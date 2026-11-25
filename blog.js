const postList = document.querySelector("#blog-list");
const postFilters = document.querySelector("#blog-filters");
const blogControls = document.querySelector("#blog-controls");
const emptyPosts = document.querySelector("#blog-empty");
const listStatus = document.querySelector("#blog-status");
const articleContent = document.querySelector("#blog-content");
const articleTitle = document.querySelector("#blog-title");
const articleDate = document.querySelector("#blog-date");
const articleSummary = document.querySelector("#blog-summary");
const articleReadingTime = document.querySelector("#blog-reading-time");
const articleTags = document.querySelector("#blog-article-tags");
const articleToc = document.querySelector("#blog-toc");
const articleStatus = document.querySelector("#blog-article-status");
const articleLoading = document.querySelector("#blog-loading");

function validatePost(post) {
  const validSlug = typeof post.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug);
  const parsedDate = typeof post.date === "string" ? new Date(`${post.date}T00:00:00Z`) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === post.date;
  const validTags = Array.isArray(post.tags) && post.tags.every((tag) => typeof tag === "string");
  if (!validSlug || !validDate || typeof post.title !== "string" || !post.title || typeof post.summary !== "string" || !post.summary || !validTags) {
    throw new Error("A blog entry has invalid metadata in blog/posts.json.");
  }
  return post;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

function addInlineText(parent, text) {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[1] !== undefined) {
      let destination;
      try {
        destination = new URL(match[2], window.location.href);
      } catch {
        destination = null;
      }
      if (destination && ["http:", "https:", "mailto:"].includes(destination.protocol)) {
        const link = document.createElement("a");
        link.href = destination.href;
        link.textContent = match[1];
        if (destination.origin !== window.location.origin && destination.protocol !== "mailto:") {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        parent.append(link);
      } else {
        parent.append(document.createTextNode(match[1]));
      }
    } else if (match[3] !== undefined || match[4] !== undefined) {
      const strong = document.createElement("strong");
      strong.textContent = match[3] || match[4];
      parent.append(strong);
    } else if (match[5] !== undefined) {
      const code = document.createElement("code");
      code.textContent = match[5];
      parent.append(code);
    } else {
      const emphasis = document.createElement("em");
      emphasis.textContent = match[6];
      parent.append(emphasis);
    }
    cursor = match.index + match[0].length;
  }
  parent.append(document.createTextNode(text.slice(cursor)));
}

function startsBlock(line) {
  return /^(#{1,6}\s|```|>\s?|[-*+]\s|\d+\.\s|(?:-{3,}|_{3,}|\*{3,})$)/.test(line);
}

function renderMarkdown(source) {
  const fragment = document.createDocumentFragment();
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      fragment.append(pre);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1);
      const element = document.createElement(`h${level}`);
      addInlineText(element, heading[2]);
      fragment.append(element);
      index += 1;
      continue;
    }

    if (/^(?:-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      fragment.append(document.createElement("hr"));
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = document.createElement("blockquote");
      const paragraph = document.createElement("p");
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      addInlineText(paragraph, quoteLines.join(" "));
      quote.append(paragraph);
      fragment.append(quote);
      continue;
    }

    const listMatch = line.match(/^\s*(?:[-*+]\s|(\d+)\.\s)/);
    if (listMatch) {
      const ordered = Boolean(listMatch[1]);
      const list = document.createElement(ordered ? "ol" : "ul");
      const itemPattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const item = lines[index].match(itemPattern);
        if (!item) break;
        const listItem = document.createElement("li");
        addInlineText(listItem, item[1]);
        list.append(listItem);
        index += 1;
      }
      fragment.append(list);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim() && !startsBlock(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    if (!paragraphLines.length) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    const paragraph = document.createElement("p");
    addInlineText(paragraph, paragraphLines.join(" "));
    fragment.append(paragraph);
  }

  return fragment;
}

let allPosts = [];
const selectedTags = new Set();
let blogSearchTerm = "";
let oldestFirst = false;
let savedOnly = false;
let savedPosts = loadSavedPosts();
const postBodyIndex = new Map();
const postBodyLoads = new Map();
let searchGeneration = 0;

