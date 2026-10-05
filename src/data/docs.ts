// The text of the docs page: one page of sections with a list of them at the side. The layout follows
// docs.ponsfamily.com, which the owner showed on 5 Oct 2026, and the look follows the home page, as the owner asked
// the same day. Each fact about the app comes from the code of apps/wallet on 5 Oct 2026: the
// values of lib/config/app_config.dart, the checks of lib/core/, and the words of the screens in lib/ui/copy.dart,
// so that the page says only what the app does. The facts about Monero come from cryptonote_config.h of the
// Monero project. The page names no feature that the owner holds back, and no platform but the Mac: on 5 Oct 2026 the
// owner held the platforms that are still coming. The same day the owner asked for the token of the project on the
// page: TOKEN_GROUP holds it, with the words of the owner and the facts of the docs of Pons v2. R6 of docs/HANDOFF.md
// bans one word from every text. copy.ts holds the text of the home page.
//
// A text can carry two marks: `code` for a value that a user types or reads, and [label](href) for a link.
import { LEGAL } from "./legal.ts";
import {
  CONTACT_EMAIL,
  DOWNLOADS_HREF,
  legalHref,
  type LegalSlug,
  ORGANIZATION_NAME,
  REPOSITORY,
  SITE_NAME,
  SOCIAL_LINKS,
  TOKEN,
  transactionHref,
  X_HANDLE,
} from "./site.ts";

export interface DocsStep {
  title: string;
  text: string;
}

export interface DocsTerm {
  term: string;
  text: string;
}

/** One row of facts. A value with copy shows in the type of code, with a button that copies it. */
export interface DocsFact {
  label: string;
  value: string;
  href?: string;
  copy?: boolean;
}

export type DocsBlock =
  | { kind: "text"; text: string }
  | { kind: "points"; items: readonly string[] }
  | { kind: "callout"; title: string; text?: string; items?: readonly string[] }
  | { kind: "steps"; items: readonly DocsStep[] }
  | { kind: "terms"; items: readonly DocsTerm[] }
  | { kind: "facts"; items: readonly DocsFact[] }
  | { kind: "table"; columns: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: "code"; title: string; code: string }
  | { kind: "note"; text: string };

export interface DocsSection {
  id: string;
  title: string;
  blocks: readonly DocsBlock[];
}

export interface DocsGroup {
  label: string;
  sections: readonly DocsSection[];
}

// The anchor of each section. A text links to a section through these names.
const IDS = {
  overview: "overview",
  status: "status",
  install: "install",
  create: "create",
  restore: "restore",
  password: "password",
  receive: "receive",
  send: "send",
  activity: "activity",
  node: "node",
  ownNode: "own-node",
  hides: "what-monero-hides",
  nodeSees: "what-a-node-sees",
  seedSafety: "seed-safety",
  networks: "networks",
  amounts: "amounts",
  restoreHeight: "restore-height",
  glossary: "glossary",
  token: "token",
  tokenLaunch: "token-launch",
  tokenTax: "token-tax",
  tokenSafety: "token-safety",
  source: "source",
  contact: "contact",
  legal: "legal",
} as const;

function anchor(id: string): string {
  return `#${id}`;
}

// Values of the app, apps/wallet/lib/config/app_config.dart, 5 Oct 2026.
const APP = {
  /** AppConfig.defaultNodes: the node of a new wallet on stagenet. */
  defaultNode: "node3.monerodevs.org:38089",
  /** AppConfig.minPasswordLength. */
  minPasswordLength: 8,
  /** AppConfig.autoRefreshInterval, in seconds. */
  refreshSeconds: 20,
  /** AppConfig.decoyCount. */
  decoys: 15,
  /** AppConfig.recentActivityCount. */
  recentCount: 5,
} as const;

// Values of Monero. CHECKED 5 Oct 2026, source cryptonote_config.h on the branch master of monero-project/monero:
// CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE, DIFFICULTY_TARGET_V2, CRYPTONOTE_DISPLAY_DECIMAL_POINT, and the RPC ports. The
// first characters of the addresses follow from their prefixes, 18 and 42 on mainnet and 24 and 36 on stagenet,
// checked with the base58 of Monero on the same date.
const MONERO = {
  unlockBlocks: 10,
  blockMinutes: 2,
  decimals: 12,
  mainnetPort: 18081,
  stagenetPort: 38081,
} as const;

