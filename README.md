# Quit Gambling

You're not going to win. You know that. You're still going to chase it.

This app lets you chase it without losing your rent.

## What this is

A fake casino. Baccarat, Blackjack, slots. Real rules, real house edge, fake money. You grind a dead-end job to earn chips, then you sit down at a table and watch them disappear — exactly like real life, except at the end of the night your bank account is still intact.

There's a **Loss Tracker** stuck to the screen the whole time. It doesn't reset. It doesn't lie to you. Every number you've ever pissed away in this app is sitting right there, staring back.

That's the whole point.

## Why bother playing a casino that isn't real

Because the urge is real. If you're reading this you already know the feeling — the itch, the "just one more hand," the certainty that this time is different. Quitting cold doesn't work for a lot of people. White-knuckling it doesn't work. Telling yourself you'll stop doesn't work.

What sometimes works: going through the motions with nothing on the line, and watching yourself lose anyway. Over and over. Until the part of your brain that swears you're due finally shuts up.

Use this instead of the real thing. Lose here so you don't lose there.

## What's inside

- **Baccarat table** — the same rules as the casino you were about to drive to
- **Blackjack table** — same
- **Slot machine** — same odds logic, same dopamine, zero withdrawal
- **A job** — you "work" at a station to earn chips. It's boring. That's on purpose. That's what your money costs in the real world too.
- **Mystery box** — you start with whatever it gives you. No top-ups. No "just one more deposit."
- **Loss Tracker** — the total you've lost. Always visible. Never goes down.
- **An account** — log in, come back tomorrow, your losses are still there waiting for you. Good.

## Running it

You need Node.js installed. That's it.

```bash
npm install
npm run dev:all
```

Open the link it prints. Make an account. Open the mystery box. Try to beat the house.

You won't.

## If you actually need help

This app is a harm-reduction toy, not treatment. If gambling has its hands around your throat, talk to someone who can actually help:

- **US:** National Problem Gambling Helpline — **1-800-GAMBLER** (1-800-426-2537), 24/7
- **UK:** GamCare — **0808 8020 133**
- **Australia:** Gambling Help Online — **1800 858 858**
- **Singapore:** National Problem Gambling Helpline — **1800-6-668-668**
- **Malaysia / elsewhere:** search "problem gambling helpline" + your country

Calling is free. They've heard worse than whatever you're about to say.

## For developers

Stack: React + TypeScript + Vite on the frontend, Express + SQLite on the backend. Game logic lives in `src/lib/` as pure functions (`baccarat.ts`, `blackjack.ts`, `slotEngine.ts`). Components in `src/components/`. Server in `server/`.

```bash
npm run dev        # frontend only
npm run server     # backend only
npm run dev:all    # both
npm test           # vitest
npm run lint       # tsc --noEmit
npm run build      # production build
```

PRs welcome. Keep the tone honest. No cheerleading, no shame — this thing only works if it feels like it's talking to someone who's been there.
