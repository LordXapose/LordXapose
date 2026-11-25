const account = "LordXapose";
const projectList = document.querySelector("#project-list");
const projectCount = document.querySelector("#project-count");
const projectFilters = document.querySelector("#project-filters");
const projectError = document.querySelector("#project-error");
let projects = [];
let selectedCategory = "all";
let favorites = loadFavorites();
let showFavorites = false;
let compactProjects = false;
let selectedForCompare = [];
let sortMode = "featured";
let searchTerm = "";

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem("portfolio-project-favorites") || "[]"));
  } catch (error) {
    console.error("Could not read saved project favorites:", error);
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("portfolio-project-favorites", JSON.stringify([...favorites]));
  } catch (error) {
    console.error("Could not save project favorites:", error);
    document.querySelector("#project-feedback").textContent = "Favorites could not be saved in this browser.";
  }
}

function safeWebUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function appendDetail(parent, label, value) {
  if (typeof value !== "string" || !value.trim()) return;
  const section = document.createElement("section");
  section.className = "project-case-detail";
  const heading = document.createElement("h4");
  heading.textContent = label;
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  section.append(heading, paragraph);
  parent.append(section);
}

function appendLink(parent, label, href) {
  const safeHref = safeWebUrl(href);
  if (!safeHref) return;
  const link = document.createElement("a");
  link.className = "project-detail-link";
  link.href = safeHref;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${label} ↗`;
  parent.append(link);
}

function appendWorkflow(parent, workflow) {
  if (!Array.isArray(workflow) || !workflow.length) return;
  const section = document.createElement("section");
  section.className = "project-workflow";
  const heading = document.createElement("h4");
  heading.textContent = "Illustrative workflow";
  const steps = document.createElement("ol");
  for (const step of workflow) {
    if (typeof step !== "string" || !step.trim()) continue;
    const item = document.createElement("li");
    item.textContent = step;
    steps.append(item);
  }
  if (steps.childElementCount) {
    section.append(heading, steps);
    parent.append(section);
  }
}

function appendScreenshots(parent, screenshots) {
  if (!Array.isArray(screenshots) || screenshots.length === 0) return;
  const gallery = document.createElement("div");
  gallery.className = "project-screenshots";
  for (const shot of screenshots) {
    if (!shot || typeof shot !== "object" || typeof shot.src !== "string" ||
        !shot.src.startsWith("assets/projects/") || shot.src.includes("..")) continue;
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = shot.src;
    image.alt = typeof shot.alt === "string" ? shot.alt : "Project screenshot";
    image.loading = "lazy";
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "lightbox-trigger";
    preview.setAttribute("aria-label", `Preview ${image.alt}`);
    preview.append(image);
    preview.addEventListener("click", () => {
      const dialog = document.querySelector("#project-image-dialog");
      const largeImage = document.querySelector("#project-image-preview");
      const caption = document.querySelector("#project-image-caption");
      largeImage.src = image.src;
      largeImage.alt = image.alt;
      caption.textContent = shot.caption || image.alt;
      dialog.showModal();
    });
    figure.append(preview);
    if (typeof shot.caption === "string" && shot.caption.trim()) {
      const caption = document.createElement("figcaption");
      caption.textContent = shot.caption;
      figure.append(caption);
    }
    gallery.append(figure);
  }
  if (gallery.childElementCount) parent.append(gallery);
}

function createProject(project, index) {
  const { config, repo } = project;
  const item = document.createElement("details");
  item.className = "project-item";
  item.dataset.category = config.category.toLowerCase();

  const row = document.createElement("summary");
  row.className = "project-row";
  row.title = `${repo.stargazers_count} stars · ${repo.forks_count} forks · Updated ${repo.updated_at || "date unavailable"}`;
  const number = document.createElement("span");
  number.className = "project-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const description = document.createElement("span");
  description.className = "project-details";
  const title = document.createElement("span");
  title.className = "project-name";
  title.textContent = config.displayName || repo.name;
  const summary = document.createElement("span");
  summary.className = "project-description";
  summary.textContent = config.summary;
  description.append(title, summary);

  const category = document.createElement("span");
  category.className = "project-language";
  category.textContent = config.category;
  const arrow = document.createElement("span");
  arrow.className = "project-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "+";
  row.append(number, description, category, arrow);

  const expanded = document.createElement("div");
  expanded.className = "project-expanded";
  appendDetail(expanded, "Overview", config.overview);
  appendDetail(expanded, "My contribution", config.contribution);
  appendWorkflow(expanded, config.workflow);

  const metadata = document.createElement("div");
  metadata.className = "project-metadata";
  const stack = [...new Set([...(config.stack || []), repo.language].filter(Boolean))];
  if (stack.length) {
    const stackLabel = document.createElement("p");
    stackLabel.append(document.createTextNode("STACK "));
    const stackText = document.createElement("span");
    stackText.textContent = stack.join(" · ");
    stackLabel.append(stackText);
    metadata.append(stackLabel);
  }
  const status = config.status || "Public repository";
  const statusLabel = document.createElement("p");
  statusLabel.append(document.createTextNode("STATUS "));
  const statusText = document.createElement("span");
  statusText.textContent = status;
  statusLabel.append(statusText);
  metadata.append(statusLabel);
  const statsLabel = document.createElement("p");
  statsLabel.append(document.createTextNode("STARS "));
  const starsText = document.createElement("span");
  starsText.textContent = `${repo.stargazers_count || 0} · FORKS ${repo.forks_count || 0}`;
  statsLabel.append(starsText);
  metadata.append(statsLabel);
  expanded.append(metadata);

  if (repo.updated_at) {
    const updated = document.createElement("p");
    updated.className = "project-updated";
    const date = document.createElement("time");
    date.dateTime = repo.updated_at;
    date.textContent = `Repository activity · ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(repo.updated_at))}`;
    updated.append(date);
    expanded.append(updated);
  }
  if (Array.isArray(config.milestones) && config.milestones.length) {
    const milestones = document.createElement("section");
    milestones.className = "project-milestones";
    const heading = document.createElement("h4");
    heading.textContent = "Project milestones";
    const list = document.createElement("ol");
    for (const milestone of config.milestones) {
      if (!milestone || typeof milestone.label !== "string" || typeof milestone.date !== "string") continue;
      const item = document.createElement("li");
      item.textContent = `${milestone.date} — ${milestone.label}`;
      list.append(item);
    }
    if (list.childElementCount) {
      milestones.append(heading, list);
      expanded.append(milestones);
    }
  }

  appendDetail(expanded, "Outcome", config.outcome);
  appendDetail(expanded, "What I learned", config.learnings);
  appendScreenshots(expanded, config.screenshots);

  const links = document.createElement("div");
  links.className = "project-detail-links";
  appendLink(links, "Source on GitHub", repo.html_url);
  appendLink(links, "Live demo", config.demoUrl || repo.homepage);
  expanded.append(links);
  const copyLink = document.createElement("button");
  copyLink.type = "button";
  copyLink.className = "project-action";
  copyLink.textContent = "Copy repository link";
  copyLink.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(repo.html_url);
      copyLink.textContent = "Repository link copied";
    } catch (error) {
      console.error("Could not copy repository URL:", error);
      document.querySelector("#project-feedback").textContent = "Could not copy the repository link in this browser.";
    }
  });

  const actions = document.createElement("div");
  actions.className = "project-actions";
  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = "project-action";
  favorite.setAttribute("aria-pressed", String(favorites.has(config.slug)));
  favorite.textContent = favorites.has(config.slug) ? "★ Saved" : "☆ Save";
  favorite.addEventListener("click", () => {
    if (favorites.has(config.slug)) favorites.delete(config.slug);
    else favorites.add(config.slug);
    saveFavorites();
    renderProjects();
    const refreshed = [...projectList.querySelectorAll(".project-item")].find((entry) => entry.dataset.slug === config.slug);
    if (refreshed) refreshed.open = true;
  });
  const compare = document.createElement("button");
  compare.type = "button";
  compare.className = "project-action";
  compare.setAttribute("aria-pressed", String(selectedForCompare.includes(config.slug)));
  compare.textContent = selectedForCompare.includes(config.slug) ? "✓ Selected to compare" : "Compare";
  compare.addEventListener("click", () => {
    if (selectedForCompare.includes(config.slug)) {
      selectedForCompare = selectedForCompare.filter((slug) => slug !== config.slug);
    } else if (selectedForCompare.length < 2) {
      selectedForCompare.push(config.slug);
    } else {
      document.querySelector("#project-feedback").textContent = "Choose up to two projects to compare.";
    }
    renderProjects();
    updateCompareControl();
    const refreshed = [...projectList.querySelectorAll(".project-item")].find((entry) => entry.dataset.slug === config.slug);
    if (refreshed) refreshed.open = true;
  });
  actions.append(favorite, compare, copyLink);
  expanded.append(actions);

  item.append(row, expanded);
  item.dataset.slug = config.slug;
  if (compactProjects) item.classList.add("is-compact");
  return item;
}

function renderProjectFilters() {
  projectFilters.replaceChildren();
  const categories = ["all", ...new Set(projects.map(({ config }) => config.category))];
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-filter";
    button.dataset.category = category.toLowerCase();
    button.setAttribute("aria-pressed", String(selectedCategory === category.toLowerCase()));
    button.textContent = category === "all" ? "All" : category;
    if (selectedCategory === category.toLowerCase()) button.classList.add("is-active");
    button.addEventListener("click", () => {
      selectedCategory = category.toLowerCase();
      renderProjectFilters();
      renderProjects();
    });
    projectFilters.append(button);
  }
}

function renderProjects() {
  projectList.replaceChildren();
  const visible = projects.filter(({ config, repo }) =>
    (selectedCategory === "all" || config.category.toLowerCase() === selectedCategory) &&
    (!showFavorites || favorites.has(config.slug)) &&
    `${repo.name} ${config.category} ${config.summary}`.toLowerCase().includes(searchTerm),
  );
  if (sortMode !== "featured") {
    visible.sort((a, b) => {
      if (sortMode === "updated") return new Date(b.repo.updated_at) - new Date(a.repo.updated_at);
      if (sortMode === "stars") return b.repo.stargazers_count - a.repo.stargazers_count;
      return b.repo.forks_count - a.repo.forks_count;
    });
  }
  projectCount.textContent = `${String(visible.length).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")} PROJECTS`;

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-results";
    empty.textContent = "No projects are available in this category.";
    projectList.append(empty);
    return;
  }

  visible.forEach((project, index) => projectList.append(createProject(project, index)));
}

