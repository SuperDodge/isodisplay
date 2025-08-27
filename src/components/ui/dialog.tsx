import * as React from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

export function Dialog({ open = false, onOpenChange = () => {}, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: () => onOpenChange(true),
    })
  }
  
  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext)
    
    if (!open) return null
    
    return (
      <>
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/20 bg-gray-900/95 p-6 shadow-lg duration-200 rounded-lg">
          <div className={className} ref={ref} {...props}>
            {children}
          </div>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={() => onOpenChange(false)}
          >
            <span className="text-white text-xl">×</span>
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
DialogContent.displayName = "DialogContent"

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    />
  )
}
DialogHeader.displayName = "DialogHeader"

export function DialogFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold leading-none tracking-tight text-white ${className}`}
      {...props}
    />
  )
}
DialogTitle.displayName = "DialogTitle"

export function DialogDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-white/70 ${className}`}
      {...props}
    />
  )
}
DialogDescription.displayName = "DialogDescription"