(function () {
  const T = window.transformers || {};
  if (T.env) {
    T.env.allowLocalModels = true;
    T.env.allowRemoteModels = true;           // оставляем TRUE, чтобы onnx-wasm подтянулся
    T.env.localModelPath   = './models';
    T.env.useBrowserCache  = true;
    T.env.backends = T.env.backends || {};
    T.env.backends.onnx = T.env.backends.onnx || {};
    T.env.backends.onnx.wasm = T.env.backends.onnx.wasm || {};
    // Если положишь wasm локально (./libs/ort), раскомментируй строку ниже и можно будет поставить allowRemoteModels=false
    // T.env.backends.onnx.wasm.wasmPaths = './libs/ort';
  }
})();

/* ===== открытка ===== */
const POEM=`You woke before the sun would rise,
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

const poemBox=document.getElementById('poem'); if(poemBox) poemBox.textContent=POEM;
document.getElementById('playPoem')?.addEventListener('click',()=>{const u=new SpeechSynthesisUtterance(POEM);u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u);});

const audio=new Audio('./song.mp3');
document.getElementById('playSong')?.addEventListener('click',()=>{audio.currentTime=0;audio.play().catch(()=>{});});

const video=document.getElementById('video');
document.getElementById('playVideo')?.addEventListener('click',()=>{if(!video)return;video.src='./video.mp4';video.style.display='block';video.play().catch(()=>{});});

document.getElementById('confetti')?.addEventListener('click',()=>{const out=document.getElementById('out');if(!out)return;const old=out.textContent||'';out.textContent=(old?old+' ':'')+'♡';setTimeout(()=>{out.textContent=old;},900);});

const gal=document.getElementById('gallery');
if(gal){[...Array(9)].forEach((_,i)=>{const img=new Image();img.src=`./img/${i+1}.jpg`;img.loading='lazy';img.onerror=()=>img.remove();img.onload=()=>gal.appendChild(img);img.alt='Наш кадр';});}

const note=document.getElementById('note'); const KEY='mamaroute_note';
if(note) note.value=localStorage.getItem(KEY)||'';
document.getElementById('saveNote')?.addEventListener('click',()=>localStorage.setItem(KEY,note.value));
document.getElementById('exportNote')?.addEventListener('click',()=>{const b=new Blob([JSON.stringify({note:note.value,at:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mamaroute_note.json';a.click();URL.revokeObjectURL(a.href);});

/* SW не мешает локальной разработке */
if('serviceWorker' in navigator && location.hostname!=='localhost'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}

/* ===== маленькая модель (Qwen2.5-0.5B) ===== */
const outEl=document.getElementById('out');
const PERSONA=`Ты — маленький добрый офлайн-помощник для мамы.
Пиши по-русски. Коротко (1–2 предложения), тепло, без назиданий и вопросов.
Без медицинских советов. Простыми словами.`;
const FACTS=['4 км до школы и терпение на лестницах.','Дача: куры, утки, грядки, ранние подъёмы и гремящая посуда.','Хлеб, запеканки, яблоки с мёдом — вкус дома.','Шахматы и первые турниры.','Ночные дежурства у кровати — я помню.','Спасибо за путь и за английский — ты лучший учитель.'];
const PROMPTS={support:'Режим: Поддержать. Мягко успокоить и приободрить. 1–2 предложения.',focus:'Режим: Собраться. Одна маленькая задача на сейчас, без слова "надо".',thanks:'Режим: Поблагодарить. Коротко и светло.'};
const FALLBACK={support:['Давай поставим тишину вокруг и вдохнём медленно — ты рядом, и это уже хорошо.','Запах яблок с мёдом помнишь? Так же мягко — и с собой сейчас.','Мы брали лестницы вместе; и это возьмём. Шаг за шагом.'],focus:['Один добрый шаг: тёплый чай, три медленных вдоха — и маленькое дело.','Запишем одну мысль в блокнот — остальное подождёт.','Откроем окно и выберем одну вещь сделать спокойно.'],thanks:['Спасибо за хлеб дома и за дорогу в школу — это со мной всегда.','Спасибо за английский и тепло рук — ты в каждом моём шаге.','Спасибо за путь. Люблю и помню.']};

const loadBar=document.getElementById('bar');const loadWrap=document.getElementById('load');
function barTo(p){if(loadBar)loadBar.style.width=`${p}%`;}

const { pipeline } = window.transformers || {};
const MODEL_ID='qwen25-0.5b-instruct';
let generatorPromise=(async()=>{ if(!pipeline) return null; try{
  if(loadWrap) loadWrap.style.display='block';
  let f=0;const t=setInterval(()=>{f=Math.min(f+6,88);barTo(f);},120);
  const gen=await pipeline('text-generation', MODEL_ID);  // ищет ./models/qwen25-0.5b-instruct
  clearInterval(t);barTo(100);setTimeout(()=>{if(loadWrap) loadWrap.style.display='none';},300);
  return gen;
}catch(e){ console.warn('[Qwen] load failed:',e); if(loadWrap) loadWrap.style.display='none'; return null; }})();

function pickOne(a){return a[Math.floor(Math.random()*a.length)];}
function sanitize(s){return s.replace(/<\|.*?\|>/g,'').replace(/\s+/g,' ').trim();}
function crop2(s){const m=s.match(/[^.!?]+[.!?]/g);if(!m)return s.slice(0,220).trim();let out=(m[0]||'').trim();if(m[1])out+=' '+m[1].trim();if(out.length>220)out=out.slice(0,220).replace(/[,;:\-\s]+[^,.;:\-\s]*$/,'').trim()+'…';return out;}

async function generate(mode){
  const gen=await generatorPromise;
  const prompt=`${PERSONA}

Факты: ${FACTS.join(' ')}

${PROMPTS[mode]}
Ответ 1–2 коротких предложения. Начни сразу с мысли, без обращений и вопросов.`;
  try{
    if(!gen) throw new Error('no-model');
    const out=await gen(prompt,{max_new_tokens:64,temperature:0.8,top_p:0.9,repetition_penalty:1.15,do_sample:true});
    let text=(out?.[0]?.generated_text||'').replace(prompt,'').trim();
    if(!text) throw new Error('empty');
    text=sanitize(text);
    if(!/[а-яА-Я]/.test(text)) return pickOne(FALLBACK[mode]);
    return crop2(text);
  }catch{ return pickOne(FALLBACK[mode]); }
}

async function handle(mode){ if(outEl) outEl.textContent='…'; const text=await generate(mode); if(outEl) outEl.textContent=text; }
document.getElementById('btnSupport')?.addEventListener('click',()=>handle('support'));
document.getElementById('btnFocus')  ?.addEventListener('click',()=>handle('focus'));
document.getElementById('btnGrat')   ?.addEventListener('click',()=>handle('thanks'));
document.getElementById('speak')?.addEventListener('click',()=>{const t=outEl?.textContent?.trim();if(!t)return;const u=new SpeechSynthesisUtterance(t);u.lang='ru-RU';speechSynthesis.cancel();speechSynthesis.speak(u);});
document.getElementById('copy') ?.addEventListener('click',async()=>{const t=outEl?.textContent?.trim();if(!t)return;try{await navigator.clipboard.writeText(t);outEl.textContent=t+'  (Скопировано)';setTimeout(()=>{outEl.textContent=t;},900);}catch{}});
