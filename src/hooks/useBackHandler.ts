/**
 * Custom hook to handle Android back button presses.
 * Useful for modals with multiple states where back should navigate between states
 * before dismissing the modal.
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Intercepts the Android hardware back button.
 *
 * @param shouldIntercept - If true, the callback is called instead of default back behavior
 * @param onBack - Callback to run when back is pressed and shouldIntercept is true
 *
 * @example
 * // In a modal with an "edit mode" that should exit before dismissing
 * useBackHandler(isEditMode, () => setIsEditMode(false));
 */
export function useBackHandler(shouldIntercept: boolean, onBack: () => void) {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (shouldIntercept) {
        onBack();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [shouldIntercept, onBack]);
}
