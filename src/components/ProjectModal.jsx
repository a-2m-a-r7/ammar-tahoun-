import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, Sparkles, Bot, Loader2 } from "lucide-react";

function safeUrl(value = "#") {
  if (!value) {
    return "#";
  }

  if (value === "#" || value.startsWith("/") || value.startsWith("#")) {
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

export default function ProjectModal({ project, onClose, onLogEvent }) {
  const liveUrl = safeUrl(project.links?.live || project.live);
  const repoUrl = safeUrl(project.links?.repo || project.repo);
  const caseStudyUrl = safeUrl(project.links?.caseStudy);
  const entryTime = useRef(Date.now());
  const titleId = `${project.slug || "project"}-modal-title`;

  const [aiExplanation, setAiExplanation] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleClose = () => {
    const durationSeconds = Math.round((Date.now() - entryTime.current) / 1000);
    onClose(durationSeconds);
  };

  const handleExplain = async () => {
    if (aiExplanation || loadingAi) return;
    setLoadingAi(true);

    try {
      const res = await fetch(`/api/ai/explain?slug=${encodeURIComponent(project.slug || project.id || "")}`);
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.explanation || "");
      } else {
        setAiExplanation(project.summary || "This project demonstrates practical software and AI engineering.");
      }
    } catch {
      setAiExplanation(project.summary || "This project demonstrates practical software and AI engineering.");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-2xl md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="glow-border glass-panel relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] md:p-8"
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white"
          aria-label="Close project details"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[1.6rem] border border-cyan-300/12 bg-slate-950/80">
              <img
                src={safeUrl(project.image)}
                alt={project.title}
                className="h-full min-h-[260px] w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* AI Explainer Box */}
            <div className="rounded-[1.4rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-950/40 to-violet-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-200">
                  <Bot size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Project Explainer</span>
                </div>
                {!aiExplanation && (
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={loadingAi}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-50"
                  >
                    {loadingAi ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Explain for Non-Tech
                      </>
                    )}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {aiExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 text-xs leading-6 text-cyan-100/90 md:text-sm"
                  >
                    💡 {aiExplanation}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                {project.category} / {project.year}
              </div>
              <h3 id={titleId} className="display-heading-lg text-white">
                {project.title}
              </h3>
              <p className="text-sm leading-7 text-white/68 md:text-base">{project.summary}</p>
            </div>

            {(project.details?.challenge || project.details?.solution) && (
              <div className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                {project.details?.challenge && (
                  <div>
                    <p className="display-meta text-cyan-200/80">Challenge</p>
                    <p className="mt-2 text-sm leading-7 text-white/70">{project.details.challenge}</p>
                  </div>
                )}
                {project.details?.solution && (
                  <div>
                    <p className="display-meta text-violet-200/80">Solution</p>
                    <p className="mt-2 text-sm leading-7 text-white/70">{project.details.solution}</p>
                  </div>
                )}
              </div>
            )}

            {project.metrics?.length > 0 && (
              <div className="space-y-3">
                <p className="display-meta text-cyan-200/80">Key Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {project.metrics.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-white/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.details?.impact?.length > 0 && (
              <div className="space-y-3">
                <p className="display-meta text-cyan-200/80">Impact</p>
                <div className="flex flex-wrap gap-2">
                  {project.details.impact.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-white/72"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(project.stack || []).map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-cyan-300/18 bg-cyan-300/8 px-4 py-2 text-xs text-cyan-100"
                >
                  {item}
                </span>
              ))}
            </div>

            {liveUrl !== "#" || repoUrl !== "#" || caseStudyUrl !== "#" ? (
              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                {liveUrl !== "#" ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/25"
                  >
                    Live Preview
                    <ArrowUpRight size={16} />
                  </a>
                ) : null}

                {repoUrl !== "#" ? (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/12"
                    onClick={() => {
                      if (onLogEvent) onLogEvent("HIGH_SIGNAL.GITHUB_CLICK", { target: repoUrl });
                    }}
                  >
                    Source Code
                    <ArrowUpRight size={16} />
                  </a>
                ) : null}

                {caseStudyUrl !== "#" ? (
                  <a
                    href={caseStudyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/12"
                  >
                    Case Study
                    <ArrowUpRight size={16} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
