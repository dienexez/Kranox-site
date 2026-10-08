// Facts about the site: its address, its section anchors, and its outbound links.

export interface ExternalLink {
  label: string;
  href: string;
}

export const SITE_NAME = "Kranox";
export const ORGANIZATION_NAME = "Kranox Labs";

// The deploy tool reads the address from this constant.
export const SITE_URL = "https://kranox.cash";

// The deploy tool refuses to publish the site while this value is false. On 3 Oct 2026 the owner asked for the look
// and the motion first, with placeholder text. On 5 Oct 2026 the owner ordered the first deploy of the new site, with
// the text that it holds then, so the value is true. Set it to false again to stop a deploy, for example while a new
// part of the site holds placeholder text. The type is boolean, not the literal value, so that a reader of the value
// checks both cases.
export const CONTENT_APPROVED: boolean = true;

// The prologue of the page holds the words on privacy, so the menu and the address name it privacy.
export const SECTION_IDS = {
  top: "top",
  privacy: "privacy",
  wallet: "wallet",
  bridge: "bridge",
  faq: "faq",
} as const;

export type SectionId = keyof typeof SECTION_IDS;

// A section link carries the path of the home page, so that it works from every page of the site. On the home
// page the menu reads the hash of the link and scrolls there.
export function sectionHref(section: SectionId): string {
  return `/#${SECTION_IDS[section]}`;
}

// The legal pages. The owner asked for a privacy policy, disclosures, and terms of use on 5 Oct 2026. Each slug is
// the path of its page, and legal.ts holds the text of each page.
export type LegalSlug = "privacy" | "disclosures" | "terms";

export function legalHref(slug: LegalSlug): string {
  return `/${slug}`;
}

// The downloads page, after getmonero.org/downloads. The owner asked for it on 5 Oct 2026. downloads.ts holds its text
// and the files of the current release.
export const DOWNLOADS_HREF = "/downloads";

// The public repository of the app. The owner made it on 4 Oct 2026 under the organization Kranox-Labs. CHECKED 5 Oct
// 2026, source the GitHub API: public, issues on, no license yet, so no text calls the code open source. The report of
// the security review of 0.2.0 sits in its folder audit/: CHECKED 8 Oct 2026, it answers 200 without a login, and it
// counts 22 findings fixed and 2 partly fixed in 0.3.1.
const REPOSITORY_URL = "https://github.com/Kranox-Labs/Kranox";

export const REPOSITORY = {
  code: { label: "Kranox-Labs/Kranox", href: REPOSITORY_URL },
  issues: { label: "Open an issue", href: `${REPOSITORY_URL}/issues` },
  review: { label: "security review of 0.2.0", href: `${REPOSITORY_URL}/blob/main/audit/security-review-0.2.0.md` },
} as const satisfies Record<string, ExternalLink>;

// The mailbox of the project, from 4 Oct 2026. The legal pages give it as the address for questions.
export const CONTACT_EMAIL = "dev@kranox.cash";

// The docs page, after docs.ponsfamily.com. The owner asked for it on 5 Oct 2026; docs.ts holds its text. The link
// "Docs" of the footer leads to it.
export const DOCS_HREF = "/docs";

// The exchanger of the bridge. On 3 Oct 2026 the owner chose an instant exchanger for the first version of the bridge,
// with ChangeNOW first; on 5 Oct 2026 the owner asked for "Powered by ChangeNOW" on the site. CHECKED 5 Oct 2026,
// source changenow.io/press: the brand is written "ChangeNOW" only.
export const EXCHANGER = { label: "ChangeNOW", href: "https://changenow.io" } as const satisfies ExternalLink;

// The support, the privacy policy, and the terms of the exchanger, for the docs and the legal pages. CHECKED 5 Oct
// 2026: the app names this mailbox (apps/wallet/lib/ui/copy.dart, from changenow.io/press and its API documentation),
// and both pages answer 200.
export const EXCHANGER_SUPPORT_EMAIL = "support@changenow.io";
export const EXCHANGER_PRIVACY = {
  label: "Privacy policy of ChangeNOW",
  href: "https://changenow.io/privacy-policy",
} as const satisfies ExternalLink;
export const EXCHANGER_TERMS = {
  label: "Terms of use of ChangeNOW",
  href: "https://changenow.io/terms-of-use",
} as const satisfies ExternalLink;

