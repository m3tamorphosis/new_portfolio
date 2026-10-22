import { ArrowRight, ArrowUpRight, MousePointerClick } from 'lucide-react'
import Playground from '../components/Playground'
import { MiniPreview } from '../components/Demos'
import { profile, projects, type View } from '../data'

export default function Home({
  openPreview,
  navigate,
  paused,
}: {
  openPreview: (i: number) => void
  navigate: (v: View) => void
  paused: boolean
}) {
  return (
    <div className="home-view">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" /> A DEVELOPER’S PLAYGROUND
          </div>
          <h1>
            I build things
            <br />
            that make
            <br />
            you <span className="serif-word">click.</span>
            <span className="headline-star" aria-hidden="true">
              <MousePointerClick size="1em" />
            </span>
          </h1>
          <p className="mobile-hero-summary">
            Full-stack thinking.
            <br />
            AI-powered possibilities.
          </p>
          <p className="hero-description">
            Full-stack developer building AI-powered web applications with React, Next.js,
            TypeScript, and Node.js, backed by PostgreSQL and Supabase. Hands-on with LLM
            integration, RAG pipelines, embeddings, and PDF processing, shipped in live tools for
            document analysis, data insights, and career management. Strong front-end and game
            development foundation: reusable UI components, animation systems, and interactive games
            built with Phaser 3 and HTML5 Canvas/WebGL.
          </p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => navigate('Builds')}>
              Explore my builds <ArrowUpRight size={18} />
            </button>
            <button className="text-button" onClick={() => navigate('Contact')}>
              Let’s talk <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-note work-availability">
            <span className="green-dot" aria-hidden="true" />
            <span className="availability-full">{profile.workAvailability}</span>
            <span className="availability-compact">Open to roles &amp; freelance projects.</span>
          </div>
        </div>
        <div className="hero-visual">
          <Playground paused={paused} />
        </div>
      </div>
      <div className="selected-work">
        <div className="section-line">
          <span className="eyebrow">A FEW THINGS I’VE BUILT</span>
          <button onClick={() => navigate('Builds')}>
            VIEW ALL {String(projects.length).padStart(2, '0')} <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="project-strip">
          {projects.slice(0, 3).map((project, i) => (
            <button
              className="project-teaser"
              key={project.id}
              onClick={() => openPreview(i)}
              aria-label={`Preview ${project.name}`}
              aria-haspopup="dialog"
            >
              <MiniPreview id={project.id} />
              <div className="teaser-copy">
                <span className="teaser-category">
                  {project.id === 'playable' ? 'INTERACTIVE EXPERIENCES' : project.category}
                </span>
                <h3>{project.name}</h3>
                <span className="teaser-note">
                  {project.id === 'playable'
                    ? 'An independent Flappy demo with responsive game controls.'
                    : project.id === 'careerforge'
                      ? 'AI-assisted resumes, cover letters, and job tracking.'
                      : project.id === 'insight'
                        ? 'Explore CSV and PDF data with AI questions and dashboards.'
                        : 'Less cramming. More knowing.'}
                </span>
              </div>
              <span className="teaser-preview-label">
                <span>Preview</span>
                <ArrowUpRight className="teaser-preview-icon" size={32} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
