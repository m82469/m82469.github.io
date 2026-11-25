const weddingDate = new Date('2027-08-09T16:00:00+04:00');
const countdown = document.getElementById('countdown');
let countdownTimer;

const pluralize = (number, forms) => {
  const lastTwo = number % 100;
  const last = number % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
};

function updateCountdown() {
  const difference = weddingDate.getTime() - Date.now();
  const values = difference > 0
    ? {
        days: Math.floor(difference / 86400000),
        hours: Math.floor(difference / 3600000) % 24,
        minutes: Math.floor(difference / 60000) % 60,
        seconds: Math.floor(difference / 1000) % 60,
      }
    : { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const labels = {
    days: ['день', 'дня', 'дней'],
    hours: ['час', 'часа', 'часов'],
    minutes: ['минута', 'минуты', 'минут'],
    seconds: ['секунда', 'секунды', 'секунд'],
  };

  Object.entries(values).forEach(([unit, value]) => {
    document.getElementById(unit).textContent = String(value).padStart(2, '0');
    document.getElementById(`${unit}-label`).textContent = pluralize(value, labels[unit]);
  });

  if (difference <= 0) {
    clearInterval(countdownTimer);
    document.getElementById('countdown-title').textContent = 'Этот день наступил!';
    countdown.setAttribute('aria-label', 'Свадьба состоялась 9 августа 2027 года');
  }
}

updateCountdown();
countdownTimer = window.setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -35px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const intro = document.getElementById('intro');
const musicToggle = document.getElementById('music-toggle');
const musicState = document.getElementById('music-state');
const audio = document.getElementById('wedding-music');
const toast = document.getElementById('toast');
let shouldPlay = false;
let toastTimer;

audio.volume = 0.45;
document.body.classList.add('intro-open');
document.getElementById('open-with-music').focus();

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4500);
}

function setMusicState(isPlaying) {
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', `${isPlaying ? 'Выключить' : 'Включить'} музыку: МАЯК X — Украсть тебя`);
  musicState.textContent = isPlaying ? 'Сейчас играет' : 'Включить музыку';
}

async function playMusic() {
  shouldPlay = true;
  musicState.textContent = 'Загружаем музыку…';
  try {
    await audio.play();
  } catch (error) {
    if (!shouldPlay) return;
    setMusicState(false);
    if (error.name === 'NotSupportedError') {
      showToast('Не удалось загрузить аудиофайл. Попробуйте обновить страницу.');
    } else if (error.name !== 'AbortError') {
      showToast('Нажмите кнопку музыки ещё раз, чтобы включить звук.');
    }
  }
}

function pauseMusic() {
  shouldPlay = false;
  audio.pause();
  setMusicState(false);
}

function toggleMusic() {
  if (audio.paused) playMusic();
  else pauseMusic();
}

function closeIntro() {
  intro.classList.add('is-hidden');
  document.body.classList.remove('intro-open');
  intro.setAttribute('aria-hidden', 'true');
  setTimeout(() => { intro.hidden = true; }, 750);
}

audio.addEventListener('playing', () => setMusicState(true));
audio.addEventListener('pause', () => setMusicState(false));
audio.addEventListener('waiting', () => {
  if (shouldPlay) musicState.textContent = 'Загружаем музыку…';
});
audio.addEventListener('error', () => {
  shouldPlay = false;
  setMusicState(false);
  showToast('Не удалось загрузить аудиофайл. Попробуйте обновить страницу.');
});

document.getElementById('open-with-music').addEventListener('click', () => {
  closeIntro();
  playMusic();
});
document.getElementById('open-without-music').addEventListener('click', closeIntro);
musicToggle.addEventListener('click', toggleMusic);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !audio.paused) audio.pause();
  else if (!document.hidden && shouldPlay && audio.paused) playMusic();
});
