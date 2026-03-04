import * as React from "react"
import { cn } from "@/lib/utils"
import {
  dialogSizes,
  dialogContentPadding,
  spacing,
  colors,
  transitions,
  borderRadius,
  typography,
} from "@/styles/design-tokens"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => onOpenChange?.(false)}
          />
          <div className="relative z-50">
            {children}
          </div>
        </div>
      )}
    </>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'sm' | 'md' | 'lg'
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ className, size = 'lg', padding = 'md', children, ...props }, ref) => {
  const sizeClass = {
    sm: 'max-w-[400px]',
    md: 'max-w-[500px]',
    lg: 'max-w-[600px]',
    xl: 'max-w-[700px]',
    '2xl': 'max-w-[800px]',
    full: 'max-w-[95vw] max-h-[95vh]',
  }[size];

  const paddingClass = dialogContentPadding[padding.toUpperCase() as keyof typeof dialogContentPadding];

  return (
  <div
    ref={ref}
    className={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%]",
      sizeClass,
      paddingClass,
      spacing.gap.LG,
      colors.border.DEFAULT,
      colors.background.DEFAULT,
      "shadow-lg",
      transitions.NORMAL,
      borderRadius.LG,
      className
    )}
    {...props}
  >
    {children}
  </div>
)})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      typography.fontSize.LG,
      typography.fontWeight.SEMIBOLD,
      "leading-none tracking-tight",
      colors.text.PRIMARY,
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(typography.fontSize.SM, colors.text.TERTIARY, className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
