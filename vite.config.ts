import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      {
        name: 'portfolio-chat-api',
        configureServer(server) {
          server.middlewares.use('/api/visitors', async (req, res, next) => {
            if (req.url?.split('?')[0] !== '/') return next()
            try {
              for (const name of [
                'SUPABASE_URL',
                'SUPABASE_SECRET_KEY',
                'SUPABASE_SERVICE_ROLE_KEY',
              ]) {
                if (env[name]) process.env[name] ||= env[name]
              }
              const { default: handler } = await server.ssrLoadModule('/api/visitors.ts')
              await handler(req, res)
            } catch {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Visitor count unavailable.' }))
            }
          })
          server.middlewares.use('/api/chat', async (req, res, next) => {
            if (req.url?.split('?')[0] !== '/') return next()
            try {
              const { default: handler } = await server.ssrLoadModule('/api/chat.ts')
              // Server-only environment; never exposed via a VITE_ variable.
              if (env.GROQ_API_KEY) process.env.GROQ_API_KEY ||= env.GROQ_API_KEY
              if (env.GROQ_MODEL) process.env.GROQ_MODEL ||= env.GROQ_MODEL
              await handler(req, res)
            } catch {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'AI chat is temporarily unavailable.' }))
            }
          })
        },
      },
    ],
    base: './',
  }
})