async function loadPostBody(post) {
  if (postBodyIndex.has(post.slug)) return postBodyIndex.get(post.slug);
  if (postBodyLoads.has(post.slug)) return postBodyLoads.get(post.slug);
  const load = (async () => {
    const response = await fetch(`blog/posts/${encodeURIComponent(post.slug)}.md`);
    if (!response.ok) throw new Error(`Blog post ${post.slug} returned ${response.status}`);
    const content = await response.text();
    postBodyIndex.set(post.slug, content);
    return content;
  })();
  postBodyLoads.set(post.slug, load);
  try {
    return await load;
  } finally {
    postBodyLoads.delete(post.slug);
  }
}

function loadSavedPosts() {
  try {
    return new Set(JSON.parse(localStorage.getItem("portfolio-reading-list") || "[]"));
  } catch (error) {
    console.error("Could not read the local reading list:", error);
    return new Set();
  }
}

function saveSavedPosts() {
  try {
    localStorage.setItem("portfolio-reading-list", JSON.stringify([...savedPosts]));
  } catch (error) {
    console.error("Could not save the local reading list:", error);
    if (listStatus) {
      listStatus.hidden = false;
      listStatus.textContent = "The reading list could not be saved in this browser.";
    }
  }
}

function renderPostFilters() {
  if (!postFilters) return;
  postFilters.replaceChildren();
  const tags = [...new Set(allPosts.flatMap((post) => post.tags))];
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "blog-filter";
  allButton.textContent = "All writing";
  allButton.setAttribute("aria-pressed", String(selectedTags.size === 0));
  if (!selectedTags.size) allButton.classList.add("is-active");
  allButton.addEventListener("click", () => {
    selectedTags.clear();
    renderPostFilters();
    renderPostList();
  });
  postFilters.append(allButton);
  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "blog-filter";
    button.textContent = tag;
    button.setAttribute("aria-pressed", String(selectedTags.has(tag.toLowerCase())));
    if (selectedTags.has(tag.toLowerCase())) button.classList.add("is-active");
    button.addEventListener("click", () => {
      const normalizedTag = tag.toLowerCase();
      if (selectedTags.has(normalizedTag)) selectedTags.delete(normalizedTag);
      else selectedTags.add(normalizedTag);
      renderPostFilters();
      renderPostList();
    });
    postFilters.append(button);
  }
}

