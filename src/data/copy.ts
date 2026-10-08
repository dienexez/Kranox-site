// All text of the home page and of the shared parts. Components import the text from this file. legal.ts holds the
// text of the legal pages.
// On 3 Oct 2026 the owner asked for a site without content: the first goal was the look and the motion. On 4 Oct
// 2026 the owner asked for the text after the sunrise. The owner approves the text before a deploy: the flag
// CONTENT_APPROVED in site.ts. The names, the handle, and the tagline are facts of the brand.
import { APP } from "./app.ts";
import { RELEASE, RELEASE_STAGE } from "./downloads.ts";
import { EXCHANGER, ORGANIZATION_NAME, SITE_NAME, X_HANDLE, type SectionId } from "./site.ts";

export interface NavItem {
  label: string;
  section: SectionId;
}

export interface FaqItem {
  question: string;
  answer: string;
}

// The name of the section on privacy on Monero, for assistive technology. On 5 Oct 2026 the owner took it out of
// the menu.
const PRIVACY = "Privacy";

// The name of the section on the wallet itself, in the menu.
const WALLET = "Wallet";

// The name of the bridge between Monero and Robinhood Chain, in the menu, in the footer, and as its title.
const BRIDGE = "Bridge";

// The name of the downloads page, in the menu and in the footer.
const DOWNLOAD = "Download";

// The name of the docs page, in the menu and in the footer.
const DOCS = "Docs";

export type WalletFeatureId = "hold" | "receive" | "send" | "privacy" | "activity" | "node";

// A widget is a small piece of the app beside the drawing of a feature, after the widgets of butter.video: one
// part of a screen, not the whole window. Its values are samples.
export type WalletWidget =
  | { kind: "unlock"; title: string; lead: string; field: string; action: string; note: string }
  | { kind: "receive"; label: string; address: string; actions: readonly [string, string] }
  | {
      kind: "send";
      title: string;
      rows: readonly (readonly [string, string])[];
      /** The hint of the empty password field that each send asks for. */
      password: string;
      actions: readonly [string, string];
    }
  | {
      kind: "privacy";
      /** One part of the ring for each check of the wallet, in their order: lit when the check is clear. */
      ring: readonly boolean[];
      ringLabel: string;
      title: string;
      lead: string;
      checks: readonly { title: string; line: string; clear: boolean }[];
    }
  | {
      kind: "activity";
      title: string;
      rows: readonly { incoming: boolean; title: string; detail: string; amount: string }[];
      unit: string;
    }
  | {
      kind: "node";
      label: string;
      node: string;
      proxy: { label: string; value: string };
      status: string;
      height: string;
      chip: string;
    }
  | {
      kind: "bridge";
      tabs: readonly [string, string];
      from: { label: string; amount: string; unit: string };
      to: { label: string; amount: string; unit: string; chip: string };
    };

export interface WalletFeature {
  id: WalletFeatureId;
  title: string;
  text: string;
  points: readonly string[];
  widget: WalletWidget;
  /** The text alternative of the drawing and its widget together. */
  imageAlt: string;
}

const XMR = "XMR";

export interface BridgeCopy {
  /** The state of the bridge, in the place where a wallet feature shows its number. */
  status: string;
  title: string;
  poweredBy: string;
  text: string;
  points: readonly string[];
  widget: WalletWidget;
  /** The text alternative of the drawing and its widget together. */
  imageAlt: string;
}

