import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

/** Add public/images/profile.jpg to replace the placeholder on the next load. */
export default function Portrait() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  return (
    <figure className="portrait" data-image-status={status}>
      {status !== 'missing' && (
        <img
          src={`${import.meta.env.BASE_URL}images/profile.jpg`}
          alt="Portrait of Carl John Haro"
          width={800}
          height={1000}
          hidden={status !== 'ready'}
          decoding="async"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('missing')}
        />
      )}
      {status !== 'ready' && (
        <div
          className="portrait-placeholder"
          role="img"
          aria-label="Portrait placeholder for Carl John Haro"
        >
          <span className="portrait-file" aria-hidden="true">
            IMAGE_001
          </span>
          <span className="portrait-label" aria-hidden="true">
            PORTRAIT
            <br />
            PLACEHOLDER
          </span>
          <span className="portrait-caption" aria-hidden="true">
            <span>PROFILE / 01</span>
            <ArrowUpRight size={14} />
          </span>
        </div>
      )}
    </figure>
  )
}
