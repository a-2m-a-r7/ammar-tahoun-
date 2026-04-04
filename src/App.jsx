import {
  lazy,
  startTransition,
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";
import Tilt from "react-parallax-tilt";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import {
  ArrowRight,
  Atom,
  Bot,
  Briefcase,
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  Globe,
  Layers3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Workflow,
  Zap
} from "lucide-react";
import MagneticButton from "./components/MagneticButton";
import ProjectModal from "./components/ProjectModal";

const BackgroundFX = lazy(() => import("./components/BackgroundFX"));

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" }
];

const sectionVariants = {
  hidden: { opacity: 0, y: 42, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const techIconMap = {
  Python: Cpu,
  "Machine Learning": Sparkles,
  "Deep Learning": Workflow,
  TensorFlow: Cpu,
  OpenCV: Bot,
  "Computer Vision": Bot,
  NLP: MessageSquare,
  React: Atom,
  "Node.js": Cpu,
  MongoDB: Database,
  "Tailwind CSS": Layers3,
  "Next.js": Rocket
};

const socialIconMap = {
  GitHub: Code2,
  LinkedIn: Briefcase,
  Instagram: Globe,
  WhatsApp: MessageSquare,
  Email: Mail,
  Phone: Phone
};

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

function toAbsoluteUrl(value, fallbackPath = "/") {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";

  try {
    const base = fallbackOrigin || "http://localhost:3000";
    return new URL(value || fallbackPath, base).toString();
  } catch {
    return `${fallbackOrigin}${fallbackPath}`;
  }
}

function upsertMetaTag(selector, attributes) {
  if (typeof document === "undefined") {
    return;
  }

  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function upsertLinkTag(selector, attributes) {
  if (typeof document === "undefined") {
    return;
  }

  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function syncPortfolioSeo(profile) {
  if (typeof document === "undefined" || !profile) {
    return;
  }

  const configuredSiteUrl = `${profile.site?.url || ""}`.trim();
  const shouldUseRuntimeOrigin =
    !configuredSiteUrl || /localhost|127\.0\.0\.1/i.test(configuredSiteUrl);
  const preferredUrl = shouldUseRuntimeOrigin
    ? `${window.location.origin}${window.location.pathname}`
    : configuredSiteUrl;
  const title = profile.site?.title || "Ammar Tahoon | AI Engineer";
  const description =
    profile.site?.description ||
    profile.personal?.heroSummary ||
    "Ammar Tahoon builds AI-driven solutions across machine learning, deep learning, computer vision, and NLP.";
  const canonicalUrl = toAbsoluteUrl(preferredUrl, window.location.pathname || "/");
  const imageUrl = toAbsoluteUrl(profile.personal?.profileImage || "/assets/avatar-monogram.svg", "/assets/avatar-monogram.svg");

  document.title = title;

  upsertMetaTag('meta[name="description"]', { name: "description", content: description });
  upsertMetaTag('meta[name="theme-color"]', { name: "theme-color", content: "#020617" });
  upsertMetaTag('meta[name="robots"]', { name: "robots", content: "index,follow,max-image-preview:large" });
  upsertMetaTag('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMetaTag('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMetaTag('meta[property="og:type"]', { property: "og:type", content: "website" });
  upsertMetaTag('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  upsertMetaTag('meta[property="og:image"]', { property: "og:image", content: imageUrl });
  upsertMetaTag('meta[property="og:site_name"]', { property: "og:site_name", content: profile.personal?.fullName || "Ammar Tahoon" });
  upsertMetaTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  upsertMetaTag('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
  upsertLinkTag('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.personal?.fullName || "Ammar Tahoon",
    jobTitle: profile.personal?.role || "AI Engineer",
    description,
    email: profile.personal?.email || undefined,
    telephone: profile.personal?.phone || undefined,
    image: imageUrl,
    address: profile.personal?.location
      ? {
          "@type": "PostalAddress",
          addressLocality: profile.personal.location,
          addressCountry: "Egypt"
        }
      : undefined,
    sameAs: (profile.socials || []).map((item) => safeUrl(item.url)).filter((item) => item !== "#"),
    url: canonicalUrl
  };

  let schemaTag = document.getElementById("portfolio-person-schema");
  if (!schemaTag) {
    schemaTag = document.createElement("script");
    schemaTag.id = "portfolio-person-schema";
    schemaTag.type = "application/ld+json";
    document.head.appendChild(schemaTag);
  }
  schemaTag.textContent = JSON.stringify(schema);
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="section-kicker">
        <span className="section-kicker__dot" />
        {eyebrow}
      </div>
      <h2 className="section-title">{title}</h2>
      {description ? <p className="subtle-copy max-w-2xl text-base md:text-lg">{description}</p> : null}
    </div>
  );
}

function LoadingScene({ error }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),transparent_28%)]" />
      <div className="noise-overlay" />
      <motion.div
        className="glow-border glass-panel relative w-full max-w-xl rounded-[2rem] p-10 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="mx-auto mb-8 h-20 w-20 rounded-full border border-cyan-300/30 bg-cyan-300/10"
          animate={{ rotate: 360 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "linear" }}
        />
              <p className="display-meta mb-3 text-cyan-200/80">System Link</p>
        <h1 className="display-heading-lg text-white">
          {error ? "Signal interrupted" : "Booting portfolio"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/62 md:text-base">
          {error || "Loading cinematic interface, reactive layers, and portfolio intelligence."}
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerSessionActive, setOwnerSessionActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState("");
  const [formStatus, setFormStatus] = useState({ state: "idle", message: "" });
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    budget: "",
    message: "",
    website: ""
  });

  const shouldReduceMotion = useReducedMotion();
  const deferredFilter = useDeferredValue(activeFilter);
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.18 });

  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const heroShiftX = useTransform(parallaxX, [-0.5, 0.5], [-18, 18]);
  const heroShiftY = useTransform(parallaxY, [-0.5, 0.5], [-14, 14]);

  const orbPrimaryX = useMotionValue(-240);
  const orbPrimaryY = useMotionValue(-240);
  const orbSecondaryX = useMotionValue(-140);
  const orbSecondaryY = useMotionValue(-140);
  const orbPrimarySpringX = useSpring(orbPrimaryX, { stiffness: 76, damping: 22, mass: 1.1 });
  const orbPrimarySpringY = useSpring(orbPrimaryY, { stiffness: 76, damping: 22, mass: 1.1 });
  const orbSecondarySpringX = useSpring(orbSecondaryX, { stiffness: 110, damping: 28, mass: 0.9 });
  const orbSecondarySpringY = useSpring(orbSecondaryY, { stiffness: 110, damping: 28, mass: 0.9 });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Unable to load the portfolio profile data.");
        }

        const payload = await response.json();
        if (!active) {
          return;
        }

        setProfile(payload.data);
        syncPortfolioSeo(payload.data);
      } catch (loadError) {
        if (loadError.name !== "AbortError" && active) {
          setError(loadError.message || "Unable to load the portfolio.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    window.sessionStorage.removeItem("portfolio-admin-token");
    window.sessionStorage.removeItem("portfolio-admin-auth");
    window.localStorage.removeItem("portfolio-admin-token");
    window.localStorage.removeItem("portfolio-admin-auth");
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function checkOwnerSession() {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal
        });

        if (active) {
          setOwnerSessionActive(response.ok);
        }
      } catch (sessionError) {
        if (active && sessionError.name !== "AbortError") {
          setOwnerSessionActive(false);
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkOwnerSession();
      }
    };

    void checkOwnerSession();
    window.addEventListener("focus", checkOwnerSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("focus", checkOwnerSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const normalizedX = event.clientX / window.innerWidth - 0.5;
      const normalizedY = event.clientY / window.innerHeight - 0.5;

      parallaxX.set(normalizedX);
      parallaxY.set(normalizedY);
      orbPrimaryX.set(event.clientX - 260);
      orbPrimaryY.set(event.clientY - 260);
      orbSecondaryX.set(event.clientX - 110);
      orbSecondaryY.set(event.clientY - 110);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [orbPrimaryX, orbPrimaryY, orbSecondaryX, orbSecondaryY, parallaxX, parallaxY, shouldReduceMotion]);

  const filters = useMemo(() => {
    if (!profile?.projects?.length) {
      return ["All"];
    }

    const values = ["All"];
    const seen = new Set(values);

    profile.projects.forEach((project) => {
      [project.category, ...(project.stack || [])].forEach((item) => {
        if (item && !seen.has(item)) {
          seen.add(item);
          values.push(item);
        }
      });
    });

    return values.slice(0, 7);
  }, [profile]);

  const filteredProjects = useMemo(() => {
    const projects = profile?.projects || [];
    if (deferredFilter === "All") {
      return projects;
    }

    return projects.filter(
      (project) => project.category === deferredFilter || (project.stack || []).includes(deferredFilter)
    );
  }, [deferredFilter, profile]);

  const heroNameLines = useMemo(() => {
    const sourceName = (profile?.personal?.fullName || "Ammar Tahoon").trim().toUpperCase();
    const words = sourceName.split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
      return [sourceName];
    }

    if (words.length === 2) {
      return words;
    }

    const splitIndex = Math.ceil(words.length / 2);
    return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")];
  }, [profile]);

  const highlights = profile?.highlights || [];
  const socialLinks = profile?.socials || [];
  const highlightedTech = profile?.spotlightTech || [];
  const skillGroups = profile?.skillGroups || [];
  const services = profile?.services || [];
  const process = profile?.process || [];
  const stats = profile?.stats || [];
  const experience = profile?.experience || [];
  const certificates = profile?.certificates || [];
  const insights = profile?.insights || [];
  const faqs = profile?.faqs || [];
  const contactLinks = profile?.contact?.directLinks || [];
  const focusTechNames = highlightedTech.slice(0, 3).map((item) => item.name).join(" • ");

  const heroSignals = useMemo(
    () => [
      {
        label: "Current Mode",
        value: profile?.personal?.availability || "Available"
      },
      {
        label: "Base",
        value: profile?.personal?.location || "Egypt"
      },
      {
        label: "Focus",
        value: focusTechNames || profile?.personal?.role || "AI Engineer"
      }
    ],
    [focusTechNames, profile]
  );

  const handleFilterClick = (filter) => {
    startTransition(() => setActiveFilter(filter));
  };

  const handleCopyValue = async (label, value) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
      window.setTimeout(() => {
        setCopiedLabel((current) => (current === label ? "" : current));
      }, 1800);
    } catch {
      setCopiedLabel("");
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormStatus({ state: "pending", message: "Transmitting your message..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to send your message right now.");
      }

      setFormValues({
        name: "",
        email: "",
        company: "",
        projectType: "",
        budget: "",
        message: "",
        website: ""
      });
      setFormStatus({ state: "success", message: payload.message || "Your message has been sent successfully." });
    } catch (submitError) {
      setFormStatus({
        state: "error",
        message: submitError.message || "Unable to send your message right now."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScene />;
  }

  if (error || !profile) {
    return <LoadingScene error={error || "Unable to render the portfolio."} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#020617] text-white">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] h-[520px] w-[520px] rounded-full bg-cyan-400/12 blur-[130px]"
        style={{ x: orbPrimarySpringX, y: orbPrimarySpringY }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[71] h-[220px] w-[220px] rounded-full bg-violet-500/20 blur-[90px]"
        style={{ x: orbSecondarySpringX, y: orbSecondarySpringY }}
      />
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[90] h-px origin-left bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500 shadow-[0_0_25px_rgba(0,245,255,0.8)]"
        style={{ scaleX: progressScaleX }}
      />

      <div className="grid-overlay" />
      <div className="noise-overlay" />
      <div className="gradient-veil" />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="blob blob-one" />
        <div className="blob blob-two" />
        <div className="blob blob-three" />
      </div>

      {!shouldReduceMotion ? (
        <Suspense fallback={null}>
          <BackgroundFX />
        </Suspense>
      ) : null}

      <header className="sticky top-0 z-[80] px-4 pt-4 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-white/10 bg-slate-950/55 px-5 py-4 shadow-[0_10px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <a href="#home" className="font-display text-xs uppercase tracking-[0.16em] text-white md:text-sm">
            {profile.personal.nativeName}
          </a>
          <nav className="hidden items-center gap-5 text-sm text-white/58 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {ownerSessionActive ? (
              <a href="/admin" className="owner-access-button hidden md:inline-flex">
                <ShieldCheck size={15} />
                <span>Admin</span>
              </a>
            ) : null}
            <MagneticButton href="#contact" className="hidden md:inline-flex" icon={<ArrowRight size={16} />}>
              Contact
            </MagneticButton>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="relative flex min-h-screen items-center px-4 pb-16 pt-24 md:px-6 md:pb-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div variants={sectionVariants} initial="hidden" animate="show" className="space-y-8">
              <div className="section-kicker">
                <span className="section-kicker__dot" />
                Future-ready developer
              </div>

              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="hero-name">
                {heroNameLines.map((line, lineIndex) => (
                  <motion.div key={`${line}-${lineIndex}`} variants={staggerItem} className="hero-name__line">
                    {line.split("").map((character, characterIndex) => (
                      <motion.span
                        key={`${character}-${lineIndex}-${characterIndex}`}
                        custom={characterIndex}
                        variants={staggerItem}
                      >
                        {character === " " ? "\u00A0" : character}
                      </motion.span>
                    ))}
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                className="max-w-2xl text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/85 md:text-sm"
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                {profile.personal.tagline}
              </motion.p>

              <motion.p
                className="max-w-2xl text-base leading-8 text-white/68 md:text-lg"
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                {profile.personal.heroSummary}
              </motion.p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-3"
              >
                {highlights.map((item) => (
                  <motion.span key={item} variants={staggerItem} className="signal-chip">
                    {item}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={staggerItem}>
                  <MagneticButton href="#projects" icon={<ArrowRight size={16} />}>
                    View Work
                  </MagneticButton>
                </motion.div>
                <motion.div variants={staggerItem}>
                  <MagneticButton href="#contact" variant="secondary" icon={<MessageSquare size={16} />}>
                    Contact Me
                  </MagneticButton>
                </motion.div>
                <motion.button
                  type="button"
                  variants={staggerItem}
                  onClick={() => handleCopyValue("hero-email", profile.personal.email)}
                  className="hero-copy-button"
                >
                  {copiedLabel === "hero-email" ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLabel === "hero-email" ? "Email Copied" : "Copy Email"}</span>
                </motion.button>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="hero-signal-grid"
              >
                {heroSignals.map((item) => (
                  <motion.article key={item.label} variants={staggerItem} className="hero-signal-card">
                    <p className="hero-signal-card__label">{item.label}</p>
                    <p className="hero-signal-card__value">{item.value}</p>
                  </motion.article>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="relative min-h-[540px]"
              style={shouldReduceMotion ? undefined : { x: heroShiftX, y: heroShiftY }}
            >
              <motion.div
                aria-hidden="true"
                className="absolute -left-2 top-6 h-40 w-40 rounded-full border border-cyan-300/18 bg-cyan-300/8 blur-sm"
                animate={shouldReduceMotion ? undefined : { y: [0, -18, 0], opacity: [0.4, 0.9, 0.4] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6.5, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute bottom-6 right-0 h-52 w-52 rounded-full border border-violet-400/16 bg-violet-500/12 blur-[6px]"
                animate={shouldReduceMotion ? undefined : { y: [0, 20, 0], x: [0, 12, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 8.5, ease: "easeInOut" }}
              />

              <Tilt
                tiltMaxAngleX={8}
                tiltMaxAngleY={8}
                glareEnable
                glareMaxOpacity={0.18}
                glareColor="#00f5ff"
                perspective={1800}
                className="relative z-10"
              >
                <div className="glow-border glass-panel relative overflow-hidden rounded-[2rem] px-6 py-7 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,245,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.18),transparent_28%)]" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="display-meta text-cyan-200/75">Identity Core</p>
                      <h2 className="display-heading-lg mt-3 text-white">
                        {profile.personal.fullName}
                      </h2>
                      <p className="mt-3 max-w-md text-sm leading-7 text-white/64">{profile.personal.availability}</p>
                    </div>
                    <span className="status-pill">Online</span>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative rounded-[1.7rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
                      <div className="avatar-badge">
                        <img src={profile.personal.profileImage} alt={profile.personal.fullName} />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="display-meta text-white/46">Signal summary</p>
                          <Sparkles size={16} className="text-cyan-300" />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {stats.slice(0, 3).map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
                              <p className="display-stat text-white">{stat.value}</p>
                              <p className="display-meta mt-2 text-white/48">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.7rem] border border-cyan-300/15 bg-cyan-300/8 p-5">
                        <p className="display-meta text-cyan-200/76">Mission</p>
                        <p className="mt-3 text-sm leading-7 text-white/70">{profile.about.intro}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-6 flex flex-wrap gap-3">
                    {socialLinks.map((item) => {
                      const Icon = socialIconMap[item.label] || Globe;

                      return (
                        <a key={item.label} href={safeUrl(item.url)} target="_blank" rel="noreferrer" className="social-pill">
                          <Icon size={15} />
                          <span>{item.label}</span>
                        </a>
                        );
                    })}
                  </div>

                  {ownerSessionActive ? (
                    <a href="/admin" className="owner-access-inline">
                      <ShieldCheck size={15} />
                      <span>Open private admin dashboard</span>
                    </a>
                  ) : null}
                </div>
              </Tilt>
            </motion.div>
          </div>
        </section>

        <motion.section
          id="about"
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} perspective={1800}>
              <div className="glow-border glass-panel h-full rounded-[2rem] p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <SectionHeading
                    eyebrow="About Me"
                    title="A glassmorphism profile node built to communicate focus and credibility."
                  />
                  <Shield className="hidden text-cyan-300 md:block" size={22} />
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-[0.55fr_0.45fr]">
                  <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5">
                    <div className="avatar-badge avatar-badge-large">
                      <img src={profile.personal.profileImage} alt={profile.personal.fullName} />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-[1.4rem] border border-white/8 bg-white/6 p-4">
                        <p className="display-stat text-white">{stat.value}</p>
                        <p className="display-meta mt-2 text-white/50">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tilt>

            <div className="grid gap-6">
              <div className="glow-border glass-panel rounded-[2rem] p-6 md:p-8">
                <SectionHeading
                  eyebrow="Precision Bio"
                  title="AI, immersive frontend engineering, and premium product execution."
                  description={profile.about.body}
                />
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {profile.about.principles.map((item, index) => (
                  <motion.article key={item} variants={staggerItem} className="principle-card">
                    <p className="display-meta mb-3 text-cyan-200/72">0{index + 1}</p>
                    <p className="text-sm leading-7 text-white/72">{item}</p>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeading
              eyebrow="What I Build"
              title="Product-grade services engineered to look sharp, move smoothly, and scale cleanly."
              description="Every block below is designed to feel premium while still communicating practical product value."
            />

            <motion.div
              className="grid gap-5 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {services.map((service, index) => {
                const icons = [Sparkles, Workflow, Rocket];
                const Icon = icons[index] || Code2;

                return (
                  <motion.article key={service.title} variants={staggerItem} className="glow-border service-card">
                    <div className="flex items-center justify-between">
                      <div className="service-icon">
                        <Icon size={18} />
                      </div>
                      <span className="display-meta text-white/38">0{index + 1}</span>
                    </div>
                    <h3 className="display-heading-md mt-6 text-white">
                      {service.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/66">{service.summary}</p>
                    <div className="mt-6 space-y-3">
                      {service.points.map((point) => (
                        <div key={point} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(0,245,255,0.9)]" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="skills"
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeading
              eyebrow="Technical Arsenal"
              title="Glowing technology cards with depth, tilt, and motion-driven presence."
              description="The goal is not only to show the stack, but to present it like a premium capability system."
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {highlightedTech.map((tech) => {
                const Icon = techIconMap[tech.name] || Code2;

                return (
                  <motion.div key={tech.name} variants={staggerItem}>
                    <Tilt tiltMaxAngleX={9} tiltMaxAngleY={9} perspective={1600} glareEnable glareMaxOpacity={0.14}>
                      <article className="glow-border skill-card">
                        <div className="skill-icon">
                          <Icon size={22} />
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-4">
                          <div>
                            <p className="display-heading-md text-white">{tech.name}</p>
                            <p className="display-meta mt-2 text-cyan-200/70">{tech.category}</p>
                          </div>
                          <Zap className="text-violet-300/70" size={18} />
                        </div>
                        <p className="mt-4 text-sm leading-7 text-white/68">{tech.summary}</p>
                      </article>
                    </Tilt>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-3">
              {skillGroups.map((group) => (
                <div key={group.title} className="glass-panel rounded-[1.8rem] border border-white/8 p-6">
                  <p className="display-heading-sm text-white">{group.title}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={item} className="signal-chip signal-chip-soft">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeading
              eyebrow="Build Sequence"
              title="Section transitions designed like scenes in a product trailer."
              description="This process section reinforces how strategy, motion, engineering, and launch readiness connect."
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-5 lg:grid-cols-4"
            >
              {process.map((item) => (
                <motion.article key={item.step} variants={staggerItem} className="process-card">
                  <p className="display-heading-md text-cyan-200/84">{item.step}</p>
                  <h3 className="display-heading-sm mt-5 text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/66">{item.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="projects"
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
        >
          <div className="mx-auto max-w-7xl space-y-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading
                eyebrow="Featured Projects"
                title="Cinematic project cards with filters, tilt, hover overlays, and animated detail views."
                description="Built to impress recruiters and clients within seconds while still giving each project enough substance."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => {
                const active = filter === activeFilter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleFilterClick(filter)}
                    className="filter-pill"
                  >
                    {active ? <motion.span layoutId="filter-pill" className="filter-pill__active" /> : null}
                    <span className={`relative z-[1] ${active ? "text-white" : "text-white/60"}`}>{filter}</span>
                  </button>
                );
              })}
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
              className="grid gap-6 xl:grid-cols-3"
            >
              {filteredProjects.map((project) => (
                <motion.div key={project.slug} variants={staggerItem}>
                  <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} perspective={1800} glareEnable glareMaxOpacity={0.12}>
                    <article className="project-card-shell group">
                      <div className="project-image-wrap">
                        <img
                          src={safeUrl(project.image)}
                          alt={project.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="project-image-overlay" />
                        <button
                          type="button"
                          onClick={() => setSelectedProject(project)}
                          className="project-card__cta"
                        >
                          View Details
                        </button>
                      </div>

                      <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="display-meta text-cyan-200/76">{project.category}</p>
                          <p className="display-meta text-white/38">{project.year}</p>
                        </div>
                        <h3 className="display-heading-md text-white">{project.title}</h3>
                        <p className="text-sm leading-7 text-white/66">{project.summary}</p>

                        <div className="flex flex-wrap gap-2">
                          {project.stack.map((item) => (
                            <span key={item} className="signal-chip signal-chip-soft">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  </Tilt>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Education & Growth"
                title="A timeline for university learning, self-development, and the milestones shaping my AI path."
              />
              <div className="space-y-4">
                {experience.map((item) => (
                  <article key={`${item.company}-${item.role}`} className="timeline-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="display-meta text-cyan-200/76">{item.period}</p>
                      <p className="display-meta text-white/40 wrap-safe">{item.company}</p>
                    </div>
                    <h3 className="display-heading-md mt-4 text-white">{item.role}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/68">{item.summary}</p>
                    <div className="mt-5 space-y-3">
                      {item.points.map((point) => (
                        <div key={point} className="flex items-start gap-3 text-sm text-white/68">
                          <span className="mt-2 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.8)]" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <SectionHeading
                  eyebrow="Certificates + Insight"
                  title="Learning milestones, credentials, and progress markers that strengthen the story."
                />
              </div>

              <div className="grid gap-4">
                {certificates.length > 0 ? (
                  certificates.map((item) => (
                    <article key={item.id} className="glass-panel rounded-[1.8rem] border border-white/8 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="display-meta text-cyan-200/76">{item.year}</p>
                          <h3 className="display-heading-sm mt-4 text-white">
                            {item.title}
                          </h3>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/10 text-cyan-100">
                          <Trophy size={18} />
                        </span>
                      </div>
                      <p className="display-meta mt-4 text-white/42 wrap-safe">{item.issuer}</p>
                      <p className="mt-4 text-sm leading-7 text-white/68">{item.summary}</p>
                      {item.credentialUrl && item.credentialUrl !== "#" ? (
                        <a
                          href={safeUrl(item.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                        className="display-meta mt-5 inline-flex items-center gap-2 text-cyan-200/82 transition hover:text-cyan-100"
                        >
                          View Credential
                          <ArrowRight size={14} />
                        </a>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <article className="glass-panel rounded-[1.8rem] border border-dashed border-white/10 p-6">
                    <p className="display-meta text-cyan-200/76">Ready for your first certificate</p>
                    <p className="mt-4 text-sm leading-7 text-white/66">Certificates will appear here as you add them from the private admin dashboard.</p>
                  </article>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {insights.map((item) => (
                  <a key={item.title} href={safeUrl(item.url)} target="_blank" rel="noreferrer" className="insight-card">
                    <p className="display-meta text-cyan-200/76">{item.tag}</p>
                    <h3 className="display-heading-sm mt-4 text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/66">{item.summary}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-7xl space-y-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Answers that reduce hesitation and keep the experience conversion-ready."
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {faqs.map((item) => (
                <article key={item.question} className="glass-panel rounded-[1.8rem] border border-white/8 p-6">
                  <p className="display-heading-sm text-white">{item.question}</p>
                  <p className="mt-4 text-sm leading-7 text-white/68">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="contact"
          className="scene-section px-4 py-16 md:px-6 md:py-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="glow-border glass-panel rounded-[2rem] p-6 md:p-8">
              <SectionHeading eyebrow="Contact" title={profile.contact.heading} description={profile.contact.intro} />

              <div className="mt-8 grid gap-4">
                {contactLinks.map((item) => {
                  const Icon = socialIconMap[item.label] || Mail;

                  return (
                    <div key={item.label} className="contact-link-card">
                      <a href={safeUrl(item.url)} className="flex min-w-0 flex-1 items-center gap-4">
                        <span className="contact-link-card__icon">
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="display-meta text-white/44">{item.label}</p>
                          <p className="mt-2 truncate text-sm text-white/76">{item.value}</p>
                        </div>
                      </a>
                      {item.label === "Email" || item.label === "Phone" ? (
                        <button
                          type="button"
                          onClick={() => handleCopyValue(item.label, item.value)}
                          className="contact-copy-button"
                        >
                          {copiedLabel === item.label ? <Check size={15} /> : <Copy size={15} />}
                          <span>{copiedLabel === item.label ? "Copied" : "Copy"}</span>
                        </button>
                      ) : null}
                    </div>
                  );
                })}

                <div className="contact-link-card">
                  <span className="contact-link-card__icon">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <p className="display-meta text-white/44">Location</p>
                    <p className="mt-2 text-sm text-white/76">{profile.personal.location}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {socialLinks.map((item) => {
                  const Icon = socialIconMap[item.label] || Globe;

                  return (
                    <a key={item.label} href={safeUrl(item.url)} target="_blank" rel="noreferrer" className="social-pill">
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="glow-border glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="input-shell">
                  <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                  />
                </label>
                <label className="input-shell">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="input-shell">
                  <span>Company</span>
                  <input
                    type="text"
                    name="company"
                    value={formValues.company}
                    onChange={handleInputChange}
                    placeholder="Brand or team"
                  />
                </label>
                <label className="input-shell">
                  <span>Project type</span>
                  <input
                    type="text"
                    name="projectType"
                    value={formValues.projectType}
                    onChange={handleInputChange}
                    placeholder="Portfolio, SaaS, AI tool..."
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="input-shell">
                  <span>Budget or scope</span>
                  <input
                    type="text"
                    name="budget"
                    value={formValues.budget}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </label>

                <label className="hidden">
                  <span>Website</span>
                  <input type="text" name="website" value={formValues.website} onChange={handleInputChange} />
                </label>

                <label className="input-shell">
                  <span>Message</span>
                  <textarea
                    name="message"
                    value={formValues.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about the product, role, or collaboration you want to discuss..."
                    rows={7}
                    required
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <MagneticButton type="submit" icon={<ArrowRight size={16} />}>
                  {submitting ? "Transmitting..." : "Send Message"}
                </MagneticButton>
                <p
                  className={`text-sm ${
                    formStatus.state === "success"
                      ? "text-emerald-300"
                      : formStatus.state === "error"
                        ? "text-rose-300"
                        : "text-white/52"
                  }`}
                >
                  {formStatus.message || "Fast replies. Serious builds. Clear communication."}
                </p>
              </div>
            </form>
          </div>
        </motion.section>
      </main>

      <footer className="px-4 pb-8 md:px-6 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[2rem] border border-white/8 bg-slate-950/60 px-6 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="font-display cursor-default text-sm uppercase tracking-[0.12em] text-white">{profile.personal.nativeName}</p>
            <p className="text-sm text-white/48">
              Built with React, Tailwind CSS, Framer Motion, premium interaction design, and a secure contact backend.
            </p>
          </div>
          <div className="display-meta flex flex-wrap items-center gap-3 text-white/42">
            <span>{profile.personal.location}</span>
            <span>{profile.projects.length} projects</span>
            <span>{new Date().getFullYear()}</span>
            {ownerSessionActive ? (
              <a href="/admin" className="owner-access-button">
                <ShieldCheck size={14} />
                <span>Admin</span>
              </a>
            ) : null}
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProject ? <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}
