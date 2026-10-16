import { useState } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { ChevronRight } from 'lucide-react'

export default function Experience() {
  const [selected, setSelected] = useState(0)
  const reducedMotion = useReducedMotion()
  const roles = [
    {
      company: 'HPL Game Design',
      full: 'HPL Game Design Corporation',
      role: 'Front-End Web Developer | Game Developer — Mid',
      field: 'FRONT-END DEVELOPMENT | GAME DEVELOPMENT',
      date: 'APR — OCT 2026',
      body: 'Reusable systems. Experiences built to be played.',
      points: [
        'Engineered reusable animation systems and interactive UI with React, Vite, Canvas, and Motion.',
        'Built cross-platform game experiences with Phaser 3: game loops, sprite animation, and win/lose states.',
        'Designed drag-and-drop, tap-to-play, and timed mechanics optimized for iOS and Android.',
        'Optimized mobile front-end bundles within strict 5 MB limits while preserving smooth animation.',
      ],
      tags: ['Interactive UI', 'Game mechanics', 'Performance'],
    },
    {
      company: 'Department of Budget & Management',
      full: 'Department of Budget and Management',
      role: 'Business Data Analytics Intern',
      field: 'DATA & ANALYTICS',
      date: 'FEB — MAY 2025',
      body: 'Turning complex financial reports into something people can use.',
      points: [
        'Analyzed government financial datasets for budget monitoring and reporting.',
        'Converted 100+ PDF financial reports, approximately 10,000 records, into structured datasets.',
        'Built Power BI dashboards to track budget utilization KPIs.',
      ],
      tags: ['Data pipelines', 'Power BI', 'Financial analytics'],
    },
  ]
  const role = roles[selected]
  return (
    <div className="section-view experience-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">THE WORK BEHIND THE WORK</span>
          <h1>
            Built on <span className="serif-word">experience.</span>
          </h1>
        </div>
      </div>
      <div className="experience-layout">
        <LayoutGroup id="experience-timeline">
          <div className="experience-timeline">
            {roles.map((r, i) => (
              <button aria-pressed={selected === i} onClick={() => setSelected(i)} key={r.company}>
                <span className="timeline-dot" aria-hidden="true" />
                {selected === i && (
                  <motion.span
                    className="timeline-dot timeline-dot-active"
                    layoutId="active-role-dot"
                    aria-hidden="true"
                    initial={false}
                    transition={{
                      layout: {
                        duration: reducedMotion ? 0 : 0.38,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                  />
                )}
                <span className="eyebrow">{r.date}</span>
                <h3>{r.company}</h3>
                <p>{r.role}</p>
              </button>
            ))}
            <div className="education">
              <span className="eyebrow">THE FOUNDATION / 2021 — 2025</span>
              <h3>BS Computer Science</h3>
              <p>
                Central Philippine University
                <br />
                Iloilo City, Philippines
              </p>
            </div>
          </div>
        </LayoutGroup>
        <motion.article
          key={selected}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.24 }}
          className="experience-detail"
        >
          <div className="detail-top">
            <span className="eyebrow">{role.field}</span>
            {selected === 0 && <span className="current-pill">RECENT ROLE</span>}
          </div>
          <h2>{role.body}</h2>
          <span className="role-company">{role.full}</span>
          <ul>
            {role.points.map((p) => (
              <li key={p}>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="tags">
            {role.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </motion.article>
      </div>
    </div>
  )
}
