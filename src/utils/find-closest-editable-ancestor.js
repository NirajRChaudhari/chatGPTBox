export function findClosestEditableAncestor(target) {
  // List of classes of input that should not be focused
  const excludedClasses = ['chat-box-popup-textarea', 'template-popup-textarea']

  // Check if the target is an excluded class
  if (excludedClasses.some((excludedClass) => target.classList.contains(excludedClass))) {
    return null
  }

  // First, try to find the nearest editable ancestor using closest()
  let editableElement = target.closest('input, textarea, [contenteditable="true"]')

  // If closest() doesn't find anything, perform a manual traversal as a fallback
  if (!editableElement) {
    let element = target
    let depth = 0 // Initialize counter to track depth of traversal

    while (element && element !== document.body && depth < 10) {
      // Limit traversal to 10 levels
      if (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        (element.getAttribute && element.getAttribute('contenteditable') === 'true')
      ) {
        editableElement = element
        break
      }
      element = element.parentNode
      depth++ // Increment the counter with each loop iteration
    }
  }

  return editableElement
}
