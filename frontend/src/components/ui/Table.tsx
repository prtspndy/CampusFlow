import React from 'react';
import { cn } from '../../lib/utils';

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#273647]/60 shadow-sm light:border-[#E2E8F0]">
      <table
        className={cn('w-full text-left border-collapse text-xs', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-[#0d1c2d] border-b border-[#273647]/70 light:bg-slate-50 light:border-[#E2E8F0]',
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableHead({
  className,
  children,
  align = 'left',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8e8fa3] light:text-slate-500',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        'divide-y divide-[#273647]/40 bg-[#122131] light:divide-slate-200 light:bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  selected = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        'h-12 transition-colors hover:bg-[#1c2b3c]/60 light:hover:bg-slate-50',
        selected && 'border-l-2 border-l-[#0047FF] bg-[#0047FF]/10',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  className,
  align = 'left',
  isMono = false,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right' | 'center';
  isMono?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-4 py-2.5 text-xs text-[#d4e4fa] light:text-slate-800 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        isMono && 'font-mono tabular-nums text-[#38BDF8] light:text-blue-600',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
