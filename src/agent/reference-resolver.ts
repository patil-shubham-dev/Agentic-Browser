import { AgentAction } from '../shared/types'

export interface ReferenceValidationResult {
  valid: boolean
  resolvedRef?: string
  error?: string
}

export class ReferenceResolver {
  private refTimestamps: Map<string, number> = new Map()
  private readonly REF_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Validates that an element reference still exists in the DOM
   */
  async validateElementRef(
    webContents: any,
    refId: string,
    action: AgentAction
  ): Promise<ReferenceValidationResult> {
    try {
      // Check if reference is too old
      const timestamp = this.refTimestamps.get(refId)
      if (timestamp && Date.now() - timestamp > this.REF_TIMEOUT_MS) {
        return {
          valid: false,
          error: `Element reference ${refId} has expired (older than ${this.REF_TIMEOUT_MS}ms)`,
        }
      }

      // Check if element still exists in DOM
      const exists = await this.checkElementExists(webContents, refId)
      if (exists) {
        this.refTimestamps.set(refId, Date.now())
        return { valid: true, resolvedRef: refId }
      }

      // Attempt semantic re-resolution via accessibility tree
      const fallbackRef = await this.semanticResolveElement(webContents, action.params)
      if (fallbackRef) {
        this.refTimestamps.set(fallbackRef, Date.now())
        return { valid: true, resolvedRef: fallbackRef }
      }

      return {
        valid: false,
        error: `Element reference ${refId} is stale and could not be re-resolved semantically.`,
      }
    } catch (err: any) {
      return {
        valid: false,
        error: `Failed to validate element reference: ${err?.message || 'Unknown error'}`,
      }
    }
  }

  /**
   * Checks if an element with the given ref ID exists in the DOM
   */
  private async checkElementExists(webContents: any, refId: string): Promise<boolean> {
    try {
      const result = await webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-ref-id="${refId}"]');
          return !!el && el.offsetParent !== null;
        })()
      `)
      return result === true
    } catch {
      return false
    }
  }

  /**
   * Attempts to re-resolve an element semantically using the accessibility tree
   * Falls back to text content and role matching
   */
  private async semanticResolveElement(
    webContents: any,
    targetParams: Record<string, unknown>
  ): Promise<string | null> {
    try {
      const targetText = targetParams.text as string
      const targetRole = targetParams.role as string
      const targetPlaceholder = targetParams.placeholder as string

      // Build a query to find similar elements
      let selector = ''
      if (targetRole) {
        selector = `[role="${targetRole}"]`
      }

      if (targetText || targetPlaceholder) {
        const searchText = targetText || targetPlaceholder
        const result = await webContents.executeJavaScript(`
          (() => {
            const elements = document.querySelectorAll('${selector || '*'}');
            for (const el of elements) {
              const text = el.textContent?.toLowerCase() || '';
              const placeholder = el.getAttribute('placeholder')?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              
              if (text.includes('${searchText.toLowerCase()}') || 
                  placeholder.includes('${searchText.toLowerCase()}') ||
                  ariaLabel.includes('${searchText.toLowerCase()}')) {
                // Generate a new ref ID for this element
                const newRefId = 'ref-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                el.setAttribute('data-ref-id', newRefId);
                return newRefId;
              }
            }
            return null;
          })()
        `)
        return result
      }

      return null
    } catch (err: any) {
      console.error('Semantic re-resolution failed:', err)
      return null
    }
  }

  /**
   * Records a new reference with current timestamp
   */
  recordReference(refId: string): void {
    this.refTimestamps.set(refId, Date.now())
  }

  /**
   * Clears expired references
   */
  clearExpiredReferences(): void {
    const now = Date.now()
    for (const [refId, timestamp] of this.refTimestamps.entries()) {
      if (now - timestamp > this.REF_TIMEOUT_MS) {
        this.refTimestamps.delete(refId)
      }
    }
  }
}
