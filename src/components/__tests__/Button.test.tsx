import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { Button } from '../Button';
import { ThemeProvider } from '../../theme';

describe('Button', () => {
  it('fires onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={onPress} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={onPress} disabled />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled state to assistive technology', async () => {
    await render(
      <ThemeProvider>
        <Button label="Valider" onPress={() => {}} disabled />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
