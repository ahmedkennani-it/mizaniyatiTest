import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from './PlaceholderScreen';

/**
 * Diaspora transfers tab, shown in place of Tontine in markets without one (US-013). The real
 * screen lands with the transfers stories (phase 11); this holds the tab's slot so the bar is
 * complete in those markets rather than a gap.
 */
export function TransfersScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen title={t('nav.transfers')} message={t('placeholder.comingSoon')} />
  );
}
