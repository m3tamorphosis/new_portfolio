import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { projects } from '../data'
import ProjectComparison from './ProjectComparison'
import './ProjectQuickPreview.css'

export default function ProjectQuickPreview({
  index,
  onClose,
  onExplore,
}: {
  index: number
  onClose: () => void
  onExplore: () => void
}) {
  const project = projects[index]
  const [compare, setCompare] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const summaryId = useId()
  useEffect(() => {
    if (!previousFocus.current) previousFocus.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.documentElement.style.overflow
    const element = dialog.current
    document.documentElement.style.overflow = 'hidden'
    element?.showModal()
    return () => {
      document.documentElement.style.overflow = previousOverflow
      element?.close()
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="quick-preview-dialog"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input')
        const first = controls[0],
          last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <div className="quick-preview-header">
        <div>
          <span className="eyebrow">
            {project.preview ? 'PROJECT PREVIEW' : 'EXAMPLE DEMO'} / {project.number}
          </span>
          <h2 id={titleId}>{project.name}</h2>
        </div>
        <button
          className="quick-preview-close"
          aria-label="Close project preview"
          onClick={onClose}
          autoFocus
        >
          <X size={21} />
        </button>
      </div>
      <div className="quick-preview-body">
        <div className="quick-preview-media">
          {project.preview && (
            <div className="preview-mode" aria-label="Preview display">
              <button aria-pressed={!compare} onClick={() => setCompare(false)}>
                Current design
              </button>
              <button aria-pressed={compare} onClick={() => setCompare(true)}>
                Compare layout
              </button>
            </div>
          )}
          {project.preview ? (
            <div className="preview-panels">
              <div
                className="preview-panel"
                data-active={!compare}
                aria-hidden={compare}
                inert={compare}
              >
                <img
                  className="quick-preview-image"
                  src={project.preview.image}
                  alt={project.preview.alt}
                  width={1440}
                  height={1000}
                  decoding="async"
                />
              </div>
              <div
                className="preview-panel"
                data-active={compare}
                aria-hidden={!compare}
                inert={!compare}
              >
                <ProjectComparison project={project} />
              </div>
            </div>
          ) : (
            <img
              className="quick-preview-image is-illustration"
              src={`${import.meta.env.BASE_URL}images/playable-wallpaper.svg`}
              alt="Illustration for the independent playable example demo"
              width={320}
              height={320}
              decoding="async"
            />
          )}
        </div>
        <div className="quick-preview-summary">
          <span className="eyebrow">{project.category}</span>
          <h3 id={summaryId}>{project.description}</h3>
          <p>{project.detail}</p>
          <div className="tags">
            {project.stack.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="quick-preview-footer">
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer">
            Visit live site <ArrowUpRight size={16} />
          </a>
        )}
        <button className="preview-explore" onClick={onExplore}>
          {project.preview ? 'View project' : 'Play demo'} <ArrowRight size={17} />
        </button>
      </div>
    </dialog>
  )
}
