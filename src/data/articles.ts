// The text of the blog: the grid of the articles at /articles, and the parts that every article page shares. The
// owner asked for it on 9 Oct 2026 ("kaya blog ... bakal banyak artikel2 di dalam nya"), with the articles in a grid
// of three columns. Each article is one Markdown file in src/content/articles/; content.config.ts holds its fields.
// R6 of docs/HANDOFF.md bans one word from every text.
import { type CollectionEntry, getCollection } from "astro:content";
import { ORGANIZATION_NAME, SITE_NAME } from "./site.ts";

export type Article = CollectionEntry<"articles">;

// A reader of non-fiction in English reads about 238 words a minute in silence (Brysbaert, Journal of Memory and
// Language, 2019; general knowledge, not checked on 9 Oct 2026). The time is a hint, so it rounds up.
const WORDS_PER_MINUTE = 238;

// A date as the docs write it, such as "9 October 2026". The date of an article has no time of day, so it reads in
// UTC, the zone in which the field of the article holds it.
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const ARTICLES = {
  meta: {
    title: `Articles | ${SITE_NAME}`,
    description: `Articles from ${ORGANIZATION_NAME} on Monero, privacy, and the ${SITE_NAME} wallet.`,
  },
  // The top of the grid, like the top of the docs: a label between stars, the title in capitals, and a lead.
  hero: {
    label: "Articles",
    title: "Notes from the build",
    lead: `Longer reads on Monero, privacy, and why ${SITE_NAME} works the way it does.`,
  },
  // In the build that the deploy publishes, the grid is empty while every article is a draft.
  empty: "The first article is on its way.",
  draft: "Draft",
  minutesRead: (minutes: number): string => `${minutes} min read`,
  // The side of an article page: the way back to the grid, and the list of the parts of the article.
  back: "All articles",
  contents: "Contents",
} as const;

export function articlePageTitle(article: Article): string {
  return `${article.data.title} | ${SITE_NAME}`;
}

/** The articles to show, the newest first. A draft shows on the dev server only. */
export async function listArticles(): Promise<Article[]> {
  const articles = await getCollection("articles", ({ data }) => import.meta.env.DEV || !data.draft);
  return articles.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export function articleDate(article: Article): string {
  return DATE_FORMAT.format(article.data.published);
}

/** The minutes that a reader needs for the text of an article, at least one. */
export function readingMinutes(article: Article): number {
  if (article.body === undefined) {
    throw new Error(`The article ${article.id} has no text.`);
  }
  const words = article.body.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
