import { Fragment } from 'react'
import { parseAnswerBody, type AnswerInline } from '@/lib/answerMarkdown'

/**
 * The reading surface for an answer body.
 *
 * The measure is set on the column, not the page, and the type is a step above
 * the marketing ramp on the other public pages: those are scanned, this is
 * read end to end. Headings stay on the display cut and the body on the text
 * cut of the same Segoe family, so hierarchy comes from weight and scale
 * rather than a second voice.
 */

const PARAGRAPH = 'text-[16.5px] leading-[1.72] text-foreground/85 sm:text-[17.5px] sm:leading-[1.75]'

function Inline({ nodes }: { nodes: AnswerInline[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case 'strong':
            return (
              <strong key={index} className="font-semibold text-foreground">
                {node.text}
              </strong>
            )
          case 'em':
            return <em key={index}>{node.text}</em>
          case 'code':
            return (
              <code key={index} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.88em] text-accent">
                {node.text}
              </code>
            )
          case 'link':
            return (
              <a
                key={index}
                href={node.href}
                className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
              >
                {node.text}
              </a>
            )
          default:
            return <Fragment key={index}>{node.text}</Fragment>
        }
      })}
    </>
  )
}

export function AnswerProse({ markdown }: { markdown: string }) {
  const blocks = parseAnswerBody(markdown)

  return (
    <div className="max-w-[64ch]">
      {blocks.map((block, index) => {
        // The first block sits flush against whatever introduced it; everything
        // after it carries its own rhythm.
        const first = index === 0

        if (block.type === 'heading') {
          return block.level === 2 ? (
            <h2
              key={index}
              className={`font-display text-[22px] font-extrabold leading-[1.16] tracking-[-0.025em] text-foreground sm:text-[27px] ${first ? '' : 'mt-14'}`}
            >
              {block.text}
            </h2>
          ) : (
            <h3
              key={index}
              className={`font-display text-[17.5px] font-bold leading-[1.3] tracking-[-0.015em] text-foreground sm:text-[19px] ${first ? '' : 'mt-10'}`}
            >
              {block.text}
            </h3>
          )
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              key={index}
              className={`space-y-3 pl-[1.35rem] marker:text-accent/70 ${block.ordered ? 'list-decimal' : 'list-disc'} ${first ? '' : 'mt-6'}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className={`pl-1 ${PARAGRAPH}`}>
                  <Inline nodes={item} />
                </li>
              ))}
            </ListTag>
          )
        }

        return (
          <p key={index} className={`${PARAGRAPH} ${first ? '' : 'mt-6'}`}>
            <Inline nodes={block.content} />
          </p>
        )
      })}
    </div>
  )
}
