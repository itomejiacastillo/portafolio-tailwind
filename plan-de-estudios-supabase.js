const SUPABASE_CONFIG = {
  url: "https://kjicmfnpxefzquowngua.supabase.co/rest/v1/",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWNtZm5weGVmenF1b3duZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzM3MDksImV4cCI6MjA5Nzc0OTcwOX0.hAyR9gYPl0CLQxZK5ehXyDQWVR3XKubyBAs9ooLmeh4",
  subjectsTable: "asignaturas",
  gradesTable: "calificaciones_publicas",
};

const periodNames = {
  1: "I Periodo",
  2: "II Periodo",
  3: "III Periodo",
  4: "IV Periodo",
  5: "V Periodo",
  6: "VI Periodo",
  7: "VII Periodo",
  8: "VIII Periodo",
  9: "IX Periodo",
  10: "X Periodo",
  11: "XI Periodo",
  12: "XII Periodo",
  13: "XIII Periodo",
  14: "XIV Periodo",
  15: "XV Periodo",
  16: "XVI Periodo",
};

const elements = {
  approved: document.getElementById("aprobadas"),
  total: document.getElementById("total-clases"),
  percent: document.getElementById("percent"),
  grid: document.getElementById("subjects-grid"),
  statusPanel: document.getElementById("status-panel"),
  statusMessage: document.getElementById("status-message"),
};

function isConfigured() {
  return (
    SUPABASE_CONFIG.url.startsWith("https://") &&
    !SUPABASE_CONFIG.url.includes("TU-PROYECTO") &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.anonKey.includes("TU_SUPABASE")
  );
}

function showStatus(message, tone = "info") {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-900",
  };

  elements.statusPanel.classList.remove("hidden");
  elements.statusMessage.className = `rounded-lg border p-4 text-sm shadow ${tones[tone]}`;
  elements.statusMessage.textContent = message;
}

function hideStatus() {
  elements.statusPanel.classList.add("hidden");
}

function buildSubjectsUrl() {
  const endpoint = new URL(`/rest/v1/${SUPABASE_CONFIG.subjectsTable}`, SUPABASE_CONFIG.url);
  endpoint.searchParams.set("select", "codigo_clase,numero_clase,nombre_clase,unidades_valorativas,anio,periodo");
  endpoint.searchParams.set("order", "anio.asc.nullslast,periodo.asc.nullslast,numero_clase.asc");
  return endpoint.toString();
}

function buildApprovedGradesUrl() {
  const endpoint = new URL(`/rest/v1/${SUPABASE_CONFIG.gradesTable}`, SUPABASE_CONFIG.url);
  endpoint.searchParams.set("select", "codigo_clase,status");
  endpoint.searchParams.set("status", "eq.APROBADO");
  endpoint.searchParams.set("codigo_clase", "not.is.null");
  return endpoint.toString();
}

