import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus:ring-1 focus:ring-[#0047FF]';

    const variants = {
      primary:
        'bg-[#0047FF] hover:bg-[#0038CC] text-white shadow-sm font-semibold',
      secondary:
        'bg-[#1c2b3c] hover:bg-[#273647] text-[#d4e4fa] border border-[#273647]/80 light:bg-slate-100 light:text-slate-800 light:border-slate-200 light:hover:bg-slate-200',
      outline:
        'bg-transparent hover:bg-[#1c2b3c] text-[#c4c5da] hover:text-[#d4e4fa] border border-[#273647] light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100',
      danger:
        'bg-[#93000a]/25 text-[#ffb4ab] border border-[#93000a]/50 hover:bg-[#93000a]/40',
      ghost:
        'bg-transparent hover:bg-[#1c2b3c] text-[#8e8fa3] hover:text-[#d4e4fa] light:hover:bg-slate-100 light:hover:text-slate-900',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 gap-1.5',
      md: 'text-xs md:text-sm h-9 px-3.5 gap-2',
      lg: 'text-sm md:text-base h-10 px-4 gap-2',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
