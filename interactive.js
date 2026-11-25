const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = $("#site-toast");
let toastTimer;

function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function readSetting(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.error(`Could not read setting ${key}:`, error);
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Could not save setting ${key}:`, error);
    notify("This preference cannot be saved in this browser.");
    return false;
  }
}

const root = document.documentElement;
const themeButton = $("#theme-toggle");
let darkTheme = readSetting("portfolio-theme", "light") === "dark";
function applyTheme() {
  root.dataset.theme = darkTheme ? "dark" : "light";
  themeButton?.setAttribute("aria-pressed", String(darkTheme));
  if (themeButton) themeButton.textContent = darkTheme ? "Light theme" : "Dark theme";
}
applyTheme();
themeButton?.addEventListener("click", () => {
  darkTheme = !darkTheme;
  saveSetting("portfolio-theme", darkTheme ? "dark" : "light");
  applyTheme();
});

const accent = $("#accent-select");
const accentOptions = ["blue", "green", "violet"];
if (accent) {
  accent.value = accentOptions.includes(readSetting("portfolio-accent", "blue"))
    ? readSetting("portfolio-accent", "blue")
    : "blue";
  root.dataset.accent = accent.value;
  accent.addEventListener("change", () => {
    root.dataset.accent = accent.value;
    saveSetting("portfolio-accent", accent.value);
  });
}

let textScale = Number(readSetting("portfolio-text-scale", "1"));
if (![1, 1.08, 1.16].includes(textScale)) textScale = 1;
const textSizeButton = $("#font-size-toggle");
function applyTextScale() {
  root.style.setProperty("--text-scale", String(textScale));
  if (textSizeButton) textSizeButton.textContent = `Text size: ${textScale === 1 ? "standard" : textScale === 1.08 ? "large" : "largest"}`;
}
applyTextScale();
textSizeButton?.addEventListener("click", () => {
  textScale = textScale === 1 ? 1.08 : textScale === 1.08 ? 1.16 : 1;
  saveSetting("portfolio-text-scale", String(textScale));
  applyTextScale();
});

let reducedMotion = readSetting("portfolio-reduced-motion", "false") === "true";
const motionButton = $("#motion-toggle");
function applyMotionPreference() {
  root.dataset.motion = reducedMotion ? "reduce" : "normal";
  motionButton?.setAttribute("aria-pressed", String(reducedMotion));
}
applyMotionPreference();
motionButton?.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  saveSetting("portfolio-reduced-motion", String(reducedMotion));
  applyMotionPreference();
});

const readingProgress = $("#reading-progress");
const backToTop = $("#back-to-top");
function updateScrollControls() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
  if (readingProgress) readingProgress.style.width = `${progress}%`;
  backToTop?.classList.toggle("is-visible", window.scrollY > 500);
}
window.addEventListener("scroll", updateScrollControls, { passive: true });
window.addEventListener("resize", updateScrollControls);
updateScrollControls();
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

const clock = $("#leipzig-clock");
function updateClock() {
  if (clock) {
    clock.dateTime = new Date().toISOString();
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  }
}
updateClock();
setInterval(updateClock, 60_000);

const sections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const active = $(`.main-nav a[href="#${entry.target.id}"]`);
      $$(".main-nav a").forEach((link) => link.removeAttribute("aria-current"));
      active?.setAttribute("aria-current", "location");
    }
  }, { rootMargin: "-25% 0px -65% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));
}

const experienceFilter = $("#experience-filter");
const timelineItems = $$(".timeline-item");
timelineItems.forEach((item, index) => {
  item.dataset.type = index < 3 ? "internship" : "education";
  const description = item.querySelector(":scope > p:last-child:not(.timeline-org)");
  if (!description) return;
  description.classList.add("timeline-description", "is-collapsed");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "timeline-toggle";
  toggle.textContent = "Show details";
  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", () => {
    const expanded = description.classList.toggle("is-expanded");
    description.classList.toggle("is-collapsed", !expanded);
    toggle.textContent = expanded ? "Hide details" : "Show details";
    toggle.setAttribute("aria-expanded", String(expanded));
  });
  item.append(toggle);
});
experienceFilter?.addEventListener("change", () => {
  for (const item of timelineItems) {
    item.hidden = experienceFilter.value !== "all" && item.dataset.type !== experienceFilter.value;
  }
});

const skillAreas = ["offensive", "defense", "architecture", "cloud", "languages"];
$$(".skill-group").forEach((group, index) => { group.dataset.skillArea = skillAreas[index] || "other"; });
$("#skill-filter")?.addEventListener("change", (event) => {
  for (const group of $$(".skill-group")) {
    group.hidden = event.target.value !== "all" && group.dataset.skillArea !== event.target.value;
  }
});

const skillDefinitions = {
  "Attack surface": "The systems, services, and entry points that an organization exposes.",
  "Reconnaissance": "Authorized information gathering used to understand a defined assessment scope.",
  "SIEM": "Security information and event management: tools for collecting and analysing security events.",
  "IDS / IPS": "Intrusion detection and prevention systems that identify or block suspicious activity.",
  "MITRE ATT&CK": "A public knowledge base describing adversary tactics and techniques.",
  "Zero Trust": "A security architecture that continuously verifies access rather than assuming trust.",
  "IAM": "Identity and access management: processes and systems for managing identities and permissions.",
  "MFA": "Multi-factor authentication requires more than one kind of proof to authenticate.",
  "RBAC": "Role-based access control assigns permissions according to defined roles.",
  "PKI": "Public key infrastructure manages certificates and public-key identities.",
  "GRC": "Governance, risk, and compliance practices for managing organizational security obligations.",
  "IaC": "Infrastructure as code describes and manages infrastructure through versioned configuration.",
  "CI/CD": "Continuous integration and delivery automate build, test, and release workflows.",
  "OSINT": "Open-source intelligence uses publicly available information within legal and ethical bounds.",
  "DeFi": "Decentralized finance applications and protocols built on distributed ledgers.",
};
const glossaryContent = $("#glossary-content");
if (glossaryContent) {
  for (const [term, definition] of Object.entries(skillDefinitions)) {
    const entry = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = term;
    const text = document.createElement("span");
    text.textContent = definition;
    entry.append(label, text);
    glossaryContent.append(entry);
  }
}
$("#skill-glossary")?.addEventListener("click", () => $("#glossary-dialog").showModal());

function renderSkillMap(projects = window.portfolioProjects || []) {
  const target = $("#skill-map-content");
  if (!target) return;
  target.replaceChildren();
  const mappings = projects.filter(({ config }) => Array.isArray(config.skills) && config.skills.length);
  if (!mappings.length) {
    target.textContent = "No project-to-skill links are configured yet. Add verified skills to each project's skills array in projects.json.";
    return;
  }
  for (const { config, repo } of mappings) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = repo.name;
    const text = document.createElement("p");
    text.textContent = config.skills.join(" · ");
    section.append(heading, text);
    target.append(section);
  }
}
$("#skill-project-map")?.addEventListener("click", () => {
  renderSkillMap();
  $("#skill-map-dialog").showModal();
});
window.addEventListener("projects-ready", (event) => renderSkillMap(event.detail));
window.addEventListener("projects-ready", () => {
  if (commandDialog?.open) renderCommands(commandSearch.value);
});
window.addEventListener("posts-ready", () => {
  if (commandDialog?.open) renderCommands(commandSearch.value);
});

$$(".research-filter").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".research-filter").forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle("is-active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    for (const card of $$(".research-card")) {
      card.hidden = button.dataset.topic !== "all" && card.dataset.topic !== button.dataset.topic;
    }
  });
});
$("#disclosure-open")?.addEventListener("click", () => $("#disclosure-dialog").showModal());
$$(".research-citation").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(`${button.dataset.citationTitle}\n${button.dataset.citationUrl}`);
      notify("Paper title and SSRN search link copied.");
    } catch (error) {
      console.error("Could not copy research reference:", error);
      notify("Could not copy the reference in this browser.");
    }
  });
});

const emailAddress = "kenilpatidar19@gmail.com";
$("#copy-email")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(emailAddress);
    notify("Email address copied.");
  } catch (error) {
    console.error("Could not copy email address:", error);
    notify("Copy is unavailable here; use the email link instead.");
  }
});
$("#contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const name = String(values.get("name")).trim();
  const sender = String(values.get("email")).trim();
  const message = String(values.get("message")).trim();
  const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
  const body = encodeURIComponent(`From: ${name} <${sender}>\n\n${message}`);
  window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
  $("#contact-feedback").textContent = "Your email app should open with a draft. Nothing is sent by this site.";
});

$("#resume-print")?.addEventListener("click", () => {
  const printWindow = window.open("resume.html?print=1", "_blank");
  if (!printWindow) notify("Allow pop-ups to open the print-ready résumé.");
});

const commandDialog = $("#command-dialog");
const commandSearch = $("#command-search");
const commandResults = $("#command-results");
const pagePrefix = window.location.pathname.endsWith("/blog.html") ? "index.html" : "";
const staticDestinations = [
  ["Selected projects", `${pagePrefix}#projects`], ["Profile", `${pagePrefix}#about`],
  ["Experience and education", `${pagePrefix}#experience`], ["Technical skills", `${pagePrefix}#skills`],
  ["Research", `${pagePrefix}#research`], ["Writing", `${pagePrefix}#blog`], ["Contact", `${pagePrefix}#contact`],
];
function renderCommands(query = "") {
  if (!commandResults) return;
  commandResults.replaceChildren();
  const normalized = query.trim().toLowerCase();
  const results = [];
  for (const [label, href] of staticDestinations) {
    if (label.toLowerCase().includes(normalized)) results.push({ label, href });
  }
  for (const project of window.portfolioProjects || []) {
    const label = `${project.config.displayName || project.repo.name} — ${project.config.category}`;
    if (label.toLowerCase().includes(normalized)) results.push({ label, href: `${pagePrefix}#projects`, slug: project.config.slug });
  }
  for (const post of window.portfolioPosts || []) {
    if (`${post.title} ${post.summary}`.toLowerCase().includes(normalized)) {
      results.push({ label: post.title, href: `blog.html?slug=${encodeURIComponent(post.slug)}` });
    }
  }
  if (!results.length) {
    commandResults.textContent = "No matching destinations.";
    return;
  }
  for (const result of results.slice(0, 20)) {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "option";
    button.textContent = result.label;
    button.addEventListener("click", () => {
      commandDialog.close();
      window.location.href = result.href;
      if (result.slug) {
        setTimeout(() => {
          const item = $$(".project-item").find((projectItem) => projectItem.dataset.slug === result.slug);
          if (item) {
            item.open = true;
            item.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
          }
        }, 350);
      }
    });
    commandResults.append(button);
  }
}
$("#command-open")?.addEventListener("click", () => {
  commandDialog.showModal();
  commandSearch.focus();
  renderCommands();
});
commandSearch?.addEventListener("input", () => renderCommands(commandSearch.value));
$("#shortcuts-open")?.addEventListener("click", () => $("#shortcuts-dialog").showModal());
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "k") {
    event.preventDefault();
    if (commandDialog && !commandDialog.open) {
      commandDialog.showModal();
      commandSearch.focus();
      renderCommands();
    }
  } else if (key === "?" && !/input|textarea|select/i.test(document.activeElement?.tagName || "")) {
    $("#shortcuts-dialog")?.showModal();
  }
});

