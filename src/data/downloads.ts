// The downloads page: its text, the platforms, and the current release. site.ts holds its address and the
// repository. The owner asked for the page on 5 Oct 2026, after the structure of getmonero.org/downloads: a choice of
// download, a group for each kind of device with its files, a part on how to verify a file, the source code, and
// help. copy.ts holds the text of the home page and of the shared parts.
// On 5 Oct 2026 the first release came out: Kranox 0.1.0 for macOS, on GitHub, with a list of the hashes of its files
// that the release key signs. RELEASE names it, and the file of macOS belongs to it. A new release changes RELEASE and
// the file of each platform that has one. The page names no feature that the owner holds back.
// The same day the owner held back every platform but macOS: the page shows a platform only when its value "shown"
// is true, and a group only when it has a platform to show.
import { REPOSITORY, SITE_NAME, SOCIAL_LINKS, X_HANDLE } from "./site.ts";

/** The anchors of the parts of the page. The choice at the top links to the groups and to the source code. */
export const DOWNLOADS_SECTION_IDS = {
  desktop: "desktop",
  mobile: "mobile",
  verify: "verify",
  source: "source",
  help: "help",
} as const;

export type DeviceGroupId = "desktop" | "mobile";

export type PlatformId = "macos" | "windows" | "linux" | "ios" | "android";

/** When a platform gets its first build. The owner set the order on 3 Oct 2026: the desktop first, macOS first of all. */
export type PlatformPlan = "first" | "next" | "later";

export interface ReleaseFile {
  href: string;
  /** The SHA-256 hash of the file, as 64 hex digits. */
  sha256: string;
}

export interface Platform {
  id: PlatformId;
  group: DeviceGroupId;
  name: string;
  /** The machines that the build runs on, when the build fixes them. */
  detail: string | null;
  plan: PlatformPlan;
  /** Whether the page shows the platform. A held platform stays in this list, ready to show. */
  shown: boolean;
  /** The file of the current release, or null while the platform has none. */
  file: ReleaseFile | null;
  /** How to install the file and open the app the first time, below the tiles, for a platform with a file. */
  install: string | null;
}

export interface Release {
  version: string;
  /** The day of the release, as the pages write a date. */
  published: string;
  notesHref: string;
  /** The name of the signed list of the hashes of every file of the release, and its address. */
  hashesFile: string;
  hashesHref: string;
  /** The name of the public part of the release key, its address, and its fingerprint in groups of four. */
  keyFile: string;
  keyHref: string;
  keyFingerprint: string;
}

// The release of 5 Oct 2026 on GitHub: the tag v0.1.0 at the commit 3b3918d of Kranox-Labs/Kranox. CHECKED 5 Oct 2026,
// source the GitHub API: the release is public and the latest, and its three files verify; the key is the release key
// of apps/wallet/tool/release/kranox-release-key.asc.
const RELEASE_VERSION = "0.1.0";
const RELEASE_PAGE = `${REPOSITORY.code.href}/releases/tag/v${RELEASE_VERSION}`;
const RELEASE_FILES = `${REPOSITORY.code.href}/releases/download/v${RELEASE_VERSION}`;
const HASHES_FILE = "hashes.txt";
const KEY_FILE = "kranox-release-key.asc";

/** The current release. */
export const RELEASE: Release = {
  version: RELEASE_VERSION,
  published: "5 October 2026",
  notesHref: RELEASE_PAGE,
  hashesFile: HASHES_FILE,
  hashesHref: `${RELEASE_FILES}/${HASHES_FILE}`,
  keyFile: KEY_FILE,
  keyHref: `${RELEASE_FILES}/${KEY_FILE}`,
  keyFingerprint: "A874 6F51 F58D 8E30 C23B 8158 439F 7602 F0C5 53D1",
};

// The macOS build joins the arm64 and the x86_64 build of the Monero library into one file (apps/wallet/tool/
// fetch_monero_c.sh), so it runs on both kinds of Mac, from macOS 12 (LSMinimumSystemVersion of the build). The other
// builds do not exist, so the page names no machine for them. Apple has not notarized the app, so macOS blocks its
// first start: CHECKED 5 Oct 2026, spctl rejects the build, which carries an ad hoc signature.
export const PLATFORMS: readonly Platform[] = [
  {
    id: "macos",
    group: "desktop",
    name: "macOS",
    detail: "Apple silicon and Intel, macOS 12 or later",
    plan: "first",
    shown: true,
    file: {
      href: `${RELEASE_FILES}/Kranox-${RELEASE_VERSION}-macos.dmg`,
      sha256: "12fad08612940c30791f57ab24c2f84acf872bd067573c57d4beebc83dce58f3",
    },
    install:
      "Open the disk image and drag Kranox into Applications. Apple hasn't notarized the app yet, so macOS blocks it the first time you open it. Go to System Settings › Privacy & Security and click Open Anyway next to the message about Kranox.",
  },
  {
    id: "windows",
    group: "desktop",
    name: "Windows",
    detail: null,
    plan: "next",
    shown: false,
    file: null,
    install: null,
  },
  { id: "linux", group: "desktop", name: "Linux", detail: null, plan: "next", shown: false, file: null, install: null },
  { id: "ios", group: "mobile", name: "iOS", detail: null, plan: "later", shown: false, file: null, install: null },
  {
    id: "android",
    group: "mobile",
    name: "Android",
    detail: null,
    plan: "later",
    shown: false,
    file: null,
    install: null,
  },
];

/** The platforms that the page shows. */
export const SHOWN_PLATFORMS = PLATFORMS.filter((platform) => platform.shown);

