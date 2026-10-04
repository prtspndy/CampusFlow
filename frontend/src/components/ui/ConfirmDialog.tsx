import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-status-error-bg text-status-error-text border border-status-error-border'
              : variant === 'warning'
              ? 'bg-status-warning-bg text-status-warning-text border border-status-warning-border'
              : 'bg-brand/10 text-brand border border-brand/20'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-headline font-semibold text-dark-text light:text-light-text text-base">
            {title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-dark-muted light:text-light-muted mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          isLoading={isLoading}
          onClick={async () => {
            await onConfirm();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
