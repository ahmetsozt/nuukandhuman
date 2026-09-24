import { esc, t } from "./lib/html.mjs";

function options(site, source, lang) {
  const list = source === "sectors" ? site.sectors : site.services;
  return list.map((item) => `<option value="${esc(item.id)}">${esc(t(item.title ?? item.name, lang))}</option>`).join("");
}

function fieldLabel(site, field, lang) {
  if (field.label) return t(field.label, lang);
  return t(site.forms.labels[field.name], lang);
}

function control(ctx, formId, field, mode) {
  const { site, lang, urls } = ctx;
  if (field.type === "file" && mode === "email") {
    return `<div class="field field-wide field-note"><p>${esc(t(site.forms.labels.attach_cv, lang))}</p></div>`;
  }
  const id = `${formId}-${field.name}`;
  const req = field.required ? " required" : "";
  const describedBy = `aria-describedby="${id}-error"`;
  const auto = field.autocomplete ? ` autocomplete="${esc(field.autocomplete)}"` : "";
  const label = esc(fieldLabel(site, field, lang));
  const tag = field.required
    ? `<span class="req">${esc(t(site.forms.labels.required, lang))}</span>`
    : `<span class="opt">${esc(t(site.forms.labels.optional, lang))}</span>`;
  const error = `<p class="field-error" id="${id}-error" aria-live="polite"></p>`;

  if (field.type === "checkbox") {
    const text = field.link ? `<a href="${urls.page(lang, field.link)}">${label}</a>` : label;
    return `<div class="field field-check">
  <input type="checkbox" id="${id}" name="${esc(field.name)}" value="yes"${req} ${describedBy}>
  <label for="${id}">${text}</label>${error}
</div>`;
  }

  let input;
  if (field.type === "select") {
    input = `<select id="${id}" name="${esc(field.name)}"${req} ${describedBy}><option value="">${esc(t(site.forms.labels.select_placeholder, lang))}</option>${options(site, field.source, lang)}</select>`;
  } else if (field.type === "textarea") {
    input = `<textarea id="${id}" name="${esc(field.name)}" rows="5" maxlength="${field.maxlength ?? 3000}"${req} ${describedBy}></textarea>`;
  } else if (field.type === "file") {
    input = `<input type="file" id="${id}" name="${esc(field.name)}" accept="${esc(field.accept.join(","))}" data-max-mb="${field.max_size_mb}"${req} ${describedBy}>`;
  } else {
    input = `<input type="${esc(field.type)}" id="${id}" name="${esc(field.name)}" maxlength="300"${auto}${req} ${describedBy}>`;
  }
  const wide = field.type === "textarea" || field.type === "file" ? " field-wide" : "";
  return `<div class="field${wide}">
  <label for="${id}">${label} ${tag}</label>
  ${input}${error}
</div>`;
}

/** Which submission route is available, in order of preference. */
export function formMode(site) {
  if (site.backend.form_endpoint) return "endpoint";
  if (site.identity.contact.email) return "email";
  return "offline";
}

/**
 * Renders a form from site.json.
 * - endpoint: POSTs to the backend; success only on a real 2xx response.
 * - email: opens the visitor's mail app pre-filled (nothing is sent by the site).
 * - offline: shown for transparency, every control disabled.
 */
export function renderForm(ctx, formId) {
  const { site, lang } = ctx;
  const form = site.forms.items.find((f) => f.id === formId);
  if (!form) throw new Error(`Unknown form ${formId}`);
  const mode = formMode(site);
  const L = site.forms.labels;
  const offline = mode === "offline"
    ? `<div class="form-offline" role="status"><p class="form-offline-title">${esc(t(L.offline_title, lang))}</p><p>${esc(t(L.offline_body, lang))}</p></div>`
    : "";
  const fields = form.fields.map((f) => control(ctx, formId, f, mode)).join("\n");
  const messages = ["sending", "success", "error", "invalid", "file_too_large", "file_type", "email_opened"]
    .map((k) => `data-msg-${k.replace(/_/g, "-")}="${esc(t(L[k], lang))}"`)
    .join(" ");
  const attrs = {
    endpoint: `action="${esc(site.backend.form_endpoint)}" method="post" data-live${form.fields.some((f) => f.type === "file") ? ' enctype="multipart/form-data"' : ""}`,
    email: `data-mailto="${esc(site.identity.contact.email)}" data-subject="${esc(`${t(form.submit_label, lang)} — NUUK & Human`)}"`,
    offline: 'aria-disabled="true"',
  }[mode];
  return `${offline}
<form class="intake-form" id="${formId}-form" novalidate data-mode="${mode}" ${attrs} ${messages}>
  <input type="hidden" name="form_id" value="${esc(formId)}">
  <input type="hidden" name="lang" value="${lang}">
  <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <fieldset${mode === "offline" ? " disabled" : ""}>
  <legend class="sr-only">${esc(t(form.submit_label, lang))}</legend>
  <div class="field-grid">
${fields}
  </div>
  <div class="form-actions">
    <button class="btn btn-primary" type="submit">${esc(t(form.submit_label, lang))}</button>
    <p class="form-status" role="status" aria-live="polite" data-status></p>
  </div>
  </fieldset>
</form>`;
}
