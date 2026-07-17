import { useEffect, useRef } from 'react'

interface WebViewProps {
  tabId: string
  isActive: boolean
  isAgentControlled: boolean
}

export function WebView({ tabId, isActive, isAgentControlled }: WebViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      const webview = document.createElement('webview')
      webview.setAttribute('style', 'width: 100%; height: 100%; border: none;')
      webview.setAttribute('src', 'about:blank')
      webview.setAttribute('partition', `persist:${tabId}`)
      webview.setAttribute('allowpopups', '')
      webview.setAttribute('disablewebsecurity', '')
      webview.setAttribute('nodeintegration', 'false')
      webview.setAttribute('sandbox', '')

      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(webview)
      webviewRef.current = webview

      // Add error handling
      webview.addEventListener('crashed', () => {
        console.error(`WebView for tab ${tabId} crashed`)
      })

      webview.addEventListener('destroyed', () => {
        console.log(`WebView for tab ${tabId} destroyed`)
      })
    } catch (err) {
      console.error(`Failed to create WebView for tab ${tabId}:`, err)
    }

    return () => {
      try {
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
        webviewRef.current = null
      } catch (err) {
        console.error('Error cleaning up WebView:', err)
      }
    }
  }, [tabId])

  useEffect(() => {
    if (isActive && webviewRef.current) {
      try {
        webviewRef.current.focus()
      } catch (err) {
        console.error('Failed to focus WebView:', err)
      }
    }
  }, [isActive])

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