// What the wallet does, in plain words, one feature at a time beside a drawing and a widget of the app. The text
// comes from the first site, without the features that the owner holds back, and says only what the release 0.3.1 beta
// of 8 Oct 2026 does. On 8 Oct 2026 the owner asked for the features of the betas: the privacy check and the menu
// Privacy as a feature of their own, the password before each send, the lock after a time without use, and the proxy
// of the node. The words in the widgets are the words of the app, apps/wallet/lib/ui/copy.dart.
const WALLET_FEATURES: readonly WalletFeature[] = [
  {
    id: "hold",
    title: "A wallet that only you hold",
    text: `Your wallet comes from a 25-word seed that never leaves your device. A password guards it, the wallet locks itself after ${APP.idleLockMinutes} minutes without use, and the same 25 words restore it on a new one. No account, no server login.`,
    points: ["Keys on your device", "Password lock", `Locks after ${APP.idleLockMinutes} minutes`, "No account"],
    widget: {
      kind: "unlock",
      title: "Welcome back",
      lead: "Enter your password to open the wallet.",
      field: "Password",
      action: "Unlock",
      note: "25 words, on this device only",
    },
    imageAlt:
      "Ink drawing of a Spartan who carves words into a stone, and the lock screen of Kranox with a password field.",
  },
  {
    id: "receive",
    title: "A new address for every payer",
    text: "Share a fresh subaddress with each payer, as text or as a QR code, so that no two payers can tell that they paid the same wallet.",
    points: ["Fresh subaddress", "QR code", "Copy in one click"],
    // The QR code beside this widget holds a stagenet subaddress of a throwaway wallet, on purpose: a sample on the
    // site must never take real XMR. The text shows the same address.
    widget: {
      kind: "receive",
      label: "Subaddress #4",
      address: "7BNz...4H5h",
      actions: ["Copy address", "New address"],
    },
    imageAlt: "Ink drawing of a scroll with an orange ribbon, and the QR code of a fresh subaddress in Kranox.",
  },
  {
    id: "send",
    title: "See the fee before you send",
    text: "Kranox checks the address and the amount, then shows the network fee and the total. Nothing leaves without your password, and after the send you keep the transaction id.",
    points: ["Address check", "Fee first", "Password to send", "Transaction id"],
    widget: {
      kind: "send",
      title: "Check the payment",
      rows: [
        ["Amount", `25.0 ${XMR}`],
        ["Network fee", `0.0000312 ${XMR}`],
        ["Total", `25.0000312 ${XMR}`],
      ],
      password: "Your password, to send",
      actions: ["Send now", "Cancel"],
    },
    imageAlt:
      "Ink drawing of a Spartan who throws a spear, and the review of a payment of 25 XMR with its network fee and the password field.",
  },
  {
    id: "privacy",
    title: "See what your wallet gives away",
    text: "Before a payment leaves, Kranox checks its amount, its timing, and its address against your own history, and suggests a new amount in one click. The Privacy menu checks your whole wallet, and your addresses on Robinhood Chain.",
    points: ["Amount, timing, address", "New amount in one click", "Whole-wallet checks", "Robinhood Chain scan"],
    // The summary of the menu Privacy with sample data, as in the app: six checks of the wallet in their order, node,
    // subaddresses, swaps, refund addresses, new XMR, and the lock, of which the swaps and the refund addresses are not
    // clear. The title counts those two, and the widget shows their tiles.
    widget: {
      kind: "privacy",
      ring: [true, true, false, false, true, true],
      ringLabel: "Clear",
      title: "2 things to improve",
      lead: "Click a check to see what it found and what you can do.",
      checks: [
        { title: "Swaps with Robinhood Chain", line: "1 pair can be matched", clear: false },
        { title: "Refund addresses", line: "1 address links both sides", clear: false },
      ],
    },
    imageAlt:
      "Ink drawing of a round shield with the M of Monero over a spear, and the Privacy menu of Kranox: four of six checks clear, and two things to improve.",
  },
  {
    id: "activity",
    title: "Every payment, in order",
    text: "Your activity lists every payment, the newest first, with its confirmations, its fee, and the subaddress that received it.",
    points: ["Confirmations", "Fees", "Subaddress labels"],
    widget: {
      kind: "activity",
      title: "Recent activity",
      rows: [
        { incoming: true, title: "Received", detail: "Today, 4 confirmations", amount: "+11.5000" },
        { incoming: false, title: "Sent", detail: `Today, fee 0.0000312 ${XMR}`, amount: "-2.7500" },
        { incoming: true, title: "Received", detail: "3 Oct, 780 confirmations", amount: "+120.0000" },
      ],
      unit: XMR,
    },
    imageAlt:
      "Ink drawing of a column of hoplites that marches through a pass, and three payments in the activity of Kranox.",
  },
  {
    id: "node",
    title: "Your own node",
    text: "Kranox talks to the node that you choose. Run your own for the most privacy, or pick one that you trust. A proxy such as Tor keeps your IP address from the node, and you can change both at any time.",
    points: ["Your own node", "Any node you trust", "Tor or another proxy", "Live sync"],
    // The default node of mainnet, and the height of mainnet. CHECKED 5 Oct 2026, source get_info of that node:
    // 3,777,437. The proxy is the one of Tor on the same Mac, as Settings shows it.
    widget: {
      kind: "node",
      label: "Node address",
      node: APP.defaultNode,
      proxy: { label: "Proxy, such as Tor (optional)", value: APP.torProxy },
      status: "Synced",
      height: "3,777,437",
      chip: "Node online",
    },
    imageAlt:
      "Ink drawing of a Spartan on watch beside a beacon at night, and the node, the proxy, and the sync of Kranox.",
  },
];

