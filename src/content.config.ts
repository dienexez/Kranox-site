// The collections of the site. The articles of the blog are the only one: one Markdown file for each article in
// src/content/articles/, with these fields at its top. The owner asked for a blog on 9 Oct 2026. articles.ts holds
// the text of the blog pages and reads the collection.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { ARTICLE_COVERS, type ArticleCoverName } from "./assets/images.ts";

const COVER_NAMES = Object.keys(ARTICLE_COVERS) as [ArticleCoverName, ...ArticleCoverName[]];

const articles = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string().min(1),
    /** One or two sentences. The card of the article and the top of its page show them. */
    lead: z.string().min(1),
    /** The day the article comes out, such as 2026-10-09. The newest article stands first. */
    published: z.coerce.date(),
    /** The name of the cover in ARTICLE_COVERS of images.ts. */
    cover: z.enum(COVER_NAMES),
    coverAlt: z.string().min(1),
    /** A draft shows on the dev server only. The build that the deploy publishes leaves it out. */
    draft: z.boolean(),
  }),
});

export const collections = { articles };