const RING_SIZE = APP.decoys + 1;
const UNLOCK_MINUTES = MONERO.unlockBlocks * MONERO.blockMinutes;

// The node software of Monero, monerod, comes from the downloads page of the Monero project.
const MONERO_DOWNLOADS_HREF = "https://www.getmonero.org/downloads/";

// One line on each legal page, beside its title. legal.ts holds the pages.
const LEGAL_SUMMARIES: Record<LegalSlug, string> = {
  privacy: "What the site and the app collect",
  disclosures: "The risks of early software and of holding your own keys",
  terms: "The terms for the site and the app",
};

const GETTING_STARTED: DocsGroup = {
  label: "Getting started",
  sections: [
    {
      id: IDS.overview,
      title: "Overview",
      blocks: [
        {
          kind: "text",
          text: `${SITE_NAME} is a self-custodial Monero wallet. Your seed and your keys are made on your device and stay there. There is no account and no sign-up, and ${ORGANIZATION_NAME} never holds your coins.`,
        },
        {
          kind: "text",
          text: `To see your payments and to send new ones, the app talks to a Monero node. You choose that node, and you can run your own.`,
        },
        {
          kind: "callout",
          title: "Before you start",
          items: [
            `${SITE_NAME} is in development. The first build runs on macOS, on stagenet, where coins have no value.`,
            "Your 25-word seed is the only backup of your wallet. Nobody can restore it for you.",
            "A Monero payment is final. Check the address before you send.",
          ],
        },
      ],
    },
    {
      id: IDS.status,
      title: "Status",
      blocks: [
        {
          kind: "text",
          text: "No build is out yet. We are testing the first one on macOS, on stagenet, the test network of Monero. Stagenet coins have no value, so a mistake costs nothing while the wallet gets its first real use.",
        },
        {
          kind: "facts",
          items: [
            { label: "Stage", value: "In development" },
            { label: "Platform", value: "macOS" },
            { label: "Network", value: "Stagenet" },
          ],
        },
        {
          kind: "text",
          text: `Mainnet comes when sending and receiving have proven safe on stagenet. Next on the list are a privacy check before each send, Touch ID to unlock, and pay by name. Follow [${X_HANDLE}](${SOCIAL_LINKS.x.href}) on X to watch the build.`,
        },
      ],
    },
    {
      id: IDS.install,
      title: "Install",
      blocks: [
        {
          kind: "text",
          text: `There is nothing to install yet. When a build is ready, you'll download it from the [downloads page](${DOWNLOADS_HREF}), next to the hash of each file, so that you can check a file before you open it.`,
        },
        {
          kind: "text",
          text: `You can also build the app from its code. The steps are under [Source code](${anchor(IDS.source)}).`,
        },
        {
          kind: "callout",
          title: "Only from us",
          text: `Get ${SITE_NAME} from this site or from our GitHub repository, nowhere else. A copy from another place can be changed to take your coins.`,
        },
      ],
    },
  ],
};

