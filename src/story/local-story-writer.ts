import { composeStory, modelDirectedIngredients, type StoryIngredients } from '../domain/story';
import { createRunDirection } from '../domain/run-direction';
import type { Character, RadioRemark, Relic, StoryArc } from '../domain/types';
import type { ExpeditionNarrative } from '../domain/types';
import { wearableForForm } from '../domain/relics';
import { parseExpeditionNarrative, parseRadioRemark, parseRelicCard, parseStoryIngredients, type StoryWorkerMessage, type StoryWorkerRequest } from './local-story-protocol';
import { storyRuntimeError } from './local-story-runtime';
import type { Locale } from '../i18n/locale';

export type WriterStatus =
  | { phase: 'idle'; progress: number }
  | { phase: 'download' | 'read' | 'weave'; progress: number }
  | { phase: 'complete'; progress: 1; story: StoryArc }
  | { phase: 'error'; progress: number; message: string };

export interface StoryWorkerLike {
  onmessage: ((event: MessageEvent<StoryWorkerMessage>) => void) | null;
  postMessage(message: StoryWorkerRequest): void;
  terminate(): void;
}

interface WriterOptions {
  workerFactory(): StoryWorkerLike;
  onStatus(status: WriterStatus): void;
  onStory(story: StoryArc): void;
  onExpedition?(expeditionId: string, narrative: ExpeditionNarrative): void;
  onRadio?(expeditionId: string, remark: Pick<RadioRemark, 'text' | 'mistaken'>): void;
  onRelic?(eventId: string, relic: Relic): void;
}

export interface ExpeditionDirectorInput {
  expeditionId:string;seed:number;character:Character;contractName:string;siteIds:string[];recentMemories:string[];recentFingerprints:string[];
  seasonBeat?:string;throughline?:string;priorBeats?:string[];
}

export interface RadioDirectorInput {
  expeditionId:string;seed:number;character:Character;voice:string;beat:string;lastDecision:string;remembered:string[];
}

export interface RelicDirectorInput {
  eventId:string;seed:number;character:Character;eventTitle:string;allowedForms:string;allowedColors:string;
}

type ActiveJob =
  | { kind:'story'; jobId: string; character: Character; seed: number }
  | { kind:'expedition';jobId:string;input:ExpeditionDirectorInput}
  | { kind:'radio';jobId:string;input:RadioDirectorInput}
  | { kind:'relic';jobId:string;input:RelicDirectorInput};

function promptCharacter(character: Character) {
  return { name: character.name, description: character.description, gift: character.gift.name, burden: character.burden.name, quirk: character.quirk.name };
}

