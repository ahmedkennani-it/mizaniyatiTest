import { useState } from 'react';

import { OnboardingLanguageCountryScreen } from './OnboardingLanguageCountryScreen';
import { SignInScreen } from './SignInScreen';
import { WelcomeScreen } from './WelcomeScreen';

export interface OnboardingFlowProps {
  /** Called once onboarding is complete and the app can show the dashboard. */
  onComplete: () => void;
}

type Step = 'welcome' | 'languageCountry' | 'signIn';

/**
 * Sequences the onboarding screens (US-001 →). `App.tsx` renders this instead of `RootNavigator`
 * whenever `getUserSettings` returns `null`, i.e. no onboarding has been completed on this device.
 *
 * Kept as plain local state rather than a navigator: the sequence is linear, short, and lives
 * outside the tab shell, so a stack here would buy nothing but a second navigation container.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');

  if (step === 'languageCountry') {
    return <OnboardingLanguageCountryScreen onComplete={onComplete} />;
  }

  if (step === 'signIn') {
    return <SignInScreen onBack={() => setStep('welcome')} />;
  }

  return (
    <WelcomeScreen onStart={() => setStep('languageCountry')} onSignIn={() => setStep('signIn')} />
  );
}
