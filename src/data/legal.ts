// The text of the legal pages: the privacy policy, the disclosures, and the terms of use. The owner asked for
// the three pages on 5 Oct 2026. copy.ts holds the text of the home page and of the shared parts.
// Each fact about data comes from the code on 5 Oct 2026: scripts/deploy/server/nginx-site.conf keeps no access log,
// nginx-headers.conf lets the page load files from its own address only and sends no referrer, the site loads its
// fonts from its own files. The release 0.3.1 beta of the app, 8 Oct 2026, sends the requests of wallet2 to the node of
// the user, through the proxy of the user when one is set, and the requests of apps/wallet/lib/bridge/client.dart to
// the relay: a quote, a swap into XMR with the coin, the amount, a new subaddress, and an optional refund address, the
// range and the quote of a payment, a payment with the coin, the XMR, the rate, the recipient, and a new subaddress for
// a refund, the state of an open swap every 15 seconds with the token of that swap, the address of a scan on Robinhood
// Chain, and a check that the relay answers when Settings opens. The relay writes no log of a request, and
// scripts/deploy/server/nginx-relay.conf keeps no access log for it; site.ts says what the relay holds in memory and
// which sources a scan asks. The page names no feature that the owner holds back.
import { RELEASE, RELEASE_STAGE } from "./downloads.ts";
import {
  CONTACT_EMAIL,
  EXCHANGER,
  EXCHANGER_PRIVACY,
  EXCHANGER_TERMS,
  type ExternalLink,
  type LegalSlug,
  ORGANIZATION_NAME,
  RELAY_HOST,
  RELAY_MEMORY_MINUTES,
  SCAN_SOURCES,
  SITE_NAME,
} from "./site.ts";

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
  points?: readonly string[];
  /** A mail link below the paragraphs. */
  email?: string;
  links?: readonly ExternalLink[];
}

export interface LegalPage {
  slug: LegalSlug;
  /** The short name of the page, in the links between the legal pages and in the footer. */
  label: string;
  title: string;
  /** The description of the page for search engines and link previews. */
  description: string;
  lead: string;
  sections: readonly LegalSection[];
}

// The date of the last change to any of the three pages. Change it with the text.
const UPDATED = "8 October 2026";

const CONTACT_SECTION: LegalSection = {
  heading: "Contact",
  paragraphs: ["Questions about this page go to our mailbox."],
  email: CONTACT_EMAIL,
};

