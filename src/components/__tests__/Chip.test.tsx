import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { Chip } from '../Chip';
import { ThemeProvider } from '../../theme';

describe('Chip', () => {
  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Chip label="Courses" selected={false} onPress={onPress} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes its selected state to assistive technology', async () => {
    await render(
      <ThemeProvider>
        <Chip label="Courses" selected onPress={() => {}} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });
});
