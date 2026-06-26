const SUPABASE_URL = "https://kjicmfnpxefzquowngua.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaWNtZm5weGVmenF1b3duZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzM3MDksImV4cCI6MjA5Nzc0OTcwOX0.hAyR9gYPl0CLQxZK5ehXyDQWVR3XKubyBAs9ooLmeh4";

const elements = {
  form: document.getElementById("reset-password-form"),
  formContainer: document.getElementById("form-container"),
  userEmailDisplay: document.getElementById("user-email-display"),
  newPassword: document.getElementById("new-password"),
  confirmPassword: document.getElementById("confirm-password"),
  submitButton: document.getElementById("submit-button"),
  statusMessage: document.getElementById("status-message"),
  description: document.getElementById("reset-description"),
};

const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function showMessage(message, tone = "info") {
  if (!elements.statusMessage) return;

  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
  };

  elements.statusMessage.className = `rounded-lg border p-3 text-sm ${tones[tone]}`;
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.remove("hidden");
}

function hideMessage() {
  if (!elements.statusMessage) return;
  elements.statusMessage.classList.add("hidden");
  elements.statusMessage.textContent = "";
}

function getRecoveryParams() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    type: query.get("type") || hash.get("type"),
    accessToken: query.get("access_token") || hash.get("access_token"),
  };
}

async function initRecoveryPage() {
  if (!supabaseClient) {
    showMessage("No se pudo inicializar la librería de Supabase.", "error");
    return;
  }

  // 1. Guardar si el usuario viene de un enlace de recuperación antes de que Supabase limpie/procese la URL
  const recovery = getRecoveryParams();
  const isRecoveryLink = recovery.type === "recovery" || Boolean(recovery.accessToken);

  // Esperamos un momento breve para que la inicialización del cliente de Supabase procese el hash de la URL
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    // Exigimos obligatoriamente que provenga de un link de recuperación y que exista el usuario
    if (!isRecoveryLink || error || !user) {
      showMessage("El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.", "error");
      elements.formContainer.classList.add("hidden");
    } else {
      hideMessage();
      elements.userEmailDisplay.textContent = user.email;
      elements.formContainer.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    showMessage("Ocurrió un error al validar la sesión de recuperación.", "error");
    elements.formContainer.classList.add("hidden");
  }

  // Limpiar el hash por seguridad
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  hideMessage();

  const password = String(elements.newPassword.value || "").trim();
  const confirmPassword = String(elements.confirmPassword.value || "").trim();

  if (!password || !confirmPassword) {
    showMessage("Por favor, ingresa y confirma tu contraseña.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Las contraseñas no coinciden.", "error");
    return;
  }

  elements.submitButton.disabled = true;
  elements.submitButton.textContent = "Guardando...";

  try {
    const { error } = await supabaseClient.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    showMessage("Contraseña restablecida con éxito. Redirigiendo en unos segundos...", "success");
    elements.form.reset();
    setTimeout(() => {
      window.location.href = "plan-de-estudios.html";
    }, 2000);
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    showMessage(error.message || "No se pudo actualizar la contraseña. Revisa que el enlace sea aún válido.", "error");
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "Guardar nueva contraseña";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (elements.form) {
    elements.form.addEventListener("submit", handleSubmit);
  }
  initRecoveryPage();
});
