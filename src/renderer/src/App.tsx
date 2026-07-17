import { useState, useCallback, useEffect } from 'react'
import { TabInfo, SessionLog } from '../../shared/types'
import { TitleBar } from './components/TitleBar'
import { TabStrip } from './components/TabStrip'
import { AddressBar } from './components/AddressBar'
import { Sidebar } from './components/Sidebar'
import { WebView } from './components/WebView'

function createTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

function createInitialTab(): TabInfo {
  return {
    id: createTabId(),
    title: 'New Tab',
    url: '',
    isLoading: false,
    isAgentControlled: false,
    canGoBack: false,
    canGoForward: false,
  }
}

export function App() {
  const [tabs, setTabs] = useState<TabInfo[]>([createInitialTab()])
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'paused' | 'waiting-for-approval' | 'completed' | 'failed'>('idle')
  const [sessionLog, setSessionLog] = useState<SessionLog | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'actions' | 'permissions' | 'annotations' | 'settings'>('actions')

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  const updateTab = useCallback((tabId: string, updates: Partial<TabInfo>) => {
    setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, ...updates } : t)))
  }, [])

  const handleTabCreate = useCallback(() => {
    const newTab = createInitialTab()
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const handleTabClose = useCallback((tabId: string) => {
    // End any active agent session for this tab
    if (window.api?.endSession) {
      window.api.endSession(tabId).catch((err: any) => {
        console.error('Failed to end session:', err)
      })
    }
    
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId)
      const filtered = prev.filter(t => t.id !== tabId)
      if (filtered.length === 0) {
        return [createInitialTab()]
      }
      if (tabId === activeTabId) {
        const nextIdx = Math.min(idx, filtered.length - 1)
        setActiveTabId(filtered[nextIdx].id)
      }
      return filtered
    })
  }, [activeTabId])

  const handleTabActivate = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleNavigate = useCallback(async (url: string) => {
    if (activeTab && window.api?.navigateTab) {
      updateTab(activeTab.id, { url, isLoading: true })
      try {
        const result = await window.api.navigateTab(activeTab.id, url)
        if (result.success) {
          updateTab(activeTab.id, {
            title: result.title || url.replace(/https?:\/\//,'').split('/')[0],
            isLoading: false,
            canGoBack: result.canGoBack || false,
            canGoForward: result.canGoForward || false,
          })
        } else {
          updateTab(activeTab.id, { isLoading: false, url: activeTab.url })
          console.error('Navigation failed:', result.error)
        }
      } catch (err) {
        console.error('Navigation error:', err)
        updateTab(activeTab.id, { isLoading: false })
      }
    }
  }, [activeTab, updateTab])

  const handleGoBack = useCallback(async () => {
    if (activeTab && window.api?.goBackTab) {
      try {
        const result = await window.api.goBackTab(activeTab.id)
        if (result.success) {
          updateTab(activeTab.id, { canGoBack: false, canGoForward: true })
        }
      } catch (err) {
        console.error('Go back error:', err)
      }
    }
  }, [activeTab, updateTab])

  const handleGoForward = useCallback(async () => {
    if (activeTab && window.api?.goForwardTab) {
      try {
        const result = await window.api.goForwardTab(activeTab.id)
        if (result.success) {
          updateTab(activeTab.id, { canGoBack: true, canGoForward: false })
        }
      } catch (err) {
        console.error('Go forward error:', err)
      }
    }
  }, [activeTab, updateTab])

  const handleReload = useCallback(async () => {
    if (activeTab && window.api?.reloadTab) {
      updateTab(activeTab.id, { isLoading: true })
      try {
        const result = await window.api.reloadTab(activeTab.id)
        if (result.success) {
          updateTab(activeTab.id, { isLoading: false })
        }
      } catch (err) {
        console.error('Reload error:', err)
        updateTab(activeTab.id, { isLoading: false })
      }
    }
  }, [activeTab, updateTab])

  const handlePause = useCallback(() => setAgentStatus('paused'), [])
  const handleResume = useCallback(() => setAgentStatus('running'), [])
  const handleTakeOver = useCallback(() => {
    setAgentStatus('idle')
    if (activeTab) {
      updateTab(activeTab.id, { isAgentControlled: false })
    }
  }, [activeTab, updateTab])

  const handleWindowControl = useCallback((action: 'minimize' | 'maximize' | 'close') => {
    switch (action) {
      case 'minimize':
        window.api?.minimizeWindow?.()
        break
      case 'maximize':
        window.api?.maximizeWindow?.()
        break
      case 'close':
        window.api?.closeWindow?.()
        break
    }
  }, [])

  useEffect(() => {
    if (!window.api?.onTabStateUpdate) {
      console.warn('IPC API not available')
      return
    }

    const cleanup = window.api.onTabStateUpdate((data) => {
      try {
        if (data?.tabId && data?.updates) {
          updateTab(data.tabId, data.updates)
        }
      } catch (err) {
        console.error('Error handling tab state update:', err)
      }
    })

    return () => {
      try {
        cleanup?.()
      } catch (err) {
        console.error('Error cleaning up IPC listener:', err)
      }
    }
  }, [updateTab])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
      }}
    >
      <TitleBar
        onMinimize={() => handleWindowControl('minimize')}
        onMaximize={() => handleWindowControl('maximize')}
        onClose={() => handleWindowControl('close')}
      />
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        onTabActivate={handleTabActivate}
        onTabClose={handleTabClose}
        onTabCreate={handleTabCreate}
      />
      <AddressBar
        url={activeTab?.url || ''}
        isLoading={activeTab?.isLoading || false}
        canGoBack={activeTab?.canGoBack || false}
        canGoForward={activeTab?.canGoForward || false}
        isAgentControlled={activeTab?.isAgentControlled || false}
        onNavigate={handleNavigate}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {tabs.map(tab => (
            <WebView
              key={tab.id}
              tabId={tab.id}
              isActive={tab.id === activeTabId}
              isAgentControlled={tab.isAgentControlled}
            />
          ))}
        </div>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          sessionLog={sessionLog}
          agentStatus={agentStatus}
          onPause={handlePause}
          onResume={handleResume}
          onTakeOver={handleTakeOver}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
        />
      </div>
    </div>
  )
}