const WALLET: DocsGroup = {
  label: "Wallet",
  sections: [
    {
      id: IDS.create,
      title: "Create a wallet",
      blocks: [
        {
          kind: "text",
          text: `On the first start, ${SITE_NAME} offers two ways in: create a new wallet, or restore one from its seed.`,
        },
        {
          kind: "steps",
          items: [
            {
              title: "Choose a password",
              text: `Type it twice. It needs at least ${APP.minPasswordLength} characters, and it locks the wallet on this device.`,
            },
            {
              title: "Write down your seed",
              text: `${SITE_NAME} shows 25 words. Write them on paper in this order, and keep the paper offline.`,
            },
            {
              title: "Open the wallet",
              text: "Tick the box that says you wrote down all 25 words, then open your wallet.",
            },
          ],
        },
        {
          kind: "callout",
          title: "Your seed is your wallet",
          text: `Anyone with the 25 words can spend your XMR from any device. Never type them into a website, a chat, or a form. ${ORGANIZATION_NAME} will never ask for them.`,
        },
      ],
    },
    {
      id: IDS.restore,
      title: "Restore a wallet",
      blocks: [
        {
          kind: "text",
          text: "Restore brings a wallet back from its 25 words, on a new device or after a reinstall.",
        },
        {
          kind: "steps",
          items: [
            {
              title: "Enter the seed",
              text: "Type the 25 words in order, with a space between them. Capital letters and extra spaces do not matter.",
            },
            {
              title: "Add a restore height",
              text: `This is optional. It tells ${SITE_NAME} from which block to look for your payments. See [Restore height](${anchor(IDS.restoreHeight)}).`,
            },
            {
              title: "Choose a password",
              text: "It locks the restored wallet on this device. It does not have to match the password that you used before.",
            },
          ],
        },
        {
          kind: "text",
          text: `${SITE_NAME} then scans the chain for your payments. The first scan can take a while, so leave the app open until it shows Synced.`,
        },
      ],
    },
    {
      id: IDS.password,
      title: "Password and lock",
      blocks: [
        {
          kind: "text",
          text: `The password encrypts the key file of your wallet on this device. ${SITE_NAME} does not store it and cannot recover it. If you lose it, your seed still restores the wallet.`,
        },
        {
          kind: "terms",
          items: [
            {
              term: "Lock",
              text: "Lock in the sidebar, or Lock now in Settings, closes the wallet. Your password opens it again.",
            },
            {
              term: "Unlock",
              text: `A locked wallet shows nothing until you enter the password.`,
            },
            {
              term: "Show seed",
              text: "Settings › Seed shows your 25 words after you enter your password.",
            },
            {
              term: "Quit",
              text: `When you quit the app, ${SITE_NAME} closes the wallet and saves its file first.`,
            },
          ],
        },
      ],
    },
    {
      id: IDS.receive,
      title: "Receive",
      blocks: [
        {
          kind: "text",
          text: "Receive shows an address of your wallet as a QR code and as text. Copy it, or let the payer scan the code.",
        },
        {
          kind: "text",
          text: "Give each payer a new address with New address. All of them belong to the same wallet and the same seed, and an outsider cannot tell that two of them belong together.",
        },
        {
          kind: "callout",
          title: "Subaddresses only",
          text: `A wallet has one main address and as many subaddresses as you like. ${SITE_NAME} hands out subaddresses only, so that two payers never see the same address.`,
        },
        {
          kind: "note",
          text: `A payment shows up when the wallet has caught up with the chain. You can spend it after ${MONERO.unlockBlocks} confirmations, about ${UNLOCK_MINUTES} minutes.`,
        },
      ],
    },
    {
      id: IDS.send,
      title: "Send",
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Enter the address and the amount",
              text: `${SITE_NAME} checks the address: its length, its checksum, and its network. An amount takes up to ${MONERO.decimals} decimals, after a point.`,
            },
            {
              title: "Review the payment",
              text: `${SITE_NAME} builds the payment and shows the network fee and the total. Nothing has left your wallet yet.`,
            },
            {
              title: "Send now",
              text: `The node takes the payment, and you get its transaction ID. A block confirms it in about ${MONERO.blockMinutes} minutes.`,
            },
          ],
        },
        {
          kind: "callout",
          title: "A payment is final",
          text: "Nobody can undo or stop a Monero payment once it is sent. Check the address, and send a small amount first when you pay someone for the first time.",
        },
        {
          kind: "text",
          text: `You can send your unlocked balance only. Coins that arrived in the last ${MONERO.unlockBlocks} blocks wait for their confirmations first.`,
        },
      ],
    },
    {
      id: IDS.activity,
      title: "Activity",
      blocks: [
        {
          kind: "text",
          text: `Activity lists every transaction of the wallet, the newest first. Home shows the latest ${APP.recentCount}.`,
        },
        {
          kind: "terms",
          items: [
            { term: "Received", text: "A payment into the wallet. The row names the subaddress that got it." },
            { term: "Sent", text: "A payment out of the wallet, with its fee." },
            { term: "Pending", text: "The network has the transaction, but no block holds it yet." },
            { term: "Failed", text: "The transaction never made it into a block, so no coins moved." },
            {
              term: "Confirmations",
              text: `The number of blocks since the block with the payment. After ${MONERO.unlockBlocks}, the coins are unlocked.`,
            },
            { term: "Copy ID", text: "Copies the transaction ID, the public name of a transaction on the chain." },
          ],
        },
      ],
    },
  ],
};

