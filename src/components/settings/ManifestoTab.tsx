import { motion } from 'framer-motion'
import { staggerContainer, slideUp, transitions } from '@/lib/motion'
import { Separator } from '@/components/ui/separator'

// ── Manifesto copy ──────────────────────────────────────────────────
// Edit the constants below to update the manifesto. No JSX changes needed.

interface ManifestoSection {
  heading: string
  accent?: string
  body: string[]
}

const MANIFESTO_HEADER = {
  title: 'What We Believe',
  subtitle: 'Your context is the most valuable thing you own. It should not live inside someone else\'s product.',
}

const MANIFESTO_SECTIONS: ManifestoSection[] = [
  {
    heading: 'Portable',
    accent: 'Your context follows you.',
    body: [
      'Every AI tool you use starts from zero. You repeat yourself. You re-explain your role, your priorities, your constraints. Every single time.',
      'CTRL builds a living memory of how you think. Export it to ChatGPT, Claude, Gemini, Cursor, or any tool that exists next year. Your context is yours. It goes where you go.',
    ],
  },
  {
    heading: 'Agnostic',
    accent: 'No platform. No lock-in.',
    body: [
      'We have no interest in being the AI you talk to. We are the context layer underneath every AI you will ever talk to.',
      'CTRL works with any model, any provider, any interface. When the next model drops, you are ready. Your Memory Web does not care who built the model.',
    ],
  },
  {
    heading: 'Private',
    accent: 'Self-contained by design.',
    body: [
      'CTRL does not connect to your Slack. It does not read your email. It does not sync your calendar. That is not a missing feature. That is the product.',
      'You talk to CTRL. You tell it what matters. Nothing is scraped, inferred, or harvested. What you share is what it knows. Nothing more.',
    ],
  },
  {
    heading: 'You Own Your Context',
    accent: 'Encrypted. Exportable. Deletable.',
    body: [
      'Your Memory Web is encrypted at rest. You control what is stored. You control what is exported. You control what is deleted. Your context never trains AI models.',
      'This is not a privacy policy buried in legal text. It is the architecture. Ownership is not a feature we added. It is the reason we built this.',
    ],
  },
  {
    heading: 'Future-Proof',
    accent: 'The leaders who start now compound every day.',
    body: [
      'In a year, every leader will wish they had a portable memory web. The ones who start building theirs today will have a compound advantage that cannot be closed.',
      'AI hallucinates. If you leave your memories inside ChatGPT or Claude, those memories live and die at the mercy of that provider. One policy change, one outage, one pivot, and your context is gone.',
      'Having your own Memory Web is the single most important step a leader can take to bridge into an AI-native world.',
    ],
  },
]

const MANIFESTO_CLOSING = 'We built CTRL because we needed it. Not as a product idea. As a tool for the work.'

// ── Component ───────────────────────────────────────────────────────

export function ManifestoTab() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-10 sm:space-y-12 pb-8 max-w-2xl"
    >
      {/* Header */}
      <motion.header variants={slideUp} transition={transitions.normal} className="space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {MANIFESTO_HEADER.title}
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
          {MANIFESTO_HEADER.subtitle}
        </p>
        <div className="h-px bg-accent/40 w-16 mt-4" />
      </motion.header>

      {/* Sections */}
      {MANIFESTO_SECTIONS.map((section) => (
        <motion.section
          key={section.heading}
          variants={slideUp}
          transition={transitions.normal}
          className="space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {section.heading}
          </p>
          {section.accent && (
            <p className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
              {section.accent}
            </p>
          )}
          <div className="space-y-3">
            {section.body.map((paragraph, i) => (
              <p key={i} className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.section>
      ))}

      {/* Closing */}
      <motion.footer variants={slideUp} transition={transitions.normal} className="pt-4">
        <Separator className="mb-6" />
        <p className="text-sm text-muted-foreground italic">
          {MANIFESTO_CLOSING}
        </p>
      </motion.footer>
    </motion.div>
  )
}
