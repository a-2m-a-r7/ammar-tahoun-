import dotenv from "dotenv";
import { createServer } from "node:http";
import { randomUUID, timingSafeEqual, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number.parseInt(process.env.PORT || "3005", 10);
const DIST_DIR = path.join(__dirname, "dist");
const DATA_DIR = path.join(__dirname, "data");
const LEGACY_MEDIA_DIR = path.join(__dirname, "media");
const WORKSPACE_PATH_LOWER = __dirname.toLowerCase();

function resolveMediaDirectory() {
  const configuredMediaDir = sanitizeText(process.env.MEDIA_STORAGE_DIR || "", { maxLength: 600 });
  if (configuredMediaDir) {
    return path.resolve(configuredMediaDir);
  }

  const isOneDriveWorkspace =
    WORKSPACE_PATH_LOWER.includes(`${path.sep}onedrive${path.sep}`) || WORKSPACE_PATH_LOWER.includes("/onedrive/");

  if (process.platform === "win32" && isOneDriveWorkspace && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "AmmarTahoonPortfolio", "media");
  }

  return LEGACY_MEDIA_DIR;
}

let MEDIA_DIR = resolveMediaDirectory();
let PROFILE_MEDIA_DIR = path.join(MEDIA_DIR, "profile");
let PROJECT_MEDIA_DIR = path.join(MEDIA_DIR, "projects");

function setActiveMediaDirectory(nextDirectory) {
  MEDIA_DIR = nextDirectory;
  PROFILE_MEDIA_DIR = path.join(MEDIA_DIR, "profile");
  PROJECT_MEDIA_DIR = path.join(MEDIA_DIR, "projects");
}
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const CONTACT_FILE = path.join(DATA_DIR, "contact-submissions.json");
const MAX_BODY_SIZE = Number.parseInt(process.env.MAX_BODY_SIZE || "16384", 10);
const defaultProfileImageBytes = 5 * 1024 * 1024;
const parsedProfileImageBytes = Number.parseInt(process.env.MAX_PROFILE_IMAGE_BYTES ?? "", 10);
const MAX_PROFILE_IMAGE_BYTES =
  Number.isFinite(parsedProfileImageBytes) && parsedProfileImageBytes > 0
    ? parsedProfileImageBytes
    : defaultProfileImageBytes;

const defaultAdminBodyBytes = Math.max(12 * 1024 * 1024, Math.ceil(MAX_PROFILE_IMAGE_BYTES * 1.45));
const parsedAdminBodyBytes = Number.parseInt(process.env.MAX_ADMIN_BODY_SIZE ?? "", 10);
const MAX_ADMIN_BODY_SIZE =
  Number.isFinite(parsedAdminBodyBytes) && parsedAdminBodyBytes > 0
    ? parsedAdminBodyBytes
    : defaultAdminBodyBytes;