const NODE: DocsGroup = {
  label: "Node",
  sections: [
    {
      id: IDS.node,
      title: "Pick a node",
      blocks: [
        {
          kind: "text",
          text: `A node keeps a copy of the Monero chain. ${SITE_NAME} asks it for new blocks every ${APP.refreshSeconds} seconds and sends your payments through it. The node never sees your keys.`,
        },
        {
          kind: "facts",
          items: [
            { label: "Default node", value: APP.defaultNode, copy: true },
            { label: "Run by", value: `A third party, not ${ORGANIZATION_NAME}` },
            { label: "Change it", value: "Settings › Node" },
          ],
        },
        {
          kind: "steps",
          items: [
            { title: "Open Settings", text: "The Node card holds the address of the node in use." },
            {
              title: "Enter the address",
              text: "Write it as host and port, such as `node.example.org:38089`. An IPv6 address goes in brackets.",
            },
            {
              title: "Save node",
              text: `${SITE_NAME} connects to the new node at once and keeps it for the next start.`,
            },
          ],
        },
        {
          kind: "terms",
          items: [
            { term: "Node online", text: "The node answers, and the wallet follows the chain." },
            {
              term: "Node offline",
              text: "The node does not answer. Check its address in Settings, or pick another one.",
            },
            { term: "Node too old", text: "The node runs an old version of Monero. Pick another one." },
          ],
        },
      ],
    },
    {
      id: IDS.ownNode,
      title: "Run your own node",
      blocks: [
        {
          kind: "text",
          text: "Your own node gives you the most privacy: no third party sees your IP address or the moments when your wallet connects. It needs a computer that stays online, with room on its disk for the chain.",
        },
        {
          kind: "text",
          text: `The node software of Monero is called monerod. Get it from the [downloads page of the Monero project](${MONERO_DOWNLOADS_HREF}), then start it for stagenet:`,
        },
        {
          kind: "code",
          title: "Start a stagenet node",
          code: "monerod --stagenet",
        },
        {
          kind: "text",
          text: `When it runs on the same computer as ${SITE_NAME}, enter \`127.0.0.1:${MONERO.stagenetPort}\` in Settings › Node. The first sync of a node takes hours, not minutes.`,
        },
      ],
    },
  ],
};

const PRIVACY: DocsGroup = {
  label: "Privacy and safety",
  sections: [
    {
      id: IDS.hides,
      title: "What Monero hides",
      blocks: [
        {
          kind: "text",
          text: "On most chains, anyone can read who paid whom, and how much. Monero hides the sender, the receiver, and the amount of every payment, by default.",
        },
        {
          kind: "terms",
          items: [
            {
              term: "Sender",
              text: `Ring signatures. Each coin that you spend hides among ${APP.decoys} decoys from the chain, so an outsider sees ${RING_SIZE} possible senders.`,
            },
            {
              term: "Receiver",
              text: "One-time addresses. Each payment goes to a new address on the chain, which only the receiver can link to a wallet.",
            },
            {
              term: "Amount",
              text: "RingCT. The chain keeps amounts hidden and still proves that no payment creates coins from nothing.",
            },
            {
              term: "Subaddresses",
              text: "Separate addresses for separate payers, all spent from one seed.",
            },
          ],
        },
        {
          kind: "note",
          text: `${SITE_NAME} uses the wallet code of the Monero project for keys, addresses, and transactions. It does not write its own cryptography.`,
        },
      ],
    },
    {
      id: IDS.nodeSees,
      title: "What a node can see",
      blocks: [
        {
          kind: "text",
          text: "Monero hides the payment, but the node that your wallet talks to can still see your IP address, when your wallet connects, and the transactions that you send through it.",
        },
        {
          kind: "points",
          items: [
            "Your own node shows this to nobody else.",
            "A node that you trust is the next best choice.",
            `The app sends nothing to ${ORGANIZATION_NAME}: no analytics, no crash reports, and no usage data.`,
          ],
        },
      ],
    },
    {
      id: IDS.seedSafety,
      title: "Keep your seed safe",
      blocks: [
        {
          kind: "points",
          items: [
            "Write the 25 words on paper, in order, and keep the paper in a safe place.",
            "Keep the words out of photos, cloud notes, mail, and chats.",
            `Never type them into a website. ${ORGANIZATION_NAME} will never ask for them, and anyone who does wants your coins.`,
            "Check the words now and then in Settings › Seed, with your password.",
          ],
        },
        {
          kind: "callout",
          title: "We cannot restore a wallet",
          text: `${ORGANIZATION_NAME} never sees your seed, your keys, or your password, so we cannot restore a wallet or move coins for anyone.`,
        },
      ],
    },
  ],
};

