import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative w-full rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-card text-foreground',
      destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
      success: 'border-success/30 bg-success/10 text-success',
      warning: 'border-warning/30 bg-warning/10 text-warning'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

const ICONS = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? 'default']
  return (
    <div role="alert" className={cn(alertVariants({ variant }), 'flex gap-2.5', className)} {...props}>
      <Icon className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export { Alert }
