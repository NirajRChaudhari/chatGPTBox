import ReactDOM from 'react-dom'
import { useState, useEffect } from 'react'

// Template Popup Component
const ShowTemplatesPopup = ({ visible, children }) => {
  const [container] = useState(() => {
    // Create a container element for the portal
    const div = document.createElement('div')
    div.id = 'show-template-popup-container'
    div.className = 'chatgptbox-template-popup-container'
    div.style.position = 'fixed'
    div.style.left = '50%' // Center horizontally
    div.style.top = '50%' // Center vertically
    div.style.minWidth = '400px'
    div.style.minHeight = '150px'
    div.style.transform = 'translate(-50%, -50%)' // Adjust to center from the middle
    div.style.zIndex = '99999' // Ensure it is on top of other content
    div.style.backgroundColor = 'white'
    div.style.border = '1px solid #ccc'
    div.style.borderRadius = '5px'
    return div
  })

  useEffect(() => {
    // Append the container to the body when the component mounts
    document.body.appendChild(container)
    return () => {
      // Remove the container when the component unmounts
      document.body.removeChild(container)
    }
  }, [container])

  // Render the children inside the container via a portal
  return ReactDOM.createPortal(visible ? <div>{children}</div> : null, container)
}

const AddNewTemplatePopup = ({ visible, children }) => {
  const [container] = useState(() => {
    // Create a container element for the portal
    const div = document.createElement('div')
    div.id = 'add-template-popup-container'
    div.className = 'chatgptbox-template-popup-container'
    div.style.position = 'fixed'
    div.style.minWidth = '500px'
    div.style.left = '50%' // Center horizontally
    div.style.top = '50%' // Center vertically
    div.style.transform = 'translate(-50%, -50%)' // Adjust to center from the middle
    div.style.zIndex = '999999' // Ensure it is on top of other content
    div.style.backgroundColor = 'white'
    div.style.border = '1px solid #ccc'
    div.style.borderRadius = '5px'
    div.style.padding = '20px'
    return div
  })

  useEffect(() => {
    // Append the container to the body when the component mounts
    document.body.appendChild(container)
    return () => {
      // Remove the container when the component unmounts
      document.body.removeChild(container)
    }
  }, [container])

  // Render the children inside the container via a portal
  return ReactDOM.createPortal(visible ? <div>{children}</div> : null, container)
  // Prompt for new message and placeholders
}

export { ShowTemplatesPopup, AddNewTemplatePopup }
