/**
 * Haptics Service for RUPIAH FINANCE OS
 * Utilizes the standard W3C Vibration API with safe fallback guards
 * to provide a tactile physical feel on supported mobile devices (Android, etc.).
 */

export const hapticFeedback = {
  /**
   * Crisp, subtle tick (e.g. key press, step change, passing gesture threshold)
   */
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Safe failover if device or browser permissions restrict vibration
      }
    }
  },

  /**
   * Firm tactile pulse (e.g. committing tab transition, successful button action)
   */
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Safe failover
      }
    }
  },

  /**
   * Double tactile recoil for hitting screen edge boundary or rubber-band limit
   */
  boundaryEdge: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 35, 12]);
      } catch {
        // Safe failover
      }
    }
  },

  /**
   * Distinct confirmation pattern for saving transactions or data restore
   */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([12, 40, 22]);
      } catch {
        // Safe failover
      }
    }
  },

  /**
   * Warning vibration pattern for deletion confirmation or invalid actions
   */
  warning: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {
        // Safe failover
      }
    }
  },
};
