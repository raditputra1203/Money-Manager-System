import { IconBack, IconClose } from './icons/NavGlyph.jsx'

/**
 * Header layar penuh: kiri (kembali/tutup), judul, kanan (aksi / tutup).
 */
export default function FullScreenHeader({
  title,
  onBack,
  onClose,
  rightAction,
  className = '',
  titleId,
}) {
  const showCloseRight = onClose && onBack

  return (
    <header className={`fs-header ${className}`.trim()}>
      <div className="fs-header__slot fs-header__slot--left">
        {onBack ? (
          <button type="button" className="fs-header__btn" aria-label="Back" onClick={onBack}>
            <IconBack />
          </button>
        ) : onClose ? (
          <button type="button" className="fs-header__btn" aria-label="Tutup" onClick={onClose}>
            <IconClose />
          </button>
        ) : (
          <span className="fs-header__spacer" aria-hidden />
        )}
      </div>

      <h1 id={titleId} className="fs-header__title">
        {title}
      </h1>

      <div className="fs-header__slot fs-header__slot--right">
        {rightAction ?? (showCloseRight ? (
          <button type="button" className="fs-header__btn" aria-label="Tutup" onClick={onClose}>
            <IconClose />
          </button>
        ) : (
          <span className="fs-header__spacer" aria-hidden />
        ))}
      </div>
    </header>
  )
}
