import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DatePicker } from '../DatePicker';
import i18n from '../../i18n/i18n';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';

async function renderPicker(value: string, maxDate = '2026-07-16') {
  const onChange = jest.fn();
  await render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <DatePicker value={value} onChange={onChange} maxDate={maxDate} />
      </ThemeProvider>
    </LanguageProvider>,
  );
  return { onChange };
}

describe('DatePicker (US-019)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('opens on the selected date’s month, with that day highlighted', async () => {
    await renderPicker('2026-07-16');

    expect(screen.getByText('juillet 2026')).toBeTruthy();
    const day16 = screen.getByLabelText('2026-07-16');
    expect(day16.props.accessibilityState.selected).toBe(true);
  });

  it('reports the tapped day', async () => {
    const { onChange } = await renderPicker('2026-07-16');

    await fireEvent.press(screen.getByLabelText('2026-07-01'));

    expect(onChange).toHaveBeenCalledWith('2026-07-01');
  });

  /** US-019: "une date future est refusée" — disabled, not merely rejected after the tap. */
  it('disables days after maxDate', async () => {
    const { onChange } = await renderPicker('2026-07-16', '2026-07-16');

    const day17 = screen.getByLabelText('2026-07-17');
    expect(day17.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(day17);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the household navigate to a previous month', async () => {
    await renderPicker('2026-07-16');

    await fireEvent.press(screen.getByLabelText('Mois précédent'));

    expect(await screen.findByText('juin 2026')).toBeTruthy();
  });

  it('disables navigating past the month containing maxDate', async () => {
    await renderPicker('2026-07-16', '2026-07-16');

    const nextButton = screen.getByLabelText('Mois suivant');
    expect(nextButton.props.accessibilityState.disabled).toBe(true);
  });

  it('still allows navigating forward when maxDate is in a later month', async () => {
    await renderPicker('2026-06-01', '2026-07-16');

    const nextButton = screen.getByLabelText('Mois suivant');
    expect(nextButton.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(nextButton);
    expect(await screen.findByText('juillet 2026')).toBeTruthy();
  });
});
