import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import { Chip } from '../Chip';
import { TextField } from '../TextField';
import { ThemeProvider } from '../../theme';

// Base components must stay direction-agnostic (no hardcoded left/right) so that both
// French (LTR) and Arabic (RTL) layouts mirror correctly once i18n/RTL is wired (US-003).
const DIRECTIONAL_KEYS = [
  'left',
  'right',
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'borderLeftWidth',
  'borderRightWidth',
];

async function renderWithTheme() {
  await render(
    <ThemeProvider initialColorScheme="light">
      <Card testID="card">
        <Button label="Ajouter" onPress={() => {}} />
        <TextField label="Libellé" placeholder="Courses" />
        <Chip label="Courses" selected={false} onPress={() => {}} />
      </Card>
    </ThemeProvider>,
  );
}

function assertNoDirectionalStyles() {
  const buttons = screen.getAllByRole('button');
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    const flattened = StyleSheet.flatten(button.props.style);
    for (const key of DIRECTIONAL_KEYS) {
      expect(flattened).not.toHaveProperty(key);
    }
  }
}

describe('base components under RTL and LTR', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders correctly in LTR (French)', async () => {
    I18nManager.isRTL = false;
    await renderWithTheme();

    expect(screen.getByText('Ajouter')).toBeTruthy();
    expect(screen.getByLabelText('Libellé')).toBeTruthy();
    assertNoDirectionalStyles();
  });

  it('renders correctly in RTL (Arabic)', async () => {
    I18nManager.isRTL = true;
    await renderWithTheme();

    expect(screen.getByText('Ajouter')).toBeTruthy();
    expect(screen.getByLabelText('Libellé')).toBeTruthy();
    assertNoDirectionalStyles();
  });
});
