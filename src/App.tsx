import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { ArrowDownLeft, ArrowUpRight, CodeXml, Download, Mail, Menu, Phone, X } from 'lucide-react'
import BrandIcon from './components/BrandIcon'
import PortfolioAssistant from './components/PortfolioAssistant'
import ProjectQuickPreview from './components/ProjectQuickPreview'
import { profile, views, type View } from './data'
import Home from './views/Home'
import Builds from './views/Builds'
import Experience from './views/Experience'
import Stack from './views/Stack'
import Contact from './views/Contact'
import About from './views/About'
import { compactLayoutQuery } from './layout'
import usePointerFeedback from './hooks/usePointerFeedback'

function readView(): View {
  if (window.location.hash.slice(1) === 'about') return 'About Me'
  return views.find((v) => v.toLowerCase() === window.location.hash.slice(1)) ?? 'Home'
}

export default function App() {
  const interactionRoot = usePointerFeedback()
  const [view, setView] = useState<View>(readView)
  const [project, setProject] = useState(0)
  const [previewProject, setPreviewProject] = useState<number | null>(null)
  const [help, setHelp] = useState(false)
  const [compact, setCompact] = useState(() => window.matchMedia(compactLayoutQuery).matches)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuDialog = useRef<HTMLDialogElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const main = useRef<HTMLElement>(null)
  function navigate(next: View) {
    setMenuOpen(false)
    if (next === view) return
    window.location.hash = next === 'About Me' ? 'about' : next.toLowerCase()
    setView(next)
  }
  useEffect(() => {
    const sync = () => {
      setView(readView())
      setMenuOpen(false)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    document.title = `${view} — Carl John Haro`
    main.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [view])
  useEffect(() => {
    const query = window.matchMedia(compactLayoutQuery)
    const sync = () => {
      setCompact(query.matches)
      setMenuOpen(false)
    }
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    if (!menuOpen || !compact) return
    menuDialog.current?.showModal()
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [menuOpen, compact])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        (e.target as HTMLElement).closest(
          'input, textarea, select, [contenteditable="true"], dialog[open]',
        ) ||
        dialog.current?.open ||
        menuDialog.current?.open
      )
        return
      if (/^[1-9]$/.test(e.key) && Number(e.key) <= views.length) {
        e.preventDefault()
        navigate(views[Number(e.key) - 1])
      }
      if (e.key === '?') setHelp(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => {
    if (help) dialog.current?.showModal()
    else dialog.current?.close()
  }, [help])
  function openBuild(i: number) {
    setProject(i)
    navigate('Builds')
  }
  const indexContent = (
    <>
      <nav aria-label="Portfolio sections">
        {views.map((v, i) => (
          <button
            key={v}
            className={v === view ? 'nav-item active' : 'nav-item'}
            aria-current={v === view ? 'page' : undefined}
            onClick={() => navigate(v)}
          >
            <span className="nav-number">0{i + 1}</span>
            <span>{v === 'Experience' ? 'Exp.' : v}</span>
            {v === view && <motion.span layoutId="nav-dot" className="nav-dot" />}
          </button>
        ))}
      </nav>
      <section className="sidebar-connect" aria-label="Resume and contact links">
        <h2 className="eyebrow">
          GET IN TOUCH
          <span>
            <ArrowDownLeft size={12} aria-hidden="true" />
          </span>
        </h2>
        <div className="connect-links">
          <a href={profile.resume} download="Carl-John-Haro-Resume.pdf" title="Download Resume">
            <Download size={17} aria-hidden="true" />
            <span>Download Resume</span>
          </a>
          <a href={`mailto:${profile.email}`} title="Email Carl">
            <Mail size={17} aria-hidden="true" />
            <span>Email</span>
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            title="GitHub (opens in a new tab)"
          >
            <BrandIcon name="github" size={17} />
            <span>GitHub</span>
          </a>
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              title="LinkedIn (opens in a new tab)"
            >
              <BrandIcon name="linkedin" size={17} />
              <span>LinkedIn</span>
            </a>
          )}
          <a href={`tel:${profile.phone}`} title="Call Carl">
            <Phone size={17} aria-hidden="true" />
            <span>0961 083 4292</span>
          </a>
        </div>
      </section>
    </>
  )
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" ref={interactionRoot}>
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault()
            main.current?.focus()
          }}
        >
          Skip to content
        </a>
        <header className="app-header">
          <button
            className="brand"
            onClick={() => navigate('Home')}
            aria-label="Carl John Haro home"
          >
            <span className="brand-symbol">
              c<span>h</span>
              <i />
            </span>
            <span className="brand-text">
              <strong>
                CARL JOHN HARO<span className="brand-period">.</span>
              </strong>
              <span>FULL-STACK × AI DEVELOPER</span>
            </span>
          </button>
          <div className="header-right">
            <span className="location-label">
              ILOILO, PH{' '}
              <span>
                <ArrowUpRight size={11} aria-hidden="true" />
              </span>
            </span>
            <a className="header-contact" href={`mailto:${profile.email}`}>
              <i className="green-dot" /> LET’S BUILD SOMETHING <ArrowUpRight size={13} />
            </a>
          </div>
          {compact && (
            <button
              className="mobile-menu-button"
              ref={menuButton}
              aria-label="Open index menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-index"
              onClick={() => setMenuOpen(true)}
            >
              <span>MENU</span>
              <Menu size={20} />
            </button>
          )}
        </header>
        <div className="app-body">
          {!compact && (
            <aside className="sidebar">
              <span className="index-label">
                EXPLORE{' '}
                <span>
                  <ArrowDownLeft size={10} aria-hidden="true" />
                </span>
              </span>
              {indexContent}
              <div className="sidebar-bottom">
                <div className="sidebar-doodle" aria-hidden="true">
                  <CodeXml size="1em" />
                </div>
                <p>
                  A little logic.
                  <br />A lot of possibility.
                </p>
              </div>
            </aside>
          )}
          <main
            id="main-content"
            className="main-content"
            ref={main}
            tabIndex={-1}
            aria-label={`${view} view`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                className="view-container"
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {view === 'About Me' ? (
                  <About onBack={() => navigate('Home')} />
                ) : view === 'Home' ? (
                  <Home
                    openPreview={setPreviewProject}
                    navigate={navigate}
                    paused={previewProject !== null || menuOpen || help}
                  />
                ) : view === 'Builds' ? (
                  <Builds
                    selected={project}
                    onSelect={setProject}
                    openPreview={setPreviewProject}
                  />
                ) : view === 'Experience' ? (
                  <Experience />
                ) : view === 'Stack' ? (
                  <Stack />
                ) : (
                  <Contact />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <footer className="app-footer">
          <span className="footer-credit">
            DESIGNED & BUILT BY CARL <span>© {new Date().getFullYear()}</span>
          </span>
          <PortfolioAssistant />
          <span className="footer-note">Built with care. Made to be used.</span>
        </footer>
        {previewProject !== null && (
          <ProjectQuickPreview
            key={previewProject}
            index={previewProject}
            onClose={() => setPreviewProject(null)}
            onExplore={() => {
              openBuild(previewProject)
              setPreviewProject(null)
            }}
          />
        )}
        {compact && (
          <motion.dialog
            id="mobile-index"
            className="mobile-index"
            ref={menuDialog}
            aria-labelledby="mobile-index-title"
            initial={false}
            animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onKeyDown={(event) => {
              if (event.key !== 'Tab') return
              const controls = [
                ...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]'),
              ]
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
            onAnimationComplete={() => {
              if (!menuOpen && menuDialog.current?.open) {
                menuDialog.current.close()
                menuButton.current?.focus({ preventScroll: true })
              }
            }}
            onCancel={(event) => {
              event.preventDefault()
              setMenuOpen(false)
            }}
            onClick={(event) => {
              if (event.target === menuDialog.current) setMenuOpen(false)
            }}
          >
            <div className="mobile-index-content">
              <div className="mobile-index-heading">
                <h2 id="mobile-index-title" className="eyebrow">
                  EXPLORE
                </h2>
                <button autoFocus aria-label="Close index menu" onClick={() => setMenuOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              {indexContent}
            </div>
          </motion.dialog>
        )}
        <dialog
          ref={dialog}
          className="shortcuts-dialog"
          aria-labelledby="shortcuts-title"
          onCancel={() => setHelp(false)}
          onClick={(e) => {
            if (e.target === dialog.current) setHelp(false)
          }}
        >
          <div className="dialog-top">
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <button autoFocus onClick={() => setHelp(false)} aria-label="Close keyboard shortcuts">
              <X size={20} />
            </button>
          </div>
          <h2 id="shortcuts-title">A few shortcuts.</h2>
          {views.map((v, i) => (
            <button
              key={v}
              onClick={() => {
                setHelp(false)
                navigate(v)
              }}
            >
              <span>{v}</span>
              <kbd>{i + 1}</kbd>
            </button>
          ))}
          <p>
            Press <kbd>?</kbd> for this menu. <kbd>Esc</kbd> to close.
          </p>
        </dialog>
        <div className="sr-only" aria-live="polite">
          {view} section
        </div>
      </div>
    </MotionConfig>
  )
}
