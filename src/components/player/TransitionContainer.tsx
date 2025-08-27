'use client';

import { ReactNode, memo, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { TransitionEffect } from '@/types/playlist';
import '@/styles/transitions.css';

interface TransitionContainerProps {
  children: ReactNode;
  transition: TransitionEffect;
  duration: number;
  contentKey: string | number;
}

export const TransitionContainer = memo(function TransitionContainer({
  children,
  transition,
  duration,
  contentKey,
}: TransitionContainerProps) {
  const transitionClassNames = `transition-${transition}`;
  const timeout = duration * 1000;
  const nodeRef = useRef<HTMLDivElement>(null);

  // Set CSS variable for transition duration
  const style = {
    '--transition-duration': `${duration}s`,
  } as React.CSSProperties;

  // For instant transitions (cut), just render without animation
  if (transition === 'cut') {
    return (
      <div className="relative w-full h-full gpu-accelerated">
        <div className="absolute inset-0 gpu-transition">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full gpu-accelerated overflow-hidden"
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      <SwitchTransition>
        <CSSTransition
          key={contentKey}
          timeout={timeout}
          classNames={transitionClassNames}
          nodeRef={nodeRef}
          addEndListener={(done) => {
            if (nodeRef.current) {
              nodeRef.current.addEventListener('transitionend', done, false);
            }
          }}
        >
          <div
            ref={nodeRef}
            className="absolute inset-0"
            style={{
              ...style,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              willChange: 'transform, opacity, filter',
            }}
          >
            {children}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
});

export default TransitionContainer;
