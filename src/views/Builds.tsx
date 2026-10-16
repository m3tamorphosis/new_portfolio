import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Maximize2 } from 'lucide-react'
import { PlayableDemo } from '../components/Demos'
import { projects } from '../data'

export default function Builds({
  selected,
  onSelect,
  openPreview,
}: {
  selected: number
  onSelect: (i: number) => void
  openPreview: (i: number) => void
}) {
  const project = projects[selected]
  return (
    <div className="section-view builds-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">SELECTED WORK / 2024 — 2026</span>
          <h1>
            Less talk. <span className="serif-word">More build.</span>
          </h1>
        </div>
        <span className="heading-note">
          Real projects.
          <br />
          Room to experiment.
        </span>
      </div>
      <div className="builds-layout">
        <div className="project-details">
          <div className="project-selector" aria-label="Select a project">
            {projects.map((p, i) => (
              <button key={p.id} onClick={() => onSelect(i)} aria-pressed={selected === i}>
                <span>{p.number}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="project-description"
            >
              <h2 className="mobile-project-name">{project.name}</h2>
              <span className="eyebrow">{project.category}</span>
              <h2>{project.description}</h2>
              <p>{project.detail}</p>
            </motion.div>
          </AnimatePresence>
          <div className="tags project-tags" aria-label={`${project.name} technologies`}>
            {project.stack.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div
          className={`project-preview ${project.color}${project.preview ? ' has-screenshot' : ' has-game'}`}
        >
          {project.preview && (
            <div className="preview-meta">
              <button
                className="preview-open-button"
                aria-haspopup="dialog"
                onClick={() => openPreview(selected)}
              >
                <Maximize2 size={14} /> Quick preview
              </button>
              <a
                className="preview-live-link"
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${project.name} live site`}
              >
                Live site <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          )}
          <div className="demo-wrapper" key={project.id}>
            {project.preview && project.liveUrl ? (
              <a
                className="project-screenshot"
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Explore ${project.name} live app`}
              >
                <img
                  src={project.preview.image}
                  alt={project.preview.alt}
                  width={1440}
                  height={1000}
                  decoding="async"
                />
              </a>
            ) : (
              <PlayableDemo />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
