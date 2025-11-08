/* MamaRoute — офлайн-открытка без моделей: тёплые фразы, галерея, заметки, видео */

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

// Кнопки: стих / трек / видео / «сердечко»
document.getElementById('playPoem')?.addEventListener('click', () => {
  const u = new SpeechSynthesisUtterance(POEM);
  u.lang = 'en-US';
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});
const audio = new Audio('./song.mp3');
document.getElementById('playSong')?.addEventListener('click', () => {
  audio.currentTime = 0; audio.play().catch(()=>{});
});
const video = document.getElementById('video');
document.getElementById('playVideo')?.addEventListener('click', () => {
  if (!video) return;
  video.src = './video.mp4';
  video.style.display = 'block';
  video.play().catch(()=>{});
});
document.getElementById('confetti')?.addEventListener('click', () => {
  const out = document.getElementById('out');
  if (!out) return;
  const old = out.textContent || '';
  out.textContent = (old ? old + ' ' : '') + '♡';
  setTimeout(()=>{ out.textContent = old; }, 900);
});

// Галерея 1.jpg…9.jpg
const gal = document.getElementById('gallery');
if (gal) {
  [...Array(9)].forEach((_,i)=>{
    const img = new Image();
    img.src = `./img/${i+1}.jpg`;
    img.loading = 'lazy';
    img.onerror = () => img.remove();
    img.onload = () => gal.appendChild(img);
    img.alt = 'Наш кадр';
  });
}

// Локальные заметки
const note = document.getElementById('note');
const KEY = 'mamaroute_note';
if (note) note.value = localStorage.getItem(KEY) || '';
document.getElementById('saveNote')?.addEventListener('click', () => {
  localStorage.setItem(KEY, note.value);
});
document.getElementById('exportNote')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ note: note.value, at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mamaroute_note.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Установка PWA
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
document.getElementById('install')?.addEventListener('click', () => {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
});

// Тёплые фразы (офлайн)
const outEl = document.getElementById('out');
const speakBtn = document.getElementById('speak');
const copyBtn  = document.getElementById('copy');
const btnSupport = document.getElementById('btnSupport');
const btnFocus   = document.getElementById('btnFocus');
const btnGrat    = document.getElementById('btnGrat');

const FALLBACK = {
  support: [
    'Тихо обниму тебя словами: ты сделала уже много — отдышимся и продолжим.',
    'Пусть мир чуть подождёт. Выпей воды и посмотри в окно — ты не одна.',
    'Ты у нас смелая. Можно идти маленькими шагами — и это нормально.',
    'Сейчас важно просто быть. Остальное сложится.',
    'Сохраним силы: один вдох, один выдох, одно доброе действие.'
  ],
  focus: [
    'Одна задача на сейчас: тёплый чай и записать одну мысль в заметку.',
    'Выбери одну маленькую вещь и сделай её спокойно. Остальное — позже.',
    'Наведи порядок на столе за две минуты — и хватит. Дальше по ощущениям.',
    'Откроем окно, проветрим голову и начнём с самого простого шага.',
    'Сфокусируемся на одном деле до ближайшей паузы — и похвалим себя.'
  ],
  thanks: [
    'Спасибо за руки, которые всё успевали. Я это храню.',
    'За хлеб, дорогу в школу и терпение — благодарю. Это во мне живёт.',
    'Спасибо за свет в доме и в сердце. Люблю.',
    'Благодарю за английский и веру в меня. Я продолжаю.',
    'Спасибо за путь — каждый день вспоминаю с теплом.'
  ]
};

function pickOne(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
async function handle(mode){
  const text = pickOne(FALLBACK[mode]);
  if (outEl) outEl.textContent = text;
}
btnSupport?.addEventListener('click', ()=>handle('support'));
btnFocus  ?.addEventListener('click', ()=>handle('focus'));
btnGrat   ?.addEventListener('click', ()=>handle('thanks'));

// Озвучка/копирование результата
speakBtn?.addEventListener('click', ()=>{
  const t = outEl?.textContent?.trim(); if(!t) return;
  const u = new SpeechSynthesisUtterance(t); u.lang='ru-RU';
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});
copyBtn?.addEventListener('click', async ()=>{
  const t = outEl?.textContent?.trim(); if(!t) return;
  try{ await navigator.clipboard.writeText(t); outEl.textContent = t + '  (Скопировано)'; setTimeout(()=>{ outEl.textContent = t; }, 900); }catch{}
});

// SW регистрируем в проде, в dev можно и так
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

// === PWA установка / iOS fallback ===
(function(){
  // Гарантируем регистрацию SW и обновление
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) navigator.serviceWorker.register('./sw.js');
    });
  }

  const btn = document.getElementById('install');
  if (!btn) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  // iOS: «Поделиться → На экран "Домой"»
  if (isIOS && !isStandalone) {
    btn.disabled = false;
    btn.textContent = 'Добавить на экран (инструкция)';
    btn.onclick = () => alert('На iPhone: кнопка «Поделиться» → «На экран Домой». Это и есть установка.');
    return;
  }

  let deferred;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.disabled = false;
    btn.textContent = 'Установить (готово)';
  });

  btn.addEventListener('click', async () => {
    if (!deferred) {
      alert('Чтобы появилась установка: HTTPS или localhost, активный service worker и валидный манифест с иконками.');
      return;
    }
    await deferred.prompt();
    deferred = null;
    btn.textContent = 'Установка…';
  });

  window.addEventListener('appinstalled', () => {
    btn.textContent = 'Установлено ✓';
    btn.disabled = true;
  });
})();
