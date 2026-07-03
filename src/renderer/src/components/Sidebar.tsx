import { useState } from 'react'
import { Button, Badge, Tooltip } from '../design-system'
import { AgentAction, SessionLog } from '../../../shared/types'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  sessionLog: SessionLog | null
  agentStatus: 'idle' | 'running' | 'paused' | 'waiting-for-approval' | 'completed' | 'failed'
  onPause: () => void
  onResume: () => void
  onTakeOver: () => void
  activeTab: 'actions' | 'permissions' | 'annotations' | 'settings'
  onTabChange: (tab: 'actions' | 'permissions' | 'annotations' | 'settings') => void
}

const agentStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  idle: { label: 'Idle', variant: 'info' },
  running: { label: 'Running', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  'waiting-for-approval': { label: 'Awaiting Approval', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
}

const sidebarTabs = [
  { id: 'actions' as const, label: 'Actions', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { id: 'permissions' as const, label: 'Permissions', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'annotations' as const, label: 'Annotations', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
  { id: 'settings' as const, label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' },
]

export function Sidebar({
  isOpen,
  onToggle,
  sessionLog,
  agentStatus,
  onPause,
  onResume,
  onTakeOver,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const statusConfig = agentStatusConfig[agentStatus] || agentStatusConfig.idle

  return (
    <div
      style={{
        width: isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed-width)',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width var(--transition-normal)',
        overflow: 'hidden',
      }}
    >
      {isOpen ? (
        <>
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Agent Session
              </span>
              <Tooltip content={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                <Button size="sm" onClick={onToggle} aria-label="Toggle sidebar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </Button>
              </Tooltip>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              {agentStatus === 'running' && (
                <Button size="sm" intent="warning" onClick={onPause}>Pause</Button>
              )}
              {agentStatus === 'paused' && (
                <Button size="sm" intent="success" onClick={onResume}>Resume</Button>
              )}
              {(agentStatus === 'running' || agentStatus === 'paused') && (
                <Button size="sm" intent="danger" onClick={onTakeOver}>Take Over</Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sessionLog?.actions.length === 0 && (
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                    No actions yet. Start an agent task to see actions here.
                  </div>
                )}
                {sessionLog?.actions.map((action) => (
                  <ActionEntry key={action.id} action={action} />
                ))}
              </div>
            )}
            {activeTab === 'permissions' && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                Permission management coming soon.
              </div>
            )}
            {activeTab === 'annotations' && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                Annotation mode coming soon.
              </div>
            )}
            {activeTab === 'settings' && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                Settings coming soon.
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            gap: '16px',
          }}
        >
          <Tooltip content={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <Button size="sm" onClick={onToggle} aria-label="Toggle sidebar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </Button>
          </Tooltip>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--agent-active)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {sidebarTabs.map((tab) => (
            <Tooltip key={tab.id} content={tab.label} position="left">
              <button
                onClick={() => { onTabChange(tab.id); onToggle() }}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionEntry({ action }: { action: AgentAction }) {
  const statusColors: Record<string, string> = {
    pending: 'var(--text-tertiary)',
    running: 'var(--accent-blue)',
    success: 'var(--accent-green)',
    failed: 'var(--accent-red)',
    cancelled: 'var(--text-tertiary)',
  }

  const actionLabels: Record<string, string> = {
    navigate: 'Navigate',
    click: 'Click',
    type: 'Type',
    scroll: 'Scroll',
    hover: 'Hover',
    readDOM: 'Read DOM',
    screenshot: 'Screenshot',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: statusColors[action.status] || 'var(--text-tertiary)',
          flexShrink: 0,
        }}
      />
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
        {actionLabels[action.type] || action.type}
      </span>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
        {new Date(action.timestamp).toLocaleTimeString()}
      </span>
    </div>
  )
}
