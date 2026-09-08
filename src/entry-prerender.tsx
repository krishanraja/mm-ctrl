/* eslint-disable react-refresh/only-export-components -- build-time SSR entry, not an HMR component module */
// SSR render entry for static prerendering of the public marketing routes.
// Browser-free (renderToStaticMarkup) so it runs in CI/Vercel with no chromium.
// The output HTML is for crawlers/LLM fetchers; the client app still mounts on top.
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { CtrlOnboarding } from '@/components/onboarding/CtrlOnboarding';
import AgentsPage from '@/pages/Agents';
import TryPage from '@/pages/Try';
import { AnswerArticle } from '@/components/answers/AnswerArticle';
import { AnswersIndex } from '@/components/answers/AnswersIndex';
import { ANSWERS } from '@/lib/answers';
import { ANSWERS_URL, answerUrl } from '@/lib/answerSchema';

/** Per-route document metadata the post-build pass writes into the head. */
export interface RouteHead {
  title: string;
  description: string;
  canonical: string;
}

// The answer routes are derived from the globbed markdown files rather than
// listed here, so adding a file in src/content/answers is the whole publishing
// step: the new page prerenders, enters the sitemap and enters llms.txt with
// no second list to keep in step.
const ANSWER_ROUTES: Record<string, () => JSX.Element> = Object.fromEntries(
  ANSWERS.map((doc) => [doc.path, () => <AnswerArticle doc={doc} />]),
);

const ROUTES: Record<string, () => JSX.Element> = {
  '/': CtrlOnboarding,
  '/agents': AgentsPage,
  '/try': TryPage,
  '/answers': () => <AnswersIndex docs={ANSWERS} />,
  ...ANSWER_ROUTES,
};

export const ROUTE_PATHS = Object.keys(ROUTES);

// Head metadata is opt-in per route. The three original routes declare none and
// keep the template's own title, description and canonical exactly as they are;
// the answer pages declare their own, because a page written to be found for
// one question cannot share a title with the product home page.
const ROUTE_HEAD: Record<string, RouteHead> = {
  '/answers': {
    title: 'Answers | CTRL',
    description: 'Direct answers to the questions leaders actually ask about AI, decisions and the tools that claim to help.',
    canonical: ANSWERS_URL,
  },
  ...Object.fromEntries(
    ANSWERS.map((doc) => [
      doc.path,
      { title: `${doc.title} | CTRL`, description: doc.description, canonical: answerUrl(doc) },
    ]),
  ),
};

export function getRouteHead(url: string): RouteHead | null {
  return ROUTE_HEAD[url] ?? null;
}

/**
 * Sitemap and llms.txt inputs for the post-build pass.
 *
 * Exported as plain data rather than rendered markup so scripts/prerender.mjs
 * can merge the answer entries into the hand-maintained public/sitemap.xml and
 * public/llms.txt without importing React or re-parsing the markdown.
 */
export const ANSWER_ENTRIES = ANSWERS.map((doc) => ({
  path: doc.path,
  url: answerUrl(doc),
  title: doc.title,
  question: doc.targetQuery,
  publishedAt: doc.publishedAt,
}));

export function render(url: string): string {
  const Comp = ROUTES[url];
  if (!Comp) return '';
  return renderToStaticMarkup(
    <StaticRouter location={url}>
      <Comp />
    </StaticRouter>,
  );
}
