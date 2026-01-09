import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: string
  hideLabel?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { 
      label, 
      error, 
      hint,
      hideLabel = false,
      className = '',
      ...props 
    }, 
    ref
  ) {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const hasError = Boolean(error)
    const describedBy = [
      hint ? hintId : null,
      hasError ? errorId : null,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={className}>
        <label 
          htmlFor={id}
          className={[
            'block text-sm font-medium text-stone-300 mb-2',
            hideLabel && 'sr-only',
          ].filter(Boolean).join(' ')}
        >
          {label}
        </label>
        
        <input
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={[
            'block w-full rounded-lg px-4 py-2.5',
            'bg-stone-900 text-stone-100 placeholder:text-stone-600',
            'border transition-all duration-200',
            !hasError && 'border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50',
            hasError && 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50',
            'disabled:bg-stone-900/50 disabled:text-stone-600 disabled:cursor-not-allowed',
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {hint && !hasError && (
          <p id={hintId} className="mt-2 text-sm text-stone-500">
            {hint}
          </p>
        )}

        {hasError && (
          <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
