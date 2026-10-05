// The downloads page: its text, the platforms, and the current release. site.ts holds its address and the
// repository. The owner asked for the page on 5 Oct 2026, after the structure of getmonero.org/downloads: a choice of
// download, a group for each kind of device with its files, a part on how to verify a file, the source code, and
// help. copy.ts holds the text of the home page and of the shared parts.
// On 5 Oct 2026 no release exists: the app runs on stagenet on the machine of the owner only. So every platform
// waits, the page says so, and it shows no hash. When a release ships, fill RELEASE and the file of each platform
// that has one; the page then shows the buttons and the hashes. The page names no feature that the owner holds back.
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
}

export interface Release {
  version: string;
  notesHref: string;
  /** The signed list of the hashes of every file of the release. */
  hashesHref: string;
}

/** The current release, or null before the first one. */
export const RELEASE: Release | null = null;

// The macOS build joins the arm64 and the x86_64 build of the Monero library into one file (apps/wallet/tool/
// fetch_monero_c.sh), so it runs on both kinds of Mac. The other builds do not exist, so the page names no machine.
export const PLATFORMS: readonly Platform[] = [
  {
    id: "macos",
    group: "desktop",
    name: "macOS",
    detail: "Apple silicon and Intel",
    plan: "first",
    shown: true,
    file: null,
  },
  { id: "windows", group: "desktop", name: "Windows", detail: null, plan: "next", shown: false, file: null },
  { id: "linux", group: "desktop", name: "Linux", detail: null, plan: "next", shown: false, file: null },
  { id: "ios", group: "mobile", name: "iOS", detail: null, plan: "later", shown: false, file: null },
  { id: "android", group: "mobile", name: "Android", detail: null, plan: "later", shown: false, file: null },
];

/** The platforms that the page shows. */
export const SHOWN_PLATFORMS = PLATFORMS.filter((platform) => platform.shown);

/** Whether the page shows a group: only a group with a platform to show. */
export function isGroupShown(group: DeviceGroupId): boolean {
  return SHOWN_PLATFORMS.some((platform) => platform.group === group);
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

// A file needs a release to belong to, a hash that a reader can check, and a platform that the page shows. The build
// stops on a fault in this list.
for (const platform of PLATFORMS) {
  if (platform.file === null) continue;
  if (!platform.shown) {
    throw new Error(`The platform ${platform.id} has a file, but the page does not show it.`);
  }
  if (RELEASE === null) {
    throw new Error(`The platform ${platform.id} has a file, but RELEASE is null.`);
  }
  if (!SHA256_PATTERN.test(platform.file.sha256)) {
    throw new Error(`The SHA-256 hash of the file for ${platform.id} must be 64 lowercase hex digits.`);
  }
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
    text: "The first build is for the Mac. Your wallet lives on your own computer and talks to a Monero node you choose, so your seed and your keys never leave the device.",
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
    description: `Get the ${SITE_NAME} wallet for Mac. The first release is still in the works, and the code is already on GitHub.`,
  },
  label: "First release coming",
  title: "Download",
  lead: `${SITE_NAME} is a private Monero wallet where only you hold the keys. The first release is still in the works, so there is nothing to install yet. When it's ready, you'll download it right here. The code is already public on GitHub.`,
  choice: {
    heading: "Choose your download",
    source: { label: "Source code", summary: "Public on GitHub" },
  },
  groups: DEVICE_GROUPS,
  // What the app on 5 Oct 2026 does, in short points. The home page tells each one in full.
  desktopPoints: [
    "A 25-word seed that stays on your device",
    "A password lock",
    "Send and receive with subaddresses",
    "Every payment in one list",
    "Your own node, if you run one",
  ],
  desktopPicture: {
    alt: "The Kranox desktop app in development, with sample data: the home screen with the balance, the buttons Send and Receive, the receive address, and the recent activity.",
  },
  files: {
    heading: "Downloads",
    versionLabel: "Current version",
    notes: "Release notes",
    noRelease: "No release yet. The first one is on its way.",
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
      "Every release will come with a SHA-256 hash for each file and a signed list of those hashes. Before you open the app, check that the hash of your file matches the list.",
      "A file that does not match may have been changed by someone else, and it could cost you your funds. Download Kranox from this site or from our GitHub repository, nowhere else.",
    ],
    commandsLabel: "Print the hash of a file",
    hashesLabel: "SHA-256 hashes",
    signedList: "Signed list of hashes",
    noHashes: "The hashes show up here with the first release.",
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
