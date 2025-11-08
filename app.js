// === MamaRoute — no-model компакт: всё офлайн, без трансформеров ===
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

// Кнопки: стих/«конфетти»/озвучка/копия
document.getElementById('playPoem')?.addEventListener('click',()=>{const u=new SpeechSynthesisUtterance(POEM);u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u);});
document.getElementById('confetti')?.addEventListener('click',()=>{const out=document.getElementById('out');if(!out)return;const old=out.textContent||'';out.textContent=(old?old+' ':'')+'♡';setTimeout(()=>{out.textContent=old;},900);});

// Галерея (1.jpg…9.jpg)
const gal=document.getElementById('gallery');
if(gal){ for(let i=1;i<=9;i++){ const img=new Image(); img.src=`./img/${i}.jpg`; img.loading='lazy'; img.alt='Наш кадр'; img.onerror=()=>img.remove(); img.onload=()=>gal.appendChild(img); } }

// Локальные заметки
const note=document.getElementById('note'); const KEY='mamaroute_note';
if(note) note.value=localStorage.getItem(KEY)||'';
document.getElementById('saveNote')?.addEventListener('click',()=>localStorage.setItem(KEY,note.value));
document.getElementById('exportNote')?.addEventListener('click',()=>{const b=new Blob([JSON.stringify({note:note.value,at:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mamaroute_note.json';a.click();URL.revokeObjectURL(a.href);});

// Видео/аудио — опционально (если положишь маленькие файлы <100MB)
const audio=new Audio('./song.mp3');
document.getElementById('playSong')?.addEventListener('click',()=>{audio.currentTime=0;audio.play().catch(()=>{});});
const video=document.getElementById('video');
document.getElementById('playVideo')?.addEventListener('click',()=>{if(!video)return;video.src='./video.mp4';video.style.display='block';video.play().catch(()=>{});});

// PWA: «Установить» (на Android). На iOS кнопка покажет подсказку.
let deferredPrompt=null;
addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;});
document.getElementById('install')?.addEventListener('click',async()=>{
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if(isiOS){
    alert('На iPhone: Поделиться → На экран «Домой».'); return;
  }
  if(deferredPrompt){ await deferredPrompt.prompt(); deferredPrompt=null; }
});

// SW: регистрируем только на https/не localhost
if('serviceWorker' in navigator && location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

// Кнопки «Поддержать/Собраться/Поблагодарить» — качественные готовые фразы
const OUT=document.getElementById('out');
const BANK={
  support:[
    'Тихо обниму тебя словами: ты не одна, я рядом мыслями.',
    'Давай поставим на паузу мир и сделаем один мягкий вдох.',
    'Ты многое несла молча — можно и мне помочь нести чуть-чуть.'
  ],
  focus:[
    'Один шаг сейчас: налить тёплый чай и записать одну мысль.',
    'Выберем маленькое дело на 5 минут — остальное подождёт.',
    'Откроем окно, вдох-выдох, и сделаем одну спокойную вещь.'
  ],
  thanks:[
    'Спасибо за хлеб дома, дорогу в школу и тепло рук — это со мной.',
    'Спасибо за английский и веру в меня. Я помню каждый твой шаг.',
    'Спасибо за путь. Люблю и берегу тебя в сердце.'
  ]
};
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function show(s){ if(OUT) OUT.textContent=s; }
document.getElementById('btnSupport')?.addEventListener('click',()=>show(pick(BANK.support)));
document.getElementById('btnFocus')  ?.addEventListener('click',()=>show(pick(BANK.focus)));
document.getElementById('btnGrat')   ?.addEventListener('click',()=>show(pick(BANK.thanks)));
document.getElementById('speak')?.addEventListener('click',()=>{const t=OUT?.textContent?.trim(); if(!t) return; const u=new SpeechSynthesisUtterance(t); u.lang='ru-RU'; speechSynthesis.cancel(); speechSynthesis.speak(u);});
document.getElementById('copy') ?.addEventListener('click',async()=>{const t=OUT?.textContent?.trim(); if(!t) return; try{ await navigator.clipboard.writeText(t); show(t+'  (Скопировано)'); setTimeout(()=>show(t),800);}catch{}});
