// --- Theme toggle button ---
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleBtn = document.getElementById('theme-toggle');

function updateIcons() {
  if (document.documentElement.classList.contains('dark')) {
    themeToggleLightIcon.classList.remove('hidden');
    themeToggleDarkIcon.classList.add('hidden');
  } else {
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }
}

updateIcons();

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

// --- Academic progress ring (Supabase) ---
const SUPABASE_URL = "https://kjicmfnpxefzquowngua.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWNtZm5weGVmenF1b3duZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzM3MDksImV4cCI6MjA5Nzc0OTcwOX0.hAyR9gYPl0CLQxZK5ehXyDQWVR3XKubyBAs9ooLmeh4";
const CIRCUMFERENCE = 263.89; // 2 * PI * r(42)
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadAcademicProgress() {
  if (!supabaseClient) {
    console.error('Supabase no esta inicializado.');
    document.getElementById('academic-detail-text').textContent =
      'No se pudo inicializar Supabase.';
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
    document.getElementById('academic-detail-text').textContent =
      'No se pudo cargar el avance académico.';
  }
}

function renderProgress(aprobadas, total, percent) {
  const circle = document.getElementById('progress-ring-fill');
  const label = document.getElementById('progress-percent');
  const detail = document.getElementById('academic-detail-text');

  detail.textContent = `Avance actual: ${aprobadas} de ${total} clases aprobadas.`;

  requestAnimationFrame(() => {
    circle.style.strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
  });

  let current = 0;
  const step = Math.max(1, Math.round(percent / 40));
  const interval = setInterval(() => {
    current = Math.min(current + step, percent);
    label.textContent = current + '%';
    if (current >= percent) clearInterval(interval);
  }, 25);
}

loadAcademicProgress();