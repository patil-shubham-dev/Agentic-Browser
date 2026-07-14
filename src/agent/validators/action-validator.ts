import { AgentAction } from '../../shared/types'

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export class ActionValidator {
  validate(action: AgentAction): ValidationResult {
    const errors: string[] = []

    // Validate action has required fields
    if (!action.id || typeof action.id !== 'string') {
      errors.push('action.id must be a non-empty string')
    }
    if (!action.type || typeof action.type !== 'string') {
      errors.push('action.type must be a non-empty string')
    }
    if (!action.params || typeof action.params !== 'object') {
      errors.push('action.params must be an object')
    }

    // Type-specific validation
    switch (action.type) {
      case 'navigate':
        if (typeof action.params.url !== 'string' || !action.params.url) {
          errors.push('navigate: url must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('navigate: tabId must be a string')
        }
        break

      case 'click':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('click: elementRef must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('click: tabId must be a string')
        }
        break

      case 'type':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('type: elementRef must be a non-empty string')
        }
        if (typeof action.params.text !== 'string') {
          errors.push('type: text must be a string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('type: tabId must be a string')
        }
        break

      case 'scroll':
        if (typeof action.params.direction !== 'string') {
          errors.push('scroll: direction must be a string')
        }
        if (action.params.amount && typeof action.params.amount !== 'number') {
          errors.push('scroll: amount must be a number')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('scroll: tabId must be a string')
        }
        break

      case 'readDOM':
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('readDOM: tabId must be a string')
        }
        break

      case 'screenshot':
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('screenshot: tabId must be a string')
        }
        break

      case 'getConsoleLogs':
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('getConsoleLogs: tabId must be a string')
        }
        break

      case 'getNetworkLogs':
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('getNetworkLogs: tabId must be a string')
        }
        break

      case 'hover':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('hover: elementRef must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('hover: tabId must be a string')
        }
        break

      case 'doubleClick':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('doubleClick: elementRef must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('doubleClick: tabId must be a string')
        }
        break

      case 'rightClick':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('rightClick: elementRef must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('rightClick: tabId must be a string')
        }
        break

      case 'dragAndDrop':
        if (typeof action.params.sourceRef !== 'string' || !action.params.sourceRef) {
          errors.push('dragAndDrop: sourceRef must be a non-empty string')
        }
        if (typeof action.params.targetRef !== 'string' || !action.params.targetRef) {
          errors.push('dragAndDrop: targetRef must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('dragAndDrop: tabId must be a string')
        }
        break

      case 'selectOption':
        if (typeof action.params.elementRef !== 'string' || !action.params.elementRef) {
          errors.push('selectOption: elementRef must be a non-empty string')
        }
        if (typeof action.params.value !== 'string' && typeof action.params.value !== 'number') {
          errors.push('selectOption: value must be a string or number')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('selectOption: tabId must be a string')
        }
        break

      case 'pressKey':
        if (typeof action.params.key !== 'string' || !action.params.key) {
          errors.push('pressKey: key must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('pressKey: tabId must be a string')
        }
        break

      case 'executeReadOnlyScript':
        if (typeof action.params.script !== 'string' || !action.params.script) {
          errors.push('executeReadOnlyScript: script must be a non-empty string')
        }
        if (action.params.tabId && typeof action.params.tabId !== 'string') {
          errors.push('executeReadOnlyScript: tabId must be a string')
        }
        break

      default:
        errors.push(`Unknown action type: ${action.type}`)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}
