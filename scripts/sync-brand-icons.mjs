import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const directory = new URL('../public/icons/brands/', import.meta.url)
const catalog = await (await fetch('https://api.svgl.app')).json()
const brands = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  csharp: 'C#',
  react: 'React',
  nextjs: 'Next.js',
  html5: 'HTML5',
  css3: 'CSS',
  tailwindcss: 'Tailwind CSS',
  motion: 'Motion',
  nodejs: 'Node.js',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlserver: 'Microsoft SQL Server',
  supabase: 'Supabase',
  openai: 'OpenAI',
  groq: 'Groq',
  copilot: 'GitHub Copilot',
  claude: 'Claude AI',
  codex: 'Codex',
  gemini: 'Gemini',
  git: 'Git',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  vercel: 'Vercel',
  vscode: 'Visual Studio Code',
  figma: 'Figma',
  vite: 'Vite',
  prisma: 'Prisma',
  authjs: 'Auth.js',
  neon: 'Neon',
  playwright: 'Playwright',
}
const sources = Object.entries(brands).map(([file, title]) => {
  const item = catalog.find((entry) => entry.title.trim() === title)
  if (!item) throw new Error(`Missing brand: ${title}`)
  return {
    file,
    title,
    source: typeof item.route === 'string' ? item.route : item.route.light,
    provider: 'SVGL',
    brand: item.brandUrl ?? item.url,
  }
})
sources.push(
  {
    file: 'phaser',
    title: 'Phaser',
    source: 'https://cdn.phaser.io/images/logo/phaser-logo.svg',
    provider: 'Phaser',
    brand: 'https://phaser.io/download/logo',
  },
  {
    file: 'powerbi',
    title: 'Power BI',
    source: 'https://raw.githubusercontent.com/microsoft/PowerBI-Icons/main/SVG/Power-BI.svg',
    provider: 'Microsoft',
    brand: 'https://github.com/microsoft/PowerBI-Icons',
  },
  {
    file: 'tableau',
    title: 'Tableau',
    source: 'https://www.tableau.com/themes/custom/tableau_www/logo.v2.svg',
    provider: 'Tableau',
    brand: 'https://www.tableau.com/',
  },
)
await mkdir(directory, { recursive: true })
const manifest = []
for (let index = 0; index < sources.length; index += 6) {
  const batch = await Promise.all(
    sources.slice(index, index + 6).map(async (item) => {
      const response = await fetch(item.source)
      if (!response.ok) throw new Error(`${item.title}: HTTP ${response.status}`)
      const original = await response.text()
      let svg = original
      if (!svg.includes('<svg') || /<script\b|<foreignObject\b|\bon\w+\s*=/i.test(svg))
        throw new Error(`Invalid SVG: ${item.title}`)
      // Preserve the vendor's paths and native colors. Crop only the presentation canvas.
      const viewBox =
        item.file === 'phaser'
          ? '128 149 592 126'
          : item.file === 'tableau'
            ? '0 0 108.97 108.97'
            : null
      if (viewBox) {
        svg = svg.replace(/<svg\b[^>]*>/, (root) =>
          root
            .replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
            .replace(/\s(?:width|height)="[^"]*"/g, ''),
        )
      }
      await writeFile(new URL(`${item.file}.svg`, directory), svg)
      return {
        ...item,
        presentation: viewBox
          ? `Original artwork, viewBox ${viewBox}; paths and colors unchanged.`
          : 'Unmodified SVG',
        sourceSha256: createHash('sha256').update(original).digest('hex'),
        sha256: createHash('sha256').update(svg).digest('hex'),
      }
    }),
  )
  manifest.push(...batch)
}
for (const [file, source] of [
  ['LICENSE-SVGL.txt', 'https://raw.githubusercontent.com/pheralb/svgl/main/LICENSE'],
  [
    'LICENSE-MICROSOFT.txt',
    'https://raw.githubusercontent.com/microsoft/PowerBI-Icons/main/LICENSE',
  ],
]) {
  const response = await fetch(source)
  if (!response.ok) throw new Error(`License: ${source}`)
  await writeFile(new URL(file, directory), await response.text())
}
// Keep separately sourced marks (messaging apps and Xendit) in the audit manifest.
const existing = JSON.parse(await readFile(new URL('sources.json', directory), 'utf8'))
const refreshed = new Set(manifest.map((item) => item.file))
manifest.push(...existing.filter((item) => !refreshed.has(item.file)))
await writeFile(new URL('sources.json', directory), JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Bundled ${manifest.length} brand SVGs with source hashes, presentation notes, and licenses.`,
)
