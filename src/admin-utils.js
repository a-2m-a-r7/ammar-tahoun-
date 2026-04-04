export function createCertificateForm(item) {
  return {
    id: item?.id || "",
    title: item?.title || "",
    issuer: item?.issuer || "",
    year: item?.year || "",
    summary: item?.summary || "",
    credentialUrl: item?.credentialUrl === "#" ? "" : item?.credentialUrl || ""
  };
}

export function createProjectForm(item) {
  const defaultArtwork = new Set([
    "/assets/project-ai.svg",
    "/assets/project-command.svg",
    "/assets/project-commerce.svg"
  ]);

  return {
    slug: item?.slug || "",
    title: item?.title || "",
    category: item?.category || "AI",
    year: item?.year || "Recent",
    summary: item?.summary || "",
    stack: Array.isArray(item?.stack) ? item.stack.join(", ") : "",
    metrics: Array.isArray(item?.metrics) ? item.metrics.join(", ") : "",
    challenge: item?.details?.challenge || "",
    solution: item?.details?.solution || "",
    impact: Array.isArray(item?.details?.impact) ? item.details.impact.join(", ") : "",
    image: defaultArtwork.has(item?.image) ? "" : item?.image || "",
    live: item?.links?.live === "#" ? "" : item?.links?.live || "",
    repo: item?.links?.repo === "#" ? "" : item?.links?.repo || "",
    caseStudy: item?.links?.caseStudy === "#" ? "" : item?.links?.caseStudy || ""
  };
}

export function splitCommaValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function guessImageMimeType(file) {
  if (file && typeof file.type === "string" && file.type.trim()) {
    const type = file.type.trim().toLowerCase();
    if (type === "image/jpg" || type === "image/pjpeg") {
      return "image/jpeg";
    }
    if (type === "image/x-png") {
      return "image/png";
    }
    if (type.startsWith("image/")) {
      return file.type.trim();
    }
  }

  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

export function createContactFormFromProfile(profile) {
  if (!profile) {
    return { email: "", phone: "", location: "", heading: "", intro: "" };
  }

  return {
    email: profile.personal?.email || "",
    phone: profile.personal?.phone || "",
    location: profile.personal?.location || "",
    heading: profile.contact?.heading || "",
    intro: profile.contact?.intro || ""
  };
}

export function explainAdminVerifyFailure(response, result) {
  if (result && typeof result.message === "string" && result.message.trim()) {
    return result.message;
  }

  if (response.status === 503) {
    return "Admin is disabled. Add PORTFOLIO_ADMIN_TOKEN to .env and restart the server.";
  }

  if (response.status === 403) {
    return "The admin key is invalid or this request was rejected.";
  }

  if (response.status === 429) {
    return "Too many admin login attempts. Please wait a little, then try again.";
  }

  if (response.status === 415) {
    return "Unsupported request content type.";
  }

  return `Unable to verify admin access (HTTP ${response.status}). Make sure the Node server is running from the project root.`;
}

export function cloneProfile(profile) {
  if (typeof structuredClone === "function") {
    return structuredClone(profile);
  }

  return JSON.parse(JSON.stringify(profile));
}
