import { useRef, useState, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BrainCircuit, Gamepad2, Layers, MousePointer2 } from 'lucide-react'
import Portrait from '../components/Portrait'

const disciplines = [
  {
    title: 'AI-powered applications',
    icon: BrainCircuit,
    tools: 'LLMs / RAG / EMBEDDINGS',
    detail: 'Document intelligence, data insights, and AI career tools.',
    expanded: 'Building AI tools for document analysis, career materials, and data insights.',
    stack: ['OpenAI API', 'Groq API', 'RAG', 'Embeddings', 'pdf-parse', 'Supabase'],
    example:
      'CareerForge AI for resumes and cover letters. InsightVault Lite for data insights. StudyBuddyGPT for learning.',
    className: 'ai',
  },
  {
    title: 'Full-stack systems',
    icon: Layers,
    tools: 'REACT / NEXT.JS / TYPESCRIPT',
    detail: 'Connected applications with authentication, data, and payments.',
    expanded: 'Building backend APIs, authentication, databases, and payment integrations.',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'NextAuth.js', 'Neon', 'Xendit'],
    example:
      'CareerForge AI brings resume building, cover letters, and job tracking into one workspace.',
    className: 'systems',
  },
  {
    title: 'Interactive experiences',
    icon: MousePointer2,
    tools: 'CANVAS / WEBGL / MOTION',
    detail: 'Thoughtful interfaces, animation, and game-like interactions.',
    expanded: 'Building responsive interfaces, reusable animations, and game-like interactions.',
    stack: ['React', 'TypeScript', 'Motion', 'HTML5 Canvas', 'WebGL', 'Unity / C#'],
    example:
      'Interactive emergency scenarios in Danger Zone, an educational disaster-response simulation.',
    className: 'interaction',
  },
  {
    title: 'Playable ads',
    icon: Gamepad2,
    tools: 'PHASER / REACT / MRAID',
    detail: 'Lightweight, high-performance play with HTML5 Canvas/WebGL.',
    expanded:
      'Creating lightweight playable ads with reusable game mechanics, animation, and mobile ad integration.',
    stack: ['Phaser 3', 'HTML5 Canvas', 'WebGL', 'React', 'MRAID', 'Vite'],
    example: 'Cross-platform experiences at HPL Game Design, packaged within 5 MB limits.',
    className: 'play',
  },
]
const panels = ['Overview', 'Profile', 'What I build', 'Approach'] as const
type Panel = (typeof panels)[number]

