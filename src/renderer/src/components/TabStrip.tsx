import { useState } from 'react'
import { TabInfo } from '../../../shared/types'
import { Button, Tooltip } from '../design-system'

interface TabStripProps {
  tabs: TabInfo[]
  activeTabId: string | null
  onTabActivate: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabCreate: () => void
}

export function TabStrip({ tabs, activeTabId, onTabActivate, onTabClose, onTabCreate }: TabStripProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  return (
    <div
      style={{
        height: 'var(--tabbar-height)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        gap: '2px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px', overflow: 'hidden' }}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isHovered = tab.id === hoveredTab
          const isAgentControlled = tab.isAgentControlled

          return (
            <div
              key={tab.id}
              onClick={() => onTabActivate(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                minWidth: 0,
                maxWidth: '200px',
                height: 'calc(var(--tabbar-height) - 4px)',
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                cursor: 'pointer',
                position: 'relative',
                transition: 'var(--transition-fast)',
                borderTop: isAgentControlled && isActive ? '2px solid var(--agent-active)' : '2px solid transparent',
                boxShadow: isAgentControlled && isActive ? '0 -2px 10px var(--agent-glow)' : 'none',
              }}
              role="tab"
              aria-selected={isActive}
              aria-label={`Tab: ${tab.title || 'New Tab'}`}
            >
              {tab.isLoading ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" style={{ animation: 'spin 1s linear infinite' }} />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
              )}
              <span
                style={{
                  fontSize: '12px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {tab.title || 'New Tab'}
              </span>
              {(isActive || isHovered) && (
                <Tooltip content="Close tab">
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      onTabClose(tab.id)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: 'var(--radius-sm)',
                      color: isActive ? 'var(--text-secondary)' : 'transparent',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = isActive ? 'var(--text-secondary)' : 'transparent'
                    }}
                  >
                    ✕
                  </span>
                </Tooltip>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', gap: '2px' }}>
        <Tooltip content="New tab">
          <Button size="sm" onClick={onTabCreate} aria-label="New tab">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
