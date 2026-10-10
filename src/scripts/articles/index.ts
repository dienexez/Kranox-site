// The script of an article page. It moves like the docs: the smooth scroll, a link to a part that scrolls there, the
// parts that show when the user reaches them, and the footer of the home page. The list at the side marks the part in
// view. An article without parts has no list.
import { initPageMotion } from "../motion/index.ts";
import { followSections } from "../section-list.ts";

// The list at the side and the parts of the text, as ArticleSide.astro and ArticleBody.astro mark them. A part is a
// heading of the second level, which Astro gives an id.
const ARTICLE_PARTS = {
  nav: "[data-article-nav]",
  link: "[data-article-link]",
  section: "[data-article-body] h2[id]",
} as const;

export function initArticle(): void {
  initPageMotion();
  if (document.querySelector(ARTICLE_PARTS.nav) !== null) {
    followSections(ARTICLE_PARTS);
  }
}