function renderPostList() {
  if (!postList) return;
  postList.replaceChildren();
  const posts = allPosts.filter((post) => {
    const tagMatch = selectedTags.size === 0 || [...selectedTags].every((selected) =>
      post.tags.some((tag) => tag.toLowerCase() === selected),
    );
    const searchMatch = `${post.title} ${post.summary} ${post.tags.join(" ")} ${postBodyIndex.get(post.slug) || ""}`.toLowerCase().includes(blogSearchTerm);
    return tagMatch && searchMatch && (!savedOnly || savedPosts.has(post.slug));
  }).sort((a, b) => (oldestFirst ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  if (emptyPosts) emptyPosts.hidden = posts.length > 0;
  if (emptyPosts) {
    emptyPosts.textContent = allPosts.length
      ? "No writing matches those filters. Clear the search or tag filters to see all posts."
      : "No posts published yet. New writing will appear here.";
  }
  if (postFilters) postFilters.hidden = allPosts.length === 0;
  if (blogControls) blogControls.hidden = allPosts.length === 0;

  for (const post of posts) {
    const card = document.createElement("article");
    card.className = "blog-card";
    const date = document.createElement("time");
    date.className = "blog-date";
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "blog-card-title";
    const titleLink = document.createElement("a");
    titleLink.href = `blog.html?slug=${encodeURIComponent(post.slug)}`;
    titleLink.textContent = post.title;
    title.append(titleLink);
    const summary = document.createElement("p");
    summary.className = "blog-summary";
    summary.textContent = post.summary;
    details.append(title, summary);

    if (post.tags.length) {
      const tags = document.createElement("div");
      tags.className = "blog-tags";
      for (const tag of post.tags) {
        const label = document.createElement("button");
        label.type = "button";
        label.className = "blog-tag";
        label.textContent = tag;
        label.setAttribute("aria-label", `Filter writing by ${tag}`);
        label.setAttribute("aria-pressed", String(selectedTags.has(tag.toLowerCase())));
        label.addEventListener("click", () => {
          const normalizedTag = tag.toLowerCase();
          if (selectedTags.has(normalizedTag)) selectedTags.delete(normalizedTag);
          else selectedTags.add(normalizedTag);
          renderPostFilters();
          renderPostList();
        });
        tags.append(label);
      }
      details.append(tags);
    }

    const bookmark = document.createElement("button");
    bookmark.type = "button";
    bookmark.className = "blog-bookmark";
    bookmark.setAttribute("aria-pressed", String(savedPosts.has(post.slug)));
    bookmark.setAttribute("aria-label", savedPosts.has(post.slug) ? `Remove ${post.title} from reading list` : `Save ${post.title} to reading list`);
    bookmark.textContent = savedPosts.has(post.slug) ? "★" : "☆";
    bookmark.addEventListener("click", () => {
      if (savedPosts.has(post.slug)) savedPosts.delete(post.slug);
      else savedPosts.add(post.slug);
      saveSavedPosts();
      renderPostList();
    });

    const readLink = document.createElement("a");
    readLink.className = "blog-read";
    readLink.href = titleLink.href;
    readLink.setAttribute("aria-label", `Read ${post.title}`);
    readLink.textContent = "↗";
    card.append(date, details, bookmark, readLink);
    postList.append(card);
  }
}

function addTableOfContents() {
  if (!articleToc || !articleContent) return;
  const headings = [...articleContent.querySelectorAll("h3, h4")];
  if (!headings.length) return;

  const title = document.createElement("h2");
  title.textContent = "In this article";
  const list = document.createElement("ol");
  const usedIds = new Set();
  for (const heading of headings) {
    const baseId = heading.textContent.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
    usedIds.add(id);
    heading.id = id;
    const item = document.createElement("li");
    if (heading.tagName === "H4") item.className = "toc-subheading";
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  }
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toc-toggle";
  toggle.textContent = "Collapse";
  toggle.setAttribute("aria-expanded", "true");
  toggle.addEventListener("click", () => {
    list.hidden = !list.hidden;
    toggle.textContent = list.hidden ? "Expand" : "Collapse";
    toggle.setAttribute("aria-expanded", String(!list.hidden));
  });
  articleToc.replaceChildren(title, toggle, list);
  articleToc.hidden = false;
}

function renderRelatedPosts(currentPost) {
  const relatedContainer = document.querySelector("#related-posts");
  const relatedList = document.querySelector("#related-post-list");
  if (!relatedContainer || !relatedList) return;
  const related = allPosts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      overlap: post.tags.filter((tag) => currentPost.tags.some((current) => current.toLowerCase() === tag.toLowerCase())).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.post.date.localeCompare(a.post.date))
    .slice(0, 3);
  relatedList.replaceChildren();
  for (const { post } of related) {
    const link = document.createElement("a");
    link.href = `blog.html?slug=${encodeURIComponent(post.slug)}`;
    link.textContent = post.title;
    relatedList.append(link);
  }
  relatedContainer.hidden = related.length === 0;
}

function addArticleInteractions(post) {
  const bookmark = document.querySelector("#article-bookmark");
  if (bookmark) {
    const updateBookmark = () => {
      const saved = savedPosts.has(post.slug);
      bookmark.textContent = saved ? "Saved to reading list" : "Save article";
      bookmark.setAttribute("aria-pressed", String(saved));
    };
    updateBookmark();
    bookmark.addEventListener("click", () => {
      if (savedPosts.has(post.slug)) savedPosts.delete(post.slug);
      else savedPosts.add(post.slug);
      saveSavedPosts();
      updateBookmark();
    });
  }

  const copyLink = document.querySelector("#article-copy-link");
  copyLink?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyLink.textContent = "Link copied";
    } catch (error) {
      console.error("Could not copy article link:", error);
      if (articleStatus) {
        articleStatus.hidden = false;
        articleStatus.textContent = "Could not copy link; use your browser's address bar to share this article.";
      }
    }
  });

  const share = document.querySelector("#article-share");
  share?.addEventListener("click", async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.summary, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      share.textContent = "Article shared";
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Could not share article:", error);
        if (articleStatus) {
          articleStatus.hidden = false;
          articleStatus.textContent = "Sharing is unavailable in this browser.";
        }
      }
    }
  });

  const fontSize = document.querySelector("#article-font-size");
  fontSize?.addEventListener("input", () => {
    articleContent.style.fontSize = `${fontSize.value}px`;
  });

  for (const code of articleContent.querySelectorAll("pre code")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Copy code";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
      } catch (error) {
        console.error("Could not copy code block:", error);
        button.textContent = "Copy unavailable";
      }
    });
    code.parentElement.append(button);
  }

  const reactionKey = `portfolio-feedback-${post.slug}`;
  let previousReaction = "";
  try {
    previousReaction = localStorage.getItem(reactionKey) || "";
  } catch (error) {
    console.error("Could not read local article feedback:", error);
  }
  for (const button of document.querySelectorAll("[data-reaction]")) {
    if (previousReaction === button.dataset.reaction) {
      button.setAttribute("aria-pressed", "true");
    }
    button.addEventListener("click", () => {
      try {
        localStorage.setItem(reactionKey, button.dataset.reaction);
        for (const item of document.querySelectorAll("[data-reaction]")) item.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-pressed", "true");
        button.textContent = "Thanks";
      } catch (error) {
        console.error("Could not save local article feedback:", error);
        if (articleStatus) {
          articleStatus.hidden = false;
          articleStatus.textContent = "Feedback could not be saved in this browser.";
        }
      }
    });
  }
  renderRelatedPosts(post);
}