// The relay of Kranox, which talks to the exchanger for the app, so that its key never sits in the app (apps/relay).
// It runs from 5 Oct 2026 behind Cloudflare, and writes no log of a request. From 0.3.0 it also scans an address on
// Robinhood Chain for the app. It holds two things in memory for ten minutes, with no IP address: a scan, so that a
// second look at the same address spends no call, and its answer to the creation of a swap, so that a try again
// makes no second exchange (apps/relay/src/config.mts, SCAN_CACHE_MS and CREATION_KEY_MS, 8 Oct 2026).
export const RELAY_HOST = "relay.kranox.cash";
export const RELAY_MEMORY_MINUTES = 10;

// The sources that the relay asks for the scan of an address on Robinhood Chain: Alchemy first, and Blockscout when
// Alchemy fails. CHECKED 8 Oct 2026, source the deploys of the relay in docs/HANDOFF.md: the live relay holds a key of
// each.
export const SCAN_SOURCES = { first: "Alchemy", fallback: "Blockscout" } as const;

// The owner chose the X handle on 2 Oct 2026.
export const X_HANDLE = "@kranoxlabs";

export const SOCIAL_LINKS = {
  x: { label: "X", href: "https://x.com/kranoxlabs" },
  // The organization of the project. The owner asked for this link on 5 Oct 2026.
  github: { label: "GitHub", href: "https://github.com/Kranox-Labs" },
} as const satisfies Record<string, ExternalLink>;

export interface TokenBurn {
  /** The whole tokens that went to the dead address, cut at the point. */
  tokens: number;
  transaction: string;
}

export interface Token {
  ticker: string;
  /** The contract address of the token, or null before the launch. */
  contract: string | null;
  /** The number of tokens that the launch made. */
  supply: number;
  /** The burn after the launch, or null before it. */
  burn: TokenBurn | null;
  chain: string;
  /** The block explorer of the chain, where a reader checks a transaction. */
  explorer: ExternalLink;
  /** Where the token launches and trades. */
  launchpad: ExternalLink;
  /** How the launchpad works, the source of the facts about it on the docs page. */
  launchpadDocs: ExternalLink;
}

// The token of the project. On 5 Oct 2026 the owner gave its ticker, $KRX, chose a launch through Pons v2 on Robinhood
// Chain, and then gave the contract address. CHECKED 5 Oct 2026 through the RPC of Robinhood Chain: the contract is
// named Kranox, with the symbol KRX, 18 decimals, and a supply of one billion, and the factory of Pons v2 launched it
// at 04:33:44 UTC in the transaction 0x77d52d91535cdb7b63859e5b50c3365d06d0245ef55e927113fde9fbb20a0f55. Both Pons
// links answer 200.
export const TOKEN: Token = {
  ticker: "$KRX",
  contract: "0x43c41b57cf771433d14c7108c650e712759d58ae",
  supply: 1_000_000_000,
  // CHECKED 5 Oct 2026 through the RPC of Robinhood Chain: 94,144,289.87 KRX went from the launch wallet to the dead
  // address 0x000000000000000000000000000000000000dEaD at 04:35:41 UTC, in block 80508902. The owner gave the
  // transaction as the proof of the burn.
  burn: { tokens: 94_144_289, transaction: "0xac25d4a0f2aaca53a5e414e7f24abae5bc6dddf9768cfc85581fd0992ee7914b" },
  chain: "Robinhood Chain",
  // The explorer where the owner showed the burn. CHECKED 5 Oct 2026: the page of the burn answers 200.
  explorer: { label: "Blockscout", href: "https://robinhoodchain.blockscout.com" },
  launchpad: { label: "Pons v2", href: "https://www.ponsfamily.com/launchpad" },
  launchpadDocs: { label: "Docs of Pons v2", href: "https://docs.ponsfamily.com/v2" },
};

// An address on Robinhood Chain, an EVM chain: 0x and 40 hex digits. The build stops on a wrong address, because a
// reader buys from the address that the docs show.
const CONTRACT_PATTERN = /^0x[0-9a-fA-F]{40}$/;

// A transaction hash: 0x and 64 hex digits.
const TRANSACTION_PATTERN = /^0x[0-9a-fA-F]{64}$/;

if (TOKEN.contract !== null && !CONTRACT_PATTERN.test(TOKEN.contract)) {
  throw new Error(`The contract address of ${TOKEN.ticker} must be 0x and 40 hex digits.`);
}
if (TOKEN.burn !== null && !TRANSACTION_PATTERN.test(TOKEN.burn.transaction)) {
  throw new Error(`The burn transaction of ${TOKEN.ticker} must be 0x and 64 hex digits.`);
}

/** The page of a transaction on the explorer of the chain of the token. */
export function transactionHref(hash: string): string {
  return `${TOKEN.explorer.href}/tx/${hash}`;
}