const REFERENCE: DocsGroup = {
  label: "Reference",
  sections: [
    {
      id: IDS.networks,
      title: "Networks",
      blocks: [
        {
          kind: "text",
          text: `Monero has a main network and test networks, each with its own addresses. ${SITE_NAME} refuses an address of another network than the wallet.`,
        },
        {
          kind: "table",
          columns: ["", "Mainnet", "Stagenet"],
          rows: [
            ["Coins", "Real XMR", "Test coins with no value"],
            ["Address starts with", "4", "5"],
            ["Subaddress starts with", "8", "7"],
            ["Node port", String(MONERO.mainnetPort), String(MONERO.stagenetPort)],
            [`In ${SITE_NAME}`, "Later", "Now"],
          ],
        },
      ],
    },
    {
      id: IDS.amounts,
      title: "Amounts and fees",
      blocks: [
        {
          kind: "text",
          text: `${SITE_NAME} counts in XMR, with up to ${MONERO.decimals} decimals. The smallest unit is the piconero, a trillionth of an XMR.`,
        },
        {
          kind: "facts",
          items: [
            { label: "1 XMR", value: "1,000,000,000,000 piconero" },
            { label: "Decimals", value: `Up to ${MONERO.decimals}, after a point` },
            { label: "Amounts on screen", value: "Cut at the last digit shown, never rounded up" },
            { label: "Network fee", value: "Shown before you send" },
          ],
        },
        {
          kind: "text",
          text: `The network fee goes to the miners of Monero, not to ${ORGANIZATION_NAME}. ${SITE_NAME} adds no fee of its own.`,
        },
      ],
    },
    {
      id: IDS.restoreHeight,
      title: "Restore height",
      blocks: [
        {
          kind: "text",
          text: `The restore height is the block from which ${SITE_NAME} looks for your payments. Monero makes a block about every ${MONERO.blockMinutes} minutes.`,
        },
        {
          kind: "points",
          items: [
            "Leave the field empty to scan from the first block. Nothing is missed, but the first sync takes longer.",
            "Enter the height of a block from a little before the day you made the wallet, to save time.",
            "A height that is too high skips your earliest payments. When in doubt, enter a lower number.",
          ],
        },
        {
          kind: "note",
          text: "A block explorer of Monero shows which block belongs to a date.",
        },
      ],
    },
    {
      id: IDS.glossary,
      title: "Glossary",
      blocks: [
        {
          kind: "terms",
          items: [
            { term: "Seed", text: "The 25 words that hold your keys. The last word is a checksum of the others." },
            {
              term: "Subaddress",
              text: "An extra receive address of your wallet. It starts with 8 on mainnet and with 7 on stagenet.",
            },
            { term: "Node", text: "A computer that keeps the Monero chain and passes your payments on." },
            { term: "Confirmation", text: "One block on top of the block that holds your payment." },
            { term: "Unlocked balance", text: "The part of your balance that you can send now." },
            { term: "Restore height", text: "The block from which the wallet looks for your payments." },
            { term: "Stagenet", text: "The test network of Monero. Its coins have no value." },
            { term: "Transaction ID", text: "The public name of a transaction on the chain." },
          ],
        },
      ],
    },
  ],
};

// The token of the project, in the words of the owner on 5 Oct 2026: the ticker, the launch through Pons v2, the burn
// after the launch, and the split of the tax: one half to rewards for the holders and to marketing, the other half to
// the development of the apps and to buybacks that burn the token. The facts about Pons v2 come from its docs, CHECKED
// 5 Oct 2026. CHECKED the same day, source the API of DexScreener: copies named Kranox trade on Robinhood Chain, Base,
// BSC, and Solana, and three of them on Robinhood Chain carry the ticker KRX and an address that ends in 58aE, like
// the contract. The texts that depend on the launch and the burn follow TOKEN in site.ts.
const TOKEN_LAUNCHED = TOKEN.contract !== null;

// The page of the token on Pons after the launch, and the list of launches before it. CHECKED 5 Oct 2026: the page of
// $KRX answers 200 with the title "Kranox ($KRX) · pons".
const TOKEN_HREF = TOKEN.contract === null ? TOKEN.launchpad.href : `${TOKEN.launchpad.href}/${TOKEN.contract}`;

