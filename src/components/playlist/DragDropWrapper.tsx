'use client';

import { ReactNode } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface DragDropWrapperProps {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}

export function DragDropWrapper({ children, onDragEnd }: DragDropWrapperProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
}

export default DragDropWrapper;