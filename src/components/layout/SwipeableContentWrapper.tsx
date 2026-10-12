import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from './Header';
import { hapticFeedback } from '../../services/haptics';

interface SwipeableContentWrapperProps {
  activeTab: ActiveTab;
  tabs: ActiveTab[];
  onTabChange: (newTab: ActiveTab) => void;
  children: React.ReactNode;
}

export const SwipeableContentWrapper: React.FC<SwipeableContentWrapperProps> = ({
  activeTab,
  tabs,
  onTabChange,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag tracking state
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<number>(0); // 1 = right to left, -1 = left to right
  const [boundaryReached, setBoundaryReached] = useState<'left' | 'right' | null>(null);

  // Touch gesture state
  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    isDetermined: false,
    isHorizontal: false,
    hasTriggeredBoundaryHaptic: false,
    hasTriggeredThresholdHaptic: false,
  });

  const currentIndex = tabs.indexOf(activeTab);
  const isFirstTab = currentIndex === 0;
  const isLastTab = currentIndex === tabs.length - 1;

  const shouldIgnoreTouch = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tagName)) return true;
    if (target.closest('[data-no-swipe="true"]') || target.closest('button')) return true;
    return false;
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    if (shouldIgnoreTouch(e.target)) return;

    const touch = e.touches[0];
    const now = Date.now();

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastX: touch.clientX,
      lastTime: now,
      velocity: 0,
      isDetermined: false,
      isHorizontal: false,
      hasTriggeredBoundaryHaptic: false,
      hasTriggeredThresholdHaptic: false,
    };
    setBoundaryReached(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const state = touchState.current;

    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // Determine gesture direction on first 8px of movement
    if (!state.isDetermined) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        state.isDetermined = true;
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          state.isHorizontal = true;
          setIsDragging(true);
        } else {
          state.isHorizontal = false;
        }
      }
    }

    if (!state.isHorizontal) return;

    const now = Date.now();
    const timeDelta = Math.max(1, now - state.lastTime);
    state.velocity = (touch.clientX - state.lastX) / timeDelta; // px/ms
    state.lastX = touch.clientX;
    state.lastTime = now;

    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth || 360;
    const distanceThreshold = containerWidth * 0.22;

    // Boundary detection & rubber-band resistance
    let appliedOffset = deltaX;
    const isAtStartEdge = isFirstTab && deltaX > 0;
    const isAtEndEdge = isLastTab && deltaX < 0;

    if (isAtStartEdge || isAtEndEdge) {
      appliedOffset = deltaX * 0.28; // Rubber-band resistance

      // Trigger boundary edge vibration pulse when stretching against the end
      if (!state.hasTriggeredBoundaryHaptic && Math.abs(deltaX) > 14) {
        hapticFeedback.boundaryEdge();
        state.hasTriggeredBoundaryHaptic = true;
      }

      setBoundaryReached(isAtStartEdge ? 'left' : 'right');
    } else {
      setBoundaryReached(null);

      // Subtle tactile tick when passing commit threshold while dragging
      if (!state.hasTriggeredThresholdHaptic && Math.abs(deltaX) > distanceThreshold) {
        hapticFeedback.light();
        state.hasTriggeredThresholdHaptic = true;
      }
    }

    setDragOffset(appliedOffset);
  };

  const handleTouchEnd = () => {
    const state = touchState.current;
    if (!state.isHorizontal) {
      setDragOffset(0);
      setIsDragging(false);
      setBoundaryReached(null);
      return;
    }

    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth || 360;
    const distanceThreshold = containerWidth * 0.22;
    const velocityThreshold = 0.35;

    const offset = dragOffset;
    const velocity = state.velocity;

    // Evaluate momentum physics commit
    const shouldGoNext =
      (offset < -distanceThreshold || velocity < -velocityThreshold) && !isLastTab;
    const shouldGoPrev =
      (offset > distanceThreshold || velocity > velocityThreshold) && !isFirstTab;

    if (shouldGoNext) {
      setSlideDirection(1);
      hapticFeedback.medium(); // Tactile pulse for transition commit
      onTabChange(tabs[currentIndex + 1]);
    } else if (shouldGoPrev) {
      setSlideDirection(-1);
      hapticFeedback.medium(); // Tactile pulse for transition commit
      onTabChange(tabs[currentIndex - 1]);
    } else if (boundaryReached) {
      // Reached boundary recoil haptic
      hapticFeedback.boundaryEdge();
    }

    // Reset drag offset with physics spring back
    setDragOffset(0);
    setIsDragging(false);
    setBoundaryReached(null);
    state.isHorizontal = false;
    state.isDetermined = false;
    state.hasTriggeredBoundaryHaptic = false;
    state.hasTriggeredThresholdHaptic = false;
  };

  // Keep slide direction synced on direct tab clicks
  const prevTabRef = useRef<ActiveTab>(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      const prevIdx = tabs.indexOf(prevTabRef.current);
      const newIdx = tabs.indexOf(activeTab);
      setSlideDirection(newIdx > prevIdx ? 1 : -1);
      prevTabRef.current = activeTab;
    }
  }, [activeTab, tabs]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 35 : direction < 0 ? -35 : 0,
      opacity: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -35 : 35,
      opacity: 0.9,
    }),
  };

  // Intensity of visual bounce indicator based on displacement
  const bounceIntensity = Math.min(1, Math.abs(dragOffset) / 45);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full overflow-hidden no-scrollbar touch-pan-y"
    >
      {/* Left Boundary Visual 'Bounce' Glow Indicator (Start of list reached) */}
      <motion.div
        animate={{
          opacity: boundaryReached === 'left' ? bounceIntensity * 0.85 : 0,
          scaleY: boundaryReached === 'left' ? 0.7 + bounceIntensity * 0.3 : 0.6,
          x: boundaryReached === 'left' ? 0 : -20,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 w-3.5 z-30 pointer-events-none flex items-center justify-start"
      >
        <div className="w-1.5 h-3/5 rounded-r-full bg-gradient-to-r from-orange-500/85 to-amber-400/40 shadow-[0_0_16px_rgba(249,115,22,0.7)] backdrop-blur-sm" />
      </motion.div>

      {/* Right Boundary Visual 'Bounce' Glow Indicator (End of list reached) */}
      <motion.div
        animate={{
          opacity: boundaryReached === 'right' ? bounceIntensity * 0.85 : 0,
          scaleY: boundaryReached === 'right' ? 0.7 + bounceIntensity * 0.3 : 0.6,
          x: boundaryReached === 'right' ? 0 : 20,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="absolute right-0 top-0 bottom-0 w-3.5 z-30 pointer-events-none flex items-center justify-end"
      >
        <div className="w-1.5 h-3/5 rounded-l-full bg-gradient-to-l from-orange-500/85 to-amber-400/40 shadow-[0_0_16px_rgba(249,115,22,0.7)] backdrop-blur-sm" />
      </motion.div>

      {/* Main Content with Momentum Physics */}
      <motion.div
        animate={{
          x: dragOffset,
        }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: 'spring', stiffness: 450, damping: 30 }
        }
        className="w-full"
      >
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={activeTab}
            custom={slideDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 380, damping: 30 },
              opacity: { duration: 0.16 },
            }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
