import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border-border bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-full px-7 text-sm',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * دکمه استاندارد پروژه — نسخه ساده‌شده v0-button.tsx.
 * وابستگی @base-ui/react حذف شد تا با استک Vite + React Router
 * پروژه اصلی سازگار و سبک بماند؛ ظاهر و API (variant/size) حفظ شده است.
 * برای لینک‌های داخلی، این کامپوننت را به‌عنوان children داخل
 * <Link> از react-router-dom استفاده کنید یا از پراپ asChild بهره ببرید.
 */
const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, {
      className: cn(buttonVariants({ variant, size }), props.children.props.className, className),
      ref,
    })
  }

  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
})

export { Button }
