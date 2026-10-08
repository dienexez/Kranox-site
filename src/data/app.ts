// The facts of the app that the pages name, so that each has one place: docs.ts and copy.ts read them from here. A new
// release of the app checks them again.

// Values of the app, apps/wallet/lib/config/app_config.dart and lib/ui/copy.dart, in the release 0.3.1 beta of 8 Oct
// 2026.
export const APP = {
  /** AppConfig.defaultNode: the node of a new wallet on mainnet. */
  defaultNode: "xmr-node.cakewallet.com:18081",
  /** AppConfig.minPasswordLength. */
  minPasswordLength: 8,
  /** AppConfig.idleLockAfter, in minutes: the wallet locks after this long without use. */
  idleLockMinutes: 10,
  /** AppConfig.autoRefreshInterval, in seconds. */
  refreshSeconds: 20,
  /** AppConfig.decoyCount. */
  decoys: 15,
  /** AppConfig.recentActivityCount. */
  recentCount: 5,
  /** AppConfig.maxNetworkFee, 10,000,000,000 piconero, in XMR: a payment with a higher network fee stops before its review. */
  maxNetworkFee: "0.01",
  /** AppConfig.privacyAmountWindow, in days: the privacy check compares an amount with what came in over this time. */
  privacyAmountDays: 3,
  /** AppConfig.privacyFreshWindow, in hours: XMR that came in less than this long ago counts as new. */
  privacyFreshHours: 24,
  /** AppConfig.bridgeStatusInterval, in seconds: how often the app asks for the state of an open swap. */
  swapCheckSeconds: 15,
  /** AppConfig.exchangerXmrConfirmations: the confirmations of Monero after which ChangeNOW takes in the XMR, about. */
  exchangerConfirmations: 6,
  /** Copy.proxyHint: the proxy of Tor on the same Mac. */
  torProxy: "127.0.0.1:9050",
  /** The proxy of Tor Browser while it runs, from the release notes of 0.3.1. */
  torBrowserProxy: "127.0.0.1:9150",
} as const;

// Values of Monero. CHECKED 5 Oct 2026, source cryptonote_config.h on the branch master of monero-project/monero:
// CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE, DIFFICULTY_TARGET_V2, CRYPTONOTE_DISPLAY_DECIMAL_POINT, and the RPC ports. The
// first characters of the addresses follow from their prefixes, 18 and 42 on mainnet, 24 and 36 on stagenet, and 53
// and 63 on testnet, checked with the base58 of Monero on the same date: a testnet address starts with 9 or, about
// one time in five, with A.
export const MONERO = {
  unlockBlocks: 10,
  blockMinutes: 2,
  decimals: 12,
  mainnetPort: 18081,
  stagenetPort: 38081,
  testnetPort: 28081,
} as const;
