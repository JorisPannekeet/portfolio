import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ 
  children, 
  interactive = false,
  className = '',
  ...props 
}: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-stone-800 bg-stone-900/50 backdrop-blur-sm',
        interactive && 'card-hover cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div 
      className={['px-6 py-5 border-b border-stone-800/50', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div 
      className={['px-6 py-5', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div 
      className={[
        'px-6 py-4 border-t border-stone-800/50 bg-stone-900/30 rounded-b-2xl',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
