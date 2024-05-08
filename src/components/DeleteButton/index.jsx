import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { TrashIcon } from '@primer/octicons-react'

DeleteButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
}

function DeleteButton({ onConfirm, size, text }) {
  const { t } = useTranslation()
  const [waitConfirm, setWaitConfirm] = useState(false)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (waitConfirm) confirmRef.current.focus()
  }, [waitConfirm])

  return (
    <span>
      <button
        ref={confirmRef}
        type="button"
        className="normal-button"
        style={{
          fontSize: '10px',
          ...(waitConfirm ? {} : { display: 'none' }),
          color: 'white',
          backgroundColor: 'darkgoldenrod',
          border: 'none',
          outline: 'none',
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onBlur={() => {
          setWaitConfirm(false)
        }}
        onClick={() => {
          setWaitConfirm(false)
          onConfirm()
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'white'
          e.target.style.backgroundColor = 'darkgoldenrod'
        }}
        onMouseLeave={(e) => {
          e.target.style.color = 'black'
          e.target.style.backgroundColor = 'burlywood'
        }}
      >
        {t('Confirm')}
      </button>
      <span
        title={text}
        className="gpt-util-icon"
        style={waitConfirm ? { display: 'none' } : {}}
        onClick={() => {
          setWaitConfirm(true)
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'darkgoldenrod'
        }}
        onMouseLeave={(e) => {
          e.target.style.color = 'black'
        }}
      >
        <TrashIcon size={size} />
      </span>
    </span>
  )
}

export default DeleteButton
