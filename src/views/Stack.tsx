import { useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronRight, Code2, Layers3 } from 'lucide-react'
import { stackGroups, technologyDetails } from '../data'
import TechnologyIcon from '../components/TechnologyIcon'

export default function Stack() {
  const [group, setGroup] = useState(0)
  const reducedMotion = useReducedMotion()
  return (
    <div className="section-view stack-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">THE RIGHT TOOLS. THE RIGHT REASONS.</span>
          <h1>
            My building <span className="serif-word">blocks.</span>
          </h1>
        </div>
      </div>
      <div className="stack-layout">
        <div className="stack-menu">
          {stackGroups.map((g, i) => (
            <button aria-pressed={group === i} key={g.name} onClick={() => setGroup(i)}>
              <span>{g.name}</span>
              <ChevronRight size={16} />
            </button>
          ))}
          <div className="stack-principle">
            <Code2 size={24} />
            <p>
              Tools change.
              <br />
              <strong>The care stays.</strong>
            </p>
            <span>
              Clean architecture. Purposeful motion.
              <br />
              Thoughtful, responsive interfaces.
            </span>
          </div>
        </div>
        <div className="stack-board">
          <div className="stack-board-top">
            <h2>{stackGroups[group].note}</h2>
            <span className="mono">
              {stackGroups[group].items.length} {stackGroups[group].countLabel.toUpperCase()}
            </span>
          </div>
          <div
            className="tool-grid"
            style={{ '--tool-rows': stackGroups[group].items.length } as CSSProperties}
            key={group}
          >
            {stackGroups[group].items.map((item, i) => (
              <motion.div
                className="tool-tile"
                key={item}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.24,
                  delay: reducedMotion ? 0 : i * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className={`tool-mark mark-${i % 4}`}>
                  <TechnologyIcon name={item} />
                </span>
                <span className="tool-name">{item}</span>
                <p className="tool-description">{technologyDetails[item]}</p>
              </motion.div>
            ))}
          </div>
          <div className="stack-board-foot">
            <Layers3 size={16} />
            <span>Chosen for what the project needs.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
