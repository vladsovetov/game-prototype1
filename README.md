# The Unwritten — local prototype

A browser-first story game about helping a strange companion reconstruct who they were. Every new tale generates a different meadow layout, atmosphere, discovery order, and character-shaped mystery. Plant any six recovered memories in the sanctuary to discover who your companion was.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The game requires no API key. Normal play remains local; enabling the optional on-device writer downloads its model files once and caches them in the browser.

## Controls

- `WASD` or arrow keys: move
- `F`: use your character's Gift near a strange object
- `E`: explore an object, borrow a temporary Gift, or plant a recovered keepsake
- `J`: open the field journal
- `C`: open the character passport

On a phone, drag the golden joystick at the lower left to move. Contextual action petals appear at the lower right for using a Gift, borrowing another Gift, exploring, and planting memories.

The first guided memory teaches the recovery loop through a rain-covered sign. Its title, refuge, disaster, recurring motif, chapters, and conclusion are generated from the current companion and run seed. Story cards survive reloads and every recovered chapter remains readable in the field journal.

The first chapter recovers one memory and opens the clearing. That is not the end. Two things remain: plant six memories to learn who the companion was, and take a field season of five to eight expeditions. The memory ending closes their past, not the game. The season tells one hidden story, can change the Refuge, and then ends. After that you may still walk, take leftover contracts, or start another tale.

The northwest enclosure is your sanctuary. Colored diamonds lend temporary Gifts; approach one and press `E`. Some objects need your own Gift and a borrowed Gift in sequence.

## Create a character with AI

Character creation is deliberately postponed until after the first guided memory. Choose **Create with your AI**, copy the provided world guide, and give it to any text AI. Paste the returned JSON back into the game. The importer accepts only four trusted Gifts, Burdens, Quirks, and modular appearance values. Unknown fields and numerical statistics cannot change gameplay power.

You can also keep the random character, add a short personality detail, or adjust only its appearance.

## Generate each tale on this device

Every fresh run immediately gets a deterministic procedural story, so gameplay never waits for AI. After the first recovered memory, **Let this device write the tale** can enhance that story using `onnx-community/SmolLM2-135M-Instruct-ONNX` through Transformers.js.

The first opt-in downloads a quantized model of roughly 120–180 MB from Hugging Face and stores it in browser cache. The worker uses WebGPU only when a real GPU adapter answers, then retries a single-thread WebAssembly/CPU path if that fails. Phones without WebGPU therefore stay on CPU instead of dying on a GPU-only load. WebGPU—not WebGL—is the browser API used for general GPU computation. Model inference happens in a Web Worker; character/story prompts are not sent to a game server.

The model returns short narrative ingredients only. The game validates and length-limits them, composes trusted prose, and inserts it as text. It cannot create mechanics, statistics, rewards, HTML, or executable code. If downloading or generation fails, the procedural story already in the journal remains unchanged and the game stays playable.

Each new tale also hides a season of five to eight expeditions: a strange signal, evidence, a contradiction, a consequence, a source, and a lasting decision. Episodes stay procedural; the local director only links them. While you walk, a radio companion may speak two to four short remarks. It remembers earlier choices and may be wrong. It never changes tools, routes, or rules. Finished expeditions pack a unique object whose name and history are written for that event; the look is assembled only from trusted shapes (hood, pack, glasses, lantern, cloak, patches) with no strength bonus.

The current Transformers.js package also installs Node-only `sharp` and `onnxruntime-node` branches that npm audit flags through transitive advisories. Those modules are not present in the Vite browser-worker bundle used by this prototype, but the upstream advisories should be revisited before a production release.

## Save and reset

Progress autosaves to this browser's localStorage under `unwritten.prototype.save.v1`. Reloading resumes exactly the same run. After onboarding, open **Help** and choose **Begin another tale** to keep the current companion while replacing the meadow, story, discoveries, seeds, and sanctuary plantings with a newly seeded run.

## Verify

```bash
npm test
npm run test:e2e
npm run build
```

## Prototype limits

This build is single-player with keyboard and phone touch controls. It has no accounts, cloud saves, multiplayer, chat, payments, combat, trading, generated images, uploaded content, or server-side AI. It includes eight mechanically authored memory types, seeded world generation, character-shaped procedural chapters, an optional local story model, an any-six sanctuary goal, a persistent story ending, player-shaped meaning, character import, sanctuary expression, and local persistence.
