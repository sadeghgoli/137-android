import { I18nManager } from 'react-native';

/**
 * Force RTL layout for Persian UI.
 * On first change, React Native may need a reload to fully apply.
 */
export function enableRTL(): void {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
}