const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${10 * 60 * 1000}`, 10);
const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5", 10);
const ADMIN_RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10);
const ADMIN_RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS || "8", 10);
const ADMIN_SESSION_TTL_MS = Number.parseInt(process.env.ADMIN_SESSION_TTL_MS || `${8 * 60 * 60 * 1000}`, 10);
const ADMIN_REMEMBER_TTL_MS = Number.parseInt(
  process.env.ADMIN_REMEMBER_TTL_MS || `${7 * 24 * 60 * 60 * 1000}`,
  10
);
const ADMIN_SESSION_COOKIE_NAME = "portfolio_admin_session";
const FORCE_SECURE_ADMIN_COOKIE = process.env.PORTFOLIO_SECURE_COOKIE === "true";
const ADMIN_TOKEN = String(process.env.PORTFOLIO_ADMIN_TOKEN || "").trim();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const CONTACT_WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL || "";
const CONTACT_WEBHOOK_TOKEN = process.env.CONTACT_WEBHOOK_TOKEN || "";
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || "").trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const allowedImageTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"]
]);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".mjs", "application/javascript; charset=utf-8"]
]);

const rateLimitStore = new Map();
const adminRateLimitStore = new Map();
const adminSessions = new Map();
const pendingManagedDeletes = new Set();
const auditLogs = [];
let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}
let writeQueue = Promise.resolve();

function isSecureRequest(req) {
  if (FORCE_SECURE_ADMIN_COOKIE) {
    return true;
  }

  if (req?.socket?.encrypted) {
    return true;
  }

  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto
      .split(",")[0]
      .trim()
      .toLowerCase() === "https";
  }

  return false;
}

function setSecurityHeaders(res) {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ")
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

function applyTransportSecurityHeaders(req, res) {
  if (!isSecureRequest(req)) {
    return;
  }

  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
}

function sendJson(res, statusCode, payload) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, body) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function markSensitiveResponse(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "unknown";
}

function isOriginAllowed(req) {
  if (ALLOWED_ORIGINS.length === 0) {
    return true;
  }

  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

function sanitizeText(value, { maxLength = 4000 } = {}) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return normalized.slice(0, maxLength);
}

function encrypt(text) {
  if (!ENCRYPTION_KEY || !text) return text;
  try {
    const key = scryptSync(ENCRYPTION_KEY, "salt", 32);
    const iv = Buffer.alloc(IV_LENGTH, 0); // Static IV for demo/simple vault, ideally random + stored
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `v1:${encrypted}`;
  } catch (err) {
    console.error("[security] Encryption failed:", err);
    return text;
  }
}

function decrypt(encryptedText) {
  if (!ENCRYPTION_KEY || !encryptedText || !encryptedText.startsWith("v1:")) return encryptedText;
  try {
    const text = encryptedText.replace("v1:", "");
    const key = scryptSync(ENCRYPTION_KEY, "salt", 32);
    const iv = Buffer.alloc(IV_LENGTH, 0);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[security] Decryption failed:", err);
    return encryptedText;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUrl(value, { allowRelative = true } = {}) {
  const cleaned = sanitizeText(value, { maxLength: 400 });

  if (!cleaned) {
    return "#";
  }

  if (cleaned === "#") {
    return "#";
  }

  if (allowRelative && cleaned.startsWith("/")) {
    return cleaned;
  }

  try {
    const url = new URL(cleaned);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}

function sanitizeRelativePath(value, { maxLength = 400 } = {}) {
  const cleaned = sanitizeText(value, { maxLength });

  if (!cleaned) {
    return "";
  }

  if (/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(cleaned)) {
    return cleaned;
  }

  return "";
}

function sanitizeStringArray(value, { maxItems = 8, maxLength = 80 } = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueValues = new Set();
  const result = [];

  value.forEach((item) => {
    const cleaned = sanitizeText(item, { maxLength });
    if (!cleaned || uniqueValues.has(cleaned)) {
      return;
    }

    uniqueValues.add(cleaned);
    result.push(cleaned);
  });

  return result.slice(0, maxItems);
}

function sanitizeCollection(value, mapper, { maxItems = 12 } = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => mapper(item, index))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeProjectRecord(project) {
  const cleaned = {
    title: sanitizeText(project?.title, { maxLength: 120 }),
    slug: slugify(project?.slug) || slugify(project?.title) || `project-${randomUUID().slice(0, 8)}`,
    summary: sanitizeText(project?.summary, { maxLength: 320 }),
    category: sanitizeText(project?.category, { maxLength: 50 }) || "Project",
    year: sanitizeText(project?.year, { maxLength: 24 }) || `${new Date().getFullYear()}`,
    image: sanitizeRelativePath(project?.image) || "",
    stack: sanitizeStringArray(project?.stack, { maxItems: 8, maxLength: 48 }),
    metrics: sanitizeStringArray(project?.metrics, { maxItems: 4, maxLength: 72 }),
    details: {
      challenge: sanitizeText(project?.details?.challenge, { maxLength: 420 }),
      solution: sanitizeText(project?.details?.solution, { maxLength: 420 }),
      impact: sanitizeStringArray(project?.details?.impact, { maxItems: 4, maxLength: 100 })
    },
    links: {
      live: sanitizeUrl(project?.links?.live),
      repo: sanitizeUrl(project?.links?.repo),
      caseStudy: sanitizeUrl(project?.links?.caseStudy)
    }
  };

  if (!cleaned.title || !cleaned.summary) {
    return null;
  }

  if (cleaned.metrics.length === 0) {
    cleaned.metrics = ["Project delivery", "Practical implementation", "Portfolio-ready presentation"];
  }

  if (cleaned.image === "") {
    cleaned.image = getDefaultProjectImage(cleaned.category);
  }

  return cleaned;
}

function normalizeCertificateRecord(certificate) {
  const cleaned = {
    id: sanitizeText(certificate?.id, { maxLength: 80 }) || randomUUID(),
    title: sanitizeText(certificate?.title, { maxLength: 120 }),
    issuer: sanitizeText(certificate?.issuer, { maxLength: 120 }),
    year: sanitizeText(certificate?.year, { maxLength: 30 }),
    summary: sanitizeText(certificate?.summary, { maxLength: 320 }),
    credentialUrl: sanitizeUrl(certificate?.credentialUrl)
  };

  if (!cleaned.title || !cleaned.issuer || !cleaned.year || !cleaned.summary) {
    return null;
  }

  return cleaned;
}

function normalizeProfilePayload(profile) {
  const source = sanitizeProfileTree(profile);
  const normalizedSiteUrl = sanitizeUrl(source?.site?.url, { allowRelative: false });
  const usedProjectSlugs = new Set();
  const usedCertificateIds = new Set();

  const normalizedProjects = sanitizeCollection(
    source?.projects,
    (project) => {
      const normalizedProject = normalizeProjectRecord(project);
      if (!normalizedProject) {
        return null;
      }

      let nextSlug = normalizedProject.slug;
      while (usedProjectSlugs.has(nextSlug)) {
        nextSlug = `${normalizedProject.slug}-${randomUUID().slice(0, 4)}`;
      }
      usedProjectSlugs.add(nextSlug);

      return {
        ...normalizedProject,
        slug: nextSlug
      };
    },
    { maxItems: 24 }
  );

  const normalizedCertificates = sanitizeCollection(
    source?.certificates,
    (certificate) => {
      const normalizedCertificate = normalizeCertificateRecord(certificate);
      if (!normalizedCertificate) {
        return null;
      }

      let nextId = normalizedCertificate.id;
      while (usedCertificateIds.has(nextId)) {
        nextId = randomUUID();
      }
      usedCertificateIds.add(nextId);

      return {
        ...normalizedCertificate,
        id: nextId
      };
    },
    { maxItems: 24 }
  );

  return {
    site: {
      title: sanitizeText(source?.site?.title, { maxLength: 160 }),
      description: sanitizeText(source?.site?.description, { maxLength: 320 }),
      url: normalizedSiteUrl === "#" ? "" : normalizedSiteUrl
    },
    personal: {
      fullName: sanitizeText(source?.personal?.fullName, { maxLength: 120 }),
      legalName: sanitizeText(source?.personal?.legalName, { maxLength: 160 }),
      nativeName: sanitizeText(source?.personal?.nativeName, { maxLength: 120 }),
      role: sanitizeText(source?.personal?.role, { maxLength: 120 }),
      tagline: sanitizeText(source?.personal?.tagline, { maxLength: 120 }),
      heroSummary: sanitizeText(source?.personal?.heroSummary, { maxLength: 320 }),
      availability: sanitizeText(source?.personal?.availability, { maxLength: 80 }),
      location: sanitizeText(source?.personal?.location, { maxLength: 120 }),
      timezone: sanitizeText(source?.personal?.timezone, { maxLength: 80 }),
      email: isValidEmail(source?.personal?.email) ? sanitizeText(source.personal.email, { maxLength: 160 }) : "",
      phone: sanitizeText(source?.personal?.phone, { maxLength: 40 }),
      resumeUrl: sanitizeUrl(source?.personal?.resumeUrl),
      profileImage: sanitizeRelativePath(source?.personal?.profileImage) || "/assets/avatar-monogram.svg"
    },
    highlights: sanitizeStringArray(source?.highlights, { maxItems: 8, maxLength: 100 }),
    socials: sanitizeCollection(
      source?.socials,
      (social) => {
        const cleaned = {
          label: sanitizeText(social?.label, { maxLength: 60 }),
          handle: sanitizeText(social?.handle, { maxLength: 120 }),
          url: sanitizeUrl(social?.url)
        };

        return cleaned.label || cleaned.handle || cleaned.url !== "#" ? cleaned : null;
      },
      { maxItems: 8 }
    ),
    stats: sanitizeCollection(
      source?.stats,
      (stat) => {
        const cleaned = {
          value: sanitizeText(stat?.value, { maxLength: 40 }),
          label: sanitizeText(stat?.label, { maxLength: 80 })
        };

        return cleaned.value || cleaned.label ? cleaned : null;
      },
      { maxItems: 6 }
    ),
    about: {
      intro: sanitizeText(source?.about?.intro, { maxLength: 420 }),
      body: sanitizeText(source?.about?.body, { maxLength: 900 }),
      principles: sanitizeStringArray(source?.about?.principles, { maxItems: 6, maxLength: 120 })
    },
    spotlightTech: sanitizeCollection(
      source?.spotlightTech,
      (tech) => {
        const cleaned = {
          name: sanitizeText(tech?.name, { maxLength: 80 }),
          category: sanitizeText(tech?.category, { maxLength: 60 }),
          summary: sanitizeText(tech?.summary, { maxLength: 220 })
        };

        return cleaned.name ? cleaned : null;
      },
      { maxItems: 16 }
    ),
    services: sanitizeCollection(
      source?.services,
      (service) => {
        const cleaned = {
          title: sanitizeText(service?.title, { maxLength: 100 }),
          summary: sanitizeText(service?.summary, { maxLength: 280 }),
          points: sanitizeStringArray(service?.points, { maxItems: 4, maxLength: 100 })
        };

        return cleaned.title ? cleaned : null;
      },
      { maxItems: 8 }
    ),
    skillGroups: sanitizeCollection(
      source?.skillGroups,
      (group) => {
        const cleaned = {
          title: sanitizeText(group?.title, { maxLength: 100 }),
          items: sanitizeStringArray(group?.items, { maxItems: 12, maxLength: 80 })
        };

        return cleaned.title ? cleaned : null;
      },
      { maxItems: 8 }
    ),
    process: sanitizeCollection(
      source?.process,
      (step) => {
        const cleaned = {
          step: sanitizeText(step?.step, { maxLength: 20 }),
          title: sanitizeText(step?.title, { maxLength: 100 }),
          description: sanitizeText(step?.description, { maxLength: 240 })
        };

        return cleaned.title ? cleaned : null;
      },
      { maxItems: 8 }
    ),
    projects: normalizedProjects,
    experience: sanitizeCollection(
      source?.experience,
      (item) => {
        const cleaned = {
          period: sanitizeText(item?.period, { maxLength: 80 }),
          role: sanitizeText(item?.role, { maxLength: 120 }),
          company: sanitizeText(item?.company, { maxLength: 160 }),
          summary: sanitizeText(item?.summary, { maxLength: 320 }),
          points: sanitizeStringArray(item?.points, { maxItems: 5, maxLength: 120 })
        };

        return cleaned.role || cleaned.company ? cleaned : null;
      },
      { maxItems: 12 }
    ),
    certificates: normalizedCertificates,
    testimonials: sanitizeCollection(
      source?.testimonials,
      (item) => {
        const cleaned = {
          quote: sanitizeText(item?.quote, { maxLength: 280 }),
          name: sanitizeText(item?.name, { maxLength: 100 }),
          title: sanitizeText(item?.title, { maxLength: 120 })
        };

        return cleaned.quote ? cleaned : null;
      },
      { maxItems: 8 }
    ),
    insights: sanitizeCollection(
      source?.insights,
      (item) => {
        const cleaned = {
          title: sanitizeText(item?.title, { maxLength: 140 }),
          tag: sanitizeText(item?.tag, { maxLength: 40 }),
          summary: sanitizeText(item?.summary, { maxLength: 240 }),
          url: sanitizeUrl(item?.url)
        };

        return cleaned.title ? cleaned : null;
      },
      { maxItems: 10 }
    ),
    faqs: sanitizeCollection(
      source?.faqs,
      (item) => {
        const cleaned = {
          question: sanitizeText(item?.question, { maxLength: 180 }),
          answer: sanitizeText(item?.answer, { maxLength: 320 })
        };

        return cleaned.question && cleaned.answer ? cleaned : null;
      },
      { maxItems: 12 }
    ),
    contact: {
      heading: sanitizeText(source?.contact?.heading, { maxLength: 140 }),
      intro: sanitizeText(source?.contact?.intro, { maxLength: 320 }),
      directLinks: sanitizeCollection(
        source?.contact?.directLinks,
        (item) => {
          const cleaned = {
            label: sanitizeText(item?.label, { maxLength: 80 }),
            value: sanitizeText(item?.value, { maxLength: 160 }),
            url: sanitizeUrl(item?.url)
          };

          return cleaned.label || cleaned.value || cleaned.url !== "#" ? cleaned : null;
        },
        { maxItems: 8 }
      )
    }
  };
}

function sanitizeProfileTree(value, depth = 0) {
  if (depth > 12) {
    return null;
  }

  if (typeof value === "string") {
    return sanitizeText(value, { maxLength: 4000 });
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) => sanitizeProfileTree(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    const sanitizedObject = {};

    Object.entries(value).forEach(([key, nestedValue]) => {
      const cleanKey = sanitizeText(key, { maxLength: 120 });

      if (!cleanKey || ["__proto__", "prototype", "constructor"].includes(cleanKey)) {
        return;
      }

      sanitizedObject[cleanKey] = sanitizeProfileTree(nestedValue, depth + 1);
    });

    return sanitizedObject;
  }

  return undefined;
}

function slugify(value) {
  return sanitizeText(value, { maxLength: 120 })
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getDefaultProjectImage(category = "") {
  const normalized = category.toLowerCase();

  if (normalized.includes("ai")) {
    return "/assets/project-ai.svg";
  }

  if (normalized.includes("desktop") || normalized.includes("simulation")) {
    return "/assets/project-command.svg";
  }

  return "/assets/project-commerce.svg";
}

function validateAdminToken(rawToken) {
  const providedToken = sanitizeText(rawToken, { maxLength: 200 });

  if (!ADMIN_TOKEN) {
    const error = new Error("Admin actions are disabled until PORTFOLIO_ADMIN_TOKEN is configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!providedToken) {
    const error = new Error("Admin key is required.");
    error.statusCode = 401;
    throw error;
  }

  const expected = Buffer.from(ADMIN_TOKEN);
  const received = Buffer.from(providedToken);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    const error = new Error("Invalid admin key.");
    error.statusCode = 403;
    throw error;
  }
}

function enforceRateLimit(store, key, { maxRequests, windowMs }) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, expiresAt: now + windowMs };

  if (entry.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  store.set(key, entry);
  return true;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((allCookies, item) => {
    const separatorIndex = item.indexOf("=");
    if (separatorIndex <= 0) {
      return allCookies;
    }

    const key = item.slice(0, separatorIndex).trim();
    const value = item.slice(separatorIndex + 1).trim();
    if (!key) {
      return allCookies;
    }

    allCookies[key] = decodeURIComponent(value);
    return allCookies;
  }, {});
}

function shouldUseSecureAdminCookie(req) {
  return isSecureRequest(req);
}

function buildAdminSessionFingerprint(req) {
  return {
    ipAddress: getClientIp(req),
    userAgent: sanitizeText(req.headers["user-agent"], { maxLength: 280 })
  };
}

function getTrustedOriginsForRequest(req) {
  const origins = new Set(ALLOWED_ORIGINS);
  const host = sanitizeText(req.headers.host, { maxLength: 200 });
  const forwardedHostHeader = sanitizeText(req.headers["x-forwarded-host"], { maxLength: 200 });
  const forwardedHost = forwardedHostHeader ? forwardedHostHeader.split(",")[0].trim() : "";
  const forwardedProtoHeader = sanitizeText(req.headers["x-forwarded-proto"], { maxLength: 40 });
  const forwardedProto = forwardedProtoHeader ? forwardedProtoHeader.split(",")[0].trim().toLowerCase() : "";

  if (host) {
    origins.add(`http://${host}`);
    origins.add(`https://${host}`);
  }

  if (forwardedHost) {
    origins.add(`http://${forwardedHost}`);
    origins.add(`https://${forwardedHost}`);

    if (forwardedProto === "http" || forwardedProto === "https") {
      origins.add(`${forwardedProto}://${forwardedHost}`);
    }
  }

  return origins;
}

