import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-dark-border/80 bg-dark-canvas/40 light:bg-light-elevated/40 light:border-light-border ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-dark-elevated text-dark-muted flex items-center justify-center mb-3 light:bg-light-elevated light:text-light-muted">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-headline font-semibold text-dark-text light:text-light-text mb-1">
        {title}
      </h3>
      <p className="text-xs text-dark-muted light:text-light-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
