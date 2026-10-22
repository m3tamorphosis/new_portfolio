import { useId, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { projects } from '../data'

type Project = (typeof projects)[number]

// A present-day layout study, not a claimed earlier version of the project.
function LayoutStudy({ id }: { id: string }) {
  const box = (x: number, y: number, w: number, h: number) => (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={14}
      fill="var(--study-paper)"
      stroke="var(--study-outline)"
      strokeWidth={2}
    />
  )
  const lines = (x: number, y: number, w: number, count = 3, gap = 30) =>
    Array.from({ length: count }, (_, i) => (
      <rect
        key={i}
        x={x}
        y={y + i * gap}
        width={w * (i === count - 1 ? 0.72 : 1)}
        height={10}
        rx={5}
        fill="var(--study-line)"
      />
    ))
  return (
    <svg viewBox="0 0 1440 1000" className="layout-study" aria-hidden="true">
      <rect width="1440" height="1000" fill="var(--study-background)" />
      {id === 'careerforge' ? (
        <>
          {box(0, 0, 1440, 80)}
          {lines(100, 32, 190, 1)}
          {lines(900, 32, 300, 1)}
          {box(75, 176, 375, 38)}
          {lines(75, 255, 640, 5, 70)}
          {lines(75, 636, 630)}
          {box(75, 750, 135, 48)}
          {box(222, 750, 130, 48)}
          {box(765, 290, 590, 540)}
          {lines(810, 345, 400, 2)}
          {box(810, 422, 502, 96)}
          {box(810, 538, 245, 130)}
          {box(1070, 538, 242, 130)}
          {box(810, 686, 502, 102)}
          {[75, 298, 520].map((x) => (
            <g key={x}>
              {box(x, 848, 207, 97)}
              {lines(x + 22, 877, 140, 2)}
            </g>
          ))}
        </>
      ) : id === 'insight' ? (
        <>
          {box(208, 212, 575, 577)}
          {box(807, 212, 425, 577)}
          {lines(250, 264, 370, 2)}
          {lines(250, 345, 440, 3, 45)}
          {lines(250, 505, 470)}
          {[250, 418, 586].map((x) => (
            <g key={x}>
              {box(x, 613, 156, 134)}
              {lines(x + 20, 645, 112, 3)}
            </g>
          ))}
          {box(840, 245, 360, 45)}
          {lines(840, 331, 280, 2)}
          {box(840, 422, 360, 56)}
          {box(840, 519, 360, 56)}
          {box(840, 624, 360, 45)}
        </>
      ) : id === 'study' ? (
        <>
          {box(112, 36, 1216, 513)}
          {lines(149, 84, 300, 1)}
          {lines(149, 136, 620, 4, 60)}
          {lines(149, 410, 640, 2)}
          {box(847, 74, 443, 437)}
          {[130, 255, 380].map((y) => (
            <g key={y}>
              {box(868, y, 400, 110)}
              {lines(946, y + 30, 280, 2)}
            </g>
          ))}
          {box(112, 574, 1216, 460)}
          {lines(149, 650, 670, 3, 44)}
          {box(149, 810, 830, 140)}
          {box(1010, 637, 280, 140)}
          {box(1010, 792, 280, 140)}
        </>
      ) : id === 'portfolio' ? (
        <>
          {box(44, 0, 1352, 92)}
          {lines(70, 30, 220, 2, 22)}
          {lines(1090, 40, 230, 1)}
          {box(44, 116, 162, 780)}
          {[180, 250, 320, 390, 460, 530].map((y) => (
            <g key={y}>{lines(70, y, 110, 1)}</g>
          ))}
          {lines(248, 190, 520, 3, 75)}
          {lines(248, 435, 530, 4, 28)}
          {box(248, 570, 180, 48)}
          <circle
            cx="1090"
            cy="410"
            r="225"
            fill="var(--study-paper)"
            stroke="var(--study-outline)"
            strokeWidth="2"
          />
          {[248, 635, 1022].map((x) => (
            <g key={x}>
              {box(x, 780, 350, 100)}
              {lines(x + 20, 812, 280, 2)}
            </g>
          ))}
          {lines(60, 940, 250, 1)}
        </>
      ) : (
        <>
          {box(0, 0, 1440, 80)}
          {lines(112, 33, 190, 1)}
          {lines(460, 33, 550, 1)}
          {box(382, 160, 676, 408)}
          <path
            d="M382 160L1058 568M1058 160L382 568"
            stroke="var(--study-cross)"
            strokeWidth="2"
          />
          {lines(290, 665, 860, 1)}
          {lines(430, 740, 570, 1)}
          {box(512, 820, 200, 60)}
          {box(729, 820, 200, 60)}
        </>
      )}
    </svg>
  )
}

export default function ProjectComparison({ project }: { project: Project }) {
  const [position, setPosition] = useState(50)
  const [pointerFocus, setPointerFocus] = useState(false)
  const descriptionId = useId()
  if (!project.preview) return null
  return (
    <div className="project-comparison">
      <div className="comparison-labels" aria-hidden="true">
        <span>Layout study</span>
        <span>Current design</span>
      </div>
      <div className="comparison-stage">
        <img src={project.preview.image} alt={project.preview.alt} width={1440} height={1000} />
        <div className="comparison-study" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <LayoutStudy id={project.id} />
        </div>
        <div className="comparison-divider" style={{ left: `${position}%` }} aria-hidden="true">
          <span>
            <MoveHorizontal size={18} />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          data-pointer-focus={pointerFocus || undefined}
          onPointerDown={() => setPointerFocus(true)}
          onKeyDown={() => setPointerFocus(false)}
          onBlur={() => setPointerFocus(false)}
          aria-label={`Compare ${project.name} layout study and current design`}
          aria-valuetext={`${position}% layout study, ${100 - position}% current design`}
          aria-describedby={descriptionId}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
      <p id={descriptionId} className="comparison-caption">
        Drag to compare, or use the arrow keys. A simplified layout study alongside the current
        interface.
      </p>
    </div>
  )
}
