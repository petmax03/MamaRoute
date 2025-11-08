/* === СТИХ === */
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

const $ = s => document.querySelector(s);
$('#poem').textContent = POEM;
$('#playPoem')?.addEventListener('click', () => {
  const u = new SpeechSynthesisUtterance(POEM); u.lang='en-US';
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});

/* === МЕДИА === */
const audio = new Audio('./song.mp3');
$('#playSong')?.addEventListener('click', ()=>{ audio.currentTime=0; audio.play().catch(()=>{}); });

const video = $('#video');
$('#playVideo')?.addEventListener('click', ()=>{
  if (!video) return; video.src='./video.mp4'; video.style.display='block'; video.play().catch(()=>{});
});

/* === КОНФЕТТИ-ПИНГ === */
$('#confetti')?.addEventListener('click', ()=>{
  const out = $('#out'); if(!out) return;
  const old = out.textContent||''; out.textContent = (old?old+' ':'')+'♡';
  setTimeout(()=>{ out.textContent=old; }, 900);
});

/* === ГАЛЕРЕЯ 1.jpg…9.jpg === */
const gal = $('#gallery');
if (gal) {
  for (let i=1;i<=9;i++){
    const img = new Image(); img.src=`./img/${i}.jpg`; img.loading='lazy';
    img.onerror=()=>img.remove(); img.onload=()=>gal.appendChild(img); img.alt='Наш кадр';
  }
}

/* === ЗАМЕТКИ (локально) === */
const noteKey='mamaroute_note', note=$('#note');
if (note) note.value = localStorage.getItem(noteKey)||'';
$('#saveNote')?.addEventListener('click', ()=>localStorage.setItem(noteKey, note.value));
$('#exportNote')?.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({ note: note.value, at: new Date().toISOString() },null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mamaroute_note.json'; a.click();
  URL.revokeObjectURL(a.href);
});

/* === PWA установка (кнопка «Установить») === */
let deferredPrompt=null;
addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; });
$('#install')?.addEventListener('click', ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; }});

/* === МОДЕЛЬ (transformers.js) === */
const { pipeline, env } = window.transformers || {};
const loadWrap = $('#load'), loadBar = $('#bar');
const barTo = p => loadBar && (loadBar.style.width = `${p}%`);

if (env){
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath   = '/models';     // ВАЖНО: абсолютный путь от корня сайта
  env.useBrowserCache  = false;         // пока отладка
}

const MODEL_QWEN = '/models/qwen25-0.5b-instruct';  // должен быть onnx/model.onnx + *.json
const MODEL_FALL = null;                              // без фолбэка — если не найдём, отдаём наши фразы

async function headOk(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok; }catch{return false;} }

let generatorPromise = (async ()=>{
  if (!pipeline) return null;
  if (loadWrap) loadWrap.style.display='block'; barTo(8);
  const qwenOk = await headOk(`${MODEL_QWEN}/onnx/model.onnx`);
  const modelPath = qwenOk ? MODEL_QWEN : MODEL_FALL;
  if (!modelPath){ if(loadWrap) loadWrap.style.display='none'; return null; }

  barTo(35);
  const gen = await pipeline('text-generation', modelPath);
  barTo(100); setTimeout(()=>{ if(loadWrap) loadWrap.style.display='none'; },250);
  return gen;
})();

/* === Генерация коротких русских фраз === */
const PERSONA = 'Ты — маленький офлайн-помощник для мамы. Пиши по-русски. 1–2 предложения. Тёпло и просто.';
const FACTS = [
  '4 км до школы и терпение на лестницах.',
  'Дача: куры, утки, грядки, ранние подъёмы и гремящая посуда.',
  'Хлеб, запеканки, яблоки с мёдом — вкус дома.',
  'Шахматы и первые турниры.',
  'Ночные дежурства у кровати — я помню.',
  'Спасибо за путь и за английский — ты лучший учитель.'
];
const PROMPTS = {
  support:'Режим: Поддержать. Мягко успокоить и приободрить.',
  focus:'Режим: Собраться. Одна маленькая задача на сейчас, без слова "надо".',
  thanks:'Режим: Поблагодарить. Коротко и светло.'
};
const FALLBACK = {
  support:[
    'Давай поставим тишину вокруг и вдохнём медленно — ты рядом, и это уже хорошо.',
    'Запах яблок с мёдом помнишь? Так же мягко — и с собой сейчас.',
    'Мы брали лестницы вместе; и это возьмём. Шаг за шагом.'
  ],
  focus:[
    'Один добрый шаг: тёплый чай, три медленных вдоха — и маленькое дело.',
    'Запишем одну мысль в блокнот — остальное подождёт.',
    'Откроем окно и выберем одну вещь сделать спокойно.'
  ],
  thanks:[
    'Спасибо за хлеб дома и за дорогу в школу — это со мной всегда.',
    'Спасибо за английский и тепло рук — ты в каждом моём шаге.',
    'Спасибо за путь. Люблю и помню.'
  ]
};

const outEl = $('#out');
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function sanitize(s){ return s.replace(/<\|.*?\|>/g,'').replace(/\s+/g,' ').trim(); }
function crop2(s){
  const m=s.match(/[^.!?]+[.!?]/g); if(!m) return s.slice(0,220).trim();
  let o=m[0].trim(); if(m[1]) o+=' '+m[1].trim();
  return o.length>220 ? o.slice(0,220).replace(/[,;:\-\s]+[^,.;:\-\s]*$/,'').trim()+'…' : o;
}

async function generate(mode){
  const gen = await generatorPromise;
  const prompt = `${PERSONA}\nФакты: ${FACTS.join(' ')}\n${PROMPTS[mode]}\nОтвет по-русски. 1–2 предложения.`;
  try{
    if(!gen) throw 0;
    const res = await gen(prompt, { max_new_tokens:64, temperature:0.7, top_p:0.9, repetition_penalty:1.1, do_sample:true });
    let text = (res?.[0]?.generated_text || '').replace(prompt,'').trim();
    if(!text) throw 0; text = sanitize(text);
    if(!/[а-яА-Я]/.test(text)) throw 0;
    return crop2(text);
  }catch{ return pick(FALLBACK[mode]); }
}

async function handle(mode){
  if(outEl) outEl.textContent='…';
  const t0=performance.now(); const t=await generate(mode); const t1=performance.now();
  if(outEl) outEl.textContent = `${t}  ${((t1-t0)/1000).toFixed(1)}s`;
}
$('#btnSupport')?.addEventListener('click', ()=>handle('support'));
$('#btnFocus')  ?.addEventListener('click', ()=>handle('focus'));
$('#btnGrat')   ?.addEventListener('click', ()=>handle('thanks'));

/* === Озвучка/копирование === */
$('#speak')?.addEventListener('click', ()=>{
  const t=outEl?.textContent?.trim(); if(!t) return;
  const u=new SpeechSynthesisUtterance(t); u.lang='ru-RU';
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});
$('#copy')?.addEventListener('click', async ()=>{
  const t=outEl?.textContent?.trim(); if(!t) return;
  try{ await navigator.clipboard.writeText(t); outEl.textContent=t+'  (Скопировано)'; setTimeout(()=>outEl.textContent=t,900);}catch{}
});
