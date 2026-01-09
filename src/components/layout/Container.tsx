import { type HTMLAttributes, type ReactNode } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  narrow?: boolean
}

export function Container({ 
  children, 
  narrow = false,
  className = '',
  ...props 
}: ContainerProps) {
  return (
    <div
      className={[
        'mx-auto px-5 sm:px-8 lg:px-12',
        narrow ? 'max-w-3xl' : 'max-w-6xl',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
