import React from 'react';

/**
 * `react-native-safe-area-context`'s real `SafeAreaProvider` renders a native view and waits for
 * a real `onLayout` event before it provides frame/insets to its children — that event never
 * fires under Jest's test renderer, so children stay unmounted forever (any screen wrapped by it,
 * i.e. the whole app via `App.tsx`, renders as empty). Swap in a synchronous provider for tests
 * that immediately supplies fixed metrics via the same contexts, keeping every other export
 * (hooks, `SafeAreaView`, …) wired to the real implementation.
 *
 * Written as a plain CommonJS `module.exports` (not `export default`) so every named property —
 * including `SafeAreaInsetsContext`/`SafeAreaFrameContext`, which `@react-navigation/bottom-tabs`
 * imports by name — lands directly on the required module object.
 */
// Requiring the bare package name here would resolve back through this file's own
// `moduleNameMapper` entry (self-reference), returning the in-progress empty exports object —
// require the compiled `main` entry point directly instead, which the mapper regex (anchored on
// the bare package name) doesn't match.
const RNSafeAreaContext = jest.requireActual('react-native-safe-area-context/lib/commonjs/index.js');
const { SafeAreaInsetsContext, SafeAreaFrameContext } = RNSafeAreaContext;

const MOCK_METRICS = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function SafeAreaProviderMock({ children, initialMetrics }) {
  return (
    <SafeAreaFrameContext.Provider value={initialMetrics?.frame ?? MOCK_METRICS.frame}>
      <SafeAreaInsetsContext.Provider value={initialMetrics?.insets ?? MOCK_METRICS.insets}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

module.exports = {
  ...RNSafeAreaContext,
  initialWindowMetrics: MOCK_METRICS,
  useSafeAreaInsets: () => MOCK_METRICS.insets,
  useSafeAreaFrame: () => MOCK_METRICS.frame,
  SafeAreaProvider: SafeAreaProviderMock,
};
