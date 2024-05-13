export function getClientPosition(e, addScrollLength = false) {
  const rect = e.getBoundingClientRect()

  if (addScrollLength) {
    const scrollLeft = window.scrollX || window.pageXOffset
    const scrollTop = window.scrollY || window.pageYOffset
    // console.log(rect.left + scrollLeft, rect.top + scrollTop)
    return { x: rect.left + scrollLeft, y: rect.top + scrollTop }
  } else {
    return { x: rect.left, y: rect.top }
  }
}
