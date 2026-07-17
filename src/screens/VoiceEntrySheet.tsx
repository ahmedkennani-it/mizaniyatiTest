import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, CategoryChipV, Chip, ScreenHeader, Txt, VoiceWaveform } from '../components';
import { categoryIconName } from '../categories';
import { getDatabase } from '../db/client';
import {
  createTransaction,
  getUserSettings,
  listCategories,
  listHouseholds,
  listMembers,
  markMicPermissionExplainerSeen,
} from '../db/repositories';
import type { Category, Household, Transaction } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { LANGUAGE_OPTIONS, useLanguage } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { DEFAULT_CURRENCY_CODE, formatMoney, parseAmountInput } from '../money';
import { useTheme } from '../theme';
import {
  createSilenceWatcher,
  deduceCategoryAndLabel,
  extractAmountFromDictation,
  normalizeVolumeLevel,
  recognitionLocale,
  speechRecognitionClient,
} from '../voice';
import type { SilenceWatcher } from '../voice';
import type { AddExpenseFormPrefill } from './AddExpenseForm';

export interface VoiceEntrySheetProps {
  onClose: () => void;
  /** Permission refused, or the household would rather type — always reachable (US-020a). */
  onFallbackToKeyboard: () => void;
  /**
   * The recognizer stopped with an amount but the household chose not to confirm the auto-detected
   * proposal (US-021b), or stopped with no amount at all (US-021a). Either way nothing was saved —
   * the household finishes by hand, with whatever was understood pre-filled.
   */
  onCaptured: (prefill: AddExpenseFormPrefill) => void;
  /** The review proposal (US-021b) was confirmed and saved. */
  onSavedFromReview: (created: Transaction) => void | Promise<void>;
}

type Stage = 'loading' | 'explainer' | 'denied' | 'listening' | 'error' | 'review';

/**
 * The voice-capture screen: contextual mic explainer on first-ever use (US-020a), then the
 * permission prompt, then a listening state with a sound-reactive waveform that auto-stops after
 * 5s of silence, showing the live transcript as it comes in (US-020b). Once the recognizer stops
 * with an amount, the label/category are deduced from the transcript (US-021b) and offered for a
 * one-tap confirmation; with no amount, it hands off to the keyboard instead (US-021a).
 */
