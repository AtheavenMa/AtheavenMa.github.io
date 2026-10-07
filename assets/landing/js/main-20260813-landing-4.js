const deburr = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const icons = {
  email: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  scholar: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2 1 8.5l4.03 2.38A6.97 6.97 0 0 0 5 12a7 7 0 1 0 13.97-1.12L21 9.66V16h2V8.5L12 2zm0 5a5 5 0 0 1 4.33 2.5L12 12.06 7.67 9.5A5 5 0 0 1 12 7z"/></svg>',
  github: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.26 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  cv: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
};

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function renderSocials(targetId) {
  setHTML(targetId, socials.map((s) =>
    `<a href="${s.href}" class="social-link" aria-label="${s.label}" data-tip="${s.tip}" target="${s.href.startsWith("mailto:") ? "_self" : "_blank"}" rel="noopener">${icons[s.icon]}</a>`
  ).join(""));
}

function highlightMe(authors) {
  return authors.replaceAll("Haotian Ma", '<span class="me">Haotian Ma</span>');
}

function renderCvEntry(item, level) {
  const tag = level > 1 ? "h4" : "h3";
  const aside = item.aside ? `<p class="cv-aside">${item.aside}</p>` : "";
  const lines = (item.lines || [])
    .map((line) => `<p class="cv-line${line.em ? " em" : ""}">${highlightMe(line.text)}</p>`)
    .join("");
  const points = (item.points || []).map((point) => `<li>${highlightMe(point)}</li>`).join("");
  const list = points ? `<ul class="cv-points">${points}</ul>` : "";
  const nested = item.items?.length
    ? `<div class="cv-children">${item.items.map((child) => renderCvEntry(child, level + 1)).join("")}</div>`
    : "";
  return (
    `<article class="cv-entry reveal"><div class="cv-entry-top">` +
    `<${tag} class="cv-title">${item.title}</${tag}>${aside}</div>${lines}${list}${nested}</article>`
  );
}

function renderCvModule(targetId, items) {
  setHTML(targetId, (items || []).map((item) => renderCvEntry(item, 1)).join(""));
}

