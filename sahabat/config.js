window.SF_CONFIG = Object.freeze({
  SUPABASE_URL: "https://cvfuuflnfexaqnncgjmw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_mqJVZHJKwvtbT5xAJurv9w_j5LMqUlK",
  APP_NAME: "Sahabat Familia",
  APP_TAGLINE: "Kesehatan Keluarga, Lebih Dekat",
  APP_PATH: "/sahabat/",
  SUPPORT_WHATSAPP: "",
  TERMS_VERSION: "2026-08-12"
});

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("script[data-sahabat-auth-feedback]")) return;
  const script = document.createElement("script");
  script.src = "auth-feedback.js?v=20260812a";
  script.dataset.sahabatAuthFeedback = "true";
  document.body.appendChild(script);
}, { once: true });
