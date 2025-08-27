'use client';

import { ReactNode, memo, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { TransitionEffect } from '@/types/playlist';
import '@/styles/transitions.css';

interface TransitionContainerProps {
  children: ReactNode;
  transition: TransitionEffect;
  duration: number;
  transitioning: boolean;
}

export const TransitionContainer = memo(function TransitionContainer({
  children,
  transition,
  duration,
  transitioning,
}: TransitionContainerProps) {
  const transitionClassNames = `transition-${transition}`;
  const timeout = duration * 1000; // Convert to milliseconds
  const nodeRef = useRef<HTMLDivElement>(null);

  // Use simplified version without transitions for now
  // TODO: Fix transitions with react-transition-group
  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full gpu-accelerated">
      <TransitionGroup component={null}>
        <CSSTransition
          key={transitioning ? 'next' : 'current'}
          timeout={timeout}
          classNames={transitionClassNames}
          unmountOnExit
          nodeRef={nodeRef}
        >
          <div ref={nodeRef} className="absolute inset-0 gpu-transition">
            {children}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
});

export default TransitionContainer;