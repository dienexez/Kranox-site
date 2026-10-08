// The one place that names which brand files the site shows.
// To change an image, change its import here.
import banner from "@brand/banner/concepts/pass-center-symbol--openai-gpt-5.4-image-2--20261002T145931--on-white.png";
import iconRound from "@brand/logo/kranox-icon-round.png";
import iconRoundVector from "@brand/logo/kranox-icon-round.svg";
import iconSquare from "@brand/logo/kranox-icon-square.png";
import logo from "@brand/logo/kranox-logo-small.svg";
import heroFigure from "@brand/site/hero-figure.png";
// The home screen of the desktop app, drawn by apps/wallet/integration_test/showcase_test.dart from the screens of
// the app with sample data: a large balance and recent activity. It shows the wallet pages only, so the held
// features stay out of it. From 8 Oct 2026 it shows the release 0.3.1 beta, with Privacy in the sidebar. The earlier
// picture from the mock stays in brand/site/app-desktop-wallet.png.
import appDesktopWallet from "@brand/site/app-wallet-home.png";
// The ink drawings of the wallet features beside the sunrise, from the first site, and the QR code of the receive
// widget, which the showcase test draws for the sample subaddress.
import featureBridge from "@brand/site/concepts/bridge--openai-gpt-5.4-image-2--20261005T060154--on-white.png";
import featureNode from "@brand/site/concepts/node--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
import featureScroll from "@brand/site/concepts/scroll--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
import featureSeed from "@brand/site/concepts/seed--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
import featureSend from "@brand/site/concepts/send--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
// The shield with the M of Monero, from the same set, for the privacy check. It joined the features on 8 Oct 2026.
import featureShield from "@brand/site/concepts/shield--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
import featureSync from "@brand/site/concepts/sync--openai-gpt-5.4-image-2--20261002T153738--on-white.png";
import widgetReceiveQr from "@brand/site/widget-receive-qr.png";
// The horizontal logo of ChangeNOW, unchanged from the logo pack of changenow.io/press (/files/ChangeNOW.zip, 5 Oct
// 2026). Its rules: the logo is always green and white, never monochrome, so it shows on dark ground.
import changenowLogo from "@brand/site/changenow-logo-horizontal.svg";
import toneOlive from "@brand/site/concepts/tone-olive--openai-gpt-5.4-image-2--20261003T095558.png";
import tonePass from "@brand/site/concepts/tone-pass--openai-gpt-5.4-image-2--20261003T095558.png";
import tonePhalanx from "@brand/site/concepts/tone-phalanx--openai-gpt-5.4-image-2--20261003T095558.png";
import toneSentinel from "@brand/site/concepts/tone-sentinel--openai-gpt-5.4-image-2--20261003T095558.png";
import toneTemple from "@brand/site/concepts/tone-temple--openai-gpt-5.4-image-2--20261003T095558.png";
import toneTrophy from "@brand/site/concepts/tone-trophy--openai-gpt-5.4-image-2--20261003T095558.png";

export const IMAGES = {
  banner,
  iconRound,
  iconRoundVector,
  iconSquare,
  logo,
  heroFigure,
  appDesktopWallet,
  changenowLogo,
  featureBridge,
  featureNode,
  featureScroll,
  featureSeed,
  featureSend,
  featureShield,
  featureSync,
  widgetReceiveQr,
  toneOlive,
  tonePass,
  tonePhalanx,
  toneSentinel,
  toneTemple,
  toneTrophy,
} as const;
