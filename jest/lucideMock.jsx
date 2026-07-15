import React from 'react';
import { View } from 'react-native';

/**
 * `lucide-react-native` renders each icon through `react-native-svg`; under Jest we don't need the
 * real vector output, only a stable host element that carries the icon's identity so tests can
 * assert an icon is present (via `testID`/`accessibilityLabel` set by our `<Icon>` wrapper).
 *
 * The wrapper imports icons by name (`import { House } from 'lucide-react-native'`), which Babel
 * compiles to a property read on this module object — a `Proxy` returns a stub component for **any**
 * icon name, so this never needs updating when new icons are used. `__esModule` is exposed so the
 * interop helper treats it as an ES module and reads the named properties directly.
 */
function LucideIconStub(props) {
  return <View {...props} />;
}

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop === '__esModule') {
        return true;
      }
      if (prop === 'default') {
        return LucideIconStub;
      }
      return LucideIconStub;
    },
  },
);
