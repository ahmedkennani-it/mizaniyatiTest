import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen, Button, Card, Chip, ScreenHeader, Txt, VoiceWaveform } from '../components';
import { getDatabase } from '../db/client';
import { getUserSettings, markMicPermissionExplainerSeen } from '../db/repositories';
import { useEntitlements } from '../entitlements';
import { LANGUAGE_OPTIONS, useLanguage } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { useTheme } from '../theme';
import {
  createSilenceWatcher,
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
   * The recognizer stopped with *something* said (US-021a). Always fires instead of `onClose` once
   * listening has genuinely started — with the amount pre-filled when one was understood, and
   * always with the raw transcript as the note, so nothing the household said is lost even when no
   * amount was found.
   */
  onCaptured: (prefill: AddExpenseFormPrefill) => void;
}

type Stage = 'loading' | 'explainer' | 'denied' | 'listening' | 'error';

/**
 * The voice-capture screen: contextual mic explainer on first-ever use (US-020a), then the
 * permission prompt, then a listening state with a sound-reactive waveform that auto-stops after
 * 5s of silence, showing the live transcript as it comes in (US-020b). Once the recognizer stops,
 * the amount is extracted from the transcript (US-021a) and handed off to the keyboard form to
 * finish — category/member assignment and confirmation are built on top of this in US-021b/US-012.
 */
export function VoiceEntrySheet({ onClose, onFallbackToKeyboard, onCaptured }: VoiceEntrySheetProps) {
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
      onCaptured({
        amountInput: amount !== null ? String(amount) : undefined,
        note: finalTranscript || undefined,
      });
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
    </AppScreen>
  );
}