async function fetchSupabaseJson(url) {
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase respondio ${response.status}: ${details}`);
  }

  return response.json();
}

async function fetchSubjects() {
  return fetchSupabaseJson(buildSubjectsUrl());
}

async function fetchApprovedCodes() {
  const grades = await fetchSupabaseJson(buildApprovedGradesUrl());
  return new Set(grades.map((grade) => grade.codigo_clase).filter(Boolean));
}

function getPeriodNumber(subject) {
  const periodNumber = Number(subject.periodo);
  if (Number.isInteger(periodNumber)) return periodNumber;
  if (Number.isInteger(subject.anio) && periodNames[subject.anio]) return subject.anio;

  return null;
}

function getPeriodLabel(subject) {
  const periodNumber = getPeriodNumber(subject);
  if (periodNumber && periodNames[periodNumber]) return periodNames[periodNumber];
  if (subject.periodo) return subject.periodo;
  if (subject.anio) return `${subject.anio} Periodo`;
  return "Sin periodo";
}

function groupByPeriod(subjects) {
  const groups = subjects.reduce((periodGroups, subject) => {
    const label = getPeriodLabel(subject);
    const order = getPeriodNumber(subject) || 999;

    if (!periodGroups.has(label)) {
      periodGroups.set(label, { label, order, subjects: [] });
    }

    periodGroups.get(label).subjects.push(subject);
    return periodGroups;
  }, new Map());

  return [...groups.values()].sort((current, next) => current.order - next.order);
}

function createSubjectRow(subject, approvedCodes) {
  const row = document.createElement("label");
  row.className = "flex gap-2 rounded-md px-1 py-1 text-sm text-gray-800";

  const fieldId = `subject-${subject.codigo_clase.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  row.htmlFor = fieldId;

  const checkbox = document.createElement("input");
  checkbox.className = "mt-1 size-4 shrink-0 accent-green-600";
  checkbox.type = "checkbox";
  checkbox.id = fieldId;
  checkbox.name = `subject_${subject.codigo_clase.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  checkbox.checked = approvedCodes.has(subject.codigo_clase);
  checkbox.dataset.code = subject.codigo_clase;
  checkbox.setAttribute("aria-readonly", "true");
  checkbox.tabIndex = -1;

  const content = document.createElement("span");
  content.className = "min-w-0";

  const name = document.createElement("span");
  name.className = "block leading-snug";
  name.textContent = subject.nombre_clase || "Asignatura sin nombre";

  const meta = document.createElement("span");
  meta.className = "block text-xs text-gray-500";
  const units = subject.unidades_valorativas ? ` - ${subject.unidades_valorativas} UV` : "";
  meta.textContent = `${subject.codigo_clase}${units}`;

  content.append(name, meta);
  row.append(checkbox, content);
  return row;
}

function updateSummary() {
  const checkboxes = [...document.querySelectorAll("#subjects-grid input[type='checkbox']")];
  const approved = checkboxes.filter((checkbox) => checkbox.checked).length;
  const total = checkboxes.length;
  const percent = total > 0 ? (approved / total) * 100 : 0;

  elements.approved.textContent = String(approved).padStart(2, "0");
  elements.total.textContent = String(total).padStart(2, "0");
  elements.percent.textContent = `${percent.toFixed(2)}%`;
}

function bindProgressEvents() {
  document.querySelectorAll("#subjects-grid input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => event.preventDefault());
    checkbox.addEventListener("keydown", (event) => event.preventDefault());
  });
}

function renderSubjects(subjects, approvedCodes) {
  const groupedSubjects = groupByPeriod(subjects);
  elements.grid.replaceChildren();

  groupedSubjects.forEach((periodGroup) => {
    const card = document.createElement("article");
    card.className = "w-full h-full max-w-sm border border-gray-300 p-4 pb-6 text-base rounded-lg shadow-lg bg-gray-100";

    const title = document.createElement("h2");
    title.className = "font-bold text-xl mb-2";
    title.textContent = periodGroup.label;

    const list = document.createElement("div");
    list.className = "space-y-1";

    periodGroup.subjects.forEach((subject) => {
      list.appendChild(createSubjectRow(subject, approvedCodes));
    });

    card.append(title, list);
    elements.grid.appendChild(card);
  });

  bindProgressEvents();
  updateSummary();
}

function renderLoading() {
  elements.grid.replaceChildren();
  for (let index = 0; index < 8; index += 1) {
    const placeholder = document.createElement("div");
    placeholder.className = "w-full h-40 max-w-sm animate-pulse rounded-lg border border-gray-200 bg-white shadow-lg";
    elements.grid.appendChild(placeholder);
  }
}

async function loadSubjects() {
  if (!isConfigured()) {
    showStatus("Configura SUPABASE_CONFIG.url y SUPABASE_CONFIG.anonKey en plan-de-estudios-supabase.js para consumir la API REST.", "error");
    elements.grid.replaceChildren();
    updateSummary();
    return;
  }

  try {
    hideStatus();
    renderLoading();
    const subjects = await fetchSubjects();
    let approvedCodes = new Set();

    try {
      approvedCodes = await fetchApprovedCodes();
    } catch (error) {
      console.error(error);
      showStatus("El plan se cargo, pero no se pudieron leer los estados aprobados. Revisa los permisos de la vista calificaciones_publicas.", "error");
    }

    renderSubjects(subjects, approvedCodes);
  } catch (error) {
    console.error(error);
    elements.grid.replaceChildren();
    updateSummary();
    showStatus("No se pudieron cargar las asignaturas o calificaciones. Revisa la URL, anon key, politicas RLS de SELECT y CORS del proyecto.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();
});
