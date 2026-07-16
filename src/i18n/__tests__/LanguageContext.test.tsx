import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, Text } from 'react-native';

import { LanguageProvider, useLanguage } from '../LanguageContext';

function Probe() {
  const { language, isRTL, setLanguage } = useLanguage();

  return (
    <>
      <Text>{`language:${language}`}</Text>
      <Text>{`isRTL:${isRTL}`}</Text>
      <Text onPress={() => setLanguage('ar')}>switch-to-ar</Text>
      <Text onPress={() => setLanguage('fr')}>switch-to-fr</Text>
    </>
  );
}

describe('LanguageProvider / useLanguage', () => {
  it('starts on French (LTR) and switches to Arabic (RTL) and back', async () => {
    const allowRTLSpy = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTLSpy = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByText('language:fr')).toBeTruthy();
    expect(screen.getByText('isRTL:false')).toBeTruthy();

    await fireEvent.press(screen.getByText('switch-to-ar'));
    expect(screen.getByText('language:ar')).toBeTruthy();
    expect(screen.getByText('isRTL:true')).toBeTruthy();
    expect(allowRTLSpy).toHaveBeenLastCalledWith(true);
    expect(forceRTLSpy).toHaveBeenLastCalledWith(true);

    await fireEvent.press(screen.getByText('switch-to-fr'));
    expect(screen.getByText('language:fr')).toBeTruthy();
    expect(screen.getByText('isRTL:false')).toBeTruthy();
    expect(allowRTLSpy).toHaveBeenLastCalledWith(false);
    expect(forceRTLSpy).toHaveBeenLastCalledWith(false);

    allowRTLSpy.mockRestore();
    forceRTLSpy.mockRestore();
  });

  it('throws when useLanguage is called outside a LanguageProvider', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow('useLanguage must be used within a LanguageProvider');

    consoleErrorSpy.mockRestore();
  });
});
