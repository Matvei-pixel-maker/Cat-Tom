(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* ---------- Живой фон: частицы с отталкиванием от курсора ---------- */
  const bgCanvas = document.getElementById('bgCanvas');
  if (bgCanvas && !reduceMotion.matches) {
    const ctx = bgCanvas.getContext('2d');
    let width, height;
    const particles = [];
    const PARTICLE_COUNT = 90;
    const MOUSE_RADIUS = 260;
    const PARTICLE_COLOR = 'rgba(110, 172, 214, 0.45)';
    const CONNECT_DIST = 160;

    const mouse = { x: -9999, y: -9999 };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = rand(0, width);
        this.y = rand(0, height);
        this.vx = rand(-1, 1);
        this.vy = rand(-1, 1);
        this.radius = rand(2, 3);
        this.originalX = this.x;
        this.originalY = this.y;
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 4;
          this.vy -= Math.sin(angle) * force * 4;
        }

        this.vx *= 0.92;
        this.vy *= 0.92;
        this.x += this.vx;
        this.y += this.vy;

        const homeDx = this.originalX - this.x;
        const homeDy = this.originalY - this.y;
        this.vx += homeDx * 0.002;
        this.vy += homeDy * 0.002;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.fillStyle = PARTICLE_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function resize() {
      width = bgCanvas.width = window.innerWidth;
      height = bgCanvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i += 1) particles.push(new Particle());
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    resize();

    function animateBg() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.strokeStyle = PARTICLE_COLOR;
            ctx.globalAlpha = 1 - dist / CONNECT_DIST;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      requestAnimationFrame(animateBg);
    }

    animateBg();
  }

  /* ---------- Глобальный параллакс контента ---------- */
  const parallaxLayers = document.querySelectorAll('[data-parallax]');
  const parallaxSpeed = -0.04;

  if (parallaxLayers.length && !reduceMotion.matches) {
    let rafId = null;
    let lastX = 0;
    let lastY = 0;
    let targetX = 0;
    let targetY = 0;

    const updateParallax = () => {
      lastX += (targetX - lastX) * 0.1;
      lastY += (targetY - lastY) * 0.1;

      parallaxLayers.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 1;
        const x = lastX * speed * parallaxSpeed;
        const y = lastY * speed * parallaxSpeed;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });

      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('pointermove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx;
      targetY = (e.clientY - cy) / cy;
    });

    updateParallax();

    window.addEventListener('resize', () => {
      targetX = 0;
      targetY = 0;
      lastX = 0;
      lastY = 0;
    });
  }

  /* ---------- Светящийся курсор (Glow Cursor) ---------- */
  const glowCursor = document.getElementById('glowCursor');
  if (glowCursor && window.matchMedia('(pointer: fine)').matches && !reduceMotion.matches) {
    let glowX = 0;
    let glowY = 0;
    let targetGlowX = 0;
    let targetGlowY = 0;

    window.addEventListener('mousemove', (e) => {
      targetGlowX = e.clientX;
      targetGlowY = e.clientY;
    });

    const animateGlow = () => {
      glowX += (targetGlowX - glowX) * 0.15;
      glowY += (targetGlowY - glowY) * 0.15;
      glowCursor.style.transform = `translate(${glowX - 60}px, ${glowY - 60}px)`;
      requestAnimationFrame(animateGlow);
    };

    animateGlow();
  }

  document.querySelectorAll('.photo-media img, .tile img').forEach((img) => {
    const holder = img.closest('.photo-media, .tile');
    if (!holder) return;

    const markMissing = () => {
      holder.classList.add('is-missing');
      const btn = holder.querySelector('.tile-btn');
      if (btn) btn.setAttribute('aria-disabled', 'true');
    };

    if (img.complete) {
      if (img.naturalWidth === 0) markMissing();
    } else {
      img.addEventListener('error', markMissing, { once: true });
    }
  });

  /* ---------- Кнопка «Погладить» и сердечки ---------- */
  const petBtn = document.getElementById('petBtn');
  const petCount = document.getElementById('petCount');
  const petHint = document.getElementById('petHint');
  const photoCard = document.getElementById('photoCard');

  const PURR_VOLUME = 0.5;
  const PURR_DURATION = 3000;
  const PURR_FADE_START = 2000;
  const PURR_START_AT = 1.5;
  const PETS_STORAGE_KEY = 'tom-pettings';

  let purr = null;
  try {
    purr = new Audio('purr.mp3');
    purr.id = 'purrSound';
    purr.preload = 'auto';
    purr.volume = PURR_VOLUME;
    purr.setAttribute('aria-hidden', 'true');
    document.body.appendChild(purr);
  } catch (error) {
    purr = null;
  }

  const readPets = () => {
    try {
      const stored = window.localStorage.getItem(PETS_STORAGE_KEY);
      if (stored === null) return 0;
      const count = Number(stored);
      return Number.isInteger(count) && count >= 0 ? count : 0;
    } catch (error) {
      return 0;
    }
  };

  const savePets = (value) => {
    try {
      window.localStorage.setItem(PETS_STORAGE_KEY, String(value));
    } catch (error) {
      /* localStorage может быть недоступен — счётчик продолжит работать в памяти */
    }
  };

  const phrases = [
    'Мурр…',
    'Мррр-р-р…',
    'Том довольно щурится',
    'Ещё разок?',
    'Мурчание на максимуме',
    'Том перевернулся на спинку',
    'Хвост пляшет от счастья',
    'Том в восторге'
  ];
  const heartColors = ['#e2737a', '#f08f96', '#d77fb2', '#ef9a6b', '#b98ad8', '#e66f6f'];
  const heartPath = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

  let pets = readPets();
  let aliveHearts = 0;

  const plural = (n, forms) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
    return forms[2];
  };

  const renderPetCount = () => {
    if (!petCount) return;
    petCount.textContent = `${pets} ${plural(pets, ['поглаживание', 'поглаживания', 'поглаживаний'])}`;
  };

  renderPetCount();

  /* ---------- Мурчание: 3 секунды, плавное затухание в последнюю секунду ---------- */
  let purrRaf = 0;
  let purrStopTimer = 0;
  let purrRun = 0;

  function stopPurr(token) {
    if (token !== purrRun) return;
    purrRun += 1;
    if (purrRaf) cancelAnimationFrame(purrRaf);
    if (purrStopTimer) clearTimeout(purrStopTimer);
    purrRaf = 0;
    purrStopTimer = 0;
    if (!purr) return;
    purr.pause();
    try {
      purr.currentTime = 0;
    } catch (error) {
      /* метаданные ещё не загружены — сброс произойдёт при следующем запуске */
    }
    purr.volume = PURR_VOLUME;
  }

  function playPurr() {
    if (!purr) return;

    purrRun += 1;
    const token = purrRun;
    if (purrRaf) cancelAnimationFrame(purrRaf);
    if (purrStopTimer) clearTimeout(purrStopTimer);
    purrRaf = 0;
    purrStopTimer = 0;

    purr.pause();
    try {
      purr.currentTime = PURR_START_AT;
    } catch (error) {
      /* пропускаем, если аудио ещё не готово */
    }
    purr.volume = PURR_VOLUME;

    const startedAt = performance.now();
    let playPromise = null;
    try {
      playPromise = purr.play();
    } catch (error) {
      playPromise = null;
    }
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        /* звук может быть заблокирован браузером или файл недоступен */
      });
    }

    const tick = (now) => {
      if (token !== purrRun) return;
      const elapsed = now - startedAt;

      if (elapsed >= PURR_DURATION) {
        stopPurr(token);
        return;
      }

      if (elapsed > PURR_FADE_START) {
        const progress = Math.min(1, (elapsed - PURR_FADE_START) / (PURR_DURATION - PURR_FADE_START));
        purr.volume = Math.max(0, PURR_VOLUME * (1 - progress));
      } else {
        purr.volume = PURR_VOLUME;
      }

      purrRaf = requestAnimationFrame(tick);
    };

    purrRaf = requestAnimationFrame(tick);
    purrStopTimer = window.setTimeout(() => stopPurr(token), PURR_DURATION);
  }

  function spawnHeart(x, y) {
    if (aliveHearts > 60) return;

    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.setAttribute('aria-hidden', 'true');
    heart.style.setProperty('--x', `${x}px`);
    heart.style.setProperty('--y', `${y}px`);
    heart.style.setProperty('--size', `${rand(20, 36).toFixed(0)}px`);
    heart.style.setProperty('--dx', `${rand(-110, 110).toFixed(0)}px`);
    heart.style.setProperty('--dy', `${rand(120, 210).toFixed(0)}px`);
    heart.style.setProperty('--r0', `${rand(-25, 25).toFixed(0)}deg`);
    heart.style.setProperty('--r1', `${rand(-120, 120).toFixed(0)}deg`);
    heart.style.setProperty('--dur', `${rand(1.5, 2.4).toFixed(2)}s`);
    heart.style.setProperty('--delay', `${rand(0, 0.12).toFixed(2)}s`);
    heart.style.color = heartColors[Math.floor(Math.random() * heartColors.length)];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', heartPath);
    svg.appendChild(path);
    heart.appendChild(svg);

    document.body.appendChild(heart);
    aliveHearts += 1;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      heart.remove();
      aliveHearts -= 1;
    };

    heart.addEventListener('animationend', cleanup, { once: true });
    window.setTimeout(cleanup, 3200);
  }

  if (petBtn) {
    petBtn.addEventListener('click', (event) => {
      pets += 1;
      renderPetCount();
      savePets(pets);
      playPurr();
      petHint.textContent = phrases[(pets - 1) % phrases.length];

      petCount.classList.remove('is-bumped');
      void petCount.offsetWidth;
      petCount.classList.add('is-bumped');

      petBtn.classList.remove('is-petting');
      void petBtn.offsetWidth;
      petBtn.classList.add('is-petting');
      window.setTimeout(() => petBtn.classList.remove('is-petting'), 480);

      if (photoCard) {
        photoCard.classList.remove('is-petted');
        void photoCard.offsetWidth;
        photoCard.classList.add('is-petted');
        window.setTimeout(() => photoCard.classList.remove('is-petted'), 720);
      }

      const rect = petBtn.getBoundingClientRect();
      const fromKeyboard = event.detail === 0;
      const centerX = fromKeyboard ? rect.left + rect.width / 2 : event.clientX;
      const centerY = fromKeyboard ? rect.top + rect.height / 2 : event.clientY;
      const amount = reduceMotion.matches ? 4 : 10;

      for (let i = 0; i < amount; i += 1) {
        window.setTimeout(() => {
          spawnHeart(centerX + rand(-46, 46), centerY + rand(-20, 8));
        }, i * 55);
      }
    });
  }

  /* ---------- Лайтбокс для галереи ---------- */
  const dialog = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCounter = document.getElementById('lbCounter');
  const tileButtons = Array.from(document.querySelectorAll('.tile-btn'));

  let visibleTiles = [];
  let currentIndex = 0;

  const isAvailable = (btn) => {
    const tile = btn.closest('.tile');
    return Boolean(tile && !tile.classList.contains('is-missing'));
  };

  function renderLightbox() {
    const btn = visibleTiles[currentIndex];
    if (!btn) return;
    const img = btn.querySelector('img');
    lbImage.src = img.currentSrc || img.src;
    lbImage.alt = img.alt;
    lbCounter.textContent = `${currentIndex + 1} / ${visibleTiles.length}`;
  }

  function openLightbox(index) {
    const btn = tileButtons[index];
    if (!btn || !isAvailable(btn)) return;

    visibleTiles = tileButtons.filter(isAvailable);
    currentIndex = visibleTiles.indexOf(btn);
    if (currentIndex < 0) return;

    renderLightbox();

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.body.classList.add('no-scroll');
  }

  function stepLightbox(delta) {
    if (visibleTiles.length < 2) return;
    currentIndex = (currentIndex + delta + visibleTiles.length) % visibleTiles.length;
    renderLightbox();
  }

  tileButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => openLightbox(index));
  });

  dialog.querySelector('[data-lb-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-lb]').forEach((btn) => {
    btn.addEventListener('click', () => stepLightbox(btn.dataset.lb === 'next' ? 1 : -1));
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('no-scroll');
    lbImage.removeAttribute('src');
  });

  lbImage.addEventListener('error', () => {
    if (dialog.open) lbCounter.textContent = 'Фото не загрузилось';
  });

  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepLightbox(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepLightbox(-1);
    }
  });

  /* ---------- 3D-вращение Тома ---------- */
  const spinCard = document.getElementById('spinCard');
  const spinFrame = document.getElementById('spinFrame');
  const spinBadge = document.getElementById('spinBadge');
  const spinBar = document.getElementById('spinBar');
  const spinPrev = document.getElementById('spinPrev');
  const spinNext = document.getElementById('spinNext');

  if (spinCard && spinFrame) {
    const SPIN_TOTAL = 30;
    const SPIN_DIR = 'img/';
    const SPIN_PREFIX = 'tom';
    const SPIN_EXT = '.jpg';

    const frameUrl = (index) => {
      const number = String(index + 1).padStart(2, '0');
      return `${SPIN_DIR}${SPIN_PREFIX}${number}${SPIN_EXT}`;
    };

    /* Предзагрузка всех кадров в память (декодирование тоже) */
    const SPIN_W = 1280;
    const SPIN_H = 718;
    const SPIN_ZOOM = 1.06;

    const spinImages = [];
    const spinReady = [];

    const canvas = document.getElementById('spinCanvas');
    const spinFallback = spinFrame.querySelector('.spin-fallback');
    const ctx = canvas && typeof canvas.getContext === 'function'
      ? canvas.getContext('2d', { alpha: false })
      : null;

    let spinIndex = 0;
    let spinPointerId = null;
    let spinStartX = 0;
    let spinStartIndex = 0;
    let spinDragging = false;
    let spinRaf = 0;
    let spinPainted = -1;

    const spinPerFrame = () => Math.max(6, Math.round(spinCard.clientWidth / (SPIN_TOTAL * 1.15)));

    /* Один кадр = один drawImage уже декодированной картинки:
       без подмены src, без промежуточных состояний и без просветов между слоями. */
    const paintSpin = () => {
      spinRaf = 0;
      if (!ctx || !canvas.width || spinPainted === spinIndex) return;

      /* Если нужный кадр ещё декодируется, рисуем ближайший готовый:
         блок никогда не пустеет и не показывает чужой промежуточный кадр.
         Когда целевой кадр станет готов, markReady запросит перерисовку. */
      let drawIndex = spinIndex;
      if (!spinReady[drawIndex]) {
        drawIndex = -1;
        for (let offset = 1; offset < SPIN_TOTAL; offset += 1) {
          const before = spinIndex - offset;
          const after = spinIndex + offset;
          if (before >= 0 && spinReady[before]) { drawIndex = before; break; }
          if (after < SPIN_TOTAL && spinReady[after]) { drawIndex = after; break; }
        }
      }

      if (drawIndex < 0) return;

      const image = spinImages[drawIndex];
      if (!image || !image.naturalWidth) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / SPIN_W, ch / SPIN_H) * SPIN_ZOOM;
      const dw = SPIN_W * scale;
      const dh = SPIN_H * scale;

      ctx.drawImage(image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      spinPainted = drawIndex;

      /* Подложка с первым кадром остаётся снизу, canvas проявляется поверх неё */
      spinFrame.classList.add('is-painted');
    };

    const scheduleSpin = () => {
      if (!spinRaf) spinRaf = requestAnimationFrame(paintSpin);
    };

    /* Буфер canvas под реальный размер и плотность пикселей экрана */
    const sizeSpinCanvas = () => {
      if (!canvas) return;
      const rect = spinFrame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      spinPainted = -1;
      paintSpin();

      if (spinPainted === -1) scheduleSpin();
    };

    for (let i = 0; i < SPIN_TOTAL; i += 1) {
      const image = new Image();
      image.decoding = 'async';
      spinImages.push(image);
      spinReady.push(false);

      const markReady = () => {
        spinReady[i] = true;
        if (i === spinIndex) scheduleSpin();
      };

      image.addEventListener('load', () => {
        if (typeof image.decode === 'function') {
          image.decode().then(markReady, markReady);
        } else {
          markReady();
        }
      }, { once: true });

      image.addEventListener('error', () => {
        spinReady[i] = false;
      }, { once: true });

      image.src = frameUrl(i);

      if (image.complete && image.naturalWidth) markReady();
    }

    const renderSpin = (nextIndex) => {
      const clamped = Math.min(SPIN_TOTAL - 1, Math.max(0, nextIndex));
      if (clamped === spinIndex && spinPainted === spinIndex) return;
      spinIndex = clamped;

      /* Размер буфера сверяем лениво: это дешёвая проверка без изменений,
         зато кадр не растянется, если окно изменили между событиями. */
      sizeSpinCanvas();

      if (ctx) {
        scheduleSpin();
      } else if (spinFallback) {
        /* Резерв без canvas: обычная подмена картинки */
        spinFallback.hidden = false;
        spinFallback.style.display = '';
        const url = frameUrl(clamped);
        if (spinFallback.getAttribute('src') !== url) spinFallback.src = url;
      }

      if (canvas) {
        canvas.setAttribute('aria-label', `Том, кадр ${clamped + 1} из ${SPIN_TOTAL}`);
      }
      if (spinBadge) {
        spinBadge.textContent = `${String(clamped + 1).padStart(2, '0')} / ${SPIN_TOTAL}`;
      }
      if (spinBar) {
        spinBar.style.width = `${((clamped + 1) / SPIN_TOTAL) * 100}%`;
      }
      if (spinPrev) spinPrev.disabled = clamped === 0;
      if (spinNext) spinNext.disabled = clamped === SPIN_TOTAL - 1;
    };

    renderSpin(0);
    sizeSpinCanvas();
    window.addEventListener('resize', sizeSpinCanvas);

    const stepSpin = (delta) => renderSpin(spinIndex + delta);

    /* Мышь: вращение по горизонтальному движению над блоком */
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (supportsHover) {
      spinCard.addEventListener('mousemove', (event) => {
        const rect = spinCard.getBoundingClientRect();
        if (rect.width === 0) return;
        const raw = (event.clientX - rect.left) / rect.width;
        // небольшой запас по краям, чтобы первый и последний кадры достигались легко
        const ratio = Math.min(1, Math.max(0, (raw - 0.03) / 0.94));
        renderSpin(Math.round(ratio * (SPIN_TOTAL - 1)));
      });

      spinCard.addEventListener('mouseenter', () => {
        spinCard.classList.add('is-active');
      });

      spinCard.addEventListener('mouseleave', () => {
        spinCard.classList.remove('is-active');
      });
    }

    /* Сенсор: свайп */
    spinCard.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      spinPointerId = event.pointerId;
      spinStartX = event.clientX;
      spinStartIndex = spinIndex;
      spinDragging = true;
      spinCard.classList.add('is-active');
    });

    spinCard.addEventListener('pointermove', (event) => {
      if (!spinDragging || event.pointerId !== spinPointerId) return;
      const delta = event.clientX - spinStartX;
      renderSpin(spinStartIndex - Math.round(delta / spinPerFrame()));
    });

    const endSpinDrag = (event) => {
      if (event.pointerId !== spinPointerId) return;
      spinDragging = false;
      spinPointerId = null;
      spinCard.classList.remove('is-active');
    };

    spinCard.addEventListener('pointerup', endSpinDrag);
    spinCard.addEventListener('pointercancel', endSpinDrag);
    spinCard.addEventListener('pointerleave', endSpinDrag);

    /* Клавиатура и кнопки */
    spinCard.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepSpin(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepSpin(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        renderSpin(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        renderSpin(SPIN_TOTAL - 1);
      }
    });

    if (spinPrev) spinPrev.addEventListener('click', () => stepSpin(-1));
    if (spinNext) spinNext.addEventListener('click', () => stepSpin(1));

    /* Первый кадр уже стоит в разметке */
  }

  /* ---------- Плавное появление блоков при скролле (fade-in-up) ---------- */
  /* Чистый IntersectionObserver: без библиотек и без обработчиков scroll,
     поэтому прокрутка не дёргается даже на слабых телефонах.
     Блок 3D-котика (.spin-card) намеренно не анимируется — его кадры
     рисуются на canvas, и лишние transform/opacity сломали бы рендер. */
  const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));

  const showReveal = (item) => {
    const delay = Number(item.dataset.revealDelay || 0);
    if (delay > 0) item.style.setProperty('--fx-delay', `${delay}ms`);

    /* Аппаратное ускорение: заранее подсказываем, что анимируем opacity/transform.
       На мобильных translateZ(0) принудительно создаёт GPU-слой до старта анимации. */
    item.style.willChange = 'opacity, transform';
    if (window.matchMedia('(max-width: 760px)').matches) {
      item.style.transform = 'translateZ(0) translate3d(0, var(--fx-lift, 15px), 0)';
    }

    item.classList.add('fx-in');

    /* После анимации оставляем элемент видимым: добавляем класс-фиксатор,
       а fx-in снимаем, чтобы не держать лишние слои композитора. */
    item.addEventListener('animationend', () => {
      item.classList.remove('fx-in');
      item.classList.add('is-revealed');
      /* Чистим will-change после анимации — не держим GPU-слои зря */
      item.style.willChange = '';
      item.style.transform = '';
    }, { once: true });

    /* Страховка на случай прерванной анимации или фоновой вкладки.
       На мобильных анимация короче (0.4s), поэтому таймаут уменьшаем. */
    window.setTimeout(() => {
      item.classList.remove('fx-in');
      item.classList.add('is-revealed');
      item.style.willChange = '';
      item.style.transform = '';
    }, delay + (window.matchMedia('(max-width: 760px)').matches ? 800 : 1400));
  };

  if ('IntersectionObserver' in window && !reduceMotion.matches && revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        showReveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((item) => {
      /* Блок 3D отсекаем прямо здесь, даже если data-reveal добавят позже */
      if (item.closest('#spinCard')) return;
      /* Скрытые плитки галереи показываем через кнопку «Ещё», не через скролл */
      if (item.classList.contains('gallery-hidden')) return;
      revealObserver.observe(item);
    });
  }

  /* ---------- GSAP анимации заголовков (Awwwards-стиль) ---------- */
  if (window.gsap && !reduceMotion.matches) {
    const { gsap } = window;

    /* Регистрируем ScrollTrigger для анимации при скролле */
    if (typeof gsap.registerPlugin === 'function') {
      try {
        gsap.registerPlugin(window.ScrollTrigger || gsap.core.globals().ScrollTrigger);
      } catch (e) {
        /* ScrollTrigger не загружен — анимация при скролле не будет */
      }
    }

    console.log('GSAP работает');
    console.log('Анимация Тома запущена');

    /* Главный заголовок "Том": буквы вылетают снизу с блюром при загрузке */
    const heroLetters = document.querySelectorAll('.hero-name .letter');
    if (heroLetters.length) {
      gsap.set(heroLetters, { y: 60, filter: 'blur(12px)', opacity: 0 });
      gsap.to(heroLetters, {
        duration: 0.8,
        y: 0,
        filter: 'blur(0px)',
        opacity: 1,
        stagger: 0.12,
        ease: 'back.out(1.7)',
        delay: 0.2,
      });
    }

    /* Заголовок 3D-блока: текст выезжает справа при скролле */
    const spinTitle = document.querySelector('#spin-title');
    if (spinTitle) {
      gsap.from(spinTitle, {
        scrollTrigger: {
          trigger: '#spin',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        duration: 1.2,
        x: 120,
        opacity: 0,
        ease: 'power3.out',
      });
    }
  }

  /* ---------- Тянущийся шнурок со скроллом (GSAP + ScrollTrigger) ---------- */
  const stringPath = document.getElementById('stringPath');
  const scrollString = document.getElementById('scrollString');

  if (stringPath && scrollString && !reduceMotion.matches) {
    console.log('Шнурок отрисован');
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const pathLength = docHeight * 2;

    /* Путь шнурка: от верхнего края до низа документа */
    stringPath.setAttribute(
      'd',
      `M 40 0 L 40 ${pathLength}`
    );

    stringPath.style.strokeDasharray = pathLength;
    stringPath.style.strokeDashoffset = pathLength;

    gsap.to(stringPath, {
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: `bottom bottom`,
        scrub: true,
        invalidateOnRefresh: true,
      },
      strokeDashoffset: 0,
      duration: 1,
      ease: 'none',
    });

    /* Обновляем высоту пути при ресайзе */
    window.addEventListener('resize', () => {
      const newHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      const newLength = newHeight * 2;
      stringPath.setAttribute('d', `M 40 0 L 40 ${newLength}`);
      stringPath.style.strokeDasharray = newLength;
    });
  }

  /* ---------- Печатная машинка для текста «Обо мне» ---------- */
  const typewriterEls = Array.from(document.querySelectorAll('[data-typewriter]'));

  if (typewriterEls.length && !reduceMotion.matches) {
    const typeWriterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        typeWriterObserver.unobserve(el);
        runTypewriter(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    typewriterEls.forEach((el) => typeWriterObserver.observe(el));
  }

  const runTypewriter = (el) => {
    const fullText = el.textContent;
    const speed = Number(el.dataset.typewriterSpeed || 40);
    el.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);

    let i = 0;
    const timer = setInterval(() => {
      el.textContent = fullText.slice(0, i + 1);
      el.appendChild(cursor);
      i += 1;

      if (i >= fullText.length) {
        clearInterval(timer);
        el.classList.add('done');
      }
    }, speed);
  };

  /* ---------- Галерея: кнопка «Ещё фотографии / Свернуть» ---------- */
  const galleryMoreBtn = document.getElementById('galleryMore');
  const galleryMoreText = galleryMoreBtn?.querySelector('.gallery-more-text');
  const hiddenTiles = Array.from(document.querySelectorAll('.gallery-grid .gallery-hidden'));
  const initiallyHiddenTiles = [...hiddenTiles]; // сохраняем исходный список для свертывания

  if (galleryMoreBtn && hiddenTiles.length) {
    let isExpanded = false;

    galleryMoreBtn.addEventListener('click', () => {
      if (!isExpanded) {
        /* --- РАЗВОРАЧИВАЕМ: показываем скрытые плитки --- */
        hiddenTiles.forEach((tile, index) => {
          tile.classList.remove('gallery-hidden');
          tile.style.setProperty('--fx-delay', `${index * 70}ms`);
          tile.classList.add('gallery-fade-in');

          tile.addEventListener('animationend', () => {
            tile.classList.remove('gallery-fade-in');
            tile.classList.add('is-revealed');
            tile.style.willChange = '';
            tile.style.removeProperty('--fx-delay');
          }, { once: true });

          window.setTimeout(() => {
            if (tile.classList.contains('gallery-fade-in')) {
              tile.classList.remove('gallery-fade-in');
              tile.classList.add('is-revealed');
              tile.style.willChange = '';
              tile.style.removeProperty('--fx-delay');
            }
          }, index * 70 + 800);
        });

        /* Меняем текст кнопки */
        if (galleryMoreText) galleryMoreText.textContent = 'Свернуть галерею';
        isExpanded = true;
      } else {
        /* --- СВЁРТЫВАЕМ: скрываем дополнительные плитки обратно --- */
        initiallyHiddenTiles.forEach((tile) => {
          /* Убираем классы анимации и состояния */
          tile.classList.remove('gallery-fade-in', 'is-revealed');
          tile.style.willChange = '';
          tile.style.removeProperty('--fx-delay');
          tile.style.removeProperty('opacity');
          tile.style.removeProperty('transform');
          /* Возвращаем класс скрытия */
          tile.classList.add('gallery-hidden');
        });

        /* Меняем текст кнопки обратно */
        if (galleryMoreText) galleryMoreText.textContent = 'Ещё фотографии котика';
        isExpanded = false;

        /* Прокручиваем к началу галереи для удобства */
        const gallerySection = document.getElementById('gallery');
        if (gallerySection) {
          gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  /* ---------- Камера-зум к кнопке «Погладить» ---------- */
  const page = document.getElementById('page');
  const zoomCta = document.querySelector('.nav-cta');
  const zoomFx = document.getElementById('zoomFx');
  let isZooming = false;

  /* ---------- Галерея: 3D-наклон плиток при наведении ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches) {
    const grid = document.getElementById('galleryGrid');
    const TILT_MAX = 6; // градусы

    const handleTilt = (event, tile) => {
      const rect = tile.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ((event.clientX - cx) / (rect.width / 2)) * TILT_MAX;
      const dy = -((event.clientY - cy) / (rect.height / 2)) * TILT_MAX;
      tile.style.transform = `perspective(900px) rotateX(${dy}deg) rotateY(${dx}deg) scale(1.02)`;
      tile.style.transition = 'none';
    };

    const resetTilt = (tile) => {
      tile.style.transform = '';
      tile.style.transition = '';
    };

    grid.addEventListener('mouseover', (event) => {
      const tile = event.target.closest('.tile');
      if (!tile || tile.closest('#spinCard')) return;
      tile.addEventListener('mousemove', onTileMove);
      tile.addEventListener('mouseleave', onTileLeave);
    });

    const onTileMove = (event) => {
      const tile = event.currentTarget;
      handleTilt(event, tile);
    };

    const onTileLeave = (event) => {
      const tile = event.currentTarget;
      resetTilt(tile);
      tile.removeEventListener('mousemove', onTileMove);
      tile.removeEventListener('mouseleave', onTileLeave);
    };
  }

  const centerPetButton = (behavior) => {
    const rect = petBtn.getBoundingClientRect();
    const centerY = window.scrollY + rect.top + rect.height / 2;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const top = Math.min(Math.max(centerY - window.innerHeight / 2, 0), maxScroll);
    window.scrollTo({ top, behavior });
  };

  const playZoom = (fromKeyboard) => {
    const pageRect = page.getBoundingClientRect();
    const btnRect = petBtn.getBoundingClientRect();
    const centerX = btnRect.left + btnRect.width / 2;
    const centerY = btnRect.top + btnRect.height / 2;

    page.style.setProperty('--zoom-origin', `${centerX - pageRect.left}px ${centerY - pageRect.top}px`);
    zoomFx.style.setProperty('--fx-x', `${centerX}px`);
    zoomFx.style.setProperty('--fx-y', `${centerY}px`);
    zoomFx.classList.add('is-on');
    void page.offsetWidth;
    page.classList.add('is-zooming');

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      page.classList.remove('is-zooming');
      page.style.removeProperty('--zoom-origin');
      page.removeEventListener('animationend', onAnimationEnd);
      zoomFx.classList.remove('is-on');
      petBtn.classList.add('is-hinting');
      window.setTimeout(() => petBtn.classList.remove('is-hinting'), 2400);
      if (fromKeyboard) petBtn.focus({ preventScroll: true });
      isZooming = false;
    };

    function onAnimationEnd(event) {
      if (event.target === page && event.animationName === 'camera-zoom') finish();
    }

    page.addEventListener('animationend', onAnimationEnd);
    window.setTimeout(finish, 2200);
  };

  if (page && zoomCta && zoomFx && petBtn) {
    zoomCta.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (isZooming) return;

      const fromKeyboard = event.detail === 0;
      isZooming = true;

      centerPetButton(reduceMotion.matches ? 'auto' : 'smooth');

      if (reduceMotion.matches) {
        petBtn.focus({ preventScroll: true });
        isZooming = false;
        return;
      }

      let started = false;
      const begin = () => {
        if (started) return;
        started = true;
        window.removeEventListener('scrollend', begin);
        playZoom(fromKeyboard);
      };

      const rect = petBtn.getBoundingClientRect();
      const alreadyCentered = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) < 4;

      if (alreadyCentered) {
        window.setTimeout(begin, 40);
      } else {
        window.addEventListener('scrollend', begin, { once: true });
        window.setTimeout(begin, 700);
      }
    });
  }
})();
  
