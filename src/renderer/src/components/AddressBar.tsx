import { useState, useRef, KeyboardEvent } from 'react'
import { Tooltip } from '../design-system'

interface AddressBarProps {
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  isAgentControlled: boolean
  onNavigate: (url: string) => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
}

export function AddressBar({
  url,
  isLoading,
  canGoBack,
  canGoForward,
  isAgentControlled,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
}: AddressBarProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(url)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    let targetUrl = inputValue.trim()
    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
    onNavigate(targetUrl)
    setEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setEditing(false)
      setInputValue(url)
    }
  }

  const handleFocus = () => {
    setEditing(true)
    setInputValue(url)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    setInputValue(url)
  }

  const iconColor = 'var(--text-tertiary)'
  const iconHoverColor = 'var(--text-primary)'

  return (
    <div
      style={{
        height: 'var(--addressbar-height)',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '6px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <Tooltip content="Back">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: canGoBack ? iconColor : 'var(--border-default)',
              cursor: canGoBack ? 'pointer' : 'default',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { if (canGoBack) e.currentTarget.style.color = iconHoverColor }}
            onMouseLeave={(e) => { if (canGoBack) e.currentTarget.style.color = iconColor }}
            aria-label="Go back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Forward">
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: canGoForward ? iconColor : 'var(--border-default)',
              cursor: canGoForward ? 'pointer' : 'default',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { if (canGoForward) e.currentTarget.style.color = iconHoverColor }}
            onMouseLeave={(e) => { if (canGoForward) e.currentTarget.style.color = iconColor }}
            aria-label="Go forward"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Reload">
          <button
            onClick={onReload}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: iconColor,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = iconHoverColor }}
            onMouseLeave={(e) => { e.currentTarget.style.color = iconColor }}
            aria-label="Reload"
          >
            {isLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            )}
          </button>
        </Tooltip>
      </div>

      {isAgentControlled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--agent-active)',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Agent
        </div>
      )}

      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            transition: 'var(--transition-fast)',
          }}
          onFocus={() => {}}
        >
          {!editing && url && (
            <div style={{ paddingLeft: '10px', display: 'flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={url.startsWith('https') ? 'var(--accent-green)' : 'var(--text-tertiary)'} strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )}
          <input
            ref={inputRef}
            value={editing ? inputValue : url}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL"
            spellCheck={false}
            style={{
              flex: 1,
              padding: '7px 10px',
              background: 'transparent',
              color: editing ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            aria-label="Address bar"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <Tooltip content="Bookmarks">
          <button
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: iconColor,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = iconHoverColor }}
            onMouseLeave={(e) => { e.currentTarget.style.color = iconColor }}
            aria-label="Bookmarks"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
