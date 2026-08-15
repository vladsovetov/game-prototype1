# The Unwritten — local prototype

A browser-first story game about helping a strange companion reconstruct who they were. Each recovered memory has concrete clues, a revealed event, and one unanswered question that the player decides. Those choices become the companion's biography and the sanctuary makes their story visible.

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

The first guided story is **The Road Home**. You uncover a rain-covered sign, restore it, learn why it mattered to your companion, bring its Waypost home, and decide who kept a light burning for them. The game introduces one action at a time and has no timer, so you can wander as long as you like.

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

This build is single-player with keyboard and phone touch controls. It has no accounts, cloud saves, multiplayer, chat, payments, combat, trading, live AI calls, generated media, uploaded content, or procedural quests. It tests the full authored first-memory loop, player-shaped meaning, character import, sanctuary expression, and persistence.
