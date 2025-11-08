// ================== Стих ==================
const POEM = `You woke before the sun would rise,
With sleepy stars still in the skies.
The clinking pots, the smell of bread —
A song of care that softly spread.

You fed the ducks, the hens, the cat,
And laughed — I still remember that.
You brushed my hair, you calmed my pain,
And turned my storms to peace again.

You walked for miles, through wind and dew,
So I could learn, because of you.
No crown, no fame, no loud acclaim —
Yet all I am recalls your name.`;

const poemBox = document.getElementById('poem');
if (poemBox) poemBox.textContent = POEM;

document.getElementById('playPoem')?.addEventListener('click', () => {
  const u = new SpeechSynthesisUtterance(POEM);
  u.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
});

// ================== UI ==================
const outEl    = document.getElementById('out');
const speakBtn = document.getElementById('speak');
const copyBtn  = document.getElementById('copy');
const btnSupport = document.getElementById('btnSupport');
const btnFocus   = document.getElementById('btnFocus');
const btnGrat    = document.getElementById('btnGrat');

const loadBar  = document.getElementById('bar');
const loadWrap = document.getElementById('load');
function barTo(p){ if(loadBar){ loadBar.style.width = `${p}%`; } }

// ================== Параметры генерации ==================
const PERSONA = `Ты — маленький офлайн-помощник для мамы.
Пиши по-русски. 1–2 предложения. Тепло, просто, без назиданий и вопросов.
Без медицинских советов.`;

const FACTS = [
  '4 км до школы и терпение на лестницах.',
  'Дача: куры, утки, грядки, ранние подъёмы и гремящая посуда.',
  'Хлеб, запеканки, яблоки с мёдом — вкус дома.',
  'Шахматы и первые турниры.',
  'Ночные дежурства у кровати — я помню.',
  'Спасибо за путь и за английский — ты лучший учитель.'
];

const PROMPTS = {
  support: `Режим: Поддержать. Мягко успокоить и приободрить.`,
  focus:   `Режим: Собраться. Одна маленькая задача на сейчас, без слова "надо".`,
  thanks:  `Режим: Поблагодарить. Коротко и светло.`
};

const FALLBACK = {
  support: [
    'Давай поставим тишину вокруг и вдохнём медленно — ты рядом, и это уже хорошо.',
    'Запах яблок с мёдом помнишь? Так же мягко — и с собой сейчас.',
    'Мы брали лестницы вместе; и это возьмём. Шаг за шагом.'
  ],
  focus: [
    'Один добрый шаг: тёплый чай, три медленных вдоха — и маленькое дело.',
    'Запишем одну мысль в блокнот — остальное подождёт.',
    'Откроем окно и выберем одну вещь сделать спокойно.'
  ],
  thanks: [
    'Спасибо за хлеб дома и за дорогу в школу — это со мной всегда.',
    'Спасибо за английский и тепло рук — ты в каждом моём шаге.',
    'Спасибо за путь. Люблю и помню.'
  ]
};

function pickOne(a){ return a[Math.floor(Math.random()*a.length)]; }
function sanitize(s){ return s.replace(/<\|.*?\|>/g,'').replace(/\s+/g,' ').trim(); }
function cropTwo(s){
  const m = s.match(/[^.!?]+[.!?]/g);
  if(!m) return s.slice(0,220).trim();
  let out = m[0].trim(); if(m[1]) out += ' ' + m[1].trim();
  if(out.length>220) out = out.slice(0,220).replace(/[,;:\-\s]+[^,.;:\-\s]*$/,'').trim() + '…';
  return out;
}

// ================== Модель (локально) ==================
const { pipeline, env } = window.transformers || {};
if (env) {
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = '/models'; // от корня сайта
  env.useBrowserCache = false;    // чтобы не залипать на кэше пока отлаживаем
}

async function headOk(url){
  try{ const r = await fetch(url, { method:'HEAD' }); return r.ok; }catch{ return false; }
}

// Основной и запасной пути (ЯВНЫЕ абсолютные пути)
const MODEL_QWEN = '/models/qwen25-0.5b-instruct'; // должен содержать onnx/model.onnx + *.json
const MODEL_FALL = '/models/distilgpt2';            // опционально

let generatorPromise = (async () => {
  if (!pipeline) return null;
  try {
    if (loadWrap) loadWrap.style.display = 'block';
    barTo(10);

    const qwenOk = await headOk(`${MODEL_QWEN}/onnx/model.onnx`);
    const modelPath = qwenOk ? MODEL_QWEN : MODEL_FALL;

    barTo(40);
    const gen = await pipeline('text-generation', modelPath);
    barTo(100);
    setTimeout(()=>{ if (loadWrap) loadWrap.style.display='none'; }, 250);
    return gen;
  } catch (e) {
    console.error('load-error:', e);
    if (outEl) outEl.textContent = 'Ошибка загрузки модели.';
    if (loadWrap) loadWrap.style.display='none';
    return null;
  }
})();

async function generate(mode){
  const gen = await generatorPromise;
  const prompt = `${PERSONA}

Факты: ${FACTS.join(' ')}

${PROMPTS[mode]}
Ответ 1–2 предложения. Начни сразу с мысли.`;

  try{
    if(!gen) throw new Error('no-model');
    const out = await gen(prompt, { max_new_tokens: 64, temperature: 0.8, top_p: 0.9, repetition_penalty: 1.1, do_sample: true });
    let text = (out?.[0]?.generated_text || '').replace(prompt,'').trim();
    if(!text) throw new Error('empty');
    text = sanitize(text);
    if(!/[а-яА-Я]/.test(text)) return pickOne(FALLBACK[mode]);
    return cropTwo(text);
  }catch{
    return pickOne(FALLBACK[mode]);
  }
}

async function handle(mode){
  if(outEl) outEl.textContent = '…';
  const t0 = performance.now();
  const text = await generate(mode);
  const t1 = performance.now();
  if(outEl) outEl.textContent = `${text}  ${((t1-t0)/1000).toFixed(1)}s`;
}

btnSupport?.addEventListener('click', ()=>handle('support'));
btnFocus  ?.addEventListener('click', ()=>handle('focus'));
btnGrat   ?.addEventListener('click', ()=>handle('thanks'));

speakBtn?.addEventListener('click', ()=>{
  const t = outEl?.textContent?.trim(); if(!t) return;
  const u = new SpeechSynthesisUtterance(t); u.lang='ru-RU';
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
});
copyBtn?.addEventListener('click', async ()=>{
  const t = outEl?.textContent?.trim(); if(!t) return;
  try{ await navigator.clipboard.writeText(t); outEl.textContent = t + '  (Скопировано)'; setTimeout(()=>{ outEl.textContent = t; }, 900); }catch{}
});
