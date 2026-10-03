import React from 'react'
import { MODULES, type ModuleType } from '../../lib/constants'
import { cn } from '../../lib/cn'

export interface ModuleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  module: ModuleType
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  title,
  subtitle,
  icon,
  className,
  children,
  ...props
}) => {
  const conf = MODULES[module]

  return (
    <div
      style={{
        backgroundColor: conf.bgVar,
        color: conf.textVar,
      }}
      className={cn(
        'rounded-[14px] p-6 transition-transform hover:-translate-y-0.5 duration-200 border border-black/5 dark:border-white/5',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="p-2 rounded-[10px] bg-white/40 dark:bg-black/20 text-inherit">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-heading-3 font-display font-bold leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-caption opacity-85 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
