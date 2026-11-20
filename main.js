// --- Theme toggle button & system preference sync ---
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeMetaTag = document.getElementById('meta-theme-color');

function syncThemeMeta() {
  if (!themeMetaTag) return;
  const isDark = document.documentElement.classList.contains('dark');
  const isTrazabilid = document.documentElement.classList.contains('theme-trazabilidapp');
  const darkColor = isTrazabilid ? '#121417' : '#0F0E0C';
  const lightColor = isTrazabilid ? '#F6F7F9' : '#F6F1E7';
  themeMetaTag.setAttribute('content', isDark ? darkColor : lightColor);
}

function updateIcons() {
  if (!themeToggleDarkIcon || !themeToggleLightIcon) return;

  if (document.documentElement.classList.contains('dark')) {
    themeToggleLightIcon.classList.remove('hidden');
    themeToggleDarkIcon.classList.add('hidden');
  } else {
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }

  syncThemeMeta();
}

updateIcons();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', function () {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
    updateIcons();
  });
}

const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
if (colorSchemeQuery && typeof colorSchemeQuery.addEventListener === 'function') {
  colorSchemeQuery.addEventListener('change', function (event) {
    if ('color-theme' in localStorage) return;
    if (event.matches) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    updateIcons();
  });
}

// --- Mobile navigation menu ---
const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (mobileMenuBtn && mobileNav) {
  const openIcon = mobileMenuBtn.querySelector('[data-menu-icon="open"]');
  const closeIcon = mobileMenuBtn.querySelector('[data-menu-icon="close"]');

  function setMenuOpen(isOpen) {
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    mobileMenuBtn.setAttribute(
      'aria-label',
      isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
    );
    mobileNav.classList.toggle('hidden', !isOpen);
    if (openIcon) openIcon.classList.toggle('hidden', isOpen);
    if (closeIcon) closeIcon.classList.toggle('hidden', !isOpen);
  }

  mobileMenuBtn.addEventListener('click', function () {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isExpanded);
  });

  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && mobileMenuBtn.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      mobileMenuBtn.focus();
    }
  });
}

// --- Subtle scroll reveal (once, 8px + opacity) ---
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = document.querySelectorAll('[data-reveal]');

if (revealTargets.length > 0 && !reduceMotionQuery.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px -18% 0px' }
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });
}

// --- Hero Typewriter animation (respects prefers-reduced-motion, zero CLS) ---
const heroTypewriter = document.getElementById('hero-typewriter');
const heroSizer = document.querySelector('.hero-typewriter-sizer');

if (heroTypewriter && heroSizer && !reduceMotionQuery.matches) {
  const leadText = 'Software que sirve, ';
  const accentText = 'y funciona.';
  const totalChars = leadText.length + accentText.length;

  heroSizer.classList.add('is-measuring');
  heroSizer.setAttribute('aria-hidden', 'true');

  const leadNode = document.createTextNode('');
  const accentEl = document.createElement('em');
  accentEl.className = 'accent-italic';
  const caret = document.createElement('span');
  caret.className = 'typewriter-caret';
  caret.setAttribute('aria-hidden', 'true');

  heroTypewriter.append(leadNode, accentEl, caret);

  let index = 0;
  const charDelay = 38;

  function stepTypewriter() {
    index += 1;
    if (index <= leadText.length) {
      leadNode.nodeValue = leadText.slice(0, index);
    } else {
      leadNode.nodeValue = leadText;
      accentEl.textContent = accentText.slice(0, index - leadText.length);
    }

    if (index < totalChars) {
      window.setTimeout(stepTypewriter, charDelay);
    } else {
      caret.classList.add('is-done');
    }
  }

  window.setTimeout(stepTypewriter, 120);
}

// --- Academic progress ring & 61-cell bar (Supabase) ---
const progressRingWrapper = document.getElementById('progress-ring-wrapper');