function renderContent() {
  renderSocials("heroSocials");
  renderSocials("contactSocials");

  const newsList = document.getElementById("newsList");
  const newsToggle = document.getElementById("newsToggle");
  if (newsList) {
    newsList.innerHTML = news.map((n, i) =>
      `<li class="news-item reveal${i >= 4 ? " hidden-news" : ""}"><span class="news-date">${n.date}</span><p>${n.html}</p></li>`
    ).join("");
    if (newsToggle && news.length > 4) newsToggle.hidden = false;
  }

  const pubList = document.getElementById("pubList");
  if (pubList) {
    publications.forEach((p) => {
      const article = document.createElement("article");
      article.className = "pub-card reveal";
      article.dataset.year = p.year;
      article.dataset.tags = (p.tags || []).join(" ");
      article.dataset.category = p.category || "";
      article.dataset.search = deburr([p.title, p.authors, p.venueFull, p.venueBadge, p.year].join(" "));
      const title = p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${p.title}</a>` : p.title;
      const links = p.url ? `<div class="pub-links"><a href="${p.url}" class="pub-link" target="_blank" rel="noopener">Paper</a></div>` : "";
      article.innerHTML =
        `<div class="pub-venue-badge venue-${p.badge}">${p.venueBadge}</div>` +
        `<div class="pub-body"><h3 class="pub-title">${title}</h3>` +
        `<p class="pub-authors">${highlightMe(p.authors)}</p>` +
        `<p class="pub-venue">${p.venueFull}</p>${links}</div>`;
      pubList.appendChild(article);
    });
  }

  renderCvModule("researchList", researchExperience);
  renderCvModule("educationList", education);
  renderCvModule("workList", workExperience);

  const renderFacts = (id, items) => {
    const el = document.getElementById(id);
    if (!el || !items) return;
    el.innerHTML = items.map((item) => `<li class="reveal">${item.html}</li>`).join("");
  };
  renderFacts("skillsList", skills);
  renderFacts("awardsList", awards);

  const listItem = (x) =>
    `<li class="reveal"><strong>${x.title}</strong>${x.html ? x.html : `<br><span class="muted">${x.muted}</span>`}</li>`;
  setHTML("serviceList", service.map(listItem).join(""));
  setHTML("teachingList", (typeof teaching === "undefined" ? [] : teaching).map(listItem).join(""));
  setHTML("openToList", openTo.map(listItem).join(""));
}

renderContent();

const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.dataset.theme = storedTheme || (prefersDark ? "dark" : "light");

document.getElementById("themeToggle")?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", root.dataset.theme);
});

const nav = document.getElementById("nav");
const progressBar = document.getElementById("progressBar");
const backToTop = document.getElementById("backToTop");
const bttCircle = backToTop?.querySelector(".btt-ring circle");
function onScroll() {
  const y = window.scrollY;
  nav?.classList.toggle("scrolled", y > 10);
  backToTop?.classList.toggle("visible", y > 600);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? y / max : 0;
  if (progressBar) progressBar.style.width = `${p * 100}%`;
  if (bttCircle) bttCircle.style.strokeDashoffset = (125.7 * (1 - p)).toFixed(1);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const burger = document.getElementById("navBurger");
const navLinks = document.getElementById("navLinks");
burger?.addEventListener("click", () => {
  burger.classList.toggle("open");
  navLinks?.classList.toggle("open");
});
navLinks?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  burger?.classList.remove("open");
  navLinks.classList.remove("open");
}));

const linkMap = new Map([...document.querySelectorAll(".nav-link")].map((l) => [l.getAttribute("href").slice(1), l]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".nav-link.active").forEach((l) => l.classList.remove("active"));
    linkMap.get(entry.target.id)?.classList.add("active");
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("section[id]").forEach((s) => sectionObserver.observe(s));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    entry.target.style.transitionDelay = `${Math.min(i * 60, 320)}ms`;
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
requestAnimationFrame(() => document.querySelectorAll(".hl").forEach((el) => el.classList.add("marked")));

const newsToggle = document.getElementById("newsToggle");
newsToggle?.addEventListener("click", () => {
  const list = document.getElementById("newsList");
  const expanded = list?.classList.toggle("show-all-news");
  newsToggle.textContent = expanded ? "Hide older news" : "Show older news";
});

const pubFilters = document.getElementById("pubFilters");
const pubSearch = document.getElementById("pubSearch");
let activeFilter = pubFilters?.querySelector(".filter-btn.active")?.dataset.filter || "selected";
function applyPubFilters() {
  const q = deburr(pubSearch?.value || "");
  let shown = 0;
  document.querySelectorAll(".pub-card").forEach((card) => {
    const tags = (card.dataset.tags || "").split(" ").filter(Boolean);
    const category = card.dataset.category || "";
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "selected" ? tags.includes("selected") : category === activeFilter);
    const matchesSearch = !q || card.dataset.search.includes(q);
    const visible = matchesFilter && matchesSearch;
    card.hidden = !visible;
    card.style.display = visible ? "" : "none";
    if (visible) shown += 1;
  });
  const empty = document.getElementById("pubEmpty");
  if (empty) empty.hidden = shown !== 0;
}
pubFilters?.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-btn");
  if (!button) return;
  pubFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  button.classList.add("active");
  activeFilter = button.dataset.filter;
  applyPubFilters();
});
pubSearch?.addEventListener("input", applyPubFilters);
applyPubFilters();

const copyEmail = document.getElementById("copyEmail");
const toast = document.getElementById("toast");
copyEmail?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyEmail.dataset.email);
    toast?.classList.add("show");
    setTimeout(() => toast?.classList.remove("show"), 1500);
  } catch (_) {
    window.location.href = `mailto:${copyEmail.dataset.email}`;
  }
});
