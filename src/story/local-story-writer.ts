import { composeStory, modelDirectedIngredients, type StoryIngredients } from '../domain/story';
import { createRunDirection } from '../domain/run-direction';
import type { Character, StoryArc } from '../domain/types';
import type { ExpeditionNarrative } from '../domain/types';
import { parseExpeditionNarrative, parseStoryIngredients, type StoryWorkerMessage, type StoryWorkerRequest } from './local-story-protocol';
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
}

export interface ExpeditionDirectorInput {
  expeditionId:string;seed:number;character:Character;contractName:string;siteIds:string[];recentMemories:string[];recentFingerprints:string[];
}

export function createLocalStoryWriter(options: WriterOptions, locale: Locale = 'uk') {
  const worker = options.workerFactory();
  let active: ({ kind:'story'; jobId: string; character: Character; seed: number }|{kind:'expedition';jobId:string;input:ExpeditionDirectorInput}) | undefined;
  let sequence = 0;
  let currentStatus: WriterStatus = { phase: 'idle', progress: 0 };
  const updateStatus = (status: WriterStatus) => {
    currentStatus = status;
    options.onStatus(status);
  };

  worker.onmessage = (event) => {
    const message = event.data;
    if (!active || message.jobId !== active.jobId) return;
    if (message.type === 'progress') {
      if(active.kind==='expedition')return;
      updateStatus({ phase: message.stage, progress: Math.max(0, Math.min(1, message.progress ?? 0)) });
      return;
    }
    if (message.type === 'error') {
      const wasStory=active.kind==='story';
      active = undefined;
      if(wasStory)updateStatus({ phase: 'error', progress: 0, message: message.message || storyRuntimeError(locale) });
      return;
    }
    if(message.type==='complete-expedition'){
      if(active.kind!=='expedition')return;
      const {input}=active;
      const parsed=parseExpeditionNarrative(message.raw.trim(),input.siteIds,input.recentFingerprints,locale);
      active=undefined;
      if(parsed.ok)options.onExpedition?.(input.expeditionId,parsed.value);
      return;
    }
    if(active.kind!=='story')return;
    const raw = message.raw.trim();
    const parsed = parseStoryIngredients(raw, locale);
    let ingredients: StoryIngredients;
    if (parsed.ok) ingredients = parsed.value;
    else if (raw && !raw.includes('{') && !raw.includes('}')) ingredients = modelDirectedIngredients(raw, active.seed,locale);
    else {
      active = undefined;
      updateStatus({ phase: 'error', progress: 0, message: parsed.reason });
      return;
    }
    const direction = createRunDirection(active.seed, raw);
    const story = composeStory(active.character, active.seed, ingredients, 'local-model', direction,locale);
    active = undefined;
    options.onStory(story);
    updateStatus({ phase: 'complete', progress: 1, story });
  };

  return {
    start(character: Character, seed: number) {
      if (active) {
        options.onStatus(currentStatus);
        return active.jobId;
      }
      const jobId = `${seed >>> 0}-${++sequence}`;
      active = { kind:'story', jobId, character, seed: seed >>> 0 };
      updateStatus({ phase: 'download', progress: 0 });
      worker.postMessage({
        type: 'generate', jobId, seed: seed >>> 0, locale,
        character: { name: character.name, description: character.description, gift: character.gift.name, burden: character.burden.name, quirk: character.quirk.name },
      });
      return jobId;
    },
    startExpedition(input:ExpeditionDirectorInput){
      if(active?.kind==='expedition'&&active.input.expeditionId===input.expeditionId)return active.jobId;
      if(active)worker.postMessage({type:'cancel',jobId:active.jobId});
      const jobId=`expedition-${input.seed>>>0}-${++sequence}`;
      active={kind:'expedition',jobId,input:{...input,seed:input.seed>>>0,siteIds:[...input.siteIds],recentMemories:input.recentMemories.slice(0,5),recentFingerprints:input.recentFingerprints.slice(0,10)}};
      worker.postMessage({type:'generate-expedition',jobId,expeditionId:input.expeditionId,seed:input.seed>>>0,locale,character:{name:input.character.name,description:input.character.description,gift:input.character.gift.name,burden:input.character.burden.name,quirk:input.character.quirk.name},contractName:input.contractName,siteIds:[...input.siteIds],recentMemories:input.recentMemories.slice(0,5),recentFingerprints:input.recentFingerprints.slice(0,10)});
      return jobId;
    },
    cancel() {
      if (active) worker.postMessage({ type: 'cancel', jobId: active.jobId });
      active = undefined;
      updateStatus({ phase: 'idle', progress: 0 });
    },
    destroy() {
      active = undefined;
      worker.terminate();
    },
  };
}
