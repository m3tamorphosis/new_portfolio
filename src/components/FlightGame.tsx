import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react'
import { observeTheme, readThemePalette } from '../themePalette'

type Phase = 'ready' | 'playing' | 'paused' | 'lost'
type Gate = { x: number; center: number; passed: boolean }
const HEIGHT = 360,
  GROUND = 334,
  RADIUS = 11,
  GAP = 124,
  GATE_WIDTH = 44
const freshFlight = () => ({
  phase: 'ready' as Phase,
  y: 180,
  velocity: 0,
  score: 0,
  time: 0,
  spawn: 1.95,
  gates: [] as Gate[],
})

export default function FlightGame() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const flight = useRef(freshFlight())
  const controls = useRef({ start: () => {}, pause: () => {}, flap: () => {} })
  const [hud, setHud] = useState({ phase: 'ready' as Phase, score: 0, best: 0 })
  useEffect(() => {
    const element = canvas.current!
    const ctx = element.getContext('2d')
    if (!ctx) return
    const colorNames = [
      'game-background',
      'game-grid',
      'game-gate',
      'game-outline',
      'paper',
      'game-ground',
      'game-ground-line',
      'blue',
      'ink',
    ] as const
    let palette = readThemePalette(colorNames)
    let frame = 0,
      previous = 0,
      worldWidth = 400,
      scale = 1,
      best = 0
    let disposed = false,
      visible = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const publish = () => {
      const { phase, score } = flight.current
      best = Math.max(best, score)
      setHud({ phase, score, best })
    }
    const paint = () => {
      if (!element.width || !element.height) return
      const g = flight.current
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, worldWidth, HEIGHT)
      ctx.fillStyle = palette['game-background']
      ctx.fillRect(0, 0, worldWidth, HEIGHT)
      ctx.fillStyle = palette['game-grid']
      for (let x = 15; x < worldWidth + 30; x += 30)
        for (let y = 15; y < GROUND; y += 30)
          ctx.fillRect(x - (reduced.matches ? 0 : (g.time * 10) % 30), y, 1, 1)
      const gates =
        g.phase === 'ready' ? [{ x: worldWidth * 0.76, center: 185, passed: false }] : g.gates
      for (const gate of gates) {
        const top = gate.center - GAP / 2,
          bottom = gate.center + GAP / 2
        ctx.fillStyle = palette['game-gate']
        ctx.strokeStyle = palette['game-outline']
        ctx.lineWidth = 1.3
        ctx.fillRect(gate.x, -2, GATE_WIDTH, top + 2)
        ctx.strokeRect(gate.x, -2, GATE_WIDTH, top + 2)
        ctx.fillRect(gate.x, bottom, GATE_WIDTH, GROUND - bottom)
        ctx.strokeRect(gate.x, bottom, GATE_WIDTH, GROUND - bottom)
        ctx.fillStyle = palette.paper
        ctx.fillRect(gate.x - 3, top - 9, GATE_WIDTH + 6, 9)
        ctx.strokeRect(gate.x - 3, top - 9, GATE_WIDTH + 6, 9)
        ctx.fillRect(gate.x - 3, bottom, GATE_WIDTH + 6, 9)
        ctx.strokeRect(gate.x - 3, bottom, GATE_WIDTH + 6, 9)
      }
      ctx.fillStyle = palette['game-ground']
      ctx.fillRect(0, GROUND, worldWidth, HEIGHT - GROUND)
      ctx.strokeStyle = palette['game-ground-line']
      ctx.beginPath()
      ctx.moveTo(0, GROUND)
      ctx.lineTo(worldWidth, GROUND)
      ctx.stroke()
      // Original artwork, rendered without image assets or a game engine.
      ctx.save()
      ctx.translate(worldWidth * 0.25, g.y)
      ctx.rotate(Math.max(-0.35, Math.min(0.9, g.velocity / 650)))
      ctx.fillStyle = palette.blue
      ctx.beginPath()
      ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#8298f5'
      ctx.beginPath()
      ctx.ellipse(
        -5,
        3,
        8,
        4,
        reduced.matches ? -0.25 : Math.sin(g.time * 16) * 0.35,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.fillStyle = palette.ink
      ctx.beginPath()
      ctx.moveTo(12, -1)
      ctx.lineTo(21, 3)
      ctx.lineTo(12, 5)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fcfcfa'
      ctx.beginPath()
      ctx.arc(6, -4, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#242521'
      ctx.beginPath()
      ctx.arc(7, -4, 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    const schedule = () => {
      if (!disposed && !frame && visible && !document.hidden && flight.current.phase === 'playing')
        frame = requestAnimationFrame(tick)
    }
    const tick = (now: number) => {
      frame = 0
      const g = flight.current
      if (g.phase !== 'playing') return
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 0
      previous = now
      g.time += dt
      g.velocity = Math.min(420, g.velocity + 760 * dt)
      g.y += g.velocity * dt
      g.spawn -= dt
      if (g.spawn <= 0) {
        g.gates.push({ x: worldWidth + 10, center: 145 + Math.random() * 65, passed: false })
        g.spawn = 1.95
      }
      let changed = false
      const birdX = worldWidth * 0.25
      for (const gate of g.gates) {
        gate.x -= 108 * dt
        const overlaps = birdX + RADIUS > gate.x - 3 && birdX - RADIUS < gate.x + GATE_WIDTH + 3
        if (
          overlaps &&
          (g.y - RADIUS < gate.center - GAP / 2 || g.y + RADIUS > gate.center + GAP / 2)
        )
          g.phase = 'lost'
        if (!gate.passed && gate.x + GATE_WIDTH + 3 < birdX - RADIUS) {
          gate.passed = true
          g.score++
          changed = true
        }
      }
      if (g.y - RADIUS <= 0 || g.y + RADIUS >= GROUND) {
        g.y = Math.max(RADIUS, Math.min(GROUND - RADIUS, g.y))
        g.phase = 'lost'
      }
      g.gates = g.gates.filter((gate) => gate.x + GATE_WIDTH > -10)
      if (changed || g.phase === 'lost') publish()
      paint()
      schedule()
    }
    const pause = () => {
      if (flight.current.phase !== 'playing') return
      flight.current.phase = 'paused'
      cancelAnimationFrame(frame)
      frame = 0
      previous = 0
      publish()
      paint()
    }
    controls.current = {
      start: () => {
        if (flight.current.phase !== 'paused') {
          flight.current = freshFlight()
          flight.current.gates = [{ x: worldWidth * 0.85, center: 180, passed: false }]
          flight.current.velocity = -245
        }
        flight.current.phase = 'playing'
        previous = 0
        publish()
        paint()
        schedule()
        element.focus({ preventScroll: true })
      },
      pause,
      flap: () => {
        if (flight.current.phase === 'playing') flight.current.velocity = -245
      },
    }
    const resize = new ResizeObserver(() => {
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = (box.width / box.height) * HEIGHT
      if (worldWidth !== nextWidth) {
        for (const gate of flight.current.gates) gate.x += (nextWidth - worldWidth) * 0.25
        pause()
      }
      worldWidth = nextWidth
      element.width = Math.round(box.width * ratio)
      element.height = Math.round(box.height * ratio)
      scale = element.height / HEIGHT
      paint()
    })
    resize.observe(element)
    const stopThemeObserver = observeTheme(() => {
      palette = readThemePalette(colorNames)
      paint()
    })
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (!visible) pause()
      },
      { threshold: 0.15 },
    )
    intersection.observe(element)
    const visibility = () => {
      if (document.hidden) pause()
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', pause)
    return () => {
      disposed = true
      stopThemeObserver()
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', pause)
    }
  }, [])
  return (
    <div className="demo flight-demo">
      <div className="demo-app-header">
        <span className="demo-logo">SIGNAL / GLIDE</span>
        <span className="demo-pill">PLAYABLE CONCEPT</span>
      </div>
      <div className="flight-stage">
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Flappy flight game"
          aria-describedby="flight-instructions"
          onPointerDown={(e) => {
            if (flight.current.phase !== 'playing') return
            e.preventDefault()
            e.currentTarget.focus({ preventScroll: true })
            controls.current.flap()
          }}
          onKeyDown={(e) => {
            if (![' ', 'ArrowUp'].includes(e.key)) return
            e.preventDefault()
            e.stopPropagation()
            if (!e.repeat) controls.current.flap()
          }}
        >
          Tap, click, or press Space to flap through the gaps. Each cleared gate earns one point.
        </canvas>
        {hud.phase !== 'playing' && (
          <div className="flight-overlay">
            <span className="small-label">
              {hud.phase === 'paused'
                ? 'TAKE YOUR TIME'
                : hud.phase === 'lost'
                  ? 'FLIGHT COMPLETE'
                  : 'A SMALL SPACE TO PLAY'}
            </span>
            <h3>
              {hud.phase === 'paused'
                ? 'Holding position.'
                : hud.phase === 'lost'
                  ? 'One more flight?'
                  : 'Find your rhythm.'}
            </h3>
            <p>
              {hud.phase === 'ready'
                ? 'A little lift. A little timing.'
                : hud.phase === 'paused'
                  ? 'Ready when you are.'
                  : `${hud.score} ${hud.score === 1 ? 'gap' : 'gaps'} cleared. Try for one more.`}
            </p>
            <button className="button button-dark" onClick={() => controls.current.start()}>
              {hud.phase === 'paused'
                ? 'Resume flight'
                : hud.phase === 'ready'
                  ? 'Let’s fly'
                  : 'Fly again'}{' '}
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
      <p className="flight-instructions" id="flight-instructions">
        Tap, click, or press Space to flap.
        <br />
        <span>Stay in the gaps. Keep your rhythm.</span>
      </p>
      <div className="flight-hud">
        <span className="flight-score">
          <span>SCORE </span>
          {String(hud.score).padStart(2, '0')}
        </span>
        <span className="flight-best">BEST {String(hud.best).padStart(2, '0')}</span>
        <div className="flight-controls">
          <button
            aria-label={hud.phase === 'paused' ? 'Resume game' : 'Pause game'}
            disabled={!['playing', 'paused'].includes(hud.phase)}
            onClick={() =>
              hud.phase === 'paused' ? controls.current.start() : controls.current.pause()
            }
          >
            {hud.phase === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            aria-label="Restart game"
            onClick={() => {
              flight.current = freshFlight()
              controls.current.start()
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {hud.phase === 'playing'
          ? 'Flight started. Tap or press Space to flap.'
          : hud.phase === 'lost'
            ? `Flight ended. Score ${hud.score}.`
            : hud.phase === 'paused'
              ? 'Game paused.'
              : 'Ready to fly.'}
      </span>
    </div>
  )
}
