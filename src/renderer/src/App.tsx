import { useState, useCallback, useEffect } from 'react'
import { TabInfo, SessionLog } from '../../shared/types'
import { TitleBar } from './components/TitleBar'
import { TabStrip } from './components/TabStrip'
import { AddressBar } from './components/AddressBar'
import { Sidebar } from './components/Sidebar'
import { WebView } from './components/WebView'

let tabIdCounter = 0

function createTabId(): string {
  return `tab-${++tabIdCounter}`
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

  const handleNavigate = useCallback((url: string) => {
    if (activeTab) {
      updateTab(activeTab.id, { url, isLoading: true })

      setTimeout(() => {
        updateTab(activeTab.id, {
          title: url.includes('localhost') ? 'Local Dev Server' : url.replace(/https?:\/\//, '').split('/')[0],
          isLoading: false,
          canGoBack: true,
          canGoForward: false,
        })
      }, 1500)
    }
  }, [activeTab, updateTab])

  const handleGoBack = useCallback(() => {
    updateTab(activeTab.id, { canGoBack: false, canGoForward: true })
  }, [activeTab, updateTab])

  const handleGoForward = useCallback(() => {
    updateTab(activeTab.id, { canGoBack: true, canGoForward: false })
  }, [activeTab, updateTab])

  const handleReload = useCallback(() => {
    if (activeTab) {
      updateTab(activeTab.id, { isLoading: true, url: activeTab.url })
      setTimeout(() => updateTab(activeTab.id, { isLoading: false }), 1000)
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
    window.api?.navigate('about:blank')
  }, [])

  useEffect(() => {
    const cleanup = window.api?.onTabStateUpdate((data) => {
      console.log('Tab state update:', data)
    })
    return () => cleanup?.()
  }, [])

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
