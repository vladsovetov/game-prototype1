# The Unwritten — local prototype

A browser-first story game about helping a strange companion reconstruct who they were. Every fully restored object reveals an authored chapter of their past. Plant any six recovered memories in the sanctuary to discover who they were and complete the Lantern House story.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). After dependencies are installed, the game makes no network requests and requires no API key.

## Controls

- `WASD` or arrow keys: move
- `F`: use your character's Gift near a strange object
- `E`: explore an object, borrow a temporary Gift, or plant a recovered keepsake
- `J`: open the field journal
- `C`: open the character passport

On a phone, drag the golden joystick at the lower left to move. Contextual action petals appear at the lower right for using a Gift, borrowing another Gift, exploring, and planting memories.

The first guided story is **The Road Home**. You uncover a rain-covered sign, restore it, learn why it mattered to your companion, bring its Waypost home, and decide who kept a light burning for them. Later recoveries reveal chapters such as **The Song Below**, **The Storm Bell**, and **Letters with Wings**. Story cards survive reloads and every recovered chapter remains readable in the field journal.

The HUD tracks the central goal: plant six memories in the sanctuary. Filling all six circles reveals **The Keeper of Lantern House**, records the conclusion in the journal, and leaves the meadow open for continued exploration. There is no timer and the other two optional memories can still be recovered afterward.

The northwest enclosure is your sanctuary. Colored diamonds lend temporary Gifts; approach one and press `E`. Some objects need your own Gift and a borrowed Gift in sequence.

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

This build is single-player with keyboard and phone touch controls. It has no accounts, cloud saves, multiplayer, chat, payments, combat, trading, live AI calls, generated media, uploaded content, or procedural quests. It includes eight authored memories, an any-six sanctuary goal, a persistent story ending, player-shaped meaning, character import, sanctuary expression, and local persistence.
