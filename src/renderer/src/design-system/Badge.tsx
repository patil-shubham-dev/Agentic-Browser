interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: string
}

const badgeStyles: Record<string, React.CSSProperties> = {
  default: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  success: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)' },
  warning: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' },
  error: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)' },
  info: { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' },
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...badgeStyles[variant],
      }}
    >
      {children}
    </span>
  )
}
