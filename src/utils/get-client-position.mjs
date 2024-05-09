export function getClientPosition(e) {
  const rect = e.getBoundingClientRect()
  const scrollLeft = window.scrollX || window.pageXOffset
  const scrollTop = window.scrollY || window.pageYOffset
  // console.log(rect.left + scrollLeft, rect.top + scrollTop)
  return { x: rect.left + scrollLeft, y: rect.top + scrollTop }
}