const PRIVACY: LegalPage = {
  slug: "privacy",
  label: "Privacy",
  title: "Privacy policy",
  description: `What the ${SITE_NAME} site and app collect, which is very little, and who else can see something when you use them.`,
  lead: `${SITE_NAME} is built so that we know as little about you as we can. This page says what the site and the app collect, and who else can see something when you use them.`,
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        `${ORGANIZATION_NAME} makes ${SITE_NAME}, a self-custodial Monero wallet, and runs this site. In this policy, “we” means ${ORGANIZATION_NAME}.`,
      ],
    },
    {
      heading: "The site",
      paragraphs: [
        "Our site sets no cookies of its own, runs no analytics, and loads no scripts, fonts, or images from other companies. Every file comes from our own server.",
        "Our server keeps no access log, so it has no record of who visits or which pages they read. When a request fails on the server itself, the server can write a line to an error log, and that line can hold the IP address of the request. We read that log only to fix faults, and it rotates out after about two weeks.",
        "When you follow a link from our site to another site, your browser does not tell that site which page you came from.",
      ],
    },
    {
      heading: "Cloudflare",
      paragraphs: [
        "The site reaches you through Cloudflare, which protects it and delivers it. Cloudflare handles each request on its way to our server, so it sees your IP address and the technical details that your browser sends. It can set a short-lived cookie when it checks for automated traffic. The privacy policy of Cloudflare covers what Cloudflare does with that data.",
      ],
      links: [{ label: "Privacy policy of Cloudflare", href: "https://www.cloudflare.com/privacypolicy/" }],
    },
    {
      heading: "The app",
      paragraphs: [
        `The app has no account and no sign-up, and it sends no analytics, no crash reports, and no usage data to ${ORGANIZATION_NAME}.`,
        "Your seed, your keys, and your password stay on your device. The app keeps your wallet in a file that your password encrypts, a small settings file with your network, the node that you chose, and a proxy if you set one, and, once you pay to or receive from Robinhood Chain, a file with your swaps. It stores neither your password nor your seed. We never receive any of them, so we cannot see your balance or your payments, and we cannot restore a wallet for you.",
      ],
    },
    {
      heading: "Nodes",
      paragraphs: [
        "To show your balance and to send a payment, the app talks to a Monero node. Monero hides the sender, the receiver, and the amount of each payment, but the node that you use can still see your IP address, when your wallet connects, and the transactions that you send through it.",
        `A new wallet starts with a public node that a third party runs, not ${ORGANIZATION_NAME}. You can switch to any node at any time in the settings of the app. Your own node gives you the most privacy, and a proxy such as Tor, which you can also set there, hides your IP address from the node.`,
      ],
    },
    {
      heading: "Paying to and receiving from Robinhood Chain",
      paragraphs: [
        `When you pay to or receive from Robinhood Chain, ${EXCHANGER.label} makes the exchange, and the app talks to it through our relay at ${RELAY_HOST}. To receive, the relay gets the coin, the amount, a new subaddress of your wallet, and the refund address if you give one. To pay, it gets the coin, the XMR, the rate, the address of the recipient, and a new subaddress of your wallet for a refund. The relay passes them on to ${EXCHANGER.label}, and the app asks for the state of each swap until it ends. The app also asks the relay whether it answers when you open Settings.`,
        `The relay writes no log of a request, and its server keeps no access log. So that trying again never makes a second exchange, the relay holds its answer to a new swap in memory for ${RELAY_MEMORY_MINUTES} minutes, without your IP address, and then forgets it. Like the site, the relay reaches you through Cloudflare, so Cloudflare sees your IP address when the app calls it.`,
        `${EXCHANGER.label} sees the amount, the time, the deposit, and the subaddress of each swap, and the recipient of each payment, but never your keys. The privacy policy of ${EXCHANGER.label} covers what it does with that data.`,
      ],
      links: [EXCHANGER_PRIVACY],
    },
    {
      heading: "Scans of Robinhood Chain addresses",
      paragraphs: [
        `When you scan an address in the Privacy menu of the app, or check the recipient of a payment, the app sends that address to our relay. The relay asks ${SCAN_SOURCES.first}, or ${SCAN_SOURCES.fallback} when ${SCAN_SOURCES.first} fails, for the public history of the address on Robinhood Chain and passes it back. They see the address, but the request comes from our relay, so they never see your IP address.`,
        `The relay writes no log of a scan. It holds a scan in memory for ${RELAY_MEMORY_MINUTES} minutes, without your IP address, so that a second look at the same address needs no new request, and then forgets it.`,
        "Every other check of the Privacy menu, and the privacy check on the review of a payment, runs on your device. Nothing of it leaves the device.",
      ],
    },
    {
      heading: "Email and social accounts",
      paragraphs: [
        "When you write to us, we get your email address and your message. We use them to answer you and keep them no longer than we need to.",
        "When you visit our accounts on X or GitHub, the privacy policies of those companies apply there.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "We hold almost nothing about you. If you think that we hold something, such as an email that you sent, write to us. We will tell you what we have, and we will delete it when you ask.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "When this policy changes, we update this page and the date at the top. If we ever plan to collect something new, we will say so here before it starts.",
      ],
    },
    CONTACT_SECTION,
  ],
};

const DISCLOSURES: LegalPage = {
  slug: "disclosures",
  label: "Disclosures",
  title: "Disclosures",
  description: `The risks of ${SITE_NAME}: early software, self-custody, final payments, swaps through ${EXCHANGER.label}, and plans that can change.`,
  lead: `${SITE_NAME} is early software for money that is hard to get back once it moves. Please read this before you use it.`,
  sections: [
    {
      heading: "Early software",
      paragraphs: [
        `${SITE_NAME} ${RELEASE.name} runs on macOS and on the main Monero network, with real XMR. It's ${RELEASE_STAGE}, and it has seen little use with real money so far. Start with small amounts.`,
      ],
    },
    {
      heading: "You hold your keys",
      paragraphs: [
        `${SITE_NAME} is self-custodial. Only you hold your seed and your password, and ${ORGANIZATION_NAME} has no copy of either. If you lose your seed, nobody can restore your wallet. If someone else gets your seed, they can take your coins. Write the 25 words down and keep them offline.`,
      ],
    },
    {
      heading: "Payments are final",
      paragraphs: [
        `A Monero payment cannot be reversed. Check the address and the amount before you send. ${ORGANIZATION_NAME} cannot cancel, refund, or trace a payment.`,
      ],
    },
    {
      heading: "Privacy checks",
      paragraphs: [
        `The privacy check and the Privacy menu of ${SITE_NAME} look for patterns that we know of, in the history on your device and in the public history of an address that you scan. They cannot find every way to link your payments, and a clear check is no promise that nobody can.`,
      ],
    },
    {
      heading: "Software risk",
      paragraphs: [
        `Like any new software, ${SITE_NAME} can have bugs. It has not had an independent security audit yet. It uses the wallet code of the Monero project for keys, addresses, and transactions, and it does not write its own cryptography.`,
      ],
    },
    {
      heading: `Swaps through ${EXCHANGER.label}`,
      paragraphs: [
        `Paying to and receiving from Robinhood Chain go through ${EXCHANGER.label}, an exchange that another company runs. ${EXCHANGER.label} sets the rate, can hold a swap for a check, and decides on refunds. ${ORGANIZATION_NAME} cannot release, refund, or speed up a swap. At a floating rate, the amount that a recipient gets can move until the exchange. When you receive, send only the coin and the amount that the app shows, on Robinhood Chain, or your deposit may not arrive.`,
      ],
    },
    {
      heading: "Nodes run by others",
      paragraphs: [
        `Public nodes are run by third parties. ${ORGANIZATION_NAME} does not control them and cannot promise that a node is honest or online. Your own node removes that risk.`,
      ],
    },
    {
      heading: "Plans can change",
      paragraphs: [
        "The features that the site lists as coming next are plans, not promises. They can change, come later, or not ship. The screens of the app on the site show sample data.",
      ],
    },
    {
      heading: "Not financial advice",
      paragraphs: [
        "Nothing on this site or in the app is financial, investment, legal, or tax advice. The price of XMR can move fast, and you can lose value.",
      ],
    },
    {
      heading: "Your local laws",
      paragraphs: [
        "The rules for privacy coins differ from country to country, and some exchanges do not list XMR. You are responsible for following the laws where you live.",
      ],
    },
    {
      heading: "Independence",
      paragraphs: [
        `${SITE_NAME} is an independent project. It is not part of the Monero project, and the Monero project does not endorse it. The Monero name and symbol refer to the Monero project.`,
      ],
    },
    CONTACT_SECTION,
  ],
};

