import { useEffect } from 'react'
import { IconClose } from './icons/NavGlyph.jsx'

export default function Sheet({ title, children, onClose, center }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={`sheet-backdrop ${center ? 'sheet-backdrop--center' : ''}`}
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <h3 id="sheet-title">{title}</h3>
          <button type="button" className="sheet__close" aria-label="Close" onClick={onClose}>
            <IconClose size={22} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  )
}
