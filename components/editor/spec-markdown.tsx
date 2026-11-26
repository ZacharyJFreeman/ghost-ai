"use client"

import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

// Styles for each Markdown element, from the app's tokens.
const COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="mt-5 mb-2 text-xl font-semibold text-copy-primary first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-5 mb-2 text-lg font-semibold text-copy-primary first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 mb-1.5 text-base font-semibold text-copy-primary">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-copy-primary">{children}</h4>,
  p: ({ children }) => <p className="my-2 text-sm leading-relaxed text-copy-secondary">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-copy-secondary">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-copy-secondary">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-copy-primary">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ai-text underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-surface-border pl-3 text-copy-muted">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-surface-border" />,
  // Images are never loaded (a spec should not make the viewer's browser fetch
  // remote content); the alt text is shown instead.
  img: ({ alt }) => (alt ? <span className="text-copy-muted">[{alt}]</span> : null),
  code: ({ children }) => (
    <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.85em] text-copy-primary">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-surface-border bg-base p-3 text-xs [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-surface-border bg-subtle px-2 py-1 text-left font-medium text-copy-primary">{children}</th>
  ),
  td: ({ children }) => <td className="border border-surface-border px-2 py-1 text-copy-secondary">{children}</td>,
}

// Renders a spec's Markdown. Raw HTML inside the Markdown is dropped (`skipHtml`)
// and `react-markdown` never turns it into elements, so nothing in a spec can inject
// markup or script; unsafe link protocols are removed by its default URL handling.
export function SpecMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS} skipHtml>
      {markdown}
    </ReactMarkdown>
  )
}