function getOriginFromHeaderValue(value) {
  const cleaned = sanitizeText(value, { maxLength: 600 });
  if (!cleaned) {
    return "";
  }

  try {
    return new URL(cleaned).origin;
  } catch {
    return "";
  }
}

function setAdminSessionCookie(res, req, sessionId, { persistent = false } = {}) {
  const cookieParts = [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/api/admin",
    "HttpOnly",
    "SameSite=Strict"
  ];

  if (persistent) {
    cookieParts.push(`Max-Age=${Math.max(1, Math.floor(ADMIN_REMEMBER_TTL_MS / 1000))}`);
  }

  if (shouldUseSecureAdminCookie(req)) {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

function clearAdminSessionCookie(res, req) {
  const cookieParts = [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "Path=/api/admin",
    "HttpOnly",
    "SameSite=Strict",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0"
  ];

  if (shouldUseSecureAdminCookie(req)) {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

function createAdminSession(req, { remember = false } = {}) {
  const sessionId = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
  const fingerprint = buildAdminSessionFingerprint(req);
  const expiresAt = Date.now() + (remember ? ADMIN_REMEMBER_TTL_MS : ADMIN_SESSION_TTL_MS);

  adminSessions.set(sessionId, {
    ...fingerprint,
    remember,
    expiresAt
  });

  return sessionId;
}

function getAdminSession(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies[ADMIN_SESSION_COOKIE_NAME];

  if (!sessionId) {
    return null;
  }

  const session = adminSessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(sessionId);
    return null;
  }

  const fingerprint = buildAdminSessionFingerprint(req);
  if (session.ipAddress !== fingerprint.ipAddress || session.userAgent !== fingerprint.userAgent) {
    adminSessions.delete(sessionId);
    return null;
  }

  session.expiresAt = Date.now() + (session.remember ? ADMIN_REMEMBER_TTL_MS : ADMIN_SESSION_TTL_MS);
  adminSessions.set(sessionId, session);
  return { id: sessionId, ...session };
}

function requireAdminSession(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    clearAdminSessionCookie(res, req);
    const error = new Error("Admin session is missing or expired. Sign in again.");
    error.statusCode = 401;
    throw error;
  }

  return session;
}

function requireTrustedAdminRequest(req) {
  const requestedWith = sanitizeText(req.headers["x-requested-with"], { maxLength: 40 });
  if (requestedWith !== "XMLHttpRequest") {
    const error = new Error("Untrusted admin request rejected.");
    error.statusCode = 403;
    throw error;
  }

  const allowedOrigins = getTrustedOriginsForRequest(req);
  const requestOrigin = sanitizeText(req.headers.origin, { maxLength: 300 }) || getOriginFromHeaderValue(req.headers.referer);

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    const error = new Error("Admin request origin was rejected.");
    error.statusCode = 403;
    throw error;
  }
}

async function parseJsonBody(req, { maxBodySize = MAX_BODY_SIZE } = {}) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;

    if (totalSize > maxBodySize) {
      const error = new Error(
        `Payload too large (over ${Math.round(maxBodySize / (1024 * 1024))} MB). For large profile photos, set MAX_ADMIN_BODY_SIZE in .env and restart the server.`
      );
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    const error = new Error("Invalid JSON");
    error.statusCode = 400;
    throw error;
  }
}

