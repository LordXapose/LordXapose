document.querySelector("#resume-save-pdf")?.addEventListener("click", () => window.print());

fetch("site-config.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Site configuration returned ${response.status}`);
    return response.json();
  })
  .then((config) => {
    const links = document.querySelector(".certificate-links");
    for (const certificate of config.certificates || []) {
      if (!certificate || typeof certificate.label !== "string" || typeof certificate.url !== "string") continue;
      const url = new URL(certificate.url, window.location.href);
      if (url.protocol !== "https:") continue;
      const link = document.createElement("a");
      link.href = url.href;
      link.textContent = `${certificate.label} ↗`;
      links.append(link);
    }
  })
  .catch((error) => console.error("Could not load certificate links:", error));

if (new URLSearchParams(window.location.search).has("print")) {
  window.addEventListener("load", () => window.print(), { once: true });
}