/** Whether the page shows a group: only a group with a platform to show. */
export function isGroupShown(group: DeviceGroupId): boolean {
  return SHOWN_PLATFORMS.some((platform) => platform.group === group);
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const FINGERPRINT_PATTERN = /^[0-9A-F]{4}( [0-9A-F]{4}){9}$/;

// A file needs a hash that a reader can check and a platform that the page shows, and the key needs a fingerprint that
// a reader can compare. The build stops on a fault in this list.
for (const platform of PLATFORMS) {
  if (platform.file === null) continue;
  if (!platform.shown) {
    throw new Error(`The platform ${platform.id} has a file, but the page does not show it.`);
  }
  if (!SHA256_PATTERN.test(platform.file.sha256)) {
    throw new Error(`The SHA-256 hash of the file for ${platform.id} must be 64 lowercase hex digits.`);
  }
}
if (!FINGERPRINT_PATTERN.test(RELEASE.keyFingerprint)) {
  throw new Error("The fingerprint of the release key must be 40 capital hex digits in ten groups of four.");
}

/** The commands that print the SHA-256 hash of a file, for each desktop platform. The page lists the shown ones. */
const HASH_COMMANDS: readonly { platform: PlatformId; command: string }[] = [
  { platform: "macos", command: "shasum -a 256 <file>" },
  { platform: "linux", command: "sha256sum <file>" },
  { platform: "windows", command: "certutil -hashfile <file> SHA256" },
];

export const SHOWN_HASH_COMMANDS = HASH_COMMANDS.flatMap(({ platform, command }) => {
  const shown = SHOWN_PLATFORMS.find(({ id }) => id === platform);
  return shown === undefined ? [] : [{ system: shown.name, command }];
});

/** The commands of GnuPG that check the signed list with the release key, in the folder of the downloaded files. */
export const SIGNATURE_COMMANDS: readonly { step: string; command: string }[] = [
  { step: "Import the key", command: `gpg --import ${RELEASE.keyFile}` },
  { step: "Check the list", command: `gpg --verify ${RELEASE.hashesFile}` },
];

export interface DeviceGroup {
  id: DeviceGroupId;
  /** The name of the group on its card in the choice at the top. */
  label: string;
  /** The platforms of the group, in one line, on its card. */
  summary: string;
  title: string;
  text: string;
}

const DEVICE_GROUPS = {
  // While the owner holds the other desktop platforms back, the group speaks of the Mac only.
  desktop: {
    id: "desktop",
    label: "Mac",
    summary: "Apple silicon and Intel",
    title: `${SITE_NAME} for Mac`,
    text: "The first release is for the Mac. Your wallet lives on your own computer and talks to a Monero node you choose, so your seed and your keys never leave the device.",
  },
  mobile: {
    id: "mobile",
    label: "Mobile",
    summary: "iOS and Android",
    title: `${SITE_NAME} for mobile`,
    text: "Phones come after the desktop. It's the same app built from the same code, so it works the same way in your pocket.",
  },
} as const satisfies { [Id in DeviceGroupId]: DeviceGroup & { id: Id } };

export const DOWNLOADS_COPY = {
  meta: {
    title: `Download ${SITE_NAME}`,
    description: `Download ${SITE_NAME} ${RELEASE.version} for Mac, a private Monero wallet where only you hold the keys. Every file comes with its hash and a signed list.`,
  },
  label: `Version ${RELEASE.version} is out`,
  title: "Download",
  lead: `${SITE_NAME} is a private Monero wallet where only you hold the keys. Version ${RELEASE.version} is out for the Mac, and it runs on the Monero mainnet with real XMR. It's early software, so start with a small amount. The code is public on GitHub.`,
  choice: {
    heading: "Choose your download",
    source: { label: "Source code", summary: "Public on GitHub" },
  },
  groups: DEVICE_GROUPS,
  // What the release 0.1.0 does, in short points. The home page tells each one in full.
  desktopPoints: [
    "A 25-word seed that stays on your device",
    "A password lock",
    "Send and receive with subaddresses",
    "XMR from ETH or USDG on Robinhood Chain",
    "Every payment in one list",
    "Your own node, if you run one",
  ],
  desktopPicture: {
    alt: "The home screen of Kranox for Mac with sample data: the balance with its locked part, the coins that are unlocking, the receive address, and the recent activity.",
  },
  files: {
    heading: "Downloads",
    versionLabel: "Current version",
    notes: "Release notes",
    download: "Download",
    plans: {
      first: "Coming soon",
      next: "Coming next",
      later: "Later",
    } satisfies Record<PlatformPlan, string>,
    source: "Source code",
  },
  verify: {
    heading: "Verify your download",
    paragraphs: [
      "Every release comes with a SHA-256 hash for each file and a list of those hashes, signed with the release key of Kranox Labs. Before you open the app, check that the hash of your file matches the list, and that the list carries a good signature from the key.",
      "A file that does not match may have been changed by someone else, and it could cost you your funds. Download Kranox from this site or from our GitHub repository, nowhere else.",
    ],
    commandsLabel: "Print the hash of a file",
    hashesLabel: "SHA-256 hashes",
    signedList: "Signed list of hashes",
    signatureLabel: "Check the signature",
    fingerprintLabel: "Key fingerprint",
    key: "Release key",
  },
  source: {
    heading: "Source code",
    text: "The code of the app is public on GitHub, so anyone can read what it does with your keys before trusting it with a coin.",
    link: REPOSITORY.code,
  },
  help: {
    heading: "Help and support",
    text: `Something not working, or a question about the app? Open an issue on GitHub, or find us on X at ${X_HANDLE}.`,
    warning: "Nobody from Kranox Labs will ever ask for your seed. Anyone who does is after your coins.",
    links: [REPOSITORY.issues, { label: X_HANDLE, href: SOCIAL_LINKS.x.href }],
  },
} as const;
