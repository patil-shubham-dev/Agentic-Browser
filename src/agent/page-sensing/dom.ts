import { WebContents } from 'electron'
import { ElementReference } from '../../shared/types'

export async function extractDOM(webContents: WebContents): Promise<ElementReference[]> {
  const script = `
    (() => {
      const elements = [];
      const seen = new Set();
      let refCounter = 0;

      function getStableId(el) {
        if (el.id) return '#id-' + el.id;
        if (el.name) return '[name="' + el.name + '"]';
        return 'ref-' + (++refCounter);
      }

      function processNode(node, depth) {
        if (depth > 15) return;
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (seen.has(node)) return;
        seen.add(node);

        const tag = node.tagName.toLowerCase();
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);

        const isVisible = (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );

        const isInteractable = (
          isVisible &&
          (tag === 'a' || tag === 'button' || tag === 'input' ||
           tag === 'select' || tag === 'textarea' ||
           node.getAttribute('role') === 'button' ||
           node.getAttribute('role') === 'link' ||
           node.tabIndex >= 0 ||
           node.onclick !== null ||
           node.getAttribute('onclick') !== null)
        );

        if (isInteractable || (isVisible && depth < 3)) {
          const refId = getStableId(node);

          elements.push({
            refId,
            tagName: tag,
            role: node.getAttribute('role') || tag,
            textContent: (node.textContent || '').trim().substring(0, 200),
            boundingBox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            attributes: {},
            isVisible,
            isInteractable,
          });
        }

        for (const child of node.children) {
          processNode(child, depth + 1);
        }
      }

      processNode(document.body, 0);
      return elements;
    })()
  `

  const result = await webContents.executeJavaScript(script, true)
  return result as ElementReference[]
}
