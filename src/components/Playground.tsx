import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'
import { stackGroups } from '../data'
import TechnologyIcon from './TechnologyIcon'
import { compactLayoutQuery } from '../layout'
import { observeTheme, readThemePalette } from '../themePalette'

type Point = { x: number; y: number; z: number }
const technologies = [...new Set(stackGroups.flatMap((group) => group.items))]
const samples = technologies.length * 16
const signalCount = 8

function createNetwork() {
  // Even coverage with a little variation; shuffle identities independently of the route.
  const phase = Math.random() * Math.PI * 2
  const anchors: Point[] = technologies.map((_, i) => {
    const y = -0.78 + ((i + 0.5) / technologies.length) * 1.56
    const longitude = phase + i * Math.PI * (3 - Math.sqrt(5)) + (Math.random() - 0.5) * 0.22
    const radius = Math.sqrt(1 - y * y)
    return { x: radius * Math.cos(longitude), y, z: radius * Math.sin(longitude) }
  })
  for (let i = anchors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[anchors[i], anchors[j]] = [anchors[j], anchors[i]]
  }
  const remaining = anchors.map((_, i) => i)
  const order = [remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]]
  while (remaining.length) {
    const previous = anchors[order[order.length - 1]]
    const distance = (i: number) =>
      Math.hypot(anchors[i].x - previous.x, anchors[i].y - previous.y, anchors[i].z - previous.z)
    remaining.sort((a, b) => distance(a) - distance(b))
    // Prefer nearby connections so randomization stays restrained instead of becoming a web.
    order.push(remaining.splice(remaining.length > 1 && Math.random() < 0.25 ? 1 : 0, 1)[0])
  }
  const nodeTimes = anchors.map(() => 0)
  order.forEach((index, step) => {
    nodeTimes[index] = step / order.length
  })
  const route = Array.from({ length: samples }, (_, i) => {
    const position = (i / samples) * order.length
    const index = Math.floor(position)
    const a = anchors[order[index]],
      b = anchors[order[(index + 1) % order.length]]
    const previous = anchors[order[(index + order.length - 1) % order.length]],
      next = anchors[order[(index + 2) % order.length]]
    const t = position - index
    // A closed Catmull–Rom curve softens turns at each technology anchor.
    const interpolate = (axis: keyof Point) =>
      0.5 *
      (2 * a[axis] +
        (-previous[axis] + b[axis]) * t +
        (2 * previous[axis] - 5 * a[axis] + 4 * b[axis] - next[axis]) * t * t +
        (-previous[axis] + 3 * a[axis] - 3 * b[axis] + next[axis]) * t * t * t)
    const point = { x: interpolate('x'), y: interpolate('y'), z: interpolate('z') }
    const length = Math.hypot(point.x, point.y, point.z)
    return { x: point.x / length, y: point.y / length, z: point.z / length }
  })
  return { anchors, route, nodeTimes }
}

