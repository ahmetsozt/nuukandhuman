// NUUK & Human — progressive enhancement only. The site works without JS.
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  // Mobile menu
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    const label = toggle.querySelector(".menu-label");
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      label.textContent = open ? label.dataset.closeLabel : label.dataset.openLabel;
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Header turns solid as soon as the page scrolls (it overlays the dark hero at the top)
  const header = document.querySelector("[data-header]");
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle("is-solid", window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  // Reveal on scroll (skipped entirely for reduced motion)
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(".section-head, .sector-row, .service-group, .approach-list li, .step, .founder, .faq-item, .path-card");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // Forms: only forms with a configured endpoint (data-live) can submit.
  const ALLOWED_EXT = /\.(pdf|docx)$/i;
  const msg = (form, key) => form.getAttribute(`data-msg-${key}`) || "";

  function fieldError(field, form) {
    if (field.validity.valueMissing) return " ";
    if (field.validity.typeMismatch || field.validity.tooLong) return " ";
    if (field.type === "file" && field.files.length) {
      const file = field.files[0];
      if (!ALLOWED_EXT.test(file.name)) return msg(form, "file-type");
      if (file.size > Number(field.dataset.maxMb) * 1024 * 1024) return msg(form, "file-too-large");
    }
    return "";
  }

  function validate(form) {
    let firstBad = null;
    form.querySelectorAll("input:not([type=hidden]), select, textarea").forEach((field) => {
      if (field.closest(".hp")) return;
      const error = fieldError(field, form);
      const out = document.getElementById(`${field.id}-error`);
      field.toggleAttribute("aria-invalid", Boolean(error));
      if (out) out.textContent = error.trim();
      if (error && !firstBad) firstBad = field;
    });
    return firstBad;
  }

  document.querySelectorAll("form[data-live]").forEach((form) => {
    const status = form.querySelector("[data-status]");
    const button = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const bad = validate(form);
      if (bad) {
        status.textContent = msg(form, "invalid");
        bad.focus();
        return;
      }
      if (form.querySelector('.hp input').value) return; // honeypot: silently drop bots
      button.disabled = true;
      status.textContent = msg(form, "sending");
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        status.textContent = msg(form, "success");
        form.classList.add("is-sent");
      } catch (err) {
        console.error("Form submission failed", err);
        status.textContent = msg(form, "error");
      } finally {
        button.disabled = false;
      }
    });
  });
})();
