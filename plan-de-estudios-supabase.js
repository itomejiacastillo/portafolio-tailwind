const SUPABASE_CONFIG = {
  url: "https://kjicmfnpxefzquowngua.supabase.co/rest/v1/",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWNtZm5weGVmenF1b3duZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzM3MDksImV4cCI6MjA5Nzc0OTcwOX0.hAyR9gYPl0CLQxZK5ehXyDQWVR3XKubyBAs9ooLmeh4",
  subjectsTable: "asignaturas",
  gradesTable: "calificaciones_publicas",
  gradeStatusApproved: "APROBADO",
  gradeStatusPending: "PENDIENTE",
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
  loginButton: document.getElementById("login-button"),
  authModal: document.getElementById("auth-modal"),
  authModalClose: document.getElementById("auth-modal-close"),
  loginForm: document.getElementById("login-form"),
  loginSubmit: document.getElementById("login-submit"),
  authMessage: document.getElementById("auth-message"),
  editModal: document.getElementById("edit-modal"),
  editModalClose: document.getElementById("edit-modal-close"),
  editForm: document.getElementById("edit-form"),
  editCode: document.getElementById("edit-code"),
  editName: document.getElementById("edit-name"),
  editStatus: document.getElementById("edit-status"),
  editGrade: document.getElementById("edit-grade"),
  editGradeContainer: document.getElementById("edit-grade-container"),
  editSubmit: document.getElementById("edit-submit"),
};

let supabaseClient = null;
let authSession = null;
let currentSubjects = [];
let currentApprovedCodes = new Set();

function isConfigured() {
  return (
    SUPABASE_CONFIG.url.startsWith("https://") &&
    !SUPABASE_CONFIG.url.includes("TU-PROYECTO") &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.anonKey.includes("TU_SUPABASE")
  );
}

