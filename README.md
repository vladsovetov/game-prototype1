# The Unwritten — local prototype

A browser-first gameplay proof for importing AI-conceived characters into a deterministic, balanced discovery game.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). After dependencies are installed, the game makes no network requests and requires no API key.

## Controls

- `WASD` or arrow keys: move
- `F`: use your character's Gift near an anomaly
- `E`: inspect an object, borrow a Resonance Gift, or plant a Memory Seed
- `J`: open the field journal
- `C`: open the character passport

The northwest enclosure is your sanctuary. Colored diamonds are Resonance Shrines: approach one and press `E` to borrow its Gift. Some anomalies need your own Gift and a borrowed Gift in sequence.

## Create a character with AI

Choose **Create with your AI**, copy the provided context, and give it to any text AI. Paste the returned JSON into **Import Character**. The game accepts only four trusted Gifts, Burdens, Quirks, and modular appearance values. Unknown fields and numerical statistics cannot change gameplay power.

You can also choose **Surprise Me** without using external AI.

## Save and reset

Progress autosaves to this browser's localStorage under `unwritten.prototype.save.v1`. Open **Help** and choose **Reset all local progress** to erase the character, discoveries, seeds, and sanctuary plantings.

## Verify

```bash
npm test
npm run test:e2e
npm run build
```

## Prototype limits

This build is single-player and desktop-first. It has no accounts, cloud saves, multiplayer, chat, payments, combat, trading, live AI calls, generated media, uploaded content, procedural quests, or mobile controls. It tests character import, balanced semantic traits, compound world reactions, collection, sanctuary expression, and persistence only.