if (progressRingWrapper) {
  const SUPABASE_URL = 'https://kjicmfnpxefzquowngua.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWNtZm5weGVmenF1b3duZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzM3MDksImV4cCI6MjA5Nzc0OTcwOX0.hAyR9gYPl0CLQxZK5ehXyDQWVR3XKubyBAs9ooLmeh4';
  const CIRCUMFERENCE = 364.42; // 2 * PI * r(58) para anillo de 140px
  const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const educationCard = document.getElementById('education-card');
  const circle = document.getElementById('progress-ring-fill');
  const label = document.getElementById('progress-percent');
  const detail = document.getElementById('academic-detail-text');
  const cellsGrid = document.getElementById('progress-cells');
  const approvedLabel = document.getElementById('progress-approved-label');
  const remainingLabel = document.getElementById('progress-remaining-label');

  function setLoadingState(loading) {
    if (educationCard) educationCard.classList.toggle('is-loading', loading);
    progressRingWrapper.classList.toggle('is-loading', loading);
    if (cellsGrid) cellsGrid.classList.toggle('is-loading', loading);
  }

  function renderProgressCells(aprobadas, total) {
    if (!cellsGrid) return;
    const count = Math.max(total, 1);
    cellsGrid.style.setProperty('--cell-count', String(count));
    cellsGrid.setAttribute('aria-label', `${aprobadas} de ${total} asignaturas aprobadas`);

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const cell = document.createElement('span');
      cell.className =
        i < aprobadas ? 'progress-cell progress-cell--approved' : 'progress-cell';
      fragment.appendChild(cell);
    }
    cellsGrid.replaceChildren(fragment);
  }

  function animateProgressNumbers(aprobadas, total, percent) {
    const remaining = Math.max(0, total - aprobadas);

    function applyValues(curApproved, curRemaining, curPercent) {
      if (detail) {
        detail.textContent = `Universidad Politécnica de Honduras · ${curApproved} de ${total} asignaturas aprobadas`;
      }
      if (label) {
        label.textContent = `${curPercent}%`;
      }
      if (approvedLabel) {
        approvedLabel.textContent = `${curApproved} aprobadas`;
      }
      if (remainingLabel) {
        remainingLabel.textContent = `${curRemaining} por cursar`;
      }
    }

    if (circle) {
      requestAnimationFrame(function () {
        circle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - percent / 100));
      });
    }

    if (reduceMotionQuery.matches) {
      applyValues(aprobadas, remaining, percent);
      return;
    }

    const duration = 650;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      applyValues(
        Math.round(aprobadas * eased),
        Math.round(remaining * eased),
        Math.round(percent * eased)
      );

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        applyValues(aprobadas, remaining, percent);
      }
    }

    requestAnimationFrame(tick);
  }

  function renderProgress(aprobadas, total, percent) {
    setLoadingState(false);
    renderProgressCells(aprobadas, total);

    if (reduceMotionQuery.matches || !educationCard || !('IntersectionObserver' in window)) {
      animateProgressNumbers(aprobadas, total, percent);
      return;
    }

    let hasAnimated = false;
    const cardObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || hasAnimated) return;
          hasAnimated = true;
          animateProgressNumbers(aprobadas, total, percent);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    cardObserver.observe(educationCard);
  }

  async function loadAcademicProgress() {
    if (!supabaseClient) {
      setLoadingState(false);
      if (detail) {
        detail.textContent =
          'Universidad Politécnica de Honduras · No se pudo inicializar Supabase.';
      }
      return;
    }

    try {
      const { count: total, error: errTotal } = await supabaseClient
        .from('calificaciones_publicas')
        .select('*', { count: 'exact', head: true });

      const { count: aprobadas, error: errAprob } = await supabaseClient
        .from('calificaciones_publicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APROBADO');

      if (errTotal || errAprob) throw errTotal || errAprob;

      const totalCount = total || 0;
      const approvedCount = aprobadas || 0;
      const percent = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0;
      renderProgress(approvedCount, totalCount, percent);
    } catch (err) {
      console.error('Error cargando avance académico:', err);
      setLoadingState(false);
      if (detail) {
        detail.textContent =
          'Universidad Politécnica de Honduras · No se pudo cargar el avance académico.';
      }
    }
  }

  loadAcademicProgress();
}

// --- Interactive UI theme showcase toggle (TrazabilidApp case study) ---
const uiShowcase = document.getElementById('trazabilid-ui-showcase');
const uiModeButtons = document.querySelectorAll('[data-ui-mode]');

if (uiShowcase && uiModeButtons.length > 0) {
  uiModeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const targetMode = button.getAttribute('data-ui-mode');
      if (!targetMode) return;

      uiShowcase.setAttribute('data-active-mode', targetMode);
      uiModeButtons.forEach(function (btn) {
        const isCurrent = btn === button;
        btn.classList.toggle('is-active', isCurrent);
        btn.setAttribute('aria-pressed', String(isCurrent));
      });
    });
  });
}