const TERMS: LegalPage = {
  slug: "terms",
  label: "Terms",
  title: "Terms of use",
  description: `The terms for the use of the ${SITE_NAME} site and of the ${SITE_NAME} app.`,
  lead: `These terms cover your use of this site and of the ${SITE_NAME} app that ${ORGANIZATION_NAME} publishes. When you use either, you agree to them.`,
  sections: [
    {
      heading: `What ${SITE_NAME} is`,
      paragraphs: [
        `${SITE_NAME} is software that runs on your device and lets you manage your own Monero wallet. ${ORGANIZATION_NAME} is not a bank, an exchange, or a custodian. We never hold, send, or control your coins, and we cannot act on your wallet for you.`,
      ],
    },
    {
      heading: "Your part",
      paragraphs: [`When you use ${SITE_NAME}, you agree to these points.`],
      points: [
        "Keep your seed and your password safe and private.",
        "Check every address and every amount before you send.",
        `Use ${SITE_NAME} only in ways that are legal where you live.`,
        `Do not use the name or the look of ${SITE_NAME} to mislead others, for example with a fake copy of the app.`,
      ],
    },
    {
      heading: `Swaps through ${EXCHANGER.label}`,
      paragraphs: [
        `When you pay to or receive from Robinhood Chain, ${EXCHANGER.label} makes the exchange, and its terms of use apply to it.`,
      ],
      links: [EXCHANGER_TERMS],
    },
    {
      heading: "The code",
      paragraphs: [
        "The license that comes with the code of the app governs your use of that code. These terms cover this site and the builds that we publish.",
      ],
    },
    {
      heading: "Name and logo",
      paragraphs: [
        `The name ${SITE_NAME}, the helmet logo, and the art on this site belong to ${ORGANIZATION_NAME}. Do not use them in a way that suggests that we made or endorse something that we did not.`,
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        `${SITE_NAME} and this site come as they are, without any warranty. We work hard to make ${SITE_NAME} safe and correct, but we cannot promise that it is free of bugs, that it always works, or that a node is available.`,
      ],
    },
    {
      heading: "Limits on liability",
      paragraphs: [
        `As far as the law allows, ${ORGANIZATION_NAME} is not liable for any loss that comes from your use of ${SITE_NAME} or of this site. That includes lost coins, a lost seed or password, a payment to a wrong address, a bug, and a fault of a node or of the network.`,
        "Some places do not allow these limits, so parts of this section may not apply to you.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        `We can update these terms. The date at the top shows the last change. When you keep using ${SITE_NAME} after a change, the new terms apply.`,
      ],
    },
    CONTACT_SECTION,
  ],
};

// The order of the links between the legal pages and in the footer.
const PAGES: readonly LegalPage[] = [PRIVACY, DISCLOSURES, TERMS];

export const LEGAL = {
  label: "Legal",
  navLabel: "Legal pages",
  updatedLabel: "Last updated",
  updated: UPDATED,
  pages: PAGES,
} as const;

/** The title of a legal page in the tab of the browser and in a link preview. */
export function legalPageTitle(page: LegalPage): string {
  return `${page.title} | ${SITE_NAME}`;
}
