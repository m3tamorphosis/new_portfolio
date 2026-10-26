import {
  BookOpen,
  BriefcaseBusiness,
  Braces,
  BrainCircuit,
  Cable,
  ChartNoAxesCombined,
  Cpu,
  Database,
  FileText,
  Gamepad2,
  Network,
  PanelsTopLeft,
  Plug,
  Server,
  ShieldCheck,
  TableProperties,
  Terminal,
  Waypoints,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import BrandIcon from './BrandIcon'

const brandNames: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
  'C#': 'csharp',
  'React.js': 'react',
  'Next.js': 'nextjs',
  HTML5: 'html5',
  CSS3: 'css3',
  'Tailwind CSS': 'tailwindcss',
  Motion: 'motion',
  'Phaser 3 (Canvas/WebGL)': 'phaser',
  'Node.js': 'nodejs',
  PostgreSQL: 'postgresql',
  MySQL: 'mysql',
  'SQL Server': 'sqlserver',
  Supabase: 'supabase',
  Firebase: 'firebase',
  'OpenAI API': 'openai',
  'Groq API': 'groq',
  'GitHub Copilot': 'copilot',
  'Claude AI': 'claude',
  Codex: 'codex',
  Gemini: 'gemini',
  Git: 'git',
  GitHub: 'github',
  Vercel: 'vercel',
  'VS Code': 'vscode',
  Figma: 'figma',
  'Power BI': 'powerbi',
  Tableau: 'tableau',
  Vite: 'vite',
  'Prisma ORM': 'prisma',
  'NextAuth.js': 'authjs',
  'Auth.js (NextAuth.js)': 'authjs',
  'Xendit Payment Integration': 'xendit',
  Neon: 'neon',
  Playwright: 'playwright',
}
// Concepts and standards do not have proprietary brand logos.
const conceptIcons: Record<string, LucideIcon> = {
  SQL: TableProperties,
  'REST APIs': Cable,
  'API Integration': Plug,
  RAG: Network,
  Embeddings: Waypoints,
  'LLM Integration': BrainCircuit,
  'PDF Text Extraction': FileText,
}

export const stackGroupIcons = [Braces, Cpu, PanelsTopLeft, Server, Database, Wrench, Terminal]
export const projectIcons: Record<string, LucideIcon> = {
  playable: Gamepad2,
  insight: ChartNoAxesCombined,
  study: BookOpen,
  danger: ShieldCheck,
  careerforge: BriefcaseBusiness,
}

export default function TechnologyIcon({ name }: { name: string }) {
  const brand = brandNames[name]
  if (brand) return <BrandIcon name={brand} size={22} className="technology-icon" />
  const Icon = conceptIcons[name]
  return Icon ? <Icon className="technology-icon" size={22} aria-hidden="true" /> : null
}
