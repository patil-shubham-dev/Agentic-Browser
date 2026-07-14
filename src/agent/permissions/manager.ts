import { PermissionStore } from '../../main/services/permissions'
import { PermissionRule, PermissionRequest } from '../../shared/types'

export class PermissionManager {
  private store: PermissionStore
  private pendingRequests: Map<string, PermissionRequest> = new Map()
  private sessionAllowCache: Map<string, Set<string>> = new Map()

  constructor(store: PermissionStore) {
    this.store = store
  }

  getPermissionStatus(domain: string): 'allowed' | 'blocked' | 'unknown' {
    if (this.store.isAllowed(domain)) {
      return 'allowed'
    }
    if (this.store.isBlocked(domain)) {
      return 'blocked'
    }
    return 'unknown'
  }

  isActionAllowed(domain: string): boolean {
    return this.store.isAllowed(domain)
  }

  isActionBlocked(domain: string): boolean {
    return this.store.isBlocked(domain)
  }

  requestPermission(domain: string, tabId: string, action: string): PermissionRequest {
    const existing = this.store.getRule(domain)

    if (existing?.action === 'allow') {
      return {
        domain,
        tabId,
        action,
        resolved: true,
        resolution: 'allow-always',
      }
    }

    if (existing?.action === 'block') {
      return {
        domain,
        tabId,
        action,
        resolved: true,
        resolution: 'block-always',
      }
    }

    const request: PermissionRequest = {
      domain,
      tabId,
      action,
      resolved: false,
    }

    const requestId = `${domain}:${tabId}:${Date.now()}`
    this.pendingRequests.set(requestId, request)

    return request
  }

  resolvePermission(
    requestId: string,
    resolution: 'allow-once' | 'allow-always' | 'deny-once' | 'block-always'
  ): void {
    const request = this.pendingRequests.get(requestId)
    if (!request) return

    request.resolved = true
    request.resolution = resolution

    if (resolution === 'allow-always') {
      this.store.setRule(request.domain, 'allow')
    } else if (resolution === 'block-always') {
      this.store.setRule(request.domain, 'block')
    }

    this.pendingRequests.delete(requestId)
  }

  getPendingRequests(): PermissionRequest[] {
    return Array.from(this.pendingRequests.values()).filter(r => !r.resolved)
  }

  isSensitiveAction(actionType: string): boolean {
    const sensitiveActions = [
      'payment',
      'password',
      'file-download',
      'executeScript',
      'uploadFile',
      'clipboard',
    ]
    return sensitiveActions.includes(actionType)
  }
}
