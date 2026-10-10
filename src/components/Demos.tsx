import { useState } from 'react'
import { projects } from '../data'
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  FileText,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

export function MiniPreview({ id }: { id: string }) {
  const preview = projects.find((project) => project.id === id)?.preview
  if (preview)
    return (
      <div className="mini-preview mini-screenshot" aria-hidden="true">
        <img src={preview.thumbnail} alt="" width={640} height={640} decoding="async" />
      </div>
    )
  if (id === 'playable')
    return (
      <div className="mini-preview mini-screenshot" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}images/playable-wallpaper.svg`}
          alt=""
          width={320}
          height={320}
          decoding="async"
        />
      </div>
    )
  if (id === 'insight')
    return (
      <div className="mini-preview mini-chart" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    )
  if (id === 'study')
    return (
      <div className="mini-preview mini-study" aria-hidden="true">
        <FileText size={20} />
        <span>
          <i />
          <i />
          <i />
        </span>
        <BookOpen size={14} />
      </div>
    )
  return (
    <div className="mini-preview mini-game" aria-hidden="true">
      <div className="mini-grid">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <ShieldCheck size={24} />
    </div>
  )
}

export { default as PlayableDemo } from './FlightGame'

export function InsightDemo() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [insight, setInsight] = useState(false)
  const values = period === 'week' ? [35, 52, 43, 68, 57, 89, 76] : [28, 42, 39, 61, 73, 66, 94]
  return (
    <div className="demo analytics-demo">
      <div className="demo-app-header">
        <span className="demo-logo">
          <span className="logo-box">iv</span> InsightVault
        </span>
        <span className="demo-pill">SAMPLE DATA</span>
      </div>
      <div className="demo-greeting">Your data. A little clearer.</div>
      <div className="chart-top">
        <div>
          <span className="small-label">REVENUE OVERVIEW</span>
          <strong>
            {period === 'week' ? '$12,480' : '$48,920'}{' '}
            <span>
              <ArrowUpRight className="metric-trend-icon" size={11} aria-hidden="true" />{' '}
              {period === 'week' ? '18.6' : '24.2'}%
            </span>
          </strong>
        </div>
        <div className="segmented">
          <button
            aria-pressed={period === 'week'}
            onClick={() => {
              setPeriod('week')
              setInsight(false)
            }}
          >
            Week
          </button>
          <button
            aria-pressed={period === 'month'}
            onClick={() => {
              setPeriod('month')
              setInsight(false)
            }}
          >
            Month
          </button>
        </div>
      </div>
      <div className="chart-area">
        <div className="chart-guides">
          <span>10k</span>
          <span>5k</span>
          <span>0</span>
        </div>
        <div className="bars">
          {values.map((v, i) => (
            <div className="bar-column" key={i}>
              <div className="bar" style={{ height: `${v}%` }}>
                <span>{v * (period === 'week' ? 10 : 40)}</span>
              </div>
              <small>
                {period === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] : `W${i + 1}`}
              </small>
            </div>
          ))}
        </div>
      </div>
      <button className="insight-prompt" onClick={() => setInsight(!insight)}>
        <ChartNoAxesCombined size={16} aria-hidden="true" />
        <span>{insight ? 'Hide the insight' : 'What’s the story behind these numbers?'}</span>
        <ArrowUpRight size={16} />
      </button>
      {insight && (
        <div className="insight-answer" role="status">
          {period === 'week'
            ? 'Saturday leads this sample week. Weekend activity is stronger than the Monday–Friday average.'
            : 'The last sample week is the strongest. Growth is positive overall, with two brief dips.'}
          <small>Preset explanation · no AI request is made</small>
        </div>
      )}
    </div>
  )
}

export function StudyDemo() {
  const [flipped, setFlipped] = useState(false)
  const [card, setCard] = useState(0)
  const cards = [
    [
      'What is retrieval-augmented generation?',
      'RAG retrieves relevant information from a knowledge source and provides it as context for a language model’s answer.',
    ],
    [
      'What is an embedding?',
      'A numerical representation of content that makes it possible to compare meaning and retrieve similar information.',
    ],
    [
      'Why split a document into chunks?',
      'Smaller passages help retrieve focused context and keep prompts within the model’s context window.',
    ],
  ]
  return (
    <div className="demo study-demo">
      <div className="demo-app-header">
        <span className="demo-logo">
          <span className="logo-box">sb</span> StudyBuddy
        </span>
        <span className="demo-pill">SAMPLE DECK</span>
      </div>
      <div className="study-document">
        <FileText size={16} />
        <span>Introduction to AI.pdf</span>
        <span>3 flashcards</span>
      </div>
      <span className="small-label">A LITTLE PRACTICE. A LOT OF PROGRESS.</span>
      <button
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
        aria-label={flipped ? 'Show question' : 'Reveal answer'}
      >
        <span className="flashcard-kind">
          {flipped ? 'THE ANSWER' : 'QUICK QUESTION'} <BookOpen size={16} aria-hidden="true" />
        </span>
        <strong>{cards[card][flipped ? 1 : 0]}</strong>
        <span className="flashcard-hint">
          <RotateCcw size={13} /> Click to {flipped ? 'see question' : 'reveal answer'}
        </span>
      </button>
      <div className="flashcard-footer">
        <span>
          0{card + 1} <span>/ 03</span>
        </span>
        <button
          onClick={() => {
            setCard((card + 1) % cards.length)
            setFlipped(false)
          }}
        >
          Next card <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function DangerDemo() {
  const [choice, setChoice] = useState<number | null>(null)
  const [stage, setStage] = useState(0)
  const questions = [
    {
      text: 'The room starts shaking. What do you do first?',
      answers: ['Run toward the stairs', 'Drop, cover, and hold on', 'Stand next to a window'],
      correct: 1,
      message:
        'Protect your head and neck under sturdy cover, and hold on until the shaking stops.',
    },
    {
      text: 'The shaking stops. What comes next?',
      answers: [
        'Use the elevator',
        'Return to collect belongings',
        'Follow the designated evacuation route',
      ],
      correct: 2,
      message:
        'Move carefully along the designated route and follow your local emergency guidance.',
    },
  ]
  const q = questions[stage]
  return (
    <div className="demo danger-demo">
      <div className="demo-app-header">
        <span className="demo-logo">
          <ShieldCheck size={19} /> DANGER ZONE
        </span>
        <span className="demo-pill">SCENARIO DEMO</span>
      </div>
      <div className="scenario-scene" aria-hidden="true">
        <div className="scene-window" />
        <div className="scene-desk" />
        <div className="scene-floor" />
        <span>EARTHQUAKE / INDOORS</span>
      </div>
      <div className="scenario-question">
        <span className="small-label">DECISION 0{stage + 1}</span>
        <h3>{q.text}</h3>
      </div>
      <div className="scenario-answers">
        {q.answers.map((answer, i) => (
          <button
            key={answer}
            className={choice === i ? (i === q.correct ? 'correct' : 'incorrect') : ''}
            onClick={() => setChoice(i)}
          >
            <span>0{i + 1}</span>
            {answer}
            {choice === i && i === q.correct ? <Check size={15} /> : <ChevronRight size={15} />}
          </button>
        ))}
      </div>
      <div className="scenario-feedback" aria-live="polite">
        {choice !== null ? (
          <>
            <span>
              {choice === q.correct
                ? q.message
                : 'Try again. Think about the safest immediate action.'}
            </span>
            {choice === q.correct && (
              <button
                aria-label={stage === 0 ? 'Next scenario' : 'Restart scenario'}
                onClick={() => {
                  setStage((stage + 1) % 2)
                  setChoice(null)
                }}
              >
                <ArrowUpRight size={18} />
              </button>
            )}
          </>
        ) : (
          <span>Choose an action to try the interaction.</span>
        )}
      </div>
    </div>
  )
}