// The bridge, after the wallet, in the layout of the swap of Vizor: a title with "Powered by" and the logo of the
// exchanger, a short text, and its points. On 5 Oct 2026 the owner asked for it with ChangeNOW, in the look of the
// site, and confirmed the two directions: pay takes value out of XMR, receive brings it into XMR. The release 0.1.0
// receives: ETH or USDG on Robinhood Chain into XMR, on the receive page of the app. The release 0.2.0 of 6 Oct 2026
// pays too: XMR into ETH or USDG for any address there, on the send page, at a fixed or a floating rate. The text
// names no rate and no fee, because both change with the market.
const BRIDGE_COPY: BridgeCopy = {
  status: "Live",
  title: BRIDGE,
  poweredBy: "Powered by",
  text: `Pay any Robinhood Chain address in ETH or USDG straight from your ${XMR}, or send ETH or USDG from Robinhood Chain and get ${XMR} in your wallet. ${EXCHANGER.label} handles the exchange.`,
  points: [
    "Pay out of XMR",
    "Receive into XMR",
    "ETH and USDG",
    "Fixed or floating rate",
    "Check the recipient first",
    "Track every step",
  ],
  // A sample swap into XMR, as the receive page of the app makes it: each swap pays into a new subaddress. The amount
  // that comes in follows the prices of 5 Oct 2026 (CoinGecko: XMR 547.88 USD, ETH 2,727.50 USD), before the fee of
  // the exchanger.
  widget: {
    kind: "bridge",
    tabs: ["Receive", "Pay"],
    from: { label: "You send", amount: "0.05", unit: "ETH" },
    to: { label: "You get", amount: "≈ 0.2489", unit: XMR, chip: "New subaddress" },
  },
  imageAlt:
    "Ink drawing of a Spartan who crosses a stone bridge over a gorge, and the bridge in Kranox: 0.05 ETH sent from Robinhood Chain for about 0.2489 XMR.",
};

// The sections of the page, in the card of the menu.
const SECTIONS: readonly NavItem[] = [
  { label: "Home", section: "top" },
  { label: WALLET, section: "wallet" },
  { label: BRIDGE, section: "bridge" },
  { label: "FAQ", section: "faq" },
];

// The questions follow the doubts of a reader, the most common one first. They come from the first site, without
// the features that the owner holds back, and with the state of the release 0.3.1 beta of 8 Oct 2026. What comes next
// names only the parts that the docs already name; it changes with the main release.
const FAQ_ITEMS = [
  {
    question: "Can I use Kranox today?",
    answer: `Yes, on a Mac. Version ${RELEASE.name} is out and runs on the Monero mainnet with real XMR. It's ${RELEASE_STAGE}, so start with a small amount.`,
  },
  {
    question: "Who holds my keys?",
    answer:
      "You do. Your seed and your keys stay on your device, locked with your password. Kranox has no account and no server login, so Kranox Labs cannot see your keys, move your coins, or restore your wallet.",
  },
  {
    question: "Does the privacy check send my data anywhere?",
    answer:
      "No. The check before each payment and the Monero checks of the Privacy menu run on your Mac. Only a scan of a Robinhood Chain address leaves it, through our relay, so the explorer never sees your IP address.",
  },
  {
    question: "Does Kranox write its own cryptography?",
    answer: "No. Kranox uses the wallet code of the Monero project for keys, addresses, and transactions.",
  },
  {
    question: "Is the code public?",
    answer: "Yes. The code of the app is on GitHub, so anyone can read it and build it.",
  },
  {
    question: "What comes next?",
    answer: `The main release comes once the beta has run with real coins for a while, and after it Touch ID to unlock and pay by name. Each part ships when it is solid, so follow ${X_HANDLE} on X to watch the build.`,
  },
  {
    question: "Is Kranox part of the Monero project?",
    answer: "No. Kranox is independent, and the Monero project does not endorse it.",
  },
] satisfies FaqItem[];