export default function Playground({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const pointer = useRef({ x: 0, y: 0, inside: false })
  const orientation = useRef({ x: 0, y: 0 })
  const drag = useRef<{
    id: number | null
    x: number
    y: number
  }>({ id: null, x: 0, y: 0 })
  const elapsed = useRef(0)
  const rotationElapsed = useRef(0)
  const redraw = useRef<() => void>(() => {})
  const reduced = useReducedMotion()
  const [network] = useState(createNetwork)

  useEffect(() => {
    const { anchors, route, nodeTimes } = network
    const canvas = canvasRef.current,
      ctx = canvas?.getContext('2d')
    // Keep the last frame while a modal covers Home; resume from the same rotation.
    if (!canvas || !ctx || paused) return
    const colorNames = ['globe-signal-rgb', 'globe-grid-rgb'] as const
    let palette = readThemePalette(colorNames)
    let darkTheme = document.documentElement.dataset.theme === 'dark'
    let frame = 0,
      previous = 0,
      width = 0,
      height = 0
    let compact = false,
      portrait = false,
      visible = true,
      disposed = false
    const cursor = { x: 0, y: 0 }
    const elements = nodeRefs.current.map((node) => ({
      node,
      label: node?.querySelector<HTMLElement>('.globe-node-label'),
    }))
    const labelWidths = technologies.map(() => 0)
    const schedule = () => {
      if (!disposed && !frame && visible && !document.hidden && width > 0 && height > 0)
        frame = requestAnimationFrame(draw)
    }
    const draw = (time: number) => {
      frame = 0
      const delta = previous ? Math.max(0, Math.min(time - previous, 50)) : 0
      previous = time
      if (!reduced) {
        elapsed.current += delta
        if (drag.current.id === null) rotationElapsed.current += delta
      }
      const ease = reduced ? 1 : 1 - Math.exp(-delta / 160)
      cursor.x += ((pointer.current.inside ? pointer.current.x : 0) - cursor.x) * ease
      cursor.y += ((pointer.current.inside ? pointer.current.y : 0) - cursor.y) * ease
      const rotation =
        0.55 +
        orientation.current.x +
        rotationElapsed.current * 0.000075 +
        (reduced ? 0 : cursor.x * 0.4)
      const tilt = -0.12 + orientation.current.y + (reduced ? 0 : cursor.y * 0.14)
      const size = Math.min(
        width * (portrait ? 0.46 : compact ? 0.36 : 0.47),
        height * (portrait ? 0.47 : compact ? 0.46 : 0.475),
      )
      const centerY = height * 0.51
      const project = (p: Point): Point => {
        const x = p.x * Math.cos(rotation) - p.z * Math.sin(rotation)
        const z = p.x * Math.sin(rotation) + p.z * Math.cos(rotation)
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt)
        const depth = p.y * Math.sin(tilt) + z * Math.cos(tilt)
        const perspective = 5 / (5 - depth)
        return {
          x: width / 2 + x * size * perspective,
          y: centerY + y * size * perspective,
          z: depth,
        }
      }
      // Echo the dark backdrop: sage at the lower left, charcoal in the
      // middle, and a blue-violet tint toward the upper right.
      const wireframeGradient = ctx.createLinearGradient(0, height, width, 0)
      wireframeGradient.addColorStop(0, '#21282a')
      wireframeGradient.addColorStop(0.45, '#1a1e21')
      wireframeGradient.addColorStop(1, '#2b303f')
      const stroke = (a: Point, b: Point, alpha: number, blue = false, weight = 0.65) => {
        if (!blue && !darkTheme) {
          ctx.strokeStyle = wireframeGradient
          ctx.globalAlpha = alpha
        } else {
          ctx.strokeStyle = `rgba(${palette[blue ? 'globe-signal-rgb' : 'globe-grid-rgb']},${alpha})`
        }
        ctx.lineWidth = weight
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      const rows = compact ? 10 : 18,
        cols = compact ? 24 : 36
      const mesh = Array.from({ length: rows + 1 }, (_, i) =>
        Array.from({ length: cols + 1 }, (_, j) => {
          const u = (i / rows) * Math.PI,
            v = (j / cols) * Math.PI * 2
          return project({
            x: Math.sin(u) * Math.cos(v),
            y: Math.cos(u),
            z: Math.sin(u) * Math.sin(v),
          })
        }),
      )
      for (let i = 0; i <= rows; i++)
        for (let j = 0; j < cols; j++) {
          const p = mesh[i][j],
            alpha = darkTheme ? 0.1 + (p.z + 1) * 0.16 : 0.08 + (p.z + 1) * 0.13
          stroke(p, mesh[i][j + 1], alpha, false, darkTheme ? 0.9 : 0.8)
          if (i < rows && j % 2 === 0)
            stroke(p, mesh[i + 1][j], alpha, false, darkTheme ? 0.9 : 0.8)
        }
      const path = route.map(project)
      const heads = Array.from(
        { length: signalCount },
        (_, index) => (elapsed.current / 48000 + index / signalCount) % 1,
      )
      const signals = heads.map((head) => {
        const position = head * samples,
          segment = Math.floor(position),
          amount = position - segment
        const a = path[segment],
          b = path[(segment + 1) % samples]
        return {
          x: a.x + (b.x - a.x) * amount,
          y: a.y + (b.y - a.y) * amount,
          z: a.z + (b.z - a.z) * amount,
        }
      })
      const points = anchors.map(project)
      const px = (pointer.current.x + 0.5) * width,
        py = (pointer.current.y + 0.5) * height
      let hovered = -1,
        near = compact ? 26 : 38
      if (pointer.current.inside)
        points.forEach((p, i) => {
          const distance = Math.hypot(px - p.x, py - (p.y - 14))
          if (p.z > 0 && distance < near) {
            hovered = i
            near = distance
          }
        })
      for (let i = 0; i < samples; i++) {
        const tail = heads.reduce((brightest, head) => {
          const behind = (head - i / samples + 1) % 1
          const fade = Math.max(0, 1 - behind / 0.045)
          return Math.max(brightest, fade * fade * (3 - 2 * fade))
        }, 0)
        const hoverDistance = hovered >= 0 ? Math.abs(i / samples - nodeTimes[hovered]) : 1
        const highlight = hovered >= 0 && Math.min(hoverDistance, 1 - hoverDistance) < 0.035
        const depth = path[i].z < 0 ? (darkTheme ? 0.28 : 0.2) : 1
        stroke(
          path[i],
          path[(i + 1) % samples],
          ((darkTheme ? 0.1 : 0.07) + tail * (darkTheme ? 0.8 : 0.7) + (highlight ? 0.35 : 0)) *
            depth,
          true,
          tail > 0 || highlight ? (compact ? 3 : 3.4) : 0.65,
        )
      }
      const icon = compact ? 34 : 38
      const candidates = points
        .map((point, index) => ({ point, index }))
        .sort((a, b) => {
          if (a.index === hovered) return -1
          if (b.index === hovered) return 1
          return b.point.z - a.point.z
        })
      const iconBoxes: { x: number; y: number; w: number; h: number; index: number }[] = []
      const conflicts = (
        a: { x: number; y: number; w: number; h: number },
        b: { x: number; y: number; w: number; h: number },
      ) => a.x < b.x + b.w + 4 && a.x + a.w + 4 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y
      const textBoxes: { x: number; y: number; w: number; h: number }[] = []
      candidates.forEach(({ point: p, index }) => {
        const { node, label } = elements[index]
        if (!node || !label) return
        const origin = { x: p.x - icon / 2, y: p.y - icon - 7 }
        const iconBox = { ...origin, w: icon, h: icon, index }
        // Reserve space only for complete icon/name pairs that are actually displayed.
        const fitsIcon =
          p.z >= -0.08 &&
          origin.y >= 12 &&
          origin.y + icon <= height - 12 &&
          origin.x >= 16 &&
          origin.x + icon <= width - 22 &&
          iconBoxes.length < (compact ? 12 : 22) &&
          !iconBoxes.some((other) => conflicts(iconBox, other)) &&
          !textBoxes.some((other) => conflicts(iconBox, other))
        const labelWidth = labelWidths[index] + 8
        const placements = [
          { x: origin.x + icon + 8, y: origin.y + (icon - 26) / 2 },
          { x: origin.x - labelWidth - 8, y: origin.y + (icon - 26) / 2 },
          { x: p.x - labelWidth / 2, y: origin.y - 34 },
          { x: p.x - labelWidth / 2, y: p.y + 5 },
        ]
        const box = fitsIcon
          ? placements
              .map((placement) => ({ ...placement, w: labelWidth, h: 26 }))
              .find(
                (candidate) =>
                  candidate.x >= 12 &&
                  candidate.x + candidate.w <= width - 20 &&
                  candidate.y >= 12 &&
                  candidate.y + candidate.h <= height - 12 &&
                  !iconBoxes.some(
                    (other) => other.index !== index && conflicts(candidate, other),
                  ) &&
                  !textBoxes.some((other) => conflicts(candidate, other)),
              )
          : undefined
        // A front-facing icon always comes with its name; crowded nodes emerge as they rotate.
        const visible = Boolean(box)
        const distance = heads.reduce((nearest, head) => {
          const d = Math.abs(head - nodeTimes[index])
          return Math.min(nearest, d, 1 - d)
        }, 1)
        const pulse = Math.max(0, 1 - distance / 0.016)
        const opacity = visible
          ? Math.min(1, (darkTheme ? 0.96 : 0.88) + p.z * 0.1 + pulse * 0.1) *
            (hovered >= 0 && hovered !== index ? (darkTheme ? 0.94 : 0.85) : 1)
          : 0
        node.style.transform = `translate3d(${(p.x - icon / 2).toFixed(2)}px, ${(p.y - icon - 7).toFixed(2)}px, 0)`
        node.style.opacity = String(opacity)
        node.style.zIndex = String(Math.round((p.z + 1) * 10))
        node.classList.toggle('is-active', index === hovered || pulse > 0.15)
        label.style.opacity = visible ? '1' : '0'
        if (box) {
          iconBoxes.push(iconBox)
          label.style.left = `${box.x - origin.x}px`
          label.style.top = `${box.y - origin.y}px`
          textBoxes.push(box)
        }
        if (p.z > 0) {
          ctx.fillStyle = `rgba(${palette['globe-signal-rgb']},${(darkTheme ? 0.3 : 0.18) + pulse * 0.7})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.4 + pulse, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      signals.forEach((signal) => {
        ctx.fillStyle = `rgba(${palette['globe-signal-rgb']},${signal.z < 0 ? (darkTheme ? 0.45 : 0.3) : 1})`
        ctx.beginPath()
        ctx.arc(signal.x, signal.y, compact ? 5 : 6, 0, Math.PI * 2)
        ctx.fill()
      })
      if (!reduced) schedule()
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      compact = window.matchMedia(compactLayoutQuery).matches
      portrait = compact && window.innerHeight > window.innerWidth
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(0, Math.round(width * dpr))
      canvas.height = Math.max(0, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${compact ? 15 : 17}px "Satoshi", sans-serif`
      technologies.forEach((name, i) => {
        labelWidths[i] = ctx.measureText(name.replace(' (Canvas/WebGL)', '')).width
      })
      schedule()
    }
    redraw.current = schedule
    const stopThemeObserver = observeTheme(() => {
      palette = readThemePalette(colorNames)
      darkTheme = document.documentElement.dataset.theme === 'dark'
      schedule()
    })
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    document.fonts.ready.then(() => {
      if (!disposed) resize()
    })
    const visibility = () => {
      previous = 0
      if (document.hidden || !visible) {
        cancelAnimationFrame(frame)
        frame = 0
      } else schedule()
    }
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      visibility()
    })
    intersection.observe(canvas)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      disposed = true
      stopThemeObserver()
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      redraw.current = () => {}
    }
  }, [reduced, network, paused])

  const clearPointer = () => {
    pointer.current.inside = false
    redraw.current()
  }
  const movePointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    if (drag.current.id === event.pointerId) {
      // Front-facing points move opposite positive projection angles.
      orientation.current.x -= ((event.clientX - drag.current.x) / rect.width) * Math.PI * 2
      orientation.current.y = Math.max(
        -0.85,
        Math.min(
          0.85,
          orientation.current.y - ((event.clientY - drag.current.y) / rect.height) * Math.PI,
        ),
      )
      drag.current.x = event.clientX
      drag.current.y = event.clientY
    }
    pointer.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
      inside: true,
    }
    redraw.current()
  }
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.id !== event.pointerId) return
    drag.current.id = null
    event.currentTarget.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    if (event.pointerType !== 'mouse') clearPointer()
    redraw.current()
  }
  return (
    <div
      className="playground"
      onPointerMove={movePointer}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        drag.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.classList.add('is-dragging')
        movePointer(event)
      }}
      onPointerLeave={clearPointer}
      onPointerCancel={endDrag}
      onPointerUp={endDrag}
      onLostPointerCapture={endDrag}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Interactive Tech Stack Globe containing all ${technologies.length} stack entries: ${technologies.join(', ')}. ${signalCount} moving blue signals connect them. Drag or swipe horizontally to rotate.`}
      />
      <div className="globe-technologies" aria-hidden="true">
        {technologies.map((name, i) => (
          <div
            key={name}
            ref={(node) => {
              nodeRefs.current[i] = node
            }}
            className="globe-node"
            data-technology={name}
          >
            <TechnologyIcon name={name} />
            <span className="globe-node-label">{name.replace(' (Canvas/WebGL)', '')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