async function ensureJsonFile(filePath, fallbackValue) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
  }
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function migrateLegacyMediaIfNeeded() {
  if (MEDIA_DIR === LEGACY_MEDIA_DIR) {
    return;
  }

  try {
    await fs.access(LEGACY_MEDIA_DIR);
  } catch {
    return;
  }

  await ensureDirectory(MEDIA_DIR);
  await fs.cp(LEGACY_MEDIA_DIR, MEDIA_DIR, {
    recursive: true,
    force: false,
    errorOnExist: false
  }).catch(() => null);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readProfile() {
  const raw = await fs.readFile(PROFILE_FILE, "utf8");
  return JSON.parse(raw);
}

async function resolveClientRoot() {
  try {
    await fs.access(DIST_DIR);
    return DIST_DIR;
  } catch {
    return null;
  }
}

function enqueueWrite(task) {
  const pendingTask = writeQueue.catch(() => null).then(task);
  writeQueue = pendingTask.then(() => null, () => null);
  return pendingTask;
}

function pruneExpiredEntries(store) {
  const now = Date.now();

  for (const [key, value] of store.entries()) {
    if (!value || typeof value.expiresAt !== "number" || value.expiresAt > now) {
      continue;
    }

    store.delete(key);
  }
}

const maintenanceTimer = setInterval(() => {
  pruneExpiredEntries(rateLimitStore);
  pruneExpiredEntries(adminRateLimitStore);
  pruneExpiredEntries(adminSessions);
}, 5 * 60 * 1000);

if (typeof maintenanceTimer.unref === "function") {
  maintenanceTimer.unref();
}

async function flushPendingManagedDeletes() {
  for (const filePath of [...pendingManagedDeletes]) {
    const deleted = await tryDeleteManagedFile(filePath);
    if (deleted) {
      pendingManagedDeletes.delete(filePath);
    }
  }
}

const managedDeleteRetryTimer = setInterval(() => {
  void flushPendingManagedDeletes();
}, 30 * 1000);

if (typeof managedDeleteRetryTimer.unref === "function") {
  managedDeleteRetryTimer.unref();
}

async function saveContactSubmission(entry) {
  return enqueueWrite(async () => {
    await ensureJsonFile(CONTACT_FILE, []);
    const raw = await fs.readFile(CONTACT_FILE, "utf8");
    const entries = JSON.parse(raw);
    entries.unshift(entry);
    await fs.writeFile(CONTACT_FILE, JSON.stringify(entries, null, 2));
  });
}

async function updateProfile(mutator) {
  return enqueueWrite(async () => {
    const profile = await readProfile();
    const updatedProfile = await mutator(profile);
    await fs.writeFile(PROFILE_FILE, JSON.stringify(updatedProfile, null, 2));
    return updatedProfile;
  });
}

async function forwardToEmail(entry) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return;
  }

  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        name: entry.name,
        email: entry.email,
        subject: `New Message from ${entry.name}`,
        message: entry.message,
        replyto: entry.email
      })
    });
  } catch (e) {
    console.error("Local email forwarding failed:", e);
  }
}

/**
 * Intent Engine v1.1 - Inference Layer
 * Transforms normalized behavioral events into an Intent Score and Clusters.
 */
function assessIntent(telemetry) {
  if (!telemetry || !Array.isArray(telemetry.events)) {
    return { score: 0, level: "LOW", clusters: { technical: 0, interests: 0, exploration: 0 }, highSignal: [] };
  }

  const events = telemetry.events;
  let score = 0;
  const clusters = { technical: 0, interests: 0, exploration: 0 };
  const highSignal = [];
  const projectsViewed = new Set();

  events.forEach((ev) => {
    switch (ev.event) {
      case "HIGH_SIGNAL.GITHUB_CLICK":
        score += 3.5;
        clusters.technical++;
        highSignal.push("GitHub Profile visited");
        break;
      case "HIGH_SIGNAL.CV_DOWNLOAD":
        score += 3.0;
        clusters.technical++;
        highSignal.push("Resume/CV downloaded");
        break;
      case "MODAL.PROJECT_VIEW":
        score += 2.0;
        clusters.interests++;
        if (ev.meta?.duration) {
          // log(1 + seconds) * 0.5 weight
          score += Math.log1p(ev.meta.duration) * 0.5;
        }
        if (ev.meta?.name) projectsViewed.add(ev.meta.name);
        break;
      case "EXPLORATION.SCROLL_DEEP":
        score += 1.0;
        clusters.exploration++;
        break;
      case "EXPLORATION.PAGE_VIEW":
        score += 0.5;
        clusters.exploration++;
        break;
      case "ACTION.CONTACT_START":
        score += 1.0;
        clusters.exploration++;
        break;
    }
  });

  // Calculate Level
  let level = "LOW";
  if (score >= 8) level = "HIGH";
  else if (score >= 4) level = "MEDIUM";

  return {
    score: parseFloat(score.toFixed(1)),
    level,
    clusters,
    highSignal,
    projects: Array.from(projectsViewed)
  };
}