async function loadSiteConfig() {
  try {
    const response = await fetch("site-config.json");
    if (!response.ok) throw new Error(`Site configuration returned ${response.status}`);
    const config = await response.json();

    if (Array.isArray(config.certificates)) {
      const list = $(".certificate-list");
      const links = document.createElement("div");
      links.className = "certificate-links";
      for (const certificate of config.certificates) {
        if (!certificate || typeof certificate.label !== "string" || typeof certificate.url !== "string") continue;
        const url = new URL(certificate.url, window.location.href);
        if (url.protocol !== "https:" || !url.hostname) continue;
        const link = document.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = `${certificate.label} ↗`;
        links.append(link);
      }
      if (links.childElementCount) list?.append(links);
    }
    if (Array.isArray(config.resumeTranslations) && config.resumeTranslations.length) {
      const select = $("#resume-language");
      const wrapper = $("#resume-language-wrap");
      for (const translation of select ? config.resumeTranslations : []) {
        if (!translation || typeof translation.label !== "string" || typeof translation.url !== "string") continue;
        const url = new URL(translation.url, window.location.href);
        if (!["http:", "https:"].includes(url.protocol)) continue;
        const option = document.createElement("option");
        option.value = url.href;
        option.textContent = translation.label;
        select.append(option);
      }
      if (select.options.length > 1) wrapper.hidden = false;
    }
    $("#resume-language")?.addEventListener("change", (event) => {
      if (event.target.value !== "en") window.location.href = event.target.value;
    });
    if (typeof config.availabilityText === "string" && config.availabilityText.trim()) {
      const indicator = document.querySelector(".experience-controls p");
      if (indicator) indicator.textContent = config.availabilityText;
    }

    const analyticsButton = $("#analytics-consent");
    const analyticsState = $("#analytics-state");
    const provider = config.analytics;
    const storedConsent = readSetting("portfolio-analytics-consent", "off");
    analyticsButton?.setAttribute("aria-pressed", String(storedConsent === "on"));
    if (provider && typeof provider.scriptUrl === "string" && typeof provider.domain === "string" &&
        provider.domain === window.location.hostname && new URL(provider.scriptUrl).protocol === "https:") {
      if (analyticsState) analyticsState.textContent = storedConsent === "on" ? "Anonymous analytics are enabled." : "Optional anonymous analytics are off until you opt in.";
      if (storedConsent === "on") enableAnalytics(provider);
      analyticsButton?.addEventListener("click", () => {
        const enable = readSetting("portfolio-analytics-consent", "off") !== "on";
        saveSetting("portfolio-analytics-consent", enable ? "on" : "off");
        analyticsButton.setAttribute("aria-pressed", String(enable));
        if (analyticsState) analyticsState.textContent = enable
          ? "Anonymous analytics enabled."
          : "Consent withdrawn; reloading to unload the configured analytics script.";
        if (enable) enableAnalytics(provider);
        else if ($("#optional-analytics")) window.location.reload();
      });
    } else {
      if (analyticsState) analyticsState.textContent = "Analytics remain off; add a trusted HTTPS provider to site-config.json to enable optional tracking.";
      if (analyticsButton) analyticsButton.disabled = true;
    }
  } catch (error) {
    console.error("Could not load optional site settings:", error);
  }
}

function enableAnalytics(provider) {
  if ($("#optional-analytics")) return;
  const source = new URL(provider.scriptUrl);
  if (source.protocol !== "https:") throw new Error("Analytics scripts must use HTTPS.");
  const script = document.createElement("script");
  script.id = "optional-analytics";
  script.defer = true;
  script.src = source.href;
  script.dataset.domain = provider.domain;
  script.onerror = () => {
    script.remove();
    notify("The configured analytics provider could not be loaded.");
  };
  document.head.append(script);
}
loadSiteConfig();