export const COPY = {
  meta: {
    title: SITE_NAME,
    description: `${SITE_NAME} is a self-custodial Monero wallet. Version ${RELEASE.name} is out for the Mac.`,
    socialImageAlt:
      "Ink drawing of a Spartan hoplite who stands on a ridge in front of an orange sun. Arrows fill the sky. The shield carries the M of the Monero symbol.",
  },
  menu: {
    label: "Main",
    homeLabel: `${SITE_NAME} home`,
    toggle: "Menu",
    sections: SECTIONS,
    // The main action opens the downloads page. On 5 Oct 2026 the owner asked for it in place of "Follow the
    // build", and for no second link to the downloads in the card; X stays in the card as an icon.
    cta: DOWNLOAD,
    // The docs page, after the sections of the home page. The owner asked for it on 5 Oct 2026.
    docs: DOCS,
  },
  // The hero of the first site. The owner asked for it again on 3 Oct 2026.
  // The lead speaks in a picture, like the hero of Vizor: on 3 Oct 2026 the owner chose to hold some cards of the
  // plan and to show them later, so the lead names no feature. It calls back the story that the title comes from
  // (Herodotus, Histories 7.226): told that the Persian arrows would hide the sun, Dienekes answered that they
  // would then fight in the shade. The arrows stand for the eyes that follow each payment on a public chain.
  // On 4 Oct 2026 the owner removed the label "Building in public" and the two buttons from the hero.
  hero: {
    titleLines: ["Fight in", "the shade"],
    lead: "Let their arrows blot out the sun. Your Monero moves in the shade.",
    figureAlt: "A marble bust of a hoplite with a Corinthian helmet and a tall crest.",
  },
  // On 4 Oct 2026 the owner asked for words on privacy on Monero here, with no label above them. A link to the
  // docs stood below them until 5 Oct 2026, when the owner removed it. The words speak in the picture of a battle
  // line and name no feature of Kranox. Monero hides the sender of each payment among other outputs with ring signatures, the receiver
  // with a one-time address, and the amount with confidential transactions.
  prologue: {
    heading: PRIVACY,
    statement:
      "On a public chain, every payment stands alone in the open. Monero holds the line. Each payment hides among others: no sender, no receiver, no amount in sight.",
    // The owner asked on 4 Oct 2026 for the desktop app below the statement, without the phone, and then for no
    // caption below it, and later for the picture of the real app with a large balance and activity. From 8 Oct 2026
    // the picture shows the release 0.3.1 beta on mainnet. The alternative text says that the data are samples.
    app: {
      alt: "The home screen of Kranox for Mac with sample data: the balance with its locked part, the coins that are unlocking, the receive address, and the recent activity, over a drawing of a Spartan treasury.",
    },
  },
  // The title answers the hero: the watchers keep the sun, and the user keeps the shade, with keys that never
  // leave the device.
  sunrise: {
    label: "Self-custody",
    title: "They own the sun. You own the shade.",
    // The owner asked on 4 Oct 2026 for a sign that the page goes on while the view moves into the sun.
    hint: "Keep scrolling",
  },
  // The owner asked on 4 Oct 2026 to fill the light ground after the sunrise with the wallet itself, in plain
  // words rather than metaphor, from the text of the first site, feature by feature over the scene.
  wallet: {
    features: WALLET_FEATURES,
    bridge: BRIDGE_COPY,
  },
  faq: {
    heading: "Questions and answers",
    letters: ["F", "A", "Q"],
    notes: ["Straight answers", "No fine print"],
    items: FAQ_ITEMS,
  },
  // The owner chose this footer on 5 Oct 2026 from three previews: columns of links over the trophy, and a last
  // row with the copyright and the legal links, without the big handle and address and without a note.
  footer: {
    siteLabel: SITE_NAME,
    sections: SECTIONS.filter((item) => item.section !== "top"),
    download: DOWNLOAD,
    docs: DOCS,
    followLabel: "Follow",
    statusLabel: "Status",
    status: "Building in public",
    copyright: ORGANIZATION_NAME,
  },
} as const;