async function loadBlog() {
  try {
    const response = await fetch("blog/posts.json");
    if (!response.ok) throw new Error(`Blog index returned ${response.status}`);
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error("Blog index must be a JSON array.");
    allPosts = entries.map(validatePost).sort((a, b) => b.date.localeCompare(a.date));
    window.portfolioPosts = allPosts;
    window.dispatchEvent(new CustomEvent("posts-ready", { detail: allPosts }));
    renderPostFilters();
    renderPostList();

    if (!articleContent) return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    const post = allPosts.find((entry) => entry.slug === slug);
    if (!post) throw new Error("That post does not exist in the blog index.");

    articleTitle.textContent = post.title;
    articleDate.dateTime = post.date;
    articleDate.textContent = formatDate(post.date);
    articleSummary.textContent = post.summary;
    if (articleTags) {
      for (const tag of post.tags) {
        const label = document.createElement("span");
        label.className = "blog-tag";
        label.textContent = tag;
        articleTags.append(label);
      }
    }
    document.title = `${post.title} | Kaushal Patidar`;
    const markdownResponse = await fetch(`blog/posts/${encodeURIComponent(post.slug)}.md`);
    if (!markdownResponse.ok) throw new Error(`Blog post returned ${markdownResponse.status}`);
    const markdown = await markdownResponse.text();
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    if (articleReadingTime) articleReadingTime.textContent = `${Math.max(1, Math.ceil(words / 220))} min read`;
    articleContent.append(renderMarkdown(markdown));
    addTableOfContents();
    addArticleInteractions(post);
    articleLoading.hidden = true;
  } catch (error) {
    const status = articleContent ? articleStatus : listStatus;
    if (status) {
      status.hidden = false;
      status.textContent = "Blog content could not be loaded. Please check the post index and Markdown file.";
    }
    if (articleLoading) articleLoading.hidden = true;
    console.error("Could not load blog content:", error);
  }
}

document.querySelector("#blog-search")?.addEventListener("input", async (event) => {
  blogSearchTerm = event.target.value.trim().toLowerCase();
  const generation = ++searchGeneration;
  if (!blogSearchTerm && listStatus) listStatus.hidden = true;
  if (blogSearchTerm && allPosts.length) {
    try {
      listStatus.hidden = false;
      listStatus.textContent = "Searching article text…";
      await Promise.all(allPosts.map(loadPostBody));
      if (generation === searchGeneration) listStatus.hidden = true;
    } catch (error) {
      console.error("Could not index article text for search:", error);
      if (generation === searchGeneration) {
        listStatus.hidden = false;
        listStatus.textContent = "Full-text search is unavailable. Search titles, summaries, and tags instead.";
      }
    }
  }
  if (generation === searchGeneration) renderPostList();
});
document.querySelector("#blog-sort")?.addEventListener("change", (event) => {
  oldestFirst = event.target.value === "oldest";
  renderPostList();
});
document.querySelector("#blog-saved-toggle")?.addEventListener("click", (event) => {
  savedOnly = !savedOnly;
  event.currentTarget.setAttribute("aria-pressed", String(savedOnly));
  event.currentTarget.textContent = savedOnly ? "All writing" : "Reading list";
  renderPostList();
});
document.querySelector("#blog-surprise")?.addEventListener("click", () => {
  if (!allPosts.length) return;
  const post = allPosts[Math.floor(Math.random() * allPosts.length)];
  window.location.href = `blog.html?slug=${encodeURIComponent(post.slug)}`;
});

loadBlog();