async function forwardToWebhook(entry) {
  if (!CONTACT_WEBHOOK_URL) {
    return;
  }

  try {
    const isDiscord = CONTACT_WEBHOOK_URL.includes("discord.com/api/webhooks");
    let body;

    if (isDiscord) {
      const intelligence = assessIntent(entry.telemetry);
      const levelColor = intelligence.level === "HIGH" ? 0x10b981 : (intelligence.level === "MEDIUM" ? 0x3b82f6 : 0x64748b);

      body = JSON.stringify({
        embeds: [
          {
            title: `🧠 Lead Intelligence ([${intelligence.level}] INTENT - ${intelligence.score}/10)`,
            color: levelColor,
            timestamp: new Date().toISOString(),
            fields: [
              { name: "👤 Name", value: entry.name || "N/A", inline: true },
              { name: "📧 Email", value: entry.email || "N/A", inline: true },
              { name: "🏢 Company", value: entry.company || "N/A", inline: true },
              { name: "🛠 Project Type", value: entry.projectType || "N/A", inline: true },
              { name: "💰 Budget", value: entry.budget || "N/A", inline: true },
              { name: "✨ Status", value: intelligence.level, inline: true },
              { name: "📝 Message", value: entry.message || "No message provided." },
              { 
                name: "🎯 Intent Highlights", 
                value: intelligence.highSignal.length > 0 ? intelligence.highSignal.join("\n") : "General interest", 
                inline: false 
              },
              { 
                name: "🏗 Primary Interests", 
                value: intelligence.projects.length > 0 ? intelligence.projects.join(", ") : "Exploratory visit", 
                inline: false 
              }
            ],
            footer: {
              text: `Telemetry based on ${entry.telemetry?.events?.length || 0} signals | IP: ${entry.ipAddress || "Unknown"}`
            }
          }
        ]
      });
    } else {
      body = JSON.stringify(entry);
    }

    const headers = { "Content-Type": "application/json" };
    if (CONTACT_WEBHOOK_TOKEN) {
      headers.Authorization = `Bearer ${CONTACT_WEBHOOK_TOKEN}`;
    }

    const response = await fetch(CONTACT_WEBHOOK_URL, {
      method: "POST",
      headers,
      body
    });

    if (!response.ok) {
      console.error(`[Webhook] Target returned ${response.status}: ${await response.text().catch(() => "N/A")}`);
    }
  } catch (error) {
    console.error("[Webhook] Transmission failed:", error.message);
  }
}

function validateContactPayload(payload) {
  const cleaned = {
    name: sanitizeText(payload.name, { maxLength: 80 }),
    email: sanitizeText(payload.email, { maxLength: 160 }),
    company: sanitizeText(payload.company, { maxLength: 120 }),
    projectType: sanitizeText(payload.projectType, { maxLength: 80 }),
    budget: sanitizeText(payload.budget, { maxLength: 80 }),
    message: sanitizeText(payload.message, { maxLength: 1500 }),
    website: sanitizeText(payload.website, { maxLength: 120 }),
    telemetry: payload.telemetry || {}
  };

  const errors = [];

  if (!cleaned.name || cleaned.name.length < 2) {
    errors.push("Name is required and must be at least 2 characters.");
  }

  if (!cleaned.email || !isValidEmail(cleaned.email)) {
    errors.push("Please provide a valid email address.");
  }

  if (!cleaned.message || cleaned.message.length < 10) {
    errors.push("Message must be at least 10 characters.");
  }

  if (cleaned.website) {
    errors.push("Spam protection triggered.");
  }

  return { cleaned, errors };
}

function normalizeProfileImageMime(mimeTypeRaw) {
  const cleaned = sanitizeText(mimeTypeRaw, { maxLength: 50 }).toLowerCase();
  const aliases = {
    "image/jpg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png"
  };

  return aliases[cleaned] || cleaned;
}

function parseAdminImagePayload(rawPayload, { required = true, label = "Image" } = {}) {
  const mimeType = normalizeProfileImageMime(rawPayload?.mimeType);
  const dataBase64 = typeof rawPayload?.dataBase64 === "string" ? rawPayload.dataBase64 : "";
  const base64Payload = dataBase64.replace(/^data:[^;]+;base64,/, "").trim();
  const errors = [];

  if (!base64Payload) {
    if (!required) {
      return { cleaned: null, errors };
    }

    errors.push(`${label} data is required.`);
  }

  if (base64Payload && !allowedImageTypes.has(mimeType)) {
    errors.push(
      `Only PNG, JPG, and WEBP ${label.toLowerCase()} files are allowed. If you picked a valid image, try another browser or convert HEIC to JPG.`
    );
  }

  let fileBuffer = Buffer.alloc(0);

  if (errors.length === 0) {
    try {
      fileBuffer = Buffer.from(base64Payload, "base64");
    } catch {
      errors.push("Invalid image encoding.");
    }
  }

  if (fileBuffer.length === 0 && errors.length === 0) {
    errors.push(`${label} data is required.`);
  }

  if (fileBuffer.length > MAX_PROFILE_IMAGE_BYTES) {
    errors.push(
      `${label} must be ${Math.round(MAX_PROFILE_IMAGE_BYTES / (1024 * 1024))} MB or smaller. You can raise MAX_PROFILE_IMAGE_BYTES in .env (and restart the server).`
    );
  }

  return {
    cleaned: {
      mimeType,
      extension: allowedImageTypes.get(mimeType),
      fileBuffer
    },
    errors
  };
}

function validateProfileImagePayload(payload) {
  validateAdminToken(payload.adminToken);
  return parseAdminImagePayload(payload, { required: true, label: "Profile image" });
}

function validateProfilePayload(payload) {
  validateAdminToken(payload.adminToken);

  const cleaned = normalizeProfilePayload(payload.profile);
  const errors = [];

  if (!cleaned || Array.isArray(cleaned) || typeof cleaned !== "object") {
    errors.push("Profile payload must be a JSON object.");
  }

  if (!cleaned?.personal || typeof cleaned.personal !== "object" || Array.isArray(cleaned.personal)) {
    errors.push("Profile personal section is required.");
  }

  if (!cleaned?.site || typeof cleaned.site !== "object" || Array.isArray(cleaned.site)) {
    errors.push("Profile site section is required.");
  }

  if (!cleaned?.personal?.fullName || cleaned.personal.fullName.length < 2) {
    errors.push("Personal full name is required.");
  }

  if (!Array.isArray(cleaned?.projects)) {
    errors.push("Projects must be an array.");
  }

  if (!Array.isArray(cleaned?.socials)) {
    errors.push("Social links must be an array.");
  }

  return { cleaned, errors };
}

function validateCertificatePayload(payload) {
  validateAdminToken(payload.adminToken);

  const certificate = payload.certificate || {};
  const cleaned = {
    id: sanitizeText(certificate.id, { maxLength: 80 }) || randomUUID(),
    title: sanitizeText(certificate.title, { maxLength: 120 }),
    issuer: sanitizeText(certificate.issuer, { maxLength: 120 }),
    year: sanitizeText(certificate.year, { maxLength: 30 }),
    summary: sanitizeText(certificate.summary, { maxLength: 320 }),
    credentialUrl: sanitizeUrl(certificate.credentialUrl)
  };

  const errors = [];

  if (!cleaned.title || cleaned.title.length < 3) {
    errors.push("Certificate title must be at least 3 characters.");
  }

  if (!cleaned.issuer || cleaned.issuer.length < 2) {
    errors.push("Issuer is required.");
  }

  if (!cleaned.year) {
    errors.push("Year or status is required.");
  }

  if (!cleaned.summary || cleaned.summary.length < 10) {
    errors.push("Certificate summary must be at least 10 characters.");
  }

  return { cleaned, errors };
}

