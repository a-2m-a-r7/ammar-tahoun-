const state = {
  profile: null,
  activeFilter: "الكل"
};

const refs = {
  brandLink: document.getElementById("brand-link"),
  heroName: document.getElementById("hero-name"),
  heroRole: document.getElementById("hero-role"),
  heroSummary: document.getElementById("hero-summary"),
  personaName: document.getElementById("persona-name"),
  personaRole: document.getElementById("persona-role"),
  availabilityText: document.getElementById("availability-text"),
  profileImage: document.getElementById("profile-image"),
  resumeLink: document.getElementById("resume-link"),
  highlightsList: document.getElementById("highlights-list"),
  socialStrip: document.getElementById("social-strip"),
  heroStats: document.getElementById("hero-stats"),
  statsGrid: document.getElementById("stats-grid"),
  aboutIntro: document.getElementById("about-intro"),
  aboutBody: document.getElementById("about-body"),
  principlesList: document.getElementById("principles-list"),
  servicesGrid: document.getElementById("services-grid"),
  processGrid: document.getElementById("process-grid"),
  skillsGrid: document.getElementById("skills-grid"),
  projectFilters: document.getElementById("project-filters"),
  projectsGrid: document.getElementById("projects-grid"),
  experienceList: document.getElementById("experience-list"),
  testimonialsGrid: document.getElementById("testimonials-grid"),
  insightsGrid: document.getElementById("insights-grid"),
  faqList: document.getElementById("faq-list"),
  contactHeading: document.getElementById("contact-heading"),
  contactIntro: document.getElementById("contact-intro"),
  contactLinks: document.getElementById("contact-links"),
  footerBrand: document.getElementById("footer-brand"),
  footerLocation: document.getElementById("footer-location"),
  footerYear: document.getElementById("footer-year"),
  contactForm: document.getElementById("contact-form"),
  submitButton: document.getElementById("submit-button"),
  formStatus: document.getElementById("form-status")
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(value = "#") {
  if (!value) {
    return "#";
  }

  if (value === "#" || value.startsWith("/")) {
    return value;
  }

  try {
    const url = new URL(value);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}

function metaDescriptionTag() {
  return document.querySelector('meta[name="description"]');
}

function renderHighlights(items = []) {
  refs.highlightsList.innerHTML = items
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join("");
}

function renderSocials(items = []) {
  refs.socialStrip.innerHTML = items
    .slice(0, 4)
    .map(
      (item) => `
        <a class="mini-link" href="${safeUrl(item.url)}" target="_blank" rel="noreferrer">
          <span>${escapeHtml(item.label)}</span>
          <small>${escapeHtml(item.handle)}</small>
        </a>
      `
    )
    .join("");
}

function renderStats(target, stats = []) {
  target.innerHTML = stats
    .map(
      (item) => `
        <article class="metric-card">
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.label)}</span>
        </article>
      `
    )
    .join("");
}

function renderPrinciples(items = []) {
  refs.principlesList.innerHTML = items
    .map(
      (item, index) => `
        <article class="principle-item">
          <strong>0${index + 1}</strong>
          <p>${escapeHtml(item)}</p>
        </article>
      `
    )
    .join("");
}

function renderServices(items = []) {
  refs.servicesGrid.innerHTML = items
    .map(
      (service, index) => `
        <article class="service-card" data-reveal>
          <span class="card-kicker">0${index + 1}</span>
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.summary)}</p>
          <ul class="service-points">
            ${(service.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderProcess(items = []) {
  refs.processGrid.innerHTML = items
    .map(
      (item) => `
        <article class="process-card" data-reveal>
          <strong>${escapeHtml(item.step)}</strong>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderSkillGroups(items = []) {
  refs.skillsGrid.innerHTML = items
    .map(
      (group) => `
        <article class="skill-card" data-reveal>
          <h3>${escapeHtml(group.title)}</h3>
          <div class="skill-tags">
            ${(group.items || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function buildProjectFilters(projects = []) {
  const filters = ["الكل"];
  const seen = new Set(filters);

  projects.forEach((project) => {
    [project.category, ...(project.stack || [])].forEach((value) => {
      if (value && !seen.has(value)) {
        seen.add(value);
        filters.push(value);
      }
    });
  });

  return filters.slice(0, 10);
}

function projectMatchesFilter(project, filter) {
  if (filter === "الكل") {
    return true;
  }

  return project.category === filter || (project.stack || []).includes(filter);
}

function renderProjectFilters(projects = []) {
  const filters = buildProjectFilters(projects);

  refs.projectFilters.innerHTML = filters
    .map(
      (filter) => `
        <button
          type="button"
          class="filter-chip ${filter === state.activeFilter ? "is-active" : ""}"
          data-filter="${escapeHtml(filter)}"
        >
          ${escapeHtml(filter)}
        </button>
      `
    )
    .join("");

  refs.projectFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.getAttribute("data-filter") || "الكل";
      renderProjectFilters(projects);
      renderProjects(projects);
      applyRevealAnimation();
    });
  });
}

function renderProjects(projects = []) {
  const filteredProjects = projects.filter((project) => projectMatchesFilter(project, state.activeFilter));

  refs.projectsGrid.innerHTML = filteredProjects
    .map(
      (project) => `
        <article class="project-card" data-reveal>
          <div class="project-visual">
            <img src="${safeUrl(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy" />
          </div>
          <div class="project-header">
            <div>
              <p class="project-meta">${escapeHtml(project.category)} • ${escapeHtml(project.year)}</p>
              <h3>${escapeHtml(project.title)}</h3>
            </div>
          </div>
          <p>${escapeHtml(project.summary)}</p>
          <div class="project-tags">
            ${(project.stack || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
          </div>
          <div class="metric-list">
            ${(project.metrics || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
          </div>
          <div class="project-links">
            <a class="text-link" href="${safeUrl(project.links?.live)}" target="_blank" rel="noreferrer">Live</a>
            <a class="text-link" href="${safeUrl(project.links?.repo)}" target="_blank" rel="noreferrer">Repo</a>
            <a class="text-link" href="${safeUrl(project.links?.caseStudy)}" target="_blank" rel="noreferrer">
              Case Study
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderExperience(items = []) {
  refs.experienceList.innerHTML = items
    .map(
      (item) => `
        <article class="timeline-card" data-reveal>
          <div class="timeline-meta">
            <p class="timeline-period">${escapeHtml(item.period)}</p>
            <p class="project-meta">${escapeHtml(item.company)}</p>
          </div>
          <h3>${escapeHtml(item.role)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <ul class="timeline-points">
            ${(item.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderTestimonials(items = []) {
  refs.testimonialsGrid.innerHTML = items
    .map(
      (item) => `
        <article class="testimonial-card" data-reveal>
          <p>"${escapeHtml(item.quote)}"</p>
          <footer>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.title)}</span>
          </footer>
        </article>
      `
    )
    .join("");
}

function renderInsights(items = []) {
  refs.insightsGrid.innerHTML = items
    .map(
      (item) => `
        <a class="insight-card" href="${safeUrl(item.url)}" target="_blank" rel="noreferrer" data-reveal>
          <span class="insight-tag">${escapeHtml(item.tag)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
        </a>
      `
    )
    .join("");
}

function renderFaqs(items = []) {
  refs.faqList.innerHTML = items
    .map(
      (item, index) => `
        <article class="faq-item" data-reveal>
          <button class="faq-trigger" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
            <span>${escapeHtml(item.question)}</span>
            <span>${index === 0 ? "−" : "+"}</span>
          </button>
          <div class="faq-panel" ${index === 0 ? "" : "hidden"}>
            <p>${escapeHtml(item.answer)}</p>
          </div>
        </article>
      `
    )
    .join("");

  refs.faqList.querySelectorAll(".faq-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.nextElementSibling;
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
      trigger.lastElementChild.textContent = isExpanded ? "+" : "−";
      panel.hidden = isExpanded;
    });
  });
}

function renderContactLinks(items = []) {
  refs.contactLinks.innerHTML = items
    .map(
      (item) => `
        <a class="contact-link" href="${safeUrl(item.url)}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.value)}</p>
        </a>
      `
    )
    .join("");
}

function applyRevealAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => {
    observer.observe(element);
  });
}

function renderProfile(profile) {
  const {
    site,
    personal,
    highlights,
    socials,
    stats,
    about,
    services,
    skillGroups,
    process,
    projects,
    experience,
    testimonials,
    insights,
    faqs,
    contact
  } = profile;

  document.title = site.title;
  const description = metaDescriptionTag();
  if (description) {
    description.setAttribute("content", site.description);
  }

  refs.brandLink.textContent = personal.fullName.toUpperCase();
  refs.footerBrand.textContent = personal.fullName.toUpperCase();
  refs.heroName.textContent = personal.fullName.toUpperCase();
  refs.heroRole.textContent = personal.role;
  refs.heroSummary.textContent = personal.heroSummary;
  refs.personaName.textContent = personal.nativeName;
  refs.personaRole.textContent = personal.role;
  refs.availabilityText.textContent = personal.availability;
  refs.profileImage.src = safeUrl(personal.profileImage);
  refs.profileImage.alt = personal.fullName;
  refs.resumeLink.href = safeUrl(personal.resumeUrl);
  refs.footerLocation.textContent = personal.location;
  refs.footerYear.textContent = new Date().getFullYear().toString();
  refs.aboutIntro.textContent = about.intro;
  refs.aboutBody.textContent = about.body;
  refs.contactHeading.textContent = contact.heading;
  refs.contactIntro.textContent = contact.intro;

  renderHighlights(highlights);
  renderSocials(socials);
  renderStats(refs.heroStats, stats.slice(0, 4));
  renderStats(refs.statsGrid, stats);
  renderPrinciples(about.principles);
  renderServices(services);
  renderProcess(process);
  renderSkillGroups(skillGroups);
  renderProjectFilters(projects);
  renderProjects(projects);
  renderExperience(experience);
  renderTestimonials(testimonials);
  renderInsights(insights);
  renderFaqs(faqs);
  renderContactLinks(contact.directLinks);
  applyRevealAnimation();
}

async function loadProfile() {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("تعذر تحميل بيانات الموقع.");
  }

  const payload = await response.json();
  return payload.data;
}

function updateFormStatus(message, type = "") {
  refs.formStatus.textContent = message;
  refs.formStatus.classList.remove("is-success", "is-error");

  if (type) {
    refs.formStatus.classList.add(type === "success" ? "is-success" : "is-error");
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.contactForm);
  const payload = Object.fromEntries(formData.entries());

  refs.submitButton.disabled = true;
  refs.submitButton.textContent = "جارٍ الإرسال...";
  updateFormStatus("يتم الآن إرسال رسالتك...");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "تعذر إرسال الرسالة.");
    }

    refs.contactForm.reset();
    updateFormStatus(result.message, "success");
  } catch (error) {
    updateFormStatus(error.message || "حدث خطأ أثناء الإرسال.", "error");
  } finally {
    refs.submitButton.disabled = false;
    refs.submitButton.textContent = "إرسال الرسالة";
  }
}

async function initialize() {
  refs.contactForm.addEventListener("submit", handleContactSubmit);

  try {
    state.profile = await loadProfile();
    renderProfile(state.profile);
  } catch (error) {
    updateFormStatus("");
    refs.heroSummary.textContent = error.message;
  }
}

initialize();