export function createLocalStoryWriter(options: WriterOptions, locale: Locale = 'uk') {
  const worker = options.workerFactory();
  let active: ActiveJob | undefined;
  let sequence = 0;
  let currentStatus: WriterStatus = { phase: 'idle', progress: 0 };
  const updateStatus = (status: WriterStatus) => {
    currentStatus = status;
    options.onStatus(status);
  };

  const cancelActive = () => {
    if (!active) return;
    worker.postMessage({ type: 'cancel', jobId: active.jobId });
    active = undefined;
  };

  const preemptSoftJobs = () => {
    if (active?.kind === 'radio' || active?.kind === 'relic') cancelActive();
  };

  worker.onmessage = (event) => {
    const message = event.data;
    if (!active || message.jobId !== active.jobId) return;
    if (message.type === 'progress') {
      if (active.kind !== 'story') return;
      updateStatus({ phase: message.stage, progress: Math.max(0, Math.min(1, message.progress ?? 0)) });
      return;
    }
    if (message.type === 'error') {
      const wasStory = active.kind === 'story';
      active = undefined;
      if (wasStory) updateStatus({ phase: 'error', progress: 0, message: message.message || storyRuntimeError(locale) });
      return;
    }
    if (message.type === 'complete-expedition') {
      if (active.kind !== 'expedition') return;
      const { input } = active;
      const parsed = parseExpeditionNarrative(message.raw.trim(), input.siteIds, input.recentFingerprints, locale);
      active = undefined;
      if (parsed.ok) options.onExpedition?.(input.expeditionId, parsed.value);
      return;
    }
    if (message.type === 'complete-radio') {
      if (active.kind !== 'radio') return;
      const { input } = active;
      const parsed = parseRadioRemark(message.raw.trim(), locale);
      active = undefined;
      if (parsed.ok) options.onRadio?.(input.expeditionId, parsed.value);
      return;
    }
    if (message.type === 'complete-relic') {
      if (active.kind !== 'relic') return;
      const { input } = active;
      const parsed = parseRelicCard(message.raw.trim(), input.seed, locale);
      active = undefined;
      if (!parsed.ok) return;
      options.onRelic?.(input.eventId, {
        ...parsed.value,
        id: `relic-${input.eventId}-model`,
        eventId: input.eventId,
        eventTitle: input.eventTitle,
        wearableId: wearableForForm(parsed.value.form),
        source: 'local-model',
      });
      return;
    }
    if (active.kind !== 'story') return;
    const raw = message.raw.trim();
    const parsed = parseStoryIngredients(raw, locale);
    let ingredients: StoryIngredients;
    if (parsed.ok) ingredients = parsed.value;
    else if (raw) ingredients = modelDirectedIngredients(raw, active.seed, locale);
    else {
      active = undefined;
      updateStatus({ phase: 'error', progress: 0, message: parsed.reason });
      return;
    }
    const direction = createRunDirection(active.seed, raw);
    const story = composeStory(active.character, active.seed, ingredients, 'local-model', direction, locale);
    active = undefined;
    options.onStory(story);
    updateStatus({ phase: 'complete', progress: 1, story });
  };

  return {
    isIdle() {
      return !active;
    },
    start(character: Character, seed: number) {
      preemptSoftJobs();
      if (active) {
        options.onStatus(currentStatus);
        return active.jobId;
      }
      const jobId = `${seed >>> 0}-${++sequence}`;
      active = { kind: 'story', jobId, character, seed: seed >>> 0 };
      updateStatus({ phase: 'download', progress: 0 });
      worker.postMessage({
        type: 'generate', jobId, seed: seed >>> 0, locale,
        character: promptCharacter(character),
      });
      return jobId;
    },
    startExpedition(input: ExpeditionDirectorInput) {
      if (active?.kind === 'expedition' && active.input.expeditionId === input.expeditionId) return active.jobId;
      cancelActive();
      const jobId = `expedition-${input.seed >>> 0}-${++sequence}`;
      const packed = {
        ...input,
        seed: input.seed >>> 0,
        siteIds: [...input.siteIds],
        recentMemories: input.recentMemories.slice(0, 5),
        recentFingerprints: input.recentFingerprints.slice(0, 10),
        priorBeats: (input.priorBeats ?? []).slice(0, 8),
      };
      active = { kind: 'expedition', jobId, input: packed };
      worker.postMessage({
        type: 'generate-expedition', jobId, expeditionId: input.expeditionId, seed: packed.seed, locale,
        character: promptCharacter(input.character), contractName: input.contractName, siteIds: packed.siteIds,
        recentMemories: packed.recentMemories, recentFingerprints: packed.recentFingerprints,
        seasonBeat: packed.seasonBeat, throughline: packed.throughline, priorBeats: packed.priorBeats,
      });
      return jobId;
    },
    startRadio(input: RadioDirectorInput) {
      if (active) return;
      const jobId = `radio-${input.seed >>> 0}-${++sequence}`;
      active = { kind: 'radio', jobId, input };
      worker.postMessage({
        type: 'generate-radio', jobId, expeditionId: input.expeditionId, seed: input.seed >>> 0, locale,
        character: promptCharacter(input.character), voice: input.voice, beat: input.beat,
        lastDecision: input.lastDecision, remembered: input.remembered.slice(0, 4),
      });
      return jobId;
    },
    startRelic(input: RelicDirectorInput) {
      if (active) return;
      const jobId = `relic-${input.seed >>> 0}-${++sequence}`;
      active = { kind: 'relic', jobId, input };
      worker.postMessage({
        type: 'generate-relic', jobId, eventId: input.eventId, seed: input.seed >>> 0, locale,
        character: promptCharacter(input.character), eventTitle: input.eventTitle,
        allowedForms: input.allowedForms, allowedColors: input.allowedColors,
      });
      return jobId;
    },
    cancel() {
      cancelActive();
      updateStatus({ phase: 'idle', progress: 0 });
    },
    destroy() {
      active = undefined;
      worker.terminate();
    },
  };
}
