import { Button } from '../design-system'

interface TitleBarProps {
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
}

export function TitleBar({ onMinimize, onMaximize, onClose }: TitleBarProps) {
  return (
    <div
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        borderBottom: '1px solid var(--border-subtle)',
        WebkitAppRegion: 'drag' as unknown as string,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' as unknown as string }}>
        <div style={{ display: 'flex', gap: '6px', padding: '0 4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-red)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-green)' }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        Agentic Browser
      </div>

      <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' as unknown as string }}>
        <Button size="sm" onClick={onMinimize} aria-label="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Button>
        <Button size="sm" onClick={onMaximize} aria-label="Maximize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </Button>
        <Button size="sm" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
