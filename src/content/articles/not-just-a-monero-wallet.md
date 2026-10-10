---
title: Kranox is not just a Monero wallet
lead: A Monero wallet keeps your XMR private. Kranox goes further and watches every step where your XMR meets Robinhood Chain, with Bunker mode and more on the way.
published: 2026-10-09
cover: harbor
coverAlt: Engraving of a harbor at dawn. A Spartan hoplite hands a sealed pouch to a ferryman in a small boat, a city waits on the far shore, and a laptop on a crate shows the Kranox helmet.
draft: false
---

Every address on Robinhood Chain is an open book. Paste one into an explorer and you'll see its balance, every trade it made, who funded it first, and the hours its owner is usually online. Pay someone from that address, and they can read all of it too.

Monero is the opposite. Every payment hides the sender, the receiver, and the amount, by default. Good Monero wallets, from the official one to Cake Wallet and Feather, keep your XMR private and do it well.

Kranox starts there, as a self-custodial Monero wallet. Your seed and your keys stay on your Mac, there's no account, and we never hold your coins. Then it goes further, because the easiest place to lose that privacy is where your XMR meets a public chain.

## Your money stays in XMR

Kranox keeps no Robinhood Chain account. Your money stays in XMR, and the chain only ever sees a payment.

- Pay any Robinhood Chain address in ETH or USDG, straight from your XMR. The recipient sees a transfer from ChangeNOW, the exchanger behind the swap, and not from your wallet.
- Receive ETH or USDG from Robinhood Chain, and it arrives as XMR in a new subaddress.
- Need a clean address? Pay a fresh one of your own from XMR, and it starts out with no on-chain link to the rest.

## A privacy check before every payment

On Monero, what gives people away is rarely the math. It's habits: paying out the same amount that just came in, spending coins minutes after a swap, or paying an address you once gave as a refund address.

So before a payment leaves, Kranox checks its amount, its timing, and its address against your own history. When your amount matches one that came in, it offers a new one in one click. The check only advises, and you can always send.

The Privacy menu runs the same kind of check on your whole wallet. And the scan shows you what everyone else can see on Robinhood Chain: paste an address of yours, and Kranox reads who funded it first, which of your other addresses it touched, the look-alike senders that hope you copy the wrong address, and the busy hours that hint at your time zone.

On 9 October 2026 we found no other Monero wallet that checks a payment to Robinhood Chain like this, or scans an address there for what it gives away.

## Bunker mode is on its way

On 7 October 2026, Justin Drake of the Ethereum Foundation asked the industry to "calmly begin planning" for [bunker mode](https://x.com/drakefjustin/status/2107837081313505768). The idea is to keep funds in fresh addresses that have never signed anything, so their public keys stay hidden behind a hash, in case AI-assisted math breaks the signatures of Ethereum one day. No such break has been shown, and bunker mode is a way to prepare for one.

The catch is that a direct move from an old address to a new one links the two in public, for good. Bunker mode in Kranox will take the private way. Your old address sends into XMR, Kranox later pays a fresh address from XMR, and the fresh address gets its first coins from ChangeNOW, with no on-chain link to the old one. Kranox will check whether an address has ever signed, and the privacy check will keep the two legs apart in time and amount. It starts with ETH and USDG.

Monero runs on elliptic curves too, so XMR is the private path for the move, not a vault against AI.

## More on the way

Bunker mode won't be the last tool. Next to ChangeNOW, we're adding more exchangers, so your swaps aren't tied to a single route. And we keep building features for people who use Robinhood Chain and want to stay private while they do.

The main release comes once the beta has run with real coins for a while, and after it Touch ID to unlock and pay by name.

## Where Kranox stands today

- Kranox is in beta and runs on the Mac. It uses the Monero mainnet with real XMR, so start with a small amount.
- ChangeNOW sees each swap, with its amount, its time, and both of its addresses. It never sees your keys, and Kranox reaches it through a relay that keeps no record of a swap.
- Kranox uses the wallet code of the Monero project for keys, addresses, and transactions. It doesn't write its own cryptography.
- The code is public on GitHub, along with the reports of two security reviews, and [the docs](/docs) explain every feature in detail.
