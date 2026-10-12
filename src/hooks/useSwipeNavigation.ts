import { useRef, useEffect } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;  // Finger moves right to left -> Next tab
  onSwipeRight?: () => void; // Finger moves left to right -> Previous tab
  minDistance?: number;      // Minimum distance in px to register a swipe (default 50px)
  maxVerticalDistance?: number; // Maximum vertical tolerance (to differentiate from page scroll)
  disabled?: boolean;
}

/**
 * Hook to detect horizontal touch & pointer swipe gestures on main content areas,
 * allowing users to navigate between tabs via natural gestures on Android, iOS, and touchscreens,
 * while preventing false triggers during vertical scrolling or when dragging sliders/keypads.
 */
export function useSwipeNavigation<T extends HTMLElement = HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 60,
  maxVerticalDistance = 75,
  disabled = false,
}: SwipeNavigationOptions) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || disabled) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const shouldIgnoreElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      // Do not trigger tab swipe if user is interacting with form controls, sliders, or keypad
      const tagName = target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tagName)) return true;
      if (target.closest('[data-no-swipe="true"]') || target.closest('button')) return true;
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (shouldIgnoreElement(e.target)) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const elapsedTime = Date.now() - touchStartTime;

      // Ignore swipes that took too long (more than 700ms is usually a slow pan or hold)
      if (elapsedTime > 700) return;

      // Ensure horizontal swipe is dominant over vertical scrolling
      if (Math.abs(deltaY) > maxVerticalDistance) return;
      if (Math.abs(deltaX) < minDistance) return;

      // Check that horizontal movement was at least 1.5x greater than vertical movement
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;

      if (deltaX < 0) {
        // Swiped Left (finger moved right to left) -> Navigate to Next Tab
        onSwipeLeft?.();
      } else {
        // Swiped Right (finger moved left to right) -> Navigate to Previous Tab
        onSwipeRight?.();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, minDistance, maxVerticalDistance, disabled]);

  return elementRef;
}
