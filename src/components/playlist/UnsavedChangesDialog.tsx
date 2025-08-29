'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-red-500/20 backdrop-blur-md border-2 border-white/40 text-white max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <span
              style={{
                fontFamily: 'Made Tommy, sans-serif',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.01em',
              }}
            >
              Unsaved Changes
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-red-300 pt-2 font-body">
            You have unsaved changes to this playlist. Are you sure you want to leave without saving? 
            Your changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="text-white hover:bg-white/10 hover:text-white font-body bg-transparent border-white/20"
          >
            Stay on Page
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-body"
          >
            Leave Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}