function validateProjectPayload(payload) {
  validateAdminToken(payload.adminToken);

  const project = payload.project || {};
  const incomingSlug = slugify(project.slug);
  const imageUploadResult = parseAdminImagePayload(payload.imageUpload, {
    required: false,
    label: "Project image"
  });
  const cleaned = {
    title: sanitizeText(project.title, { maxLength: 120 }),
    slug: incomingSlug || slugify(project.title) || `project-${randomUUID().slice(0, 8)}`,
    summary: sanitizeText(project.summary, { maxLength: 320 }),
    category: sanitizeText(project.category, { maxLength: 50 }) || "Project",
    year: sanitizeText(project.year, { maxLength: 24 }) || `${new Date().getFullYear()}`,
    image: sanitizeRelativePath(project.image) || "",
    stack: sanitizeStringArray(project.stack, { maxItems: 8, maxLength: 48 }),
    metrics: sanitizeStringArray(project.metrics, { maxItems: 4, maxLength: 72 }),
    details: {
      challenge: sanitizeText(project.details?.challenge, { maxLength: 420 }),
      solution: sanitizeText(project.details?.solution, { maxLength: 420 }),
      impact: sanitizeStringArray(project.details?.impact, { maxItems: 4, maxLength: 100 })
    },
    links: {
      live: sanitizeUrl(project.links?.live),
      repo: sanitizeUrl(project.links?.repo),
      caseStudy: sanitizeUrl(project.links?.caseStudy)
    }
  };

  const errors = [];

  if (!cleaned.title || cleaned.title.length < 3) {
    errors.push("Project title must be at least 3 characters.");
  }

  if (!cleaned.summary || cleaned.summary.length < 12) {
    errors.push("Project summary must be at least 12 characters.");
  }

  if (cleaned.stack.length === 0) {
    errors.push("Add at least one project technology.");
  }

  if (!cleaned.details.challenge || cleaned.details.challenge.length < 12) {
    errors.push("Project challenge must be at least 12 characters.");
  }

  if (!cleaned.details.solution || cleaned.details.solution.length < 12) {
    errors.push("Project solution must be at least 12 characters.");
  }

  if (cleaned.details.impact.length === 0) {
    errors.push("Add at least one project impact point.");
  }

  if (cleaned.metrics.length === 0) {
    cleaned.metrics = ["Project delivery", "Practical implementation", "Portfolio-ready presentation"];
  }

  if (cleaned.image === "") {
    cleaned.image = getDefaultProjectImage(cleaned.category);
  }

  return {
    cleaned,
    imageUpload: imageUploadResult.cleaned,
    errors: [...errors, ...imageUploadResult.errors]
  };
}

function validateDeletePayload(payload, { key, label }) {
  validateAdminToken(payload.adminToken);

  const cleanedValue = sanitizeText(payload[key], { maxLength: 120 });
  const errors = [];

  if (!cleanedValue) {
    errors.push(`${label} identifier is required.`);
  }

  return {
    cleaned: {
      [key]: cleanedValue
    },
    errors
  };
}

async function writeManagedImage(directoryPath, publicFolderName, imagePayload, filePrefix) {
  await ensureDirectory(directoryPath);
  const fileName = `${filePrefix}-${Date.now()}-${randomUUID().slice(0, 8)}${imagePayload.extension}`;
  const filePath = path.join(directoryPath, fileName);
  await fs.writeFile(filePath, imagePayload.fileBuffer);
  return `/media/${publicFolderName}/${fileName}`;
}

function resolveManagedImagePath(publicPath, folderName) {
  if (!publicPath || typeof publicPath !== "string") {
    return "";
  }

  const normalizedPrefix = `/media/${folderName}/`;
  if (!publicPath.startsWith(normalizedPrefix)) {
    return "";
  }

  const relativePath = publicPath.replace("/media/", "");
  return path.join(MEDIA_DIR, relativePath);
}

async function tryDeleteManagedFile(filePath) {
  const retryDelays = [0, 180, 420, 900, 1600];

  for (const delayMs of retryDelays) {
    if (delayMs > 0) {
      await wait(delayMs);
    }

    await fs.rm(filePath, { force: true }).catch(() => null);

    try {
      await fs.access(filePath);
    } catch {
      return true;
    }
  }

  return false;
}

async function removeManagedImage(publicPath, folderName) {
  const filePath = resolveManagedImagePath(publicPath, folderName);
  if (!filePath) {
    return;
  }

  const deleted = await tryDeleteManagedFile(filePath);
  if (!deleted) {
    pendingManagedDeletes.add(filePath);
  }
}