// The share of the supply in a number of tokens, cut at two decimals and never rounded up, like the amounts of the app.
function supplyShare(tokens: number): string {
  return (Math.floor((tokens / TOKEN.supply) * 10_000) / 100).toFixed(2);
}

const TOKEN_BURN_TEXT =
  TOKEN.burn === null
    ? "After the launch we burn part of the supply. The burn transaction goes on X and on this page, so anyone can check it on the chain."
    : `Right after the launch we burned ${TOKEN.burn.tokens.toLocaleString("en-US")} ${TOKEN.ticker}, ${supplyShare(TOKEN.burn.tokens)}% of the supply, by sending them to the dead address. Nobody can move them again, and anyone can check the [transaction on ${TOKEN.explorer.label}](${transactionHref(TOKEN.burn.transaction)}).`;

const TOKEN_CONTRACT: DocsFact =
  TOKEN.contract === null
    ? { label: "Contract", value: "Posted at launch" }
    : { label: "Contract", value: TOKEN.contract, copy: true };

const TOKEN_GROUP: DocsGroup = {
  label: "Token",
  sections: [
    {
      id: IDS.token,
      title: `The ${TOKEN.ticker} token`,
      blocks: [
        {
          kind: "text",
          text: `${TOKEN.ticker} is the official token of ${SITE_NAME}. ${TOKEN_LAUNCHED ? "It trades on" : "It's coming to"} [${TOKEN.launchpad.label}](${TOKEN_HREF}) on ${TOKEN.chain}.`,
        },
        {
          kind: "facts",
          items: [
            { label: "Ticker", value: TOKEN.ticker },
            { label: "Chain", value: TOKEN.chain },
            { label: TOKEN_LAUNCHED ? "Trade" : "Launch", value: TOKEN.launchpad.label, href: TOKEN_HREF },
            { label: "Supply at launch", value: TOKEN.supply.toLocaleString("en-US") },
            TOKEN_CONTRACT,
          ],
        },
        {
          kind: "note",
          text: `For now the ${SITE_NAME} wallet holds XMR only, so keep ${TOKEN.ticker} in a wallet that supports ${TOKEN.chain}.`,
        },
      ],
    },
    {
      id: IDS.tokenLaunch,
      title: "Launch and burn",
      blocks: [
        {
          kind: "text",
          text: `How a launch on ${TOKEN.launchpad.label} works, from its [docs](${TOKEN.launchpadDocs.href}):`,
        },
        {
          kind: "points",
          items: [
            "The whole supply starts on a bonding curve. Nobody, us included, holds tokens before trading opens.",
            "When the curve sells out, the token moves to a Uniswap v4 pool. Its liquidity is locked for good, and nobody can pull it out, not us and not Pons.",
            "Nobody can mint more tokens, freeze a wallet, or raise the tax after the launch.",
          ],
        },
        {
          kind: "text",
          text: TOKEN_BURN_TEXT,
        },
      ],
    },
    {
      id: IDS.tokenTax,
      title: "Where the tax goes",
      blocks: [
        {
          kind: "text",
          text: `Each trade of ${TOKEN.ticker} pays a tax. ${TOKEN.launchpad.label} fixes it at the launch, and nobody can raise it later. We split our share of it in half:`,
        },
        {
          kind: "facts",
          items: [
            { label: "50%", value: `Rewards for ${TOKEN.ticker} holders, marketing, and more` },
            { label: "50%", value: `Development of the ${SITE_NAME} apps, plus buybacks and burns of ${TOKEN.ticker}` },
          ],
        },
      ],
    },
    {
      id: IDS.tokenSafety,
      title: "Fake tokens and risk",
      blocks: [
        {
          kind: "callout",
          title: TOKEN_LAUNCHED ? "Check the address" : "No contract yet",
          text: TOKEN_LAUNCHED
            ? `Names, tickers, and even the last characters of an address can be copied. The only ${TOKEN.ticker} is the full contract address on this page.`
            : `Until we post the contract address here and on X from [${X_HANDLE}](${SOCIAL_LINKS.x.href}), every token called ${SITE_NAME} is a copy.`,
        },
        {
          kind: "points",
          items: [
            `Copies named ${SITE_NAME} already trade on ${TOKEN.chain}, Base, BSC, and Solana. Some use the ticker ${TOKEN.ticker} and an address that ends in the same characters as ours. None of them is ours.`,
            `Check every character of the contract address against this page or [${X_HANDLE}](${SOCIAL_LINKS.x.href}) before you buy, not only the first and last few.`,
            `Nobody from ${ORGANIZATION_NAME} will DM you to sell ${TOKEN.ticker}.`,
          ],
        },
        {
          kind: "text",
          text: "A new token can swing hard and can lose all of its value. Only buy what you can afford to lose. Nothing here is financial advice.",
        },
        {
          kind: "note",
          text: `Pons and ${TOKEN.chain} are run by other teams. ${ORGANIZATION_NAME} isn't part of either.`,
        },
      ],
    },
  ],
};

