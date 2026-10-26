import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, MessageCircle, SendHorizontal, X } from 'lucide-react'
import './PortfolioAssistant.css'
import { readChatHistory, saveChatHistory, trimChatHistory, type ChatMessage } from '../chatHistory'

function formatInline(text: string) {
  return text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    )
}

function formatReply(content: string) {
  const blocks: ReactNode[] = []
  let prose: string[] = []
  let items: string[] = []
  function flushProse() {
    if (prose.length) blocks.push(<p key={blocks.length}>{formatInline(prose.join(' '))}</p>)
    prose = []
  }
  function flushList() {
    if (items.length)
      blocks.push(
        <ul key={blocks.length}>
          {items.map((item, index) => (
            <li key={index}>{formatInline(item)}</li>
          ))}
        </ul>,
      )
    items = []
  }
  for (const line of content.split('\n')) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (heading) {
      flushProse()
      flushList()
      blocks.push(<h3 key={blocks.length}>{formatInline(heading[1])}</h3>)
    } else if (bullet) {
      flushProse()
      items.push(bullet[1])
    } else if (!line.trim()) {
      flushProse()
      flushList()
    } else {
      flushList()
      prose.push(line.trim())
    }
  }
  flushProse()
  flushList()
  return blocks
}

function AnimatedReply({ content }: { content: string }) {
  const [visible, setVisible] = useState(0)
  const paragraph = useRef<HTMLDivElement>(null)
  const characters = Array.from(content)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const started = performance.now()
    const length = Array.from(content).length
    const duration = Math.min(20000, length * 28)
    function finish() {
      if (!motion.matches) return
      cancelAnimationFrame(frame)
      setVisible(length)
    }
    function reveal(now: number) {
      const progress = Math.min(1, (now - started) / Math.max(1, duration))
      setVisible(Math.ceil(length * progress))
      if (progress < 1) frame = requestAnimationFrame(reveal)
    }
    if (motion.matches) setVisible(length)
    else frame = requestAnimationFrame(reveal)
    motion.addEventListener('change', finish)
    return () => {
      cancelAnimationFrame(frame)
      motion.removeEventListener('change', finish)
    }
  }, [content])

  useEffect(() => {
    const body = paragraph.current?.closest('.assistant-body')
    if (body && body.scrollHeight - body.scrollTop - body.clientHeight < 80)
      body.scrollTop = body.scrollHeight
  }, [visible])

  return (
    <div ref={paragraph} className="assistant-reply">
      <div className="sr-only">{formatReply(content)}</div>
      <div aria-hidden="true" className="assistant-reply-text">
        {formatReply(characters.slice(0, visible).join(''))}
      </div>
    </div>
  )
}

function AssistantAvatar() {
  return (
    <span className="assistant-avatar" aria-hidden="true">
      <span className="assistant-monogram">
        c<span>h</span>
        <i />
      </span>
    </span>
  )
}

export default function PortfolioAssistant({ label = 'Ask about my work' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(readChatHistory)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  const transcript = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  useEffect(() => {
    if (!input.current) return
    input.current.style.height = 'auto'
    input.current.style.height = `${Math.min(input.current.scrollHeight, 112)}px`
  }, [draft, open])

  useEffect(
    () => () => {
      request.current?.abort()
      request.current = null
    },
    [],
  )
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight
  }, [messages, pending, error, open])

  async function ask(history: ChatMessage[]) {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    const timer = window.setTimeout(() => controller.abort(), 30000)
    try {
      // Keep whole user/assistant pairs within the server's context limit.
      const context = trimChatHistory(history)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: context }),
        signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.reply !== 'string' || !result.reply.trim())
        throw new Error(
          result?.error || 'AI chat is unavailable right now. Please retry or contact Carl below.',
        )
      setMessages(trimChatHistory([...history, { role: 'assistant', content: result.reply }]))
    } catch (cause) {
      if (!controller.signal.aborted || request.current === controller)
        setError(
          controller.signal.aborted
            ? 'The reply took too long. Please try again.'
            : cause instanceof Error
              ? cause.message
              : 'Could not connect. Please try again.',
        )
    } finally {
      window.clearTimeout(timer)
      if (request.current === controller) {
        request.current = null
        setPending(false)
      }
    }
  }
  function send(value: string) {
    const content = value.trim()
    if (!content || content.length > 2000 || request.current) return
    const answered = messages.at(-1)?.role === 'user' ? messages.slice(0, -1) : messages
    const next = trimChatHistory([...answered, { role: 'user', content }])
    setMessages(next)
    setDraft('')
    void ask(next)
  }
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
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="portfolio-assistant"
        onClick={() => {
          dialog.current?.showModal()
          dialog.current?.focus({ preventScroll: true })
          setOpen(true)
        }}
      >
        <MessageCircle size={21} aria-hidden="true" />
        <span aria-hidden="true">{label}</span>
      </button>

      <dialog
        id="portfolio-assistant"
        className="assistant-dialog"
        data-has-messages={messages.length > 0}
        ref={dialog}
        tabIndex={-1}
        aria-labelledby="assistant-title"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], textarea:not(:disabled), [tabindex="0"]',
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
          <h2 id="assistant-title">Ask Carl’s assistant</h2>
          <button
            className="assistant-close"
            aria-label="Close portfolio assistant"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          className="assistant-body"
          ref={transcript}
          tabIndex={0}
          role="region"
          aria-label="Chat history"
        >
          <div
            className="assistant-messages"
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
            aria-relevant="additions"
          >
            <div className="assistant-message assistant-message-assistant">
              <AssistantAvatar />
              <span className="sr-only">Portfolio assistant</span>
              <p>Curious about Carl’s work? Ask away.</p>
            </div>
            {messages.map((message, index) => (
              <div className={`assistant-message assistant-message-${message.role}`} key={index}>
                {message.role === 'assistant' && <AssistantAvatar />}
                <span className="sr-only">
                  {message.role === 'user' ? 'You' : 'Portfolio assistant'}
                </span>
                {message.role === 'assistant' ? (
                  <AnimatedReply content={message.content} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
          </div>
          {pending && (
            <div className="assistant-pending" role="status">
              <AssistantAvatar />
              <span className="sr-only">Portfolio assistant is typing</span>
              <span className="assistant-typing-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
          {error && (
            <div className="assistant-error">
              <p role="alert">{error}</p>
              <button onClick={() => void ask(messages)}>Try again</button>
            </div>
          )}
        </div>
        <div className="assistant-footer">
          <form
            className="assistant-composer"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <label className="sr-only" htmlFor="assistant-question">
              Message portfolio assistant
            </label>
            <textarea
              id="assistant-question"
              ref={input}
              rows={1}
              maxLength={2000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Your question…"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send(draft)
                }
              }}
            />
            <button type="submit" aria-label="Send message" disabled={pending || !draft.trim()}>
              <SendHorizontal size={20} aria-hidden="true" />
            </button>
          </form>
          <div className="assistant-footer-note">
            <span title="Powered by Groq">Groq AI</span>
            {messages.length > 0 && (
              <button
                disabled={pending}
                onClick={() => {
                  setMessages([])
                  setError('')
                  setDraft('')
                  input.current?.focus()
                }}
              >
                New chat
              </button>
            )}
            <a href="#contact" onClick={() => dialog.current?.close()}>
              Contact Carl <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </dialog>
    </>
  )
}