async function serveStaticFile(req, res) {
  const clientRoot = await resolveClientRoot();
  if (!clientRoot) {
    sendText(res, 503, "Frontend build not found. Run `npm run build` first.");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const isAdminShellRequest = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  let filePath = url.pathname === "/" ? path.join(clientRoot, "index.html") : path.join(clientRoot, url.pathname);

  filePath = path.normalize(filePath);
  if (!filePath.startsWith(clientRoot)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes.get(extension) || "application/octet-stream";

    setSecurityHeaders(res);
    if (isAdminShellRequest) {
      markSensitiveResponse(res);
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    try {
      const appShell = await fs.readFile(path.join(clientRoot, "index.html"));
      setSecurityHeaders(res);
      if (isAdminShellRequest) {
        markSensitiveResponse(res);
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(appShell);
    } catch {
      sendText(res, 404, "Not Found");
    }
  }
}

async function serveMediaFile(urlPathname, res) {
  const relativePath = urlPathname.replace(/^\/media\//, "");
  const filePath = path.normalize(path.join(MEDIA_DIR, relativePath));

  if (!filePath.startsWith(MEDIA_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }

    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes.get(extension) || "application/octet-stream";

    setSecurityHeaders(res);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, immutable"
    });
    res.end(data);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

const server = createServer(async (req, res) => {
  try {
    applyTransportSecurityHeaders(req, res);

    if (!isOriginAllowed(req)) {
      sendJson(res, 403, { ok: false, message: "Origin not allowed." });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      await serveMediaFile(url.pathname, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/profile") {
      const profile = await readProfile();
      sendJson(res, 200, { ok: true, data: profile });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, status: "healthy", timestamp: new Date().toISOString() });
      return;
    }

    // (AI Chatbot Logic is handled further down)

    // Secure Contact Submission
    if (req.method === "POST" && url.pathname === "/api/contact") {
      const payload = await parseJsonBody(req, { maxBodySize: 8192 });
      const { name, email, message } = payload;
      
      if (!name || !email || !message) {
        sendJson(res, 400, { ok: false, message: "Missing required fields." });
        return;
      }

      const submissionId = randomUUID();
      const timestamp = new Date().toISOString();
      const encryptedMessage = encrypt(message);
      
      const record = { id: submissionId, timestamp, name, email, message: encryptedMessage };
      
      await updateJsonFile(CONTACT_FILE, (current) => [...(current || []), record]);
      
      auditLogs.push({ timestamp, type: "SUCCESS", message: `New secure contact from ${name}` });

      // Notify owner if Resend is configured
      if (resend) {
        resend.emails.send({
          from: "Portfolio <onboarding@resend.dev>",
          to: "mart33645@gmail.com",
          subject: `Portfolio: New secure message from ${name}`,
          html: `<p>New encrypted message received.</p><p><strong>From:</strong> ${name} (${email})</p><p>View in Admin Vault.</p>`
        }).catch(err => console.error("[email] Failed to send notification:", err));
      }

      sendJson(res, 200, { ok: true, message: "Signal transmitted. Encrypted record stored in the vault." });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/session") {
      markSensitiveResponse(res);
      const session = getAdminSession(req);

      if (!session) {
        clearAdminSessionCookie(res, req);
        sendJson(res, 401, { ok: false, message: "Admin session is missing or expired." });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        message: "Admin session is active."
      });
      return;
    }

    // Admin Security Vault
    if (req.method === "POST" && url.pathname === "/api/admin/vault") {
      requireAdminSession(req, res);
      const payload = await parseJsonBody(req, { maxBodySize: 2048 });
      const providedVaultKey = payload.vaultPassword;
      
      if (providedVaultKey !== process.env.AUDIT_LOG_PASSWORD) {
        sendJson(res, 403, { ok: false, message: "Access Denied: Invalid Vault Key." });
        return;
      }

      const submissions = await readJsonFile(CONTACT_FILE, []);
      const decryptedSubmissions = {};
      
      submissions.forEach(sub => {
        decryptedSubmissions[sub.id] = decrypt(sub.message);
      });

      sendJson(res, 200, {
        ok: true,
        data: {
          submissions,
          decryptedSubmissions,
          auditLogs: auditLogs.slice(-100).reverse()
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/verify") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      const ipAddress = getClientIp(req);
      if (
        !enforceRateLimit(adminRateLimitStore, `verify:${ipAddress}`, {
          maxRequests: ADMIN_RATE_LIMIT_MAX_REQUESTS,
          windowMs: ADMIN_RATE_LIMIT_WINDOW_MS
        })
      ) {
        sendJson(res, 429, { ok: false, message: "Too many admin login attempts. Please try again later." });
        return;
      }

      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      validateAdminToken(payload.adminToken);
      const remember = Boolean(payload.remember);
      const sessionId = createAdminSession(req, { remember });
      setAdminSessionCookie(res, req, sessionId, { persistent: remember });

      sendJson(res, 200, {
        ok: true,
        message: "Admin mode unlocked successfully."
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/logout") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      const cookies = parseCookies(req);
      const sessionId = cookies[ADMIN_SESSION_COOKIE_NAME];
      if (sessionId) {
        adminSessions.delete(sessionId);
      }

      clearAdminSessionCookie(res, req);
      sendJson(res, 200, {
        ok: true,
        message: "Admin session closed."
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/vault") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      
      const submissions = await readContactSubmissions();
      const auditLog = await readAuditLog().catch(() => []);

      // Decrypt messages for the admin view
      const securedSubmissions = submissions.map(s => ({
        ...s,
        message: decrypt(s.message)
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      sendJson(res, 200, {
        ok: true,
        data: {
          submissions: securedSubmissions,
          auditLog: auditLog.slice(0, 50),
          encryptionActive: !!ENCRYPTION_KEY
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/contact") {
      const ipAddress = getClientIp(req);
      if (
        !enforceRateLimit(rateLimitStore, ipAddress, {
          maxRequests: RATE_LIMIT_MAX_REQUESTS,
          windowMs: RATE_LIMIT_WINDOW_MS
        })
      ) {
        sendJson(res, 429, { ok: false, message: "Too many requests. Please try again later." });
        return;
      }

      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req);
      const { cleaned, errors } = validateContactPayload(payload);

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      const submission = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ipAddress,
        ...cleaned,
        message: encrypt(cleaned.message) // LEVEL 5 SECURITY: Encrypt message
      };

      await saveContactSubmission(submission);
      await forwardToWebhook(submission).catch(() => null);
      await forwardToEmail(submission).catch(() => null);

      sendJson(res, 201, {
        ok: true,
        message: "Message sent successfully. I will get back to you soon."
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/ai/chat") {
      const ipAddress = getClientIp(req);
      if (
        !enforceRateLimit(rateLimitStore, `ai:${ipAddress}`, {
          maxRequests: 10,
          windowMs: 1 * 60 * 1000
        })
      ) {
        sendJson(res, 429, { ok: false, message: "AI rate limit reached. Slow down experimental systems." });
        return;
      }

      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      if (!GEMINI_API_KEY) {
        sendJson(res, 503, { ok: false, message: "AI Intelligence is currently offline (Key missing)." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: 65536 });
      const userMessage = sanitizeText(payload.message, { maxLength: 1000 });
      
      if (!userMessage) {
        sendJson(res, 400, { ok: false, message: "Message is required." });
        return;
      }

      try {
        const profile = await readProfile();
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const history = Array.isArray(payload.history) ? payload.history.slice(-6) : [];

        // Compact profile summary — fewer tokens = faster response
        const p = profile?.personal || {};
        const compactProfile = [
          `Name: ${p.fullName || "Ammar Tahoon"} | Role: ${p.role || "AI Engineer"} | Location: ${p.location || "Egypt"}`,
          `Availability: ${p.availability || "Available"} | Email: ${p.email || ""}`,
          `Summary: ${p.heroSummary || ""}`,
          `Skills: ${(profile?.skillGroups || []).map(g => `${g.title}: ${(g.items || []).join(", ")}`).join(" | ")}`,
          `Tech Spotlight: ${(profile?.spotlightTech || []).map(t => t.name).join(", ")}`,
          `Projects: ${(profile?.projects || []).map(pr => `${pr.title} (${pr.category}) — ${pr.summary}`).join(" | ")}`,
          `Experience: ${(profile?.experience || []).map(e => `${e.role} @ ${e.company} (${e.period})`).join(" | ")}`,
          `Certificates: ${(profile?.certificates || []).map(c => `${c.title} by ${c.issuer}`).join(", ")}`,
          `Services: ${(profile?.services || []).map(s => s.title).join(", ")}`,
          `Socials: ${(profile?.socials || []).map(s => `${s.label}: ${s.url}`).join(" | ")}`,
        ].filter(Boolean).join("\n");

        const systemPrompt = `You are an extremely smart, fast, and futuristic AI assistant for Ammar Tahoon's portfolio.
CRITICAL: You MUST reply in the EXACT SAME LANGUAGE and DIALECT as the user's question (e.g., if asked in Egyptian Arabic, reply naturally in Egyptian Arabic; if English, reply in English).
Answer visitor questions about Ammar's skills, projects, experience, and availability.
Be concise (1-3 sentences), professional, yet welcoming. Never invent facts.
Only answer portfolio-related questions. Redirect others politely.

${compactProfile}`;

        // Use streaming for instant response feel
        setSecurityHeaders(res);
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-store",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no"
        });

        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Ready. Ask me anything about Ammar." }] },
            ...history.map((msg) => ({
              role: msg.role === "ai" ? "model" : "user",
              parts: [{ text: msg.content }]
            }))
          ]
        });

        const streamResult = await chat.sendMessageStream(userMessage);
        let fullText = "";

        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true, response: fullText })}\n\n`);
        res.end();
      } catch (err) {
        console.error("[ai] Gemini Error:", err);
        try {
          res.write(`data: ${JSON.stringify({ error: true, message: "AI core sync error. Try again." })}\n\n`);
          res.end();
        } catch {}
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/profile-image") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, errors } = validateProfileImagePayload(payload);

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      const publicImagePath = await writeManagedImage(PROFILE_MEDIA_DIR, "profile", cleaned, "avatar");

      const previousImagePath = (await readProfile()).personal?.profileImage || "";
      const updatedProfile = await updateProfile((profile) => ({
        ...profile,
        personal: {
          ...profile.personal,
          profileImage: publicImagePath
        }
      }));

      await removeManagedImage(previousImagePath, "profile");

      sendJson(res, 200, {
        ok: true,
        message: "Profile image updated successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/profile-image/clear") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      validateAdminToken(payload.adminToken);

      const defaultAvatar = "/assets/avatar-monogram.svg";
      const previousImagePath = (await readProfile()).personal?.profileImage || "";

      const updatedProfile = await updateProfile((profile) => ({
        ...profile,
        personal: {
          ...profile.personal,
          profileImage: defaultAvatar
        }
      }));

      await removeManagedImage(previousImagePath, "profile");

      sendJson(res, 200, {
        ok: true,
        message: "Profile image reset to default.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/profile") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, errors } = validateProfilePayload(payload);

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      const updatedProfile = await updateProfile(() => cleaned);

      sendJson(res, 200, {
        ok: true,
        message: "Profile data saved successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/certificates") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, errors } = validateCertificatePayload(payload);

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      let wasUpdated = false;

      const updatedProfile = await updateProfile((profile) => {
        const currentCertificates = Array.isArray(profile.certificates) ? profile.certificates : [];
        const existingIndex = currentCertificates.findIndex((item) => item.id === cleaned.id);

        if (existingIndex >= 0) {
          wasUpdated = true;

          return {
            ...profile,
            certificates: currentCertificates.map((item, index) => (index === existingIndex ? cleaned : item))
          };
        }

        return {
          ...profile,
          certificates: [cleaned, ...currentCertificates]
        };
      });

      sendJson(res, wasUpdated ? 200 : 201, {
        ok: true,
        message: wasUpdated ? "Certificate updated successfully." : "Certificate added successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/certificates/delete") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, errors } = validateDeletePayload(payload, {
        key: "id",
        label: "Certificate"
      });

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      let wasDeleted = false;

      const updatedProfile = await updateProfile((profile) => {
        const currentCertificates = Array.isArray(profile.certificates) ? profile.certificates : [];
        const nextCertificates = currentCertificates.filter((item) => item.id !== cleaned.id);
        wasDeleted = nextCertificates.length !== currentCertificates.length;

        return {
          ...profile,
          certificates: nextCertificates
        };
      });

      if (!wasDeleted) {
        sendJson(res, 404, { ok: false, message: "Certificate not found." });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        message: "Certificate deleted successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/projects") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, imageUpload, errors } = validateProjectPayload(payload);

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      let wasUpdated = false;
      let previousManagedImageToRemove = "";

      if (imageUpload) {
        cleaned.image = await writeManagedImage(PROJECT_MEDIA_DIR, "projects", imageUpload, "project");
      }

      const updatedProfile = await updateProfile((profile) => {
        const existingProjects = Array.isArray(profile.projects) ? profile.projects : [];
        const slugTaken = new Set(existingProjects.map((project) => project.slug));
        const existingIndex = existingProjects.findIndex((project) => project.slug === cleaned.slug);

        if (existingIndex >= 0) {
          wasUpdated = true;
          const existingProject = existingProjects[existingIndex];
          if (
            existingProject?.image?.startsWith("/media/projects/") &&
            existingProject.image !== cleaned.image
          ) {
            previousManagedImageToRemove = existingProject.image;
          }

          return {
            ...profile,
            projects: existingProjects.map((project, index) => (index === existingIndex ? cleaned : project))
          };
        }

        let nextSlug = cleaned.slug;

        while (slugTaken.has(nextSlug)) {
          nextSlug = `${cleaned.slug}-${randomUUID().slice(0, 4)}`;
        }

        return {
          ...profile,
          projects: [
            {
              ...cleaned,
              slug: nextSlug
            },
            ...existingProjects
          ]
        };
      });

      await removeManagedImage(previousManagedImageToRemove, "projects");

      sendJson(res, wasUpdated ? 200 : 201, {
        ok: true,
        message: wasUpdated ? "Project updated successfully." : "Project added successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/projects/delete") {
      markSensitiveResponse(res);
      requireTrustedAdminRequest(req);
      requireAdminSession(req, res);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("application/json")) {
        sendJson(res, 415, { ok: false, message: "Unsupported content type." });
        return;
      }

      const payload = await parseJsonBody(req, { maxBodySize: MAX_ADMIN_BODY_SIZE });
      payload.adminToken = ADMIN_TOKEN;
      const { cleaned, errors } = validateDeletePayload(payload, {
        key: "slug",
        label: "Project"
      });

      if (errors.length > 0) {
        sendJson(res, 422, { ok: false, message: errors[0], errors });
        return;
      }

      let wasDeleted = false;
      let deletedProjectImage = "";

      const updatedProfile = await updateProfile((profile) => {
        const currentProjects = Array.isArray(profile.projects) ? profile.projects : [];
        const projectToDelete = currentProjects.find((item) => item.slug === cleaned.slug);
        deletedProjectImage = projectToDelete?.image || "";
        const nextProjects = currentProjects.filter((item) => item.slug !== cleaned.slug);
        wasDeleted = nextProjects.length !== currentProjects.length;

        return {
          ...profile,
          projects: nextProjects
        };
      });

      if (!wasDeleted) {
        sendJson(res, 404, { ok: false, message: "Project not found." });
        return;
      }

      await removeManagedImage(deletedProjectImage, "projects");

      sendJson(res, 200, {
        ok: true,
        message: "Project deleted successfully.",
        data: updatedProfile
      });
      return;
    }

    if (req.method !== "GET" && req.method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Method not allowed." });
      return;
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/")) {
      sendJson(res, 404, {
        ok: false,
        message: "Unknown API route. Run the Node server from the project folder (npm run dev:server or node server.js) so /api/* is handled."
      });
      return;
    }

    await serveStaticFile(req, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const requestPath = (() => {
      try {
        return new URL(req.url, `http://${req.headers.host}`).pathname;
      } catch {
        return "";
      }
    })();

    if (requestPath.startsWith("/api/admin/")) {
      markSensitiveResponse(res);
      if (statusCode === 401 || statusCode === 403) {
        clearAdminSessionCookie(res, req);
      }
    }

    sendJson(res, statusCode, {
      ok: false,
      message: statusCode === 500 ? "Unexpected internal server error." : error.message
    });
  }
});

export default async function handler(req, res) {
  return new Promise((resolve) => {
    server.emit("request", req, res);
    res.on("finish", resolve);
  });
}

if (!process.env.VERCEL) {
  await ensureJsonFile(CONTACT_FILE, []);
  try {
    await migrateLegacyMediaIfNeeded();
    await ensureDirectory(MEDIA_DIR);
    await ensureDirectory(PROFILE_MEDIA_DIR);
    await ensureDirectory(PROJECT_MEDIA_DIR);
  } catch (error) {
    if (MEDIA_DIR !== LEGACY_MEDIA_DIR) {
      console.warn(`[media] Falling back to workspace media storage because "${MEDIA_DIR}" is not writable.`);
      setActiveMediaDirectory(LEGACY_MEDIA_DIR);
      await ensureDirectory(MEDIA_DIR);
      await ensureDirectory(PROFILE_MEDIA_DIR);
      await ensureDirectory(PROJECT_MEDIA_DIR);
    } else {
      throw error;
    }
  }

  server.listen(PORT, () => {
    console.log(`Portfolio server is running on http://localhost:${PORT}`);
    console.log(`[media] Active storage directory: ${MEDIA_DIR}`);
    if (!ADMIN_TOKEN) {
      console.warn("[admin] PORTFOLIO_ADMIN_TOKEN is missing — admin login will fail. Add it to .env next to server.js.");
    } else {
      console.log("[admin] Admin API enabled (PORTFOLIO_ADMIN_TOKEN loaded).");
    }
  });
}
