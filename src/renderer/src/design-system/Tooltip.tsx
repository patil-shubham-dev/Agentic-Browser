import { useState, useRef, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const show = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setVisible(true), 400)
  }

  const hide = () => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '4px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '4px' },
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            ...positionStyles[position],
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 400,
            pointerEvents: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
