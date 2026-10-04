import { cn } from '../../lib/utils';

interface BrandMarkProps {
  className?: string;
  /** Set when the mark is the only CampusFlow label on screen. */
  labelled?: boolean;
}

export function BrandMark({ className, labelled = false }: BrandMarkProps) {
  return (
    <img
      src="/logo-mark.png"
      alt={labelled ? 'CampusFlow' : ''}
      draggable={false}
      className={cn('object-contain select-none', className)}
    />
  );
}