const PROJECT: DocsGroup = {
  label: "Project",
  sections: [
    {
      id: IDS.source,
      title: "Source code",
      blocks: [
        {
          kind: "text",
          text: "The code of the app is public on GitHub, so anyone can read what it does with your keys before trusting it with a coin.",
        },
        {
          kind: "facts",
          items: [
            { label: "Repository", value: REPOSITORY.code.label, href: REPOSITORY.code.href },
            { label: "Built with", value: "Flutter, and the wallet code of Monero through monero_c" },
            { label: "Bugs", value: REPOSITORY.issues.label, href: REPOSITORY.issues.href },
          ],
        },
        {
          kind: "code",
          title: "Build and run on macOS",
          code: [
            `git clone ${REPOSITORY.code.href}.git`,
            "cd Kranox",
            "# Fetch the Monero library and check its digest, once",
            "sh tool/fetch_monero_c.sh",
            "# Install the pinned Flutter, then run the app",
            "fvm install",
            "fvm flutter run -d macos",
          ].join("\n"),
        },
        {
          kind: "note",
          text: "You need Xcode, CocoaPods, and fvm, which pins the Flutter version of the project.",
        },
      ],
    },
    {
      id: IDS.contact,
      title: "Contact",
      blocks: [
        {
          kind: "facts",
          items: [
            { label: "Mail", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
            { label: "Bugs and ideas", value: REPOSITORY.issues.label, href: REPOSITORY.issues.href },
            { label: "News", value: X_HANDLE, href: SOCIAL_LINKS.x.href },
          ],
        },
        {
          kind: "callout",
          title: "We never ask for your seed",
          text: `Nobody from ${ORGANIZATION_NAME} will ask for your seed, your password, or a payment to help you.`,
        },
      ],
    },
    {
      id: IDS.legal,
      title: "Legal",
      blocks: [
        {
          kind: "facts",
          items: LEGAL.pages.map((page) => ({
            label: page.title,
            value: LEGAL_SUMMARIES[page.slug],
            href: legalHref(page.slug),
          })),
        },
        {
          kind: "note",
          text: `${SITE_NAME} is independent. The Monero project does not endorse it.`,
        },
      ],
    },
  ],
};

export const DOCS = {
  meta: {
    title: `Docs | ${SITE_NAME}`,
    description: `How the ${SITE_NAME} wallet works: create or restore a wallet, send and receive XMR, choose your node, and keep your seed safe. Plus the ${TOKEN.ticker} token.`,
  },
  // The top of the page, like the title of the sunrise on the home page: a label between stars, the title in capitals,
  // and a lead in plain words.
  hero: {
    label: "Docs",
    title: `How the ${SITE_NAME} wallet works`,
    lead: "What the app does today, and how to keep your coins safe with it.",
    updatedLabel: "Updated",
    // The date of the last change to the text. Change it with the text.
    updated: "5 October 2026",
  },
  sidebar: {
    label: "Docs",
    searchLabel: "Search the docs",
    searchPlaceholder: "Search docs",
    // The key that focuses the search together with Command on a Mac, or with Control elsewhere.
    shortcutKey: "k",
    shortcutMac: "⌘K",
    shortcutOther: "Ctrl K",
    noResults: "No section matches.",
    // The network of the app at the foot of the list, like the status in the footer of the home page.
    network: { label: "Network", value: "Monero stagenet" },
  },
  copyButton: { label: "Copy", copied: "Copied", failed: "Copy failed" },
  groups: [GETTING_STARTED, WALLET, NODE, PRIVACY, REFERENCE, TOKEN_GROUP, PROJECT],
} as const;
