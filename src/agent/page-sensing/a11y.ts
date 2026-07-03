import { WebContents } from 'electron'
import { AccessibilityNode } from '../../shared/types'

export async function extractAccessibilityTree(webContents: WebContents): Promise<AccessibilityNode[]> {
  const script = `
    (() => {
      const nodes = [];
      let refCounter = 0;

      function walkA11yTree(root, depth) {
        if (depth > 20) return;
        if (!root || !root.role) return;

        const refId = root.id || 'a11y-ref-' + (++refCounter);

        const node = {
          refId,
          role: root.role,
          name: root.name || '',
          value: root.value || '',
          description: root.description || '',
          state: root.states || {},
          bounds: root.location ? {
            x: root.location.x || 0,
            y: root.location.y || 0,
            width: root.location.width || 0,
            height: root.location.height || 0,
          } : null,
          children: [],
        };

        nodes.push(node);

        if (root.children) {
          for (const child of root.children) {
            const childNode = walkA11yTree(child, depth + 1);
            if (childNode) {
              node.children.push(childNode);
            }
          }
        }

        return node;
      }

      try {
        const a11yTree = (window).__ariaTree || null;
        if (a11yTree) {
          walkA11yTree(a11yTree, 0);
        }
      } catch (e) {
        // Accessibility tree not available via script, fall back to DOM-based roles
      }

      // Fallback: extract ARIA roles from DOM
      if (nodes.length === 0) {
        const allElements = document.querySelectorAll('[role], button, a, input, select, textarea, [tabindex]');
        allElements.forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          nodes.push({
            refId: 'dom-a11y-' + i,
            role: el.getAttribute('role') || el.tagName.toLowerCase(),
            name: el.getAttribute('aria-label') || el.textContent?.trim()?.substring(0, 100) || '',
            value: el.value || '',
            description: el.getAttribute('aria-describedby') || '',
            state: {
              disabled: el.disabled || false,
              expanded: el.getAttribute('aria-expanded') === 'true',
              selected: el.getAttribute('aria-selected') === 'true',
            },
            bounds: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            children: [],
          });
        });
      }

      return nodes;
    })()
  `

  const result = await webContents.executeJavaScript(script, true)
  return result as AccessibilityNode[]
}