async function loadProjects() {
  const url = `https://api.github.com/users/${account}/repos?per_page=100&sort=updated&type=owner`;
  try {
    const [reposResponse, configResponse] = await Promise.all([
      fetch(url, { headers: { Accept: "application/vnd.github+json" } }),
      fetch("projects.json"),
    ]);
    if (!reposResponse.ok) throw new Error(`GitHub returned ${reposResponse.status}`);
    if (!configResponse.ok) throw new Error(`Project configuration returned ${configResponse.status}`);

    const repos = (await reposResponse.json()).filter((repo) => !repo.fork);
    const configuration = await configResponse.json();
    if (!Array.isArray(configuration)) throw new Error("projects.json must contain an array.");

    const repoByName = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));
    projects = configuration.map((config) => {
      if (!config.slug || !config.category || !config.summary || !Array.isArray(config.workflow)) {
        throw new Error("A project entry is missing required metadata in projects.json.");
      }
      const repo = repoByName.get(config.slug.toLowerCase());
      if (!repo) throw new Error(`The configured repository "${config.slug}" was not found on GitHub.`);
      return { config, repo };
    });

    renderProjectFilters();
    renderProjects();
    if (!projects.length) {
      projectError.hidden = false;
      projectError.textContent = "Add selected public repositories to projects.json to show project details.";
    }
    window.portfolioProjects = projects;
    window.dispatchEvent(new CustomEvent("projects-ready", { detail: projects }));
    updateCompareControl();
  } catch (error) {
    projectList.replaceChildren();
    projectCount.textContent = "PROJECTS UNAVAILABLE";
    projectError.hidden = false;
    projectError.textContent = "Project details could not be loaded. Check the GitHub connection and projects.json.";
    console.error("Could not load projects:", error);
  }
}

