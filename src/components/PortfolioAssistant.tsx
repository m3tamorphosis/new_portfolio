import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUp, ArrowUpRight, MessageCircle, X } from 'lucide-react'
import { profile, projects } from '../data'
import './PortfolioAssistant.css'

const sampleQuestions = [
  {
    question: 'What has Carl built?',
    answer: `Carl’s builds include ${projects.map((project) => project.name).join(', ')}. Explore the Builds section for project details, previews, and live links.`,
  },
  {
    question: 'What technologies does he use?',
    answer:
      'Carl works with React, Next.js, TypeScript, and PostgreSQL, alongside OpenAI and Groq APIs. His interactive work also includes Phaser 3 and HTML5 Canvas/WebGL.',
  },
  {
    question: 'How can I contact Carl?',
    answer: `Email Carl at ${profile.email}. The Contact section also has his LinkedIn profile and links to Viber, Telegram, and WhatsApp.`,
  },
]

export default function PortfolioAssistant() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        className="assistant-launcher"
        ref={launcher}
        aria-label="Ask about my work"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="portfolio-assistant"
        onClick={() => {
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        <MessageCircle size={21} aria-hidden="true" />
        <span aria-hidden="true">Ask about my work</span>
      </button>

      <dialog
        id="portfolio-assistant"
        className="assistant-dialog"
        ref={dialog}
        aria-labelledby="assistant-title"
        aria-describedby="assistant-description"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled)',
          )
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
        onClose={() => {
          setOpen(false)
          launcher.current?.focus({ preventScroll: true })
        }}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close()
        }}
      >
        <div className="assistant-header">
          <div>
            <p className="assistant-label">
              <MessageCircle size={15} aria-hidden="true" />
              PORTFOLIO ASSISTANT
            </p>
            <h2 id="assistant-title">Ask about my work.</h2>
          </div>
          <button
            className="assistant-close"
            autoFocus
            aria-label="Close portfolio assistant"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="assistant-body">
          <p id="assistant-description">
            Get to know Carl’s projects, skills, and experience. Try a sample question below.
          </p>
          <div className="assistant-questions" role="group" aria-label="Sample questions">
            {sampleQuestions.map(({ question }, index) => (
              <button
                key={question}
                aria-pressed={selected === index}
                aria-controls="assistant-answer"
                onClick={() => setSelected(index)}
              >
                <span>{question}</span>
                <ArrowDownRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div id="assistant-answer" className="assistant-answer" role="status">
            {selected !== null && (
              <>
                <span className="assistant-label">SAMPLE ANSWER</span>
                <p>{sampleQuestions[selected].answer}</p>
              </>
            )}
          </div>
        </div>

        <div className="assistant-footer">
          <div className="assistant-composer">
            <label htmlFor="assistant-question" className="sr-only">
              Ask a question — AI chat coming soon
            </label>
            <input
              id="assistant-question"
              type="text"
              placeholder="Ask a question…"
              aria-describedby="assistant-preview-note"
              disabled
            />
            <button disabled aria-label="Send message — coming soon">
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="assistant-footer-note">
            <p id="assistant-preview-note">Sample answers · AI chat coming soon</p>
            <a href="#contact" onClick={() => dialog.current?.close()}>
              Contact Carl <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </dialog>
    </>
  )
}
