import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

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

export default function ProjectModal({ project, onClose }) {
  const liveUrl = safeUrl(project.links?.live);
  const repoUrl = safeUrl(project.links?.repo);
  const caseStudyUrl = safeUrl(project.links?.caseStudy);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
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
      onClick={onClose}
    >
      <motion.div
        className="glow-border glass-panel relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] md:p-8"
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white"
          aria-label="Close project details"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[1.6rem] border border-cyan-300/12 bg-slate-950/80">
            <img
              src={safeUrl(project.image)}
              alt={project.title}
              className="h-full min-h-[300px] w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                {project.category} / {project.year}
              </div>
              <h3 className="display-heading-lg text-white">
                {project.title}
              </h3>
              <p className="text-sm leading-7 text-white/68 md:text-base">{project.summary}</p>
            </div>

            <div className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
              <div>
                <p className="display-meta text-cyan-200/80">Challenge</p>
                <p className="mt-2 text-sm leading-7 text-white/70">{project.details?.challenge}</p>
              </div>
              <div>
                <p className="display-meta text-violet-200/80">Solution</p>
                <p className="mt-2 text-sm leading-7 text-white/70">{project.details?.solution}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="display-meta text-cyan-200/80">Impact</p>
              <div className="flex flex-wrap gap-2">
                {(project.details?.impact || []).map((item) => (
                  <span
                    key={item}
                    className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(project.stack || []).map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-cyan-300/18 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100"
                >
                  {item}
                </span>
              ))}
            </div>

            {liveUrl !== "#" || repoUrl !== "#" || caseStudyUrl !== "#" ? (
              <div className="mt-auto flex flex-wrap gap-3">
                {liveUrl !== "#" ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16"
                  >
                    Live Preview
                    <ArrowUpRight size={16} />
                  </a>
                ) : null}

                {repoUrl !== "#" ? (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/12"
                  >
                    Source Code
                    <ArrowUpRight size={16} />
                  </a>
                ) : null}

                {caseStudyUrl !== "#" ? (
                  <a
                    href={caseStudyUrl}
                    target="_blank"
                    rel="noreferrer"
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
