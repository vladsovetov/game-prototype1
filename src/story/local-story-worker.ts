/// <reference lib="webworker" />

import { pipeline } from '@huggingface/transformers';
import type { StoryWorkerMessage, StoryWorkerRequest } from './local-story-protocol';

const MODEL = 'onnx-community/SmolLM2-135M-Instruct-ONNX';
type Generator = Awaited<ReturnType<typeof pipeline<'text-generation'>>>;
let generatorPromise: Promise<Generator> | undefined;
let latestJobId: string | undefined;

function send(message: StoryWorkerMessage) {
  self.postMessage(message);
}

function progressValue(event: unknown) {
  if (!event || typeof event !== 'object') return 0;
  const value = event as { progress?: number; loaded?: number; total?: number };
  if (typeof value.progress === 'number') return value.progress > 1 ? value.progress / 100 : value.progress;
  if (value.loaded && value.total) return value.loaded / value.total;
  return 0;
}

async function load(jobId: string) {
  if (generatorPromise) return generatorPromise;
  const options: Parameters<typeof pipeline<'text-generation'>>[2] = {
    dtype: 'q4',
    progress_callback: (event: unknown) => send({ type: 'progress', jobId, stage: 'download', progress: progressValue(event) }),
  };
  if ('gpu' in navigator) options.device = 'webgpu';
  generatorPromise = pipeline('text-generation', MODEL, options).catch((error) => {
    generatorPromise = undefined;
    throw error;
  });
  return generatorPromise;
}

function generatedText(output: Awaited<ReturnType<Generator>>) {
  const first = output[0];
  if (!first || !('generated_text' in first)) return '';
  const value = first.generated_text;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const last = value.at(-1) as { content?: unknown } | undefined;
    return typeof last?.content === 'string' ? last.content : '';
  }
  return '';
}

self.onmessage = async (event: MessageEvent<StoryWorkerRequest>) => {
  if (event.data.type === 'cancel') {
    if (latestJobId === event.data.jobId) latestJobId = undefined;
    return;
  }
  const { jobId, character, seed } = event.data;
  latestJobId = jobId;
  try {
    const localGenerator = await load(jobId);
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'read', progress: 1 });
    const isExpedition=event.data.type==='generate-expedition';
    const prompt = isExpedition ? [
      {role:'system',content:'Ти локальний режисер затишної польової пригоди. Пиши лише українською. Поверни тільки один валідний JSON без markdown. Не змінюй siteId, правила, нагороди або маршрут. Уникай абстрактної магії: використовуй реальні помпи, кабелі, укриття, сліди, погоду та інструменти.'},
      {role:'user',content:`Створи виразно нову картку експедиції для ${character.name}. Персонаж: ${character.description}. Інструмент: ${character.gift}. Стиль роботи: ${character.burden}. Риса: ${character.quirk}. Контракт: ${event.data.contractName}. Seed: ${seed}. Маршрут у точному порядку: ${event.data.siteIds.join(', ')}. Доречні спогади: ${event.data.recentMemories.join(' | ')||'ще немає'}. Недавні fingerprints, які не можна повторювати: ${event.data.recentFingerprints.join(' | ')||'ще немає'}. Схема: {"title":"до 72 символів","situation":"одне з: зникнення | поломка | хибний-сигнал | слід-мандрівника | природна-зміна","mood":"одне з: тиха-тривога | тепла-надія | польова-таємниця | наближення-бурі","palette":"одне з: мідь-мох | синій-дощ | бурштин-туман | крейда-хвоя","cause":"конкретна причина до 180 символів","siteNotes":[по одному {"siteId":"точно з маршруту","observation":"конкретний фізичний доказ"} у тому самому порядку],"optionalLead":"конкретний дальній слід","warning":"чесне попередження","rareFind":"реальний невеликий предмет","visualTags":[2-4 короткі українські ознаки]}`},
    ] : [
      { role: 'system', content: 'Ти пишеш затишну польову історію українською. Поверни лише валідний JSON без markdown, пояснень чи англійських слів.' },
      { role: 'user', content: `Створи відмінний початок світу для ${character.name}. Супутник: ${character.description}. Інструмент: ${character.gift}. Стиль роботи: ${character.burden}. Риса: ${character.quirk}. Випадкове зерно: ${seed}. Схема: {"place":"назва місця до 64 символів","role":"земна роль персонажа","disaster":"конкретна минула подія","vow":"коротка обіцянка","motif":"фізичний мотив","truth":"прихована особиста правда"}.` },
    ];
    send({ type: 'progress', jobId, stage: 'weave', progress: .1 });
    const output = await localGenerator(prompt, { max_new_tokens: isExpedition?420:220, do_sample: true, temperature: .88, top_p: .92, repetition_penalty:1.12 });
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'weave', progress: 1 });
    send({ type: isExpedition?'complete-expedition':'complete', jobId, raw: generatedText(output) });
  } catch (error) {
    if (latestJobId !== jobId) return;
    send({ type: 'error', jobId, message: 'Локальний оповідач не зміг завершити роботу. Перевірте підтримку WebGPU або спробуйте ще раз.' });
  }
};
