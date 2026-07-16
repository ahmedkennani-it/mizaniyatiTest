import { useState } from 'react';

import { OnboardingLanguageCountryScreen } from './OnboardingLanguageCountryScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { PrivacyScreen } from './PrivacyScreen';
import { SignInScreen } from './SignInScreen';
import { WelcomeScreen } from './WelcomeScreen';

export interface OnboardingFlowProps {
  /** Called once onboarding is complete and the app can show the dashboard. */
  onComplete: () => void;
}

type Step = 'welcome' | 'languageCountry' | 'privacy' | 'privacyPolicy' | 'signIn';

/**
 * Sequences the onboarding screens (US-001 → US-004): welcome → language & country → privacy →
 * dashboard. `App.tsx` renders this instead of `RootNavigator` whenever `getUserSettings` returns
 * `null`, i.e. no onboarding has been completed on this device.
 *
 * Privacy comes **after** language & country, not before: the commitments are worth reading in
 * one's own language, and that step is what creates the `user_settings` row the acceptance
 * timestamp is written onto.
 *
 * Kept as plain local state rather than a navigator: the sequence is linear, short, and lives
 * outside the tab shell, so a stack here would buy nothing but a second navigation container.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');

  if (step === 'languageCountry') {
    return <OnboardingLanguageCountryScreen onComplete={() => setStep('privacy')} />;
  }

  if (step === 'privacy') {
    return (
      <PrivacyScreen onAccepted={onComplete} onOpenPolicy={() => setStep('privacyPolicy')} />
    );
  }

  if (step === 'privacyPolicy') {
    return <PrivacyPolicyScreen onBack={() => setStep('privacy')} />;
  }

  if (step === 'signIn') {
    return <SignInScreen onBack={() => setStep('welcome')} />;
  }

  return (
    <WelcomeScreen onStart={() => setStep('languageCountry')} onSignIn={() => setStep('signIn')} />
  );
}
