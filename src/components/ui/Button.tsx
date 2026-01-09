import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'default' | 'small'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-medium',
    'hover:from-amber-400 hover:to-amber-500',
    'active:from-amber-600 active:to-amber-700',
    'disabled:from-stone-700 disabled:to-stone-700 disabled:text-stone-500',
    'shadow-lg shadow-amber-500/20',
  ].join(' '),
  secondary: [
    'bg-stone-800 text-stone-200',
    'hover:bg-stone-700',
    'active:bg-stone-600',
    'border border-stone-700',
    'disabled:bg-stone-900 disabled:text-stone-600',
  ].join(' '),
  ghost: [
    'bg-transparent text-stone-400',
    'hover:bg-stone-800/50 hover:text-stone-200',
    'active:bg-stone-700/50',
    'disabled:text-stone-600 disabled:bg-transparent',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  default: 'px-5 py-2.5 text-sm',
  small: 'px-3 py-1.5 text-xs',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { 
      variant = 'primary', 
      size = 'default', 
      loading = false,
      disabled,
      className = '',
      children, 
      ...props 
    }, 
    ref
  ) {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center',
          'font-medium rounded-lg',
          'transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
          'disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