// --- TrazabilidApp Dashboard: Backward lineage timeline & screen preview ---
const lineageSteps = document.querySelectorAll('.lineage-step[data-stage]');
const traceLineageBtn = document.getElementById('trace-lineage-btn');
const lineageDetailCode = document.getElementById('lineage-detail-code');
const lineageDetailText = document.getElementById('lineage-detail-text');

if (lineageSteps.length > 0) {
  const stageDetails = {
    5: {
      code: 'ETAPA 05 · EMPAQUE ZPL',
      text: 'Caja EMP-2026-0842 escaneada con Data Matrix · 25 puros · Etiqueta impresa vía Zebra Browser Print.'
    },
    4: {
      code: 'ETAPA 04 · ENTREGA',
      text: 'Despacho interno ENT-0419 hacia línea de empaque · 250 puros recibidos sin faltantes.'
    },
    3: {
      code: 'ETAPA 03 · CALIDAD Y REZAGO',
      text: 'Inspección de lote LOT-2026-0418 · 250 aprobados, 10 en rezago (3.8% merma por vena/tiro).'
    },
    2: {
      code: 'ETAPA 02 · BODEGA Y CURADO',
      text: 'Escaparate B-12 · 42 días de reposo controlado tras salida de galera.'
    },
    1: {
      code: 'ETAPA 01 · GALERA (ORIGEN)',
      text: 'Pareja #14 · Vitola Robusto 5×50 · Capa Habano 2000 · Lote original LOT-2026-0418.'
    }
  };

  let traceTimer = null;

  function setActiveStage(stageNumber, keepPrevious) {
    lineageSteps.forEach(function (step) {
      const num = Number(step.getAttribute('data-stage'));
      const active = keepPrevious ? num >= stageNumber : num === stageNumber;
      step.classList.toggle('is-traced', active);
      step.setAttribute('aria-pressed', String(num === stageNumber));
    });

    const info = stageDetails[stageNumber];
    if (info && lineageDetailCode && lineageDetailText) {
      lineageDetailCode.textContent = info.code;
      lineageDetailText.textContent = info.text;
    }
  }

  lineageSteps.forEach(function (step) {
    step.addEventListener('click', function () {
      if (traceTimer) {
        window.clearTimeout(traceTimer);
        traceTimer = null;
      }
      const stage = Number(step.getAttribute('data-stage'));
      setActiveStage(stage, false);
    });
  });

  if (traceLineageBtn) {
    traceLineageBtn.addEventListener('click', function () {
      if (traceTimer) {
        window.clearTimeout(traceTimer);
        traceTimer = null;
      }

      if (reduceMotionQuery.matches) {
        setActiveStage(1, true);
        return;
      }

      let current = 5;
      function stepBackward() {
        setActiveStage(current, true);
        if (current > 1) {
          current -= 1;
          traceTimer = window.setTimeout(stepBackward, 420);
        } else {
          traceTimer = null;
        }
      }

      stepBackward();
    });
  }
}

const dashWindow = document.getElementById('dash-preview-window');
const dashTabButtons = document.querySelectorAll('[data-dash-tab]');
const dashPanelViews = document.querySelectorAll('[data-dash-panel]');
const dashThemeButtons = document.querySelectorAll('[data-dash-theme]');

if (dashWindow && dashTabButtons.length > 0) {
  dashTabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = btn.getAttribute('data-dash-tab');
      if (!target) return;

      dashTabButtons.forEach(function (b) {
        const isCurrent = b === btn;
        b.classList.toggle('is-active', isCurrent);
        b.setAttribute('aria-selected', String(isCurrent));
      });

      dashPanelViews.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-dash-panel') === target);
      });
    });
  });
}

if (dashWindow && dashThemeButtons.length > 0) {
  dashThemeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const mode = btn.getAttribute('data-dash-theme');
      if (!mode) return;

      dashWindow.setAttribute('data-preview-theme', mode);
      dashThemeButtons.forEach(function (b) {
        const isCurrent = b === btn;
        b.classList.toggle('is-active', isCurrent);
        b.setAttribute('aria-pressed', String(isCurrent));
      });
    });
  });
}
