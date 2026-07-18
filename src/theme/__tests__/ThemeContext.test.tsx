import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

let mockSystemScheme: 'light' | 'dark' | null = 'light';

// `ThemeContext` reads the OS scheme through RN's own `useColorScheme` — mocking just that leaf
// module (rather than all of `react-native`) avoids dragging in native modules the jest-expo
// preset can't resolve (e.g. `DevMenu`).
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockSystemScheme,
}));

// eslint-disable-next-line import/first -- must come after jest.mock(...) above
import { ThemeProvider, useTheme } from '../ThemeContext';

function Probe() {
  const { colorScheme, colorSchemePreference, setColorSchemePreference, toggleColorScheme } =
    useTheme();
  return (
    <>
      <Text>{`effective:${colorScheme}`}</Text>
      <Text>{`preference:${colorSchemePreference}`}</Text>
      <Pressable onPress={toggleColorScheme}>
        <Text>toggle</Text>
      </Pressable>
      <Pressable onPress={() => setColorSchemePreference('system')}>
        <Text>use system</Text>
      </Pressable>
    </>
  );
}

describe('ThemeContext — color scheme preference (US-059)', () => {
  beforeEach(() => {
    mockSystemScheme = 'light';
  });

  it('defaults to following the system scheme when no initial scheme is pinned', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByText('preference:system')).toBeTruthy();
    expect(screen.getByText('effective:light')).toBeTruthy();
  });

  it('follows a live system scheme change while on "system"', () => {
    const { rerender } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('effective:light')).toBeTruthy();

    mockSystemScheme = 'dark';
    rerender(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByText('effective:dark')).toBeTruthy();
  });

  it('an explicit initialColorScheme pins the scheme, ignoring the system value (tests/previews)', () => {
    mockSystemScheme = 'dark';
    render(
      <ThemeProvider initialColorScheme="light">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByText('preference:light')).toBeTruthy();
    expect(screen.getByText('effective:light')).toBeTruthy();
  });

  it('toggling sets an explicit override, no longer following the system', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('toggle'));

    expect(screen.getByText('preference:dark')).toBeTruthy();
    expect(screen.getByText('effective:dark')).toBeTruthy();
  });

  it('an explicit override stops following further system changes', () => {
    const { rerender } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByText('toggle'));
    expect(screen.getByText('effective:dark')).toBeTruthy();

    mockSystemScheme = 'dark';
    rerender(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    // Still explicit "dark" — a real system flip back to light wouldn't move it either, this just
    // confirms the override isn't silently reset by an unrelated re-render.
    expect(screen.getByText('preference:dark')).toBeTruthy();
  });

  it('choosing "system" again resumes following the OS value', () => {
    mockSystemScheme = 'dark';
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('toggle')); // system(dark) -> explicit light
    expect(screen.getByText('effective:light')).toBeTruthy();

    fireEvent.press(screen.getByText('use system'));

    expect(screen.getByText('preference:system')).toBeTruthy();
    expect(screen.getByText('effective:dark')).toBeTruthy();
  });
});
