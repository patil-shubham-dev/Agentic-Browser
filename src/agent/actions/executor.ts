import { WebContents } from 'electron'
import { ActionResult } from '../../shared/types'

export class ActionExecutor {
  async navigate(webContents: WebContents, url: string): Promise<ActionResult> {
    try {
      const finalUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
      webContents.loadURL(finalUrl)
      await new Promise<void>((resolve) => {
        const handler = () => {
          webContents.removeListener('did-finish-load', handler)
          resolve()
        }
        webContents.on('did-finish-load', handler)
      })
      return {
        success: true,
        data: { url: webContents.getURL(), title: webContents.getTitle() },
      }
    } catch (error) {
      return { success: false, error: `Navigation failed: ${error}` }
    }
  }

  async click(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}') ||
                     document.querySelector('[role="button"]');
          if (el) { el.click(); return true; }
          return false;
        })()
      `, true)
      return { success: true, data: { action: 'click', selector } }
    } catch (error) {
      return { success: false, error: `Click failed: ${error}` }
    }
  }

  async doubleClick(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}');
          if (el) {
            el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
            return true;
          }
          return false;
        })()
      `, true)
      return { success: true, data: { action: 'doubleClick', selector } }
    } catch (error) {
      return { success: false, error: `Double click failed: ${error}` }
    }
  }

  async rightClick(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}');
          if (el) {
            el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
            return true;
          }
          return false;
        })()
      `, true)
      return { success: true, data: { action: 'rightClick', selector } }
    } catch (error) {
      return { success: false, error: `Right click failed: ${error}` }
    }
  }

  async type(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      const text = params.text as string
      const shouldClear = params.clear as boolean

      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}') ||
                     document.querySelector('input:not([type="hidden"]), textarea, [contenteditable="true"]');
          if (!el) return false;

          el.focus();
          if (${shouldClear}) {
            el.value = '';
          }

          // Dispatch native input events for framework compatibility
          el.value = '${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        })()
      `, true)
      return { success: true, data: { action: 'type', text, selector } }
    } catch (error) {
      return { success: false, error: `Type failed: ${error}` }
    }
  }

  async scroll(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const direction = (params.direction as string) || 'down'
      const amount = (params.amount as number) || 300
      const selector = params.selector as string

      await webContents.executeJavaScript(`
        (() => {
          const target = ${selector ? `document.querySelector('${selector}')` : 'window'};
          if (!target) return false;
          const delta = ${direction === 'down' ? amount : direction === 'up' ? -amount : amount};
          target.scrollBy({ top: delta, behavior: 'smooth' });
          return true;
        })()
      `, true)
      return { success: true, data: { action: 'scroll', direction, amount } }
    } catch (error) {
      return { success: false, error: `Scroll failed: ${error}` }
    }
  }

  async hover(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}');
          if (el) {
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            return true;
          }
          return false;
        })()
      `, true)
      return { success: true, data: { action: 'hover', selector } }
    } catch (error) {
      return { success: false, error: `Hover failed: ${error}` }
    }
  }

  async dragAndDrop(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const source = params.sourceSelector as string || params.sourceRefId as string
      const target = params.targetSelector as string || params.targetRefId as string

      await webContents.executeJavaScript(`
        (() => {
          const src = document.querySelector('[data-ref-id="${source}"]') || document.querySelector('${source}');
          const tgt = document.querySelector('[data-ref-id="${target}"]') || document.querySelector('${target}');
          if (!src || !tgt) return false;

          src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
          tgt.dispatchEvent(new DragEvent('drop', { bubbles: true }));
          src.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
          return true;
        })()
      `, true)
      return { success: true, data: { action: 'dragAndDrop' } }
    } catch (error) {
      return { success: false, error: `Drag and drop failed: ${error}` }
    }
  }

  async selectOption(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const selector = params.selector as string || params.refId as string
      const value = params.value as string

      await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${selector}"]') ||
                     document.querySelector('${selector}') ||
                     document.querySelector('select');
          if (!el) return false;
          el.value = '${value.replace(/'/g, "\\'")}';
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()
      `, true)
      return { success: true, data: { action: 'selectOption', value } }
    } catch (error) {
      return { success: false, error: `Select option failed: ${error}` }
    }
  }

  async pressKey(webContents: WebContents, params: Record<string, unknown>): Promise<ActionResult> {
    try {
      const key = params.key as string
      const modifiers = (params.modifiers as string[]) || []

      await webContents.executeJavaScript(`
        (() => {
          const activeEl = document.activeElement;
          if (!activeEl) return false;
          activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', ${modifiers.map(m => `${m}: true`).join(', ')} }));
          activeEl.dispatchEvent(new KeyboardEvent('keyup', { key: '${key}', ${modifiers.map(m => `${m}: true`).join(', ')} }));
          return true;
        })()
      `, true)
      return { success: true, data: { action: 'pressKey', key } }
    } catch (error) {
      return { success: false, error: `Press key failed: ${error}` }
    }
  }

  async executeReadOnlyScript(webContents: WebContents, script: string): Promise<ActionResult> {
    try {
      const result = await webContents.executeJavaScript(`
        (() => {
          'use strict';
          const __readonly = true;
          const __original = {};

          // Prevent DOM mutations
          const handler = {
            set() { if (typeof __readonly !== 'undefined') throw new Error('Read-only mode: cannot set properties'); return true; },
            deleteProperty() { if (typeof __readonly !== 'undefined') throw new Error('Read-only mode: cannot delete properties'); return true; },
            defineProperty() { throw new Error('Read-only mode: cannot define properties'); },
          };

          const readOnlyProxy = new Proxy(window, handler);
          const fn = new Function('window', '"use strict"; ' + ${JSON.stringify(script)});
          return fn(readOnlyProxy);
        })()
      `, true)
      return { success: true, data: { result } }
    } catch (error) {
      return { success: false, error: `Script execution failed: ${error}` }
    }
  }
}
