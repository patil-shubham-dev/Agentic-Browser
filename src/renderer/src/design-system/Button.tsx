import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'solid' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  intent?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  isActive?: boolean
}

const styles: Record<string, Record<string, React.CSSProperties>> = {
  ghost: {
    sm: {
      padding: '4px 8px',
      fontSize: '11px',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      transition: 'var(--transition-fast)',
    },
    md: {
      padding: '6px 12px',
      fontSize: '13px',
      borderRadius: 'var(--radius-md)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      transition: 'var(--transition-fast)',
    },
    lg: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: 'var(--radius-md)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      transition: 'var(--transition-fast)',
    },
  },
  solid: {
    sm: {
      padding: '4px 8px',
      fontSize: '11px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--accent-blue)',
      color: 'white',
      transition: 'var(--transition-fast)',
    },
    md: {
      padding: '6px 12px',
      fontSize: '13px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-blue)',
      color: 'white',
      transition: 'var(--transition-fast)',
    },
    lg: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-blue)',
      color: 'white',
      transition: 'var(--transition-fast)',
    },
  },
  outline: {
    sm: {
      padding: '4px 8px',
      fontSize: '11px',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
      transition: 'var(--transition-fast)',
    },
    md: {
      padding: '6px 12px',
      fontSize: '13px',
      borderRadius: 'var(--radius-md)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
      transition: 'var(--transition-fast)',
    },
    lg: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: 'var(--radius-md)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
      transition: 'var(--transition-fast)',
    },
  },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', intent = 'default', isActive, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const baseStyle = styles[variant]?.[size] ?? styles.ghost.md

    const variantStyle: React.CSSProperties = {
      ...baseStyle,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      whiteSpace: 'nowrap',
      fontWeight: 500,
      cursor: 'pointer',
      ...(intent === 'danger' && variant === 'solid' ? { background: 'var(--accent-red)' } : {}),
      ...(intent === 'success' && variant === 'solid' ? { background: 'var(--accent-green)' } : {}),
      ...(intent === 'warning' && variant === 'solid' ? { background: 'var(--accent-amber)' } : {}),
      ...(isActive ? { background: 'var(--bg-hover)', color: 'var(--text-primary)' } : {}),
      ...style,
    }

    return (
      <button
        ref={ref}
        style={variantStyle}
        onMouseEnter={(e) => {
          if (variant === 'ghost') {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (variant === 'ghost' && !isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
          onMouseLeave?.(e)
        }}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