export default function About() {
  const [panel, setPanel] = useState<Panel>('Overview')
  const [discipline, setDiscipline] = useState(0)
  const reducedMotion = useReducedMotion()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const reveal = (order: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reducedMotion ? 0 : 0.3,
      delay: reducedMotion ? 0 : order * 0.045,
      ease: 'easeOut' as const,
    },
  })
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % panels.length
        : event.key === 'ArrowLeft'
          ? (index + panels.length - 1) % panels.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? panels.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    setPanel(panels[next])
    tabs.current[next]?.focus()
  }
  return (
    <div className="section-view about-view" data-panel={panel}>
      <motion.div className="about-heading" {...reveal(0)}>
        <div>
          <span className="eyebrow">THE PERSON BEHIND THE BUILD</span>
          <h1>
            About <span className="serif-word">me.</span>
          </h1>
        </div>
      </motion.div>
      <div className="about-overview" id="about-panel-0" aria-labelledby="about-tab-0">
        <motion.div
          className="about-portrait"
          {...reveal(1)}
          transition={{ ...reveal(1).transition, duration: reducedMotion ? 0 : 0.42 }}
        >
          <Portrait />
        </motion.div>
        <motion.div className="about-intro" {...reveal(2)}>
          <h2>
            I’m Carl — a full-stack and AI developer who enjoys building useful, interactive, and
            thoughtfully designed digital experiences.
          </h2>
        </motion.div>
      </div>
      <div className="about-tabs" role="tablist" aria-label="About Me details">
        {panels.map((name, i) => (
          <button
            key={name}
            ref={(el) => {
              tabs.current[i] = el
            }}
            role="tab"
            id={`about-tab-${i}`}
            aria-controls={`about-panel-${i}`}
            aria-selected={panel === name}
            tabIndex={panel === name ? 0 : -1}
            onClick={() => setPanel(name)}
            onKeyDown={(event) => onTabKey(event, i)}
          >
            {name}
          </button>
        ))}
      </div>
      <section
        className="about-profile about-panel"
        id="about-panel-1"
        aria-labelledby="about-tab-1"
      >
        <motion.p className="about-description" {...reveal(3)}>
          I work across AI-powered applications, full-stack web development, interactive
          experiences, and playable ads. I enjoy turning ideas into polished products, from the
          underlying logic and data systems to the interface and interaction.
        </motion.p>
        <dl className="about-metadata">
          {[
            ['Name', 'Carl John Haro'],
            ['Role', 'Full-Stack Developer × AI Developer'],
            ['Based in', 'Iloilo City, Philippines'],
            [
              'Education',
              <>
                Bachelor of Science in Computer Science
                <span>Central Philippine University · 2021–2025</span>
              </>,
            ],
          ].map(([label, value], i) => (
            <motion.div key={String(label)} {...reveal(4 + i)}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </motion.div>
          ))}
        </dl>
      </section>
      <div className="about-work">
        <section
          className="about-builds about-panel"
          id="about-panel-2"
          aria-labelledby="about-builds-title"
        >
          <motion.h2 className="eyebrow" id="about-builds-title" {...reveal(8)}>
            WHAT I BUILD
          </motion.h2>
          <div className="about-discipline-switcher" aria-label="Choose a discipline">
            {disciplines.map(({ title, icon: Icon }, i) => (
              <button key={title} aria-pressed={discipline === i} onClick={() => setDiscipline(i)}>
                <Icon className="discipline-icon" size={16} aria-hidden="true" />
                {title}
              </button>
            ))}
          </div>
          <div className="about-build-grid">
            {disciplines.map(({ title, tools, detail, expanded, stack, example, className }, i) => (
              <motion.article
                className={`about-discipline ${className}`}
                data-selected={discipline === i}
                key={title}
                {...reveal(9 + i)}
              >
                <div className="discipline-top">
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p className="discipline-description">
                  <span className="discipline-summary">{detail}</span>
                  <span className="discipline-expanded-description">{expanded}</span>
                </p>
                <span className="discipline-tools">{tools}</span>
                <div className="discipline-stack">
                  <span className="discipline-label">TECH STACK:</span>
                  <ul aria-label={`${title} stack`}>
                    {stack.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                </div>
                <div className="discipline-example">
                  <span className="discipline-label">IN PRACTICE</span>
                  <span>{example}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
        <motion.div className="about-current" {...reveal(14)}>
          <span className="eyebrow">
            <i className="green-dot" /> RECENT EXPERIENCE
          </span>
          <h3>HPL Game Design</h3>
          <p>Built responsive web interfaces with reusable components and smooth interactions.</p>
        </motion.div>
      </div>
      <motion.section
        className="about-approach about-panel"
        id="about-panel-3"
        aria-labelledby="about-approach-title"
        {...reveal(13)}
      >
        <h2 className="eyebrow" id="about-approach-title">
          HOW I LIKE TO BUILD
        </h2>
        <p>
          I like building things that feel simple on the surface but are carefully engineered
          underneath.
        </p>
        <div className="about-principles">
          {[
            [
              'Function',
              'Make it work.',
              'Clear logic and reliable behavior, built around real needs.',
            ],
            [
              'Interaction',
              'Make it feel good.',
              'Purposeful motion and clear feedback for every interaction.',
            ],
            [
              'Detail',
              'Make it worth exploring.',
              'Readable type and consistent spacing across screen sizes.',
            ],
          ].map(([name, detail, description], i) => (
            <div key={name}>
              <span>0{i + 1}</span>
              <div>
                <h3>{name}</h3>
                <p className="principle-title">{detail}</p>
                <p className="principle-description">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
