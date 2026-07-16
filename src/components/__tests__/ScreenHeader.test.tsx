import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import '../../i18n';
import { ScreenHeader } from '../ScreenHeader';
import { ThemeProvider } from '../../theme';
import type { ColorScheme } from '../../theme';

function renderHeader(
  element: React.ReactElement,
  { scheme = 'light' as ColorScheme, senior = false } = {},
) {
  return render(
    <ThemeProvider initialColorScheme={scheme} initialSeniorMode={senior}>
      {element}
    </ThemeProvider>,
  );
}

describe('ScreenHeader (US-074a)', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders the title variant', async () => {
    await renderHeader(<ScreenHeader title="Catégories" />);
    expect(screen.getByText('Catégories')).toBeTruthy();
  });

  it('renders the greeting variant with an avatar initial', async () => {
    await renderHeader(<ScreenHeader greeting="Bonjour" name="Famille Benali" />);
    expect(screen.getByText('Bonjour')).toBeTruthy();
    expect(screen.getByText('Famille Benali')).toBeTruthy();
  });

  it('shows no back button unless onBack is given', async () => {
    await renderHeader(<ScreenHeader title="Catégories" />);
    expect(screen.queryByLabelText('Retour')).toBeNull();
  });

  it('calls onBack when the back chevron is pressed', async () => {
    const onBack = jest.fn();
    await renderHeader(<ScreenHeader title="Catégories" onBack={onBack} />);

    await fireEvent.press(screen.getByLabelText('Retour'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders trailing actions and calls their handler', async () => {
    const onPress = jest.fn();
    await renderHeader(
      <ScreenHeader
        title="Accueil"
        actions={[{ icon: 'bell', accessibilityLabel: 'Alertes', onPress }]}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Alertes'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('icon-bell')).toBeTruthy();
  });

  it('renders an action with its optional short text (the language pill)', async () => {
    await renderHeader(
      <ScreenHeader
        title="Accueil"
        actions={[{ icon: 'globe', accessibilityLabel: 'Langue', text: 'FR' }]}
      />,
    );
    expect(screen.getByText('FR')).toBeTruthy();
  });

  // The back chevron points at the reading start, so it has to flip with the direction.
  it.each([
    ['LTR', false],
    ['RTL', true],
  ])('renders in %s', async (_name, isRTL) => {
    I18nManager.isRTL = isRTL;
    await renderHeader(
      <ScreenHeader
        title="Catégories"
        onBack={jest.fn()}
        actions={[{ icon: 'bell', accessibilityLabel: 'Alertes', badge: true }]}
      />,
    );
    expect(screen.getByText('Catégories')).toBeTruthy();
    expect(screen.getByTestId('icon-chevron-left')).toBeTruthy();
  });

  const THEMES: [string, ColorScheme, boolean][] = [
    ['light', 'light', false],
    ['dark', 'dark', false],
    ['light senior', 'light', true],
    ['dark senior', 'dark', true],
  ];

  it.each(THEMES)('renders under the %s theme', async (_name, scheme, senior) => {
    await renderHeader(
      <ScreenHeader
        title="Catégories"
        onBack={jest.fn()}
        actions={[{ icon: 'bell', accessibilityLabel: 'Alertes' }]}
      />,
      { scheme, senior },
    );
    expect(screen.getByText('Catégories')).toBeTruthy();
  });
});
