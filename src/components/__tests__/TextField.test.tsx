import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TextField } from '../TextField';
import { ThemeProvider } from '../../theme';

describe('TextField', () => {
  it('renders its label and accepts input', async () => {
    const onChangeText = jest.fn();
    await render(
      <ThemeProvider>
        <TextField label="Montant" onChangeText={onChangeText} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Montant')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Montant'), '120');
    expect(onChangeText).toHaveBeenCalledWith('120');
  });

  it('shows an error message when provided', async () => {
    await render(
      <ThemeProvider>
        <TextField label="Montant" errorMessage="Montant invalide" />
      </ThemeProvider>,
    );

    expect(screen.getByText('Montant invalide')).toBeTruthy();
  });
});