function getSupabaseProjectUrl() {
  return SUPABASE_CONFIG.url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function initSupabaseClient() {
  if (!isConfigured() || !window.supabase?.createClient) return null;

  supabaseClient = window.supabase.createClient(getSupabaseProjectUrl(), SUPABASE_CONFIG.anonKey);
  return supabaseClient;
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

function showAuthMessage(message, tone = "info") {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-900",
  };

  elements.authMessage.className = `rounded-lg border p-3 text-sm ${tones[tone]}`;
  elements.authMessage.textContent = message;
}

function hideAuthMessage() {
  elements.authMessage.classList.add("hidden");
  elements.authMessage.textContent = "";
}

function openAuthModal() {
  hideAuthMessage();
  elements.authModal.classList.remove("hidden");
  elements.authModal.classList.add("flex");
  document.getElementById("login-email").focus();
}

function closeAuthModal() {
  elements.authModal.classList.add("hidden");
  elements.authModal.classList.remove("flex");
  elements.loginForm.reset();
  hideAuthMessage();
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
  const token = authSession?.access_token || SUPABASE_CONFIG.anonKey;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${token}`,
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

async function saveApprovalStatus(code, approved) {
  if (!supabaseClient || !authSession) {
    throw new Error("Debes iniciar sesion para editar.");
  }

  const status = approved ? SUPABASE_CONFIG.gradeStatusApproved : SUPABASE_CONFIG.gradeStatusPending;
  const payload = {
    codigo_clase: code,
    status,
  };

  const { data, error: updateError } = await supabaseClient
    .from(SUPABASE_CONFIG.gradesTable)
    .update({ status })
    .eq("codigo_clase", code)
    .select("codigo_clase");

  if (updateError) throw updateError;
  if (data.length > 0 || !approved) return;

  const { error: insertError } = await supabaseClient
    .from(SUPABASE_CONFIG.gradesTable)
    .insert(payload);

  if (insertError) throw insertError;
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
  row.className = `flex gap-2 rounded-md px-1 py-1 text-sm text-gray-800 ${authSession ? "cursor-pointer hover:bg-white" : ""}`;

  const fieldId = `subject-${subject.codigo_clase.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  row.htmlFor = fieldId;

  const checkbox = document.createElement("input");
  checkbox.className = "mt-1 size-4 shrink-0 accent-green-600";
  checkbox.type = "checkbox";
  checkbox.id = fieldId;
  checkbox.name = `subject_${subject.codigo_clase.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  checkbox.checked = approvedCodes.has(subject.codigo_clase);
  checkbox.dataset.code = subject.codigo_clase;

  if (!authSession) {
    checkbox.setAttribute("aria-readonly", "true");
    checkbox.tabIndex = -1;
    checkbox.classList.add("pointer-events-none", "cursor-not-allowed");
  } else {
    checkbox.removeAttribute("aria-readonly");
    checkbox.addEventListener("click", (event) => {
      event.preventDefault();
      openEditModal(subject);
    });
  }

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

function toggleGradeField() {
  const isApproved = elements.editStatus.value === "APROBADO";
  if (isApproved) {
    elements.editGrade.disabled = false;
    if (elements.editGrade.value === "0") {
      elements.editGrade.value = "";
    }
    elements.editGradeContainer.classList.remove("opacity-50");
  } else {
    elements.editGrade.disabled = true;
    elements.editGrade.value = 0;
    elements.editGradeContainer.classList.add("opacity-50");
  }
}

function closeEditModal() {
  elements.editModal.classList.add("hidden");
  elements.editModal.classList.remove("flex");
  elements.editForm.reset();
}

async function openEditModal(subject) {
  elements.editCode.textContent = subject.codigo_clase;
  elements.editName.textContent = subject.nombre_clase || "Asignatura sin nombre";

  elements.editStatus.disabled = true;
  elements.editGrade.disabled = true;
  elements.editSubmit.disabled = true;
  
  const isApproved = currentApprovedCodes.has(subject.codigo_clase);
  elements.editStatus.value = isApproved ? "APROBADO" : "PENDIENTE";
  elements.editGrade.value = "0";

  elements.editModal.classList.remove("hidden");
  elements.editModal.classList.add("flex");

  try {
    const token = authSession?.access_token || SUPABASE_CONFIG.anonKey;
    const response = await fetch(`${SUPABASE_CONFIG.url}calificaciones?codigo_clase=eq.${encodeURIComponent(subject.codigo_clase)}`, {
      headers: {
        apikey: SUPABASE_CONFIG.anonKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const record = data[0];
        elements.editStatus.value = record.status || "PENDIENTE";
        elements.editGrade.value = record.calificacion !== undefined && record.calificacion !== null ? record.calificacion : "0";
      }
    }
  } catch (error) {
    console.error("Error al obtener la calificación:", error);
  } finally {
    elements.editStatus.disabled = false;
    elements.editSubmit.disabled = false;
    toggleGradeField();
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();

  if (!supabaseClient || !authSession) {
    showStatus("Debes iniciar sesión para editar.", "error");
    return;
  }

  const code = elements.editCode.textContent;
  const status = elements.editStatus.value;
  const val = Number(elements.editGrade.value) || 0;

  elements.editSubmit.disabled = true;
  elements.editSubmit.textContent = "Guardando...";

  try {
    // Intentar actualizar el registro existente en calificaciones
    const { data, error: updateError } = await supabaseClient
      .from("calificaciones")
      .update({ status, calificacion: val })
      .eq("codigo_clase", code)
      .select("codigo_clase");

    if (updateError) throw updateError;

    // Si no se actualizó ninguna fila, insertamos un nuevo registro
    if (!data || data.length === 0) {
      const { error: insertError } = await supabaseClient
        .from("calificaciones")
        .insert({ codigo_clase: code, status, calificacion: val });
      if (insertError) throw insertError;
    }

    if (status === "APROBADO") {
      currentApprovedCodes.add(code);
    } else {
      currentApprovedCodes.delete(code);
    }

    showStatus("Cambio guardado correctamente.", "success");
    closeEditModal();
    rerenderCurrentSubjects();
  } catch (error) {
    console.error(error);
    showStatus("No se pudo guardar el cambio. Revisa las políticas RLS.", "error");
  } finally {
    elements.editSubmit.disabled = false;
    elements.editSubmit.textContent = "Guardar";
  }
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
    if (!authSession) {
      checkbox.addEventListener("click", (event) => event.preventDefault());
      checkbox.addEventListener("keydown", (event) => event.preventDefault());
    }
  });
}

function renderSubjects(subjects, approvedCodes) {
  currentSubjects = subjects;
  currentApprovedCodes = new Set(approvedCodes);
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

function rerenderCurrentSubjects() {
  if (currentSubjects.length > 0) {
    renderSubjects(currentSubjects, currentApprovedCodes);
  }
}

function updateAuthUi() {
  if (!elements.loginButton) return;

  if (authSession) {
    elements.loginButton.textContent = "Salir";
    elements.loginButton.className = "self-start py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-800 focus:outline-none dark:border-transparent dark:text-neutral-400 dark:hover:text-neutral-200";
    showStatus("Sesion iniciada. Puedes editar las clases aprobadas desde los checks.", "success");
  } else {
    elements.loginButton.textContent = "Ingresar";
    elements.loginButton.className = "self-start py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-800 focus:outline-none dark:border-transparent dark:text-neutral-400 dark:hover:text-neutral-200";
  }

  rerenderCurrentSubjects();
}

async function initAuth() {
  const client = initSupabaseClient();

  if (!client) {
    updateAuthUi();
    return;
  }

  const { data } = await client.auth.getSession();
  authSession = data.session;

  client.auth.onAuthStateChange((_event, session) => {
    authSession = session;
    updateAuthUi();
  });

  updateAuthUi();
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    showAuthMessage("No se pudo inicializar Supabase Auth. Revisa la URL y la anon key.", "error");
    return;
  }

  const formData = new FormData(elements.loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  elements.loginSubmit.disabled = true;
  elements.loginSubmit.textContent = "Ingresando...";
  hideAuthMessage();

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  elements.loginSubmit.disabled = false;
  elements.loginSubmit.textContent = "Iniciar sesion";

  if (error) {
    showAuthMessage("No se pudo iniciar sesion. Revisa correo y contrasena.", "error");
    return;
  }

  showAuthMessage("Sesion iniciada correctamente.", "success");
  window.setTimeout(closeAuthModal, 500);
}

async function handleLoginButtonClick() {
  if (authSession && supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      showStatus("No se pudo cerrar sesion.", "error");
      return;
    }

    hideStatus();
    return;
  }

  openAuthModal();
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
  initAuth();
  elements.loginButton.addEventListener("click", handleLoginButtonClick);
  elements.authModalClose.addEventListener("click", closeAuthModal);
  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) closeAuthModal();
  });
  elements.loginForm.addEventListener("submit", handleLoginSubmit);

  elements.editModalClose.addEventListener("click", closeEditModal);
  elements.editModal.addEventListener("click", (event) => {
    if (event.target === elements.editModal) closeEditModal();
  });
  elements.editStatus.addEventListener("change", toggleGradeField);
  elements.editForm.addEventListener("submit", handleEditSubmit);

  loadSubjects();
});