import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, ImagePlus, Lock, Trophy, X } from "lucide-react";
import { guessImageMimeType } from "../admin-utils";

const toolMeta = {
  photo: {
    label: "Photo",
    title: "Update profile photo",
    description: "Upload a new image for the avatar card and hero identity badge.",
    icon: ImagePlus
  },
  certificate: {
    label: "Certificate",
    title: "Add a certificate",
    description: "Create a new learning or achievement card that appears in the certificates section.",
    icon: Trophy
  },
  project: {
    label: "Project",
    title: "Add a project",
    description: "Publish a new portfolio project with stack, impact, and links in one step.",
    icon: FolderPlus
  }
};

const initialCertificate = {
  title: "",
  issuer: "",
  year: "",
  summary: "",
  credentialUrl: ""
};

const initialProject = {
  title: "",
  category: "AI",
  year: "Recent",
  summary: "",
  stack: "",
  metrics: "",
  challenge: "",
  solution: "",
  impact: "",
  image: "",
  live: "",
  repo: "",
  caseStudy: ""
};

function splitCommaValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function ContentStudio({
  adminToken,
  onAdminTokenChange,
  profileImage,
  busy,
  status,
  onUpdatePhoto,
  onAddCertificate,
  onAddProject
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [certificateValues, setCertificateValues] = useState(initialCertificate);
  const [projectValues, setProjectValues] = useState(initialProject);

  const isUnlocked = adminToken.trim().length > 0;
  const activeMeta = activeTool ? toolMeta[activeTool] : null;
  const ActiveIcon = activeMeta?.icon || FolderPlus;

  const previewUrl = useMemo(() => {
    if (!photoFile) {
      return profileImage;
    }

    return URL.createObjectURL(photoFile);
  }, [photoFile, profileImage]);

  useEffect(() => {
    if (!photoFile) {
      return undefined;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile, previewUrl]);

  useEffect(() => {
    if (!activeTool) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveTool(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTool]);

  useEffect(() => {
    if (status.state !== "success") {
      return;
    }

    if (activeTool === "photo") {
      setPhotoFile(null);
    }

    if (activeTool === "certificate") {
      setCertificateValues(initialCertificate);
    }

    if (activeTool === "project") {
      setProjectValues(initialProject);
    }
  }, [activeTool, status.state]);

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();

    if (!photoFile) {
      return;
    }

    const dataBase64 = await readFileAsDataUrl(photoFile);
    await onUpdatePhoto({
      adminToken,
      fileName: photoFile.name,
      mimeType: guessImageMimeType(photoFile),
      dataBase64
    });
  };

  const handleCertificateSubmit = async (event) => {
    event.preventDefault();

    await onAddCertificate({
      adminToken,
      certificate: certificateValues
    });
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    await onAddProject({
      adminToken,
      project: {
        title: projectValues.title,
        category: projectValues.category,
        year: projectValues.year,
        summary: projectValues.summary,
        image: projectValues.image,
        stack: splitCommaValues(projectValues.stack),
        metrics: splitCommaValues(projectValues.metrics),
        details: {
          challenge: projectValues.challenge,
          solution: projectValues.solution,
          impact: splitCommaValues(projectValues.impact)
        },
        links: {
          live: projectValues.live,
          repo: projectValues.repo,
          caseStudy: projectValues.caseStudy
        }
      }
    });
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[95] w-[min(22rem,calc(100vw-1rem))]">
        <div className="pointer-events-auto glow-border glass-panel rounded-[1.8rem] p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/78">Content Studio</p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Update your photo, certificates, and projects directly from the interface.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/68">
              <Lock size={14} className={isUnlocked ? "text-emerald-300" : "text-white/52"} />
              {isUnlocked ? "Ready" : "Locked"}
            </div>
          </div>

          <label className="input-shell mt-4">
            <span>Admin key</span>
            <input
              type="password"
              value={adminToken}
              onChange={(event) => onAdminTokenChange(event.target.value)}
              placeholder="Matches PORTFOLIO_ADMIN_TOKEN"
              autoComplete="current-password"
            />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.entries(toolMeta).map(([key, item]) => {
              const Icon = item.icon;
              const active = activeTool === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTool(key)}
                  className={`rounded-[1.3rem] border p-3 text-left transition ${
                    active
                      ? "border-cyan-300/30 bg-cyan-300/12 shadow-[0_0_40px_rgba(0,245,255,0.12)]"
                      : "border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/72 text-cyan-200">
                    <Icon size={18} />
                  </span>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-white/78">{item.label}</p>
                </button>
              );
            })}
          </div>

          <p
            className={`mt-4 text-xs leading-6 ${
              status.state === "success"
                ? "text-emerald-300"
                : status.state === "error"
                  ? "text-rose-300"
                  : "text-white/52"
            }`}
          >
            {status.message ||
              (isUnlocked
                ? "Studio unlocked. Open any tool and save changes directly into the portfolio data."
                : "Set PORTFOLIO_ADMIN_TOKEN on the server, then enter the same key here to enable editing.")}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {activeTool ? (
          <motion.div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/78 px-4 py-5 backdrop-blur-2xl md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveTool(null)}
          >
            <motion.div
              className="glow-border glass-panel relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.68)] md:p-8"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white"
                aria-label="Close content studio"
              >
                <X size={18} />
              </button>

              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/76">{activeMeta.label}</p>
                  <h3 className="mt-3 font-display text-3xl uppercase tracking-[0.18em] text-white md:text-4xl">
                    {activeMeta.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">{activeMeta.description}</p>
                </div>
                <div className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.6rem] border border-cyan-300/16 bg-cyan-300/10 text-cyan-100">
                  <ActiveIcon size={24} />
                </div>
              </div>

              {!isUnlocked ? (
                <div className="mb-6 rounded-[1.5rem] border border-amber-300/18 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100/88">
                  Add the same admin key here that you configured in <code>PORTFOLIO_ADMIN_TOKEN</code> on the server,
                  then the save action will unlock.
                </div>
              ) : null}

              {activeTool === "photo" ? (
                <form onSubmit={handlePhotoSubmit} className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/76 p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/46">Preview</p>
                    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-cyan-300/14 bg-slate-950/80">
                      <img src={previewUrl} alt="Profile preview" className="h-[320px] w-full object-cover" />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <label className="input-shell">
                      <span>New image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                      />
                    </label>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/66">
                      Use a square or portrait image for the cleanest avatar crop. PNG, JPG, and WEBP are supported.
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                      <p className="text-sm text-white/48">
                        {photoFile ? photoFile.name : "Select a file, then save it to the portfolio."}
                      </p>
                      <button
                        type="submit"
                        disabled={!isUnlocked || busy || !photoFile}
                        className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {busy ? "Saving..." : "Save Photo"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}

              {activeTool === "certificate" ? (
                <form onSubmit={handleCertificateSubmit} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Certificate title</span>
                      <input
                        type="text"
                        value={certificateValues.title}
                        onChange={(event) => setCertificateValues((current) => ({ ...current, title: event.target.value }))}
                        placeholder="AI Fundamentals"
                        required
                      />
                    </label>
                    <label className="input-shell">
                      <span>Issuer</span>
                      <input
                        type="text"
                        value={certificateValues.issuer}
                        onChange={(event) => setCertificateValues((current) => ({ ...current, issuer: event.target.value }))}
                        placeholder="Coursera, Udemy, Google..."
                        required
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Year or status</span>
                      <input
                        type="text"
                        value={certificateValues.year}
                        onChange={(event) => setCertificateValues((current) => ({ ...current, year: event.target.value }))}
                        placeholder="2026 or In Progress"
                        required
                      />
                    </label>
                    <label className="input-shell">
                      <span>Credential link</span>
                      <input
                        type="url"
                        value={certificateValues.credentialUrl}
                        onChange={(event) =>
                          setCertificateValues((current) => ({ ...current, credentialUrl: event.target.value }))
                        }
                        placeholder="Optional public verification link"
                      />
                    </label>
                  </div>

                  <label className="input-shell">
                    <span>Summary</span>
                    <textarea
                      rows={5}
                      value={certificateValues.summary}
                      onChange={(event) => setCertificateValues((current) => ({ ...current, summary: event.target.value }))}
                      placeholder="What this certificate covered, why it matters, or what you learned from it..."
                      required
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-white/48">Each certificate is added directly to the certificates section.</p>
                    <button
                      type="submit"
                      disabled={!isUnlocked || busy}
                      className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {busy ? "Saving..." : "Add Certificate"}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeTool === "project" ? (
                <form onSubmit={handleProjectSubmit} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Project title</span>
                      <input
                        type="text"
                        value={projectValues.title}
                        onChange={(event) => setProjectValues((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Smart Vision Assistant"
                        required
                      />
                    </label>
                    <label className="input-shell">
                      <span>Category</span>
                      <input
                        type="text"
                        value={projectValues.category}
                        onChange={(event) => setProjectValues((current) => ({ ...current, category: event.target.value }))}
                        placeholder="AI, Backend, Web, Desktop..."
                        required
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Year</span>
                      <input
                        type="text"
                        value={projectValues.year}
                        onChange={(event) => setProjectValues((current) => ({ ...current, year: event.target.value }))}
                        placeholder="2026 or Recent"
                      />
                    </label>
                    <label className="input-shell">
                      <span>Image URL</span>
                      <input
                        type="url"
                        value={projectValues.image}
                        onChange={(event) => setProjectValues((current) => ({ ...current, image: event.target.value }))}
                        placeholder="Optional image URL"
                      />
                    </label>
                  </div>

                  <label className="input-shell">
                    <span>Summary</span>
                    <textarea
                      rows={4}
                      value={projectValues.summary}
                      onChange={(event) => setProjectValues((current) => ({ ...current, summary: event.target.value }))}
                      placeholder="Describe the project in one strong portfolio-ready paragraph..."
                      required
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Stack</span>
                      <input
                        type="text"
                        value={projectValues.stack}
                        onChange={(event) => setProjectValues((current) => ({ ...current, stack: event.target.value }))}
                        placeholder="Python, TensorFlow, OpenCV"
                        required
                      />
                    </label>
                    <label className="input-shell">
                      <span>Metrics</span>
                      <input
                        type="text"
                        value={projectValues.metrics}
                        onChange={(event) => setProjectValues((current) => ({ ...current, metrics: event.target.value }))}
                        placeholder="Realtime, Automation, AI-first"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="input-shell">
                      <span>Challenge</span>
                      <textarea
                        rows={4}
                        value={projectValues.challenge}
                        onChange={(event) =>
                          setProjectValues((current) => ({ ...current, challenge: event.target.value }))
                        }
                        placeholder="What problem did the project solve?"
                        required
                      />
                    </label>
                    <label className="input-shell">
                      <span>Solution</span>
                      <textarea
                        rows={4}
                        value={projectValues.solution}
                        onChange={(event) => setProjectValues((current) => ({ ...current, solution: event.target.value }))}
                        placeholder="How did you build or approach the solution?"
                        required
                      />
                    </label>
                  </div>

                  <label className="input-shell">
                    <span>Impact points</span>
                    <input
                      type="text"
                      value={projectValues.impact}
                      onChange={(event) => setProjectValues((current) => ({ ...current, impact: event.target.value }))}
                      placeholder="Portfolio-ready, AI integration, scalable foundation"
                      required
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="input-shell">
                      <span>Live URL</span>
                      <input
                        type="url"
                        value={projectValues.live}
                        onChange={(event) => setProjectValues((current) => ({ ...current, live: event.target.value }))}
                        placeholder="Optional"
                      />
                    </label>
                    <label className="input-shell">
                      <span>Repo URL</span>
                      <input
                        type="url"
                        value={projectValues.repo}
                        onChange={(event) => setProjectValues((current) => ({ ...current, repo: event.target.value }))}
                        placeholder="Optional"
                      />
                    </label>
                    <label className="input-shell">
                      <span>Case study URL</span>
                      <input
                        type="url"
                        value={projectValues.caseStudy}
                        onChange={(event) =>
                          setProjectValues((current) => ({ ...current, caseStudy: event.target.value }))
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-white/48">
                      Use commas to separate stack items, metrics, and impact points.
                    </p>
                    <button
                      type="submit"
                      disabled={!isUnlocked || busy}
                      className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {busy ? "Saving..." : "Add Project"}
                    </button>
                  </div>
                </form>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