function updateCompareControl() {
  const button = document.querySelector("#project-compare");
  if (!button) return;
  button.textContent = `Compare (${selectedForCompare.length})`;
  button.disabled = selectedForCompare.length !== 2;
}

document.querySelector("#project-search").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProjects();
});
document.querySelector("#project-sort").addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderProjects();
});
document.querySelector("#project-favorites").addEventListener("click", (event) => {
  showFavorites = !showFavorites;
  event.currentTarget.setAttribute("aria-pressed", String(showFavorites));
  event.currentTarget.textContent = showFavorites ? "★ Favorites" : "☆ Favorites";
  renderProjects();
});
document.querySelector("#project-density").addEventListener("click", (event) => {
  compactProjects = !compactProjects;
  event.currentTarget.setAttribute("aria-pressed", String(compactProjects));
  event.currentTarget.textContent = compactProjects ? "Detailed view" : "Compact view";
  renderProjects();
});
document.querySelector("#project-compare").addEventListener("click", () => {
  const dialog = document.querySelector("#compare-dialog");
  const container = document.querySelector("#compare-content");
  container.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "comparison-grid";
  for (const project of projects.filter(({ config }) => selectedForCompare.includes(config.slug))) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    title.textContent = project.repo.name;
    const category = document.createElement("p");
    category.textContent = `Category: ${project.config.category}`;
    const description = document.createElement("p");
    description.textContent = project.config.summary;
    const language = document.createElement("p");
    language.textContent = `Language: ${project.repo.language || "Not specified"}`;
    const stats = document.createElement("p");
    stats.textContent = `${project.repo.stargazers_count} stars · ${project.repo.forks_count} forks`;
    const link = document.createElement("a");
    link.href = project.repo.html_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open source repository ↗";
    card.append(title, category, description, language, stats, link);
    grid.append(card);
  }
  container.append(grid);
  dialog.showModal();
});
document.querySelector("#project-surprise").addEventListener("click", () => {
  if (!projects.length) return;
  selectedCategory = "all";
  showFavorites = false;
  const favoritesToggle = document.querySelector("#project-favorites");
  favoritesToggle.setAttribute("aria-pressed", "false");
  favoritesToggle.textContent = "☆ Favorites";
  renderProjectFilters();
  renderProjects();
  const project = projects[Math.floor(Math.random() * projects.length)];
  const row = [...projectList.querySelectorAll(".project-item")].find((entry) => entry.dataset.slug === project.config.slug);
  if (row) {
    row.open = true;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll(".section-block, .skills-band, .contact-section").forEach((section) => {
    section.setAttribute("data-reveal", "");
    revealObserver.observe(section);
  });
}
loadProjects();