export function VoiceEntrySheet({
  onClose,
  onFallbackToKeyboard,
  onCaptured,
  onSavedFromReview,
}: VoiceEntrySheetProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const entitlements = useEntitlements();

  const [stage, setStage] = useState<Stage>('loading');
  const [recognitionLanguage, setRecognitionLanguage] = useState<SupportedLanguage>(language);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const watcherRef = useRef<SilenceWatcher | null>(null);
  // `onEnd`'s closure is set up once per listening session and must not restart on every partial
  // result, so `transcript` (state) can't be a dependency — this ref is what lets it read the
  // latest value anyway.
  const transcriptRef = useRef('');

  const [reviewCategories, setReviewCategories] = useState<Category[]>([]);
  const [reviewHouseholds, setReviewHouseholds] = useState<Household[]>([]);
  const [capturedAmountInput, setCapturedAmountInput] = useState('');
  const [capturedNote, setCapturedNote] = useState('');
  const [deducedCategoryIcon, setDeducedCategoryIcon] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [categoryAutoDetected, setCategoryAutoDetected] = useState(false);

  const canUseVoice = entitlements.can('voice');

  async function beginCapture() {
    const permission = await speechRecognitionClient.getPermissionsAsync();
    const granted = permission.granted || (await speechRecognitionClient.requestPermissionsAsync()).granted;
    setStage(granted ? 'listening' : 'denied');
  }

  useEffect(() => {
    if (!canUseVoice) {
      return;
    }
    let cancelled = false;
    getUserSettings(getDatabase()).then((settings) => {
      if (cancelled) {
        return;
      }
      if (!settings || settings.micPermissionExplainerSeen) {
        beginCapture();
        return;
      }
      // Shown-once semantics: being shown *is* the "seen" event, regardless of whether the
      // household continues or backs out — otherwise "Pas maintenant" would bring the explainer
      // back on every single tap, which is not "au premier usage".
      markMicPermissionExplainerSeen(getDatabase());
      setStage('explainer');
    });
    return () => {
      cancelled = true;
    };
  }, [canUseVoice]);

  useEffect(() => {
    if (stage !== 'listening') {
      return;
    }
    setTranscript('');
    transcriptRef.current = '';
    const watcher = createSilenceWatcher(() => speechRecognitionClient.stop());
    watcherRef.current = watcher;

    const unsubscribeVolume = speechRecognitionClient.onVolumeChange((raw) => {
      const level = normalizeVolumeLevel(raw);
      setVolumeLevel(level);
      watcher.reportVolume(level);
    });
    // US-020b: shown live while the recognizer is still working, not only once it settles — the
    // first result is already interim (`interimResults: true` in the client), it just keeps
    // getting replaced by a better one as more speech arrives.
    const unsubscribeResult = speechRecognitionClient.onResult((event) => {
      const latest = event.results[0]?.transcript ?? '';
      setTranscript(latest);
      transcriptRef.current = latest;
    });
    const unsubscribeEnd = speechRecognitionClient.onEnd(() => {
      watcher.stop();
      const finalTranscript = transcriptRef.current;
      const amount = extractAmountFromDictation(finalTranscript, recognitionLanguage);
      if (amount === null) {
        // US-021a: nothing to confirm without an amount — straight to the keyboard, whatever else
        // was said kept as the note.
        onCaptured({ note: finalTranscript || undefined });
        return;
      }
      // US-021b: an amount was understood, so there's something worth reviewing before it saves —
      // the label/category deduction and the category list load once the review stage mounts.
      const deduced = deduceCategoryAndLabel(finalTranscript, recognitionLanguage);
      setCapturedAmountInput(String(amount));
      setCapturedNote(deduced?.label ?? finalTranscript);
      setDeducedCategoryIcon(deduced?.categoryIcon ?? null);
      setSelectedCategoryId(null);
      setCategoryAutoDetected(deduced !== null);
      setStage('review');
    });
    const unsubscribeError = speechRecognitionClient.onError(() => {
      watcher.stop();
      setStage('error');
    });

    speechRecognitionClient.start({ lang: recognitionLocale(recognitionLanguage) });
    watcher.start();

    return () => {
      watcher.stop();
      watcherRef.current = null;
      unsubscribeVolume();
      unsubscribeResult();
      unsubscribeEnd();
      unsubscribeError();
      speechRecognitionClient.abort();
    };
    // Switching the dictation language mid-listen restarts capture with the new locale.
  }, [stage, recognitionLanguage, onCaptured]);

  useEffect(() => {
    if (stage !== 'review') {
      return;
    }
    const db = getDatabase();
    listCategories(db).then(setReviewCategories);
    listHouseholds(db).then(setReviewHouseholds);
    // No member picker here on purpose — assigning to a specific member is US-018's job (task
    // 6.10), not this one's; the first member is a working default until that lands.
    listMembers(db).then((loaded) => {
      setSelectedMemberId((current) => current ?? loaded[0]?.id ?? null);
    });
  }, [stage]);

  useEffect(() => {
    if (stage !== 'review' || !deducedCategoryIcon || selectedCategoryId) {
      return;
    }
    const match = reviewCategories.find((category) => category.icon === deducedCategoryIcon);
    if (match) {
      setSelectedCategoryId(match.id);
    }
  }, [stage, reviewCategories, deducedCategoryIcon, selectedCategoryId]);

  const reviewCurrencyCode = reviewHouseholds[0]?.currencyCode ?? DEFAULT_CURRENCY_CODE;
  const reviewAmountMinor = parseAmountInput(capturedAmountInput, reviewCurrencyCode);
  const canConfirmReview = reviewAmountMinor !== null && selectedCategoryId !== null && selectedMemberId !== null;

  async function handleConfirmReview() {
    if (!canConfirmReview || reviewAmountMinor === null || !selectedCategoryId || !selectedMemberId) {
      return;
    }
    const created = await createTransaction(getDatabase(), {
      type: 'expense',
      amountMinor: reviewAmountMinor,
      currencyCode: reviewCurrencyCode,
      categoryId: selectedCategoryId,
      memberId: selectedMemberId,
      occurredAt: new Date().toISOString(),
      note: capturedNote || undefined,
    });
    await onSavedFromReview(created);
  }

  if (!canUseVoice) {
    return (
      <AppScreen scroll contentStyle={{ gap: theme.spacing.md }}>
        <ScreenHeader title={t('voiceCapture.title')} onBack={onClose} />
        <Card elevated style={{ gap: theme.spacing.xs }}>
          <Txt size="sm">{t('voiceCapture.upsellMessage')}</Txt>
          <Txt size="sm" weight="bold" color={theme.colors.primary}>
            {t('voiceCapture.upsellCta')}
          </Txt>
        </Card>
      </AppScreen>
    );
  }

  const languageRow = (
    <View style={{ gap: theme.spacing.xs }}>
      <Txt size="sm" color={theme.colors.textSecondary}>
        {t('voiceCapture.languageLabel')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {LANGUAGE_OPTIONS.map((option) => (
          <Chip
            key={option.code}
            label={t(option.nativeNameKey)}
            selected={recognitionLanguage === option.code}
            onPress={() => setRecognitionLanguage(option.code)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <AppScreen scroll contentStyle={{ gap: theme.spacing.lg }}>
      <ScreenHeader title={t('voiceCapture.title')} onBack={onClose} />

      {stage === 'explainer' ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('voiceCapture.explainerTitle')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('voiceCapture.explainerBody')}
          </Txt>
          <Button label={t('voiceCapture.explainerContinue')} icon="mic" onPress={beginCapture} />
          <Button
            label={t('voiceCapture.explainerCancel')}
            variant="secondary"
            onPress={onClose}
          />
        </Card>
      ) : null}

      {stage === 'denied' ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('voiceCapture.deniedTitle')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('voiceCapture.deniedBody')}
          </Txt>
          <Button label={t('voiceCapture.useKeyboard')} onPress={onFallbackToKeyboard} />
        </Card>
      ) : null}

      {stage === 'error' ? (
        <Card elevated style={{ gap: theme.spacing.sm }}>
          <Txt weight="semibold" size="md">
            {t('voiceCapture.errorTitle')}
          </Txt>
          <Txt size="sm" color={theme.colors.textSecondary}>
            {t('voiceCapture.errorBody')}
          </Txt>
          <Button label={t('voiceCapture.retry')} onPress={beginCapture} />
          <Button label={t('voiceCapture.useKeyboard')} variant="secondary" onPress={onFallbackToKeyboard} />
        </Card>
      ) : null}

      {stage === 'listening' ? (
        <Card elevated style={{ gap: theme.spacing.md, alignItems: 'center' }}>
          <Txt size="xs" color={theme.colors.textSecondary}>
            {t(LANGUAGE_OPTIONS.find((option) => option.code === recognitionLanguage)?.nativeNameKey ?? '')}
          </Txt>
          <Txt weight="semibold" size="lg">
            {t('voiceCapture.listeningLabel')}
          </Txt>
          <VoiceWaveform level={volumeLevel} />
          {transcript ? (
            <Txt
              size="md"
              style={{ textAlign: 'center' }}
              accessibilityLabel={t('voiceCapture.transcriptA11yLabel', { transcript })}
            >
              {transcript}
            </Txt>
          ) : null}
          {languageRow}
          <Button
            label={t('voiceCapture.cancelButton')}
            variant="secondary"
            onPress={() => {
              speechRecognitionClient.abort();
              onClose();
            }}
          />
        </Card>
      ) : null}

      {stage === 'review' ? (
        <Card elevated style={{ gap: theme.spacing.md }}>
          <Txt weight="bold" size="xl" style={{ textAlign: 'center' }}>
            {formatMoney(reviewAmountMinor ?? 0, reviewCurrencyCode, language)}
          </Txt>

          <View style={{ gap: theme.spacing.xs }}>
            <Txt size="sm" color={theme.colors.textSecondary}>
              {t('voiceCapture.labelFieldLabel')}
            </Txt>
            <Txt size="md">{capturedNote || '—'}</Txt>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <Txt size="sm" color={theme.colors.textSecondary}>
                {t('expenseForm.categoryLabel')}
              </Txt>
              {categoryAutoDetected ? (
                <Txt size="xs" weight="semibold" color={theme.colors.primary}>
                  {t('voiceCapture.autoDetectedBadge')}
                </Txt>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {reviewCategories.map((category) => (
                <CategoryChipV
                  key={category.id}
                  icon={categoryIconName(category.icon)}
                  label={category.name}
                  selected={category.id === selectedCategoryId}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setCategoryAutoDetected(false);
                  }}
                />
              ))}
            </View>
          </View>

          <Button
            label={t('voiceCapture.confirmButton')}
            onPress={handleConfirmReview}
            disabled={!canConfirmReview}
          />
          <Button
            label={t('voiceCapture.cancelButton')}
            variant="secondary"
            onPress={() =>
              onCaptured({
                amountInput: capturedAmountInput || undefined,
                note: capturedNote || undefined,
                categoryId: selectedCategoryId ?? undefined,
              })
            }
          />
        </Card>
      ) : null}
    </AppScreen>
  );
}
