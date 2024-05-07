export function ensureFloatingToolbarVisibilityInsideScreen(position) {
  // Constants for the toolbar dimensions
  const width = 420
  const height = 250

  // Ensure the toolbar doesn't appear too far to the left or top
  if (position.x < 100) {
    position.x = 100
  }
  if (position.y < 180) {
    position.y = 180
  }

  // Calculate the right and bottom edges of the toolbar
  let right = position.x + width
  let bottom = position.y + height

  // Get viewport width
  let viewportWidth = window.innerWidth || document.documentElement.clientWidth

  // Calculate the maximum allowed x-coordinate for the toolbar
  let maxAllowedX = viewportWidth - 340

  // Constraints for right edge
  if (right > viewportWidth) {
    position.x = maxAllowedX // Adjust x to ensure the toolbar doesn't exceed the viewport boundary
  }

  // Get the full document height
  let documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight,
  )

  // Constraints for bottom edge
  if (bottom > documentHeight) {
    position.y = documentHeight - height - 10 // Adjust y to ensure the toolbar doesn't go below the document height
  }
  return position
}
