import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/10 text-primary',
        muted: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}
