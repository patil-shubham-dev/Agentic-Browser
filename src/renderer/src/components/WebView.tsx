import { useEffect, useRef } from 'react'

interface WebViewProps {
  tabId: string
  isActive: boolean
  isAgentControlled: boolean
}

export function WebView({ tabId, isActive, isAgentControlled }: WebViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const webview = document.createElement('webview')
    webview.setAttribute('style', 'width: 100%; height: 100%; border: none;')
    webview.setAttribute('src', 'about:blank')
    webview.setAttribute('partition', 'persist:default')
    webview.setAttribute('allowpopups', '')
    webview.setAttribute('disablewebsecurity', '')

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(webview)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [tabId])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        display: isActive ? 'flex' : 'none',
        overflow: 'hidden',
        boxShadow: isAgentControlled ? 'inset 0 0 0 2px var(--agent-active)' : 'none',
        transition: 'box-shadow var(--transition-normal)',
      }}
    >
      {!isActive && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            background: 'var(--bg-primary)',
          }}
        >
          Tab inactive
        </div>
      )}
    </div>
  )
}
