# The Unwritten — local prototype

A browser-first gameplay prototype about helping a strange companion change a quiet meadow. It opens immediately with a random character and teaches its discovery loop one action at a time.

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

The first guided memory introduces these controls gradually. There is no timer: the lights suggest a destination, but you can wander at your own pace. After finishing the first reaction and planting its Memory Seed, the full journal and character tools become available.

The northwest enclosure is your sanctuary. Colored diamonds are Resonance Shrines: approach one and press `E` to borrow its Gift. Some anomalies need your own Gift and a borrowed Gift in sequence.

## Create a character with AI

Character creation is deliberately postponed until after the first guided memory. Choose **Create with your AI**, copy the provided world guide, and give it to any text AI. Paste the returned JSON back into the game. The importer accepts only four trusted Gifts, Burdens, Quirks, and modular appearance values. Unknown fields and numerical statistics cannot change gameplay power.

You can also keep the random character, add a short personality detail, or adjust only its appearance.

## Save and reset

Progress autosaves to this browser's localStorage under `unwritten.prototype.save.v1`. After onboarding, open **Help** and choose **Reset this world** to erase the character, discoveries, seeds, and sanctuary plantings.

## Verify

```bash
npm test
npm run test:e2e
npm run build
```

## Prototype limits

This build is single-player and keyboard-first, with a responsive UI. It has no accounts, cloud saves, multiplayer, chat, payments, combat, trading, live AI calls, generated media, uploaded content, procedural quests, or touch controls. It tests progressive onboarding, character import, balanced semantic traits, compound world reactions, collection, sanctuary expression, and persistence only.
