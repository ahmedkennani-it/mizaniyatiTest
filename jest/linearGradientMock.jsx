import React from 'react';
import { View } from 'react-native';

/**
 * `expo-linear-gradient`'s `LinearGradient` renders a native gradient view; under Jest we only need
 * a plain `View` that still lays out and renders its children (so hero cards / gradient buttons that
 * wrap content in a gradient keep their text queryable in tests). `colors`/`start`/`end` props are
 * accepted and ignored. Written as CommonJS with named + default export so both
 * `import { LinearGradient }` and `import LinearGradient` resolve.
 */
function LinearGradient({ children, ...rest }) {
  return <View {...rest}>{children}</View>;
}

module.exports = {
  __esModule: true,
  LinearGradient,
  default: LinearGradient,
};
