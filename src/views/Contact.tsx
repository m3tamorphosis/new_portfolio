import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Copy,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
} from 'lucide-react'
import BrandIcon from '../components/BrandIcon'
import { profile } from '../data'

const contactIntents = [
  { label: 'A project idea', subject: 'Project Inquiry' },
  { label: 'An opportunity', subject: 'Career Opportunity' },
  { label: 'A collaboration', subject: 'Collaboration Inquiry' },
  { label: 'Just saying hello', subject: 'Hello!' },
]
const localTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

export default function Contact() {
  const [now, setNow] = useState(() => new Date())
  const localTime = localTimeFormatter.format(now)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [topic, setTopic] = useState(contactIntents[0])
  const emailHref = `mailto:${profile.email}?subject=${encodeURIComponent(topic.subject)}`
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    let timer = 0
    const update = () => {
      setNow(new Date())
      timer = window.setTimeout(update, 1000 - (Date.now() % 1000))
    }
    update()
    const sync = () => {
      if (!document.hidden) {
        window.clearTimeout(timer)
        update()
      }
    }
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current)
    },
    [],
  )
  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setCopyError(false)
      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }
  return (
    <div className="section-view contact-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow work-availability">
            <span className="green-dot" aria-hidden="true" />
            <span className="availability-full">{profile.workAvailability}</span>
            <span className="availability-compact">Open to roles &amp; freelance projects.</span>
          </span>
          <h1>
            Got an idea?
            <br />
            Let’s make it <span className="serif-word">real.</span>
          </h1>
        </div>
        <span className="contact-asterisk" aria-hidden="true">
          <MessagesSquare size="1em" />
        </span>
      </div>
      <div className="contact-layout">
        <div className="contact-copy">
          <p>
            Something useful. Something ambitious.
            <br />
            Something people haven’t clicked before.
            <br />
            I’d like to hear about it.
          </p>
          <div className="contact-location">
            <MapPin size={17} />
            <span>
              Iloilo City, Philippines
              <small title="Philippine Standard Time (UTC +08:00)">
                <time
                  dateTime={now.toISOString()}
                  aria-label={`Current time in Iloilo: ${localTime}, Philippine Standard Time`}
                >
                  {localTime}
                </time>{' '}
                · PHT
              </small>
            </span>
          </div>
          <div className="contact-links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              <BrandIcon name="github" size={17} /> GitHub <ArrowUpRight size={15} />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              <BrandIcon name="linkedin" size={17} /> LinkedIn <ArrowUpRight size={15} />
            </a>
            <a href={profile.resume} download>
              <ArrowDownToLine size={17} /> Résumé
            </a>
          </div>
          <section className="contact-interests" aria-labelledby="contact-interests-heading">
            <h2 className="eyebrow" id="contact-interests-heading">
              CURRENTLY INTERESTED IN
            </h2>
            <ul>
              <li>AI-powered applications</li>
              <li>Creative development</li>
              <li>Interactive web experiences</li>
            </ul>
          </section>
        </div>
        <div className="contact-card">
          <span className="eyebrow">WHAT’S ON YOUR MIND?</span>
          <div className="topic-options" role="group" aria-label="Email topic">
            {contactIntents.map((intent) => (
              <button
                key={intent.label}
                aria-pressed={topic.subject === intent.subject}
                onClick={() => setTopic(intent)}
              >
                {intent.label}
              </button>
            ))}
          </div>
          <div className="contact-email-row">
            <a className="contact-email" href={emailHref}>
              {profile.email}
            </a>
            <button
              className="copy-button"
              onClick={copy}
              aria-label="Copy email address"
              title={copied ? 'Copied' : 'Copy email address'}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
          <div className="email-actions">
            <a className="button button-dark" href={emailHref}>
              Start a conversation <Mail size={16} />
            </a>
          </div>
          <div className="contact-small" role="status">
            {copied
              ? 'Email address copied. Talk soon.'
              : copyError
                ? 'Select the email address above to copy it manually.'
                : 'Opens your email app. A simple hello works, too.'}
          </div>
          <div className="contact-links contact-messaging" aria-label="Phone and messaging apps">
            <a href={`tel:${profile.phone}`} title="Call Carl">
              <Phone size={17} aria-hidden="true" /> 0961 083 4292
            </a>
            <a href={`viber://chat?number=${encodeURIComponent(profile.phone)}`} title="Open Viber">
              <BrandIcon name="viber" size={17} /> Viber <ArrowUpRight size={15} />
            </a>
            <a href={`https://t.me/${profile.phone}`} target="_blank" rel="noreferrer">
              <BrandIcon name="telegram" size={17} /> Telegram <ArrowUpRight size={15} />
            </a>
            <a
              href={`https://wa.me/${profile.phone.replace('+', '')}`}
              target="_blank"
              rel="noreferrer"
            >
              <BrandIcon name="whatsapp" size={17} /> WhatsApp <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
