import { Alert } from 'react-native';

/**
 * Detect web environment reliably — works during SSR too.
 * We check for `window` and `document` directly instead of relying on Platform.OS,
 * which can be unreliable during Expo Router's SSR pass.
 */
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Cross-platform alert that works on both mobile (native Alert) and web (window.confirm/alert).
 */
export function crossAlert(
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) {
  if (isWeb) {
    // On web, use window.confirm for two-button dialogs and window.alert for single-button
    if (buttons && buttons.length > 1) {
      // Find the confirm (non-cancel) button
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

      const confirmed = window.confirm(`${title}\n\n${message || ''}`);
      if (confirmed) {
        actionBtn?.onPress?.();
      } else {
        cancelBtn?.onPress?.();
      }
    } else if (buttons && buttons.length === 1) {
      window.alert(`${title}\n\n${message || ''}`);
      buttons[0]?.onPress?.();
    } else {
      window.alert(`${title}\n\n${message || ''}`);
    }
  } else {
    // On mobile, use native Alert
    Alert.alert(title, message, buttons);
  }
}

/**
 * Simple info alert (no action buttons needed)
 */
export function infoAlert(title: string, message?: string) {
  if (isWeb) {
    window.alert(`${title}${message ? '\n\n' + message : ''}`);
  } else {
    Alert.alert(title, message);
  }
}
