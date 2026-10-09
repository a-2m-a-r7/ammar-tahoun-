import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, FolderPlus, ImagePlus, Lock, LogOut, MessageSquare, Shield, Trash2, Trophy, X } from "lucide-react";
import {
  cloneProfile,
  createCertificateForm,
  createContactFormFromProfile,
  createProjectForm,
  guessImageMimeType,
  readFileAsDataUrl,
  splitCommaValues
} from "../admin-utils";

const toolMeta = {
  photo: {
    label: "Photo",
    createTitle: "Update profile photo",
    editTitle: "Update profile photo",
    description: "Replace the avatar image used across the portfolio.",
    icon: ImagePlus
  },
  certificate: {
    label: "Certificate",
    createTitle: "Add a certificate",
    editTitle: "Edit certificate",
    description: "Add or update a certificate that appears in the learning milestones section.",
    icon: Trophy
  },
  project: {
    label: "Project",
    createTitle: "Add a project",
    editTitle: "Edit project",
    description: "Add a new project or update an existing one without leaving the site.",
    icon: FolderPlus
  },
  contact: {
    label: "Contact",
    createTitle: "Update contact details",
    editTitle: "Update contact details",
    description: "Update your email, phone, location, and social links.",
    icon: MessageSquare
  },
  vault: {
    label: "Security Vault",
    createTitle: "Level 5 Security Vault",
    editTitle: "Level 5 Security Vault",
    description: "Access encrypted visitor messages and system audit logs. Decrypted on-the-fly for your eyes only.",
    icon: Shield
  }
};

function ModalShell({ title, eyebrow, description, icon: Icon, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/78 px-4 py-5 backdrop-blur-2xl md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
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
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white"
          aria-label="Close admin studio"
        >
          <X size={18} />
        </button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/76">{eyebrow}</p>
            <h3 className="mt-3 font-display text-3xl uppercase tracking-[0.18em] text-white md:text-4xl">{title}</h3>
            <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">{description}</p>
          </div>
          <div className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.6rem] border border-cyan-300/16 bg-cyan-300/10 text-cyan-100">
            <Icon size={24} />
          </div>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

export default function IntegratedAdminStudio({
  adminPromptOpen,
  onCloseAdminPrompt,
  onVerifyAdminToken,
  editorState,
  onCloseEditor,
  adminToken,
  onAdminTokenChange,
  rememberAdmin,
  onRememberAdminChange,
  isAdminAuthenticated,
  busy,
  status,
  profileImage,
  onUpdatePhoto,
  onSaveCertificate,
  onSaveProject,
  onOpenPhotoEditor,
  onOpenProjectCreator,
  onOpenCertificateCreator,
  onOpenContactEditor,
  profile,
  onSaveProfile,
  onClearProfilePhoto,
  onDeleteProject,
  onDeleteCertificate,
  onClearQuickContact,
  onLogout,
  onOpenVault
}) {
  const [photoFile, setPhotoFile] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("mart33645@gmail.com");
  const [certificateValues, setCertificateValues] = useState(createCertificateForm(editorState?.data));
  const [projectValues, setProjectValues] = useState(createProjectForm(editorState?.data));
  const [contactValues, setContactValues] = useState(() => createContactFormFromProfile(profile));
  const [quickDeleteTarget, setQuickDeleteTarget] = useState(null);
  const [vaultData, setVaultData] = useState({ submissions: [], auditLog: [], encryptionActive: false });

  const projectsList = Array.isArray(profile?.projects) ? profile.projects : [];
  const certificatesList = Array.isArray(profile?.certificates) ? profile.certificates : [];

  const deleteFabClass =
    "pointer-events-auto absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/28 bg-rose-500/16 text-rose-100 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition hover:bg-rose-500/26 disabled:cursor-not-allowed disabled:opacity-40";

  const activeTool = editorState?.type || null;
  const mode = editorState?.mode || "create";
  const activeMeta = activeTool ? toolMeta[activeTool] : null;
  const ActiveIcon = activeMeta?.icon || Shield;

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
    if (!adminPromptOpen && !activeTool) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (activeTool) {
          onCloseEditor();
          return;
        }

        onCloseAdminPrompt();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTool, adminPromptOpen, onCloseAdminPrompt, onCloseEditor]);

  useEffect(() => {
    if (activeTool === "certificate") {
      setCertificateValues(createCertificateForm(editorState?.data));
    }

    if (activeTool === "project") {
      setProjectValues(createProjectForm(editorState?.data));
    }

    if (activeTool === "photo") {
      setPhotoFile(null);
    }

    if (activeTool === "contact") {
      setContactValues(createContactFormFromProfile(profile));
    }

    if (activeTool === "vault") {
      const loadVault = async () => {
        try {
          const response = await fetch("/api/admin/vault", {
            headers: { "Authorization": `Admin ${adminToken}` } // Note: real server uses cookies but we can pass token for safety
          });
          const payload = await response.json();
          if (payload.ok) {
            setVaultData(payload.data);
          }
        } catch (err) {
          console.error("Vault access failed:", err);
        }
      };
      void loadVault();
    }
  }, [activeTool, editorState, profile, adminToken]);

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    await onVerifyAdminToken(adminToken, adminEmail);
  };

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

    await onSaveCertificate({
      adminToken,
      certificate: certificateValues
    });
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    await onSaveProject({
      adminToken,
      project: {
        slug: projectValues.slug,
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

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    const nextProfile = cloneProfile(profile);
    nextProfile.personal = {
      ...nextProfile.personal,
      email: contactValues.email.trim(),
      phone: contactValues.phone.trim(),
      location: contactValues.location.trim()
    };
    nextProfile.contact = {
      ...nextProfile.contact,
      heading: contactValues.heading.trim(),
      intro: contactValues.intro.trim()
    };

    await onSaveProfile({
      adminToken,
      profile: nextProfile
    });
  };

  const handleClearPhotoFab = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!onClearProfilePhoto || busy) {
      return;
    }
    if (!window.confirm("إرجاع صورة البروفايل للصورة الافتراضية وحذف ملف الصورة المرفوع؟")) {
      return;
    }
    try {
      await onClearProfilePhoto({ adminToken });
    } catch {
      /* رسالة الخطأ تظهر عبر status في الأب */
    }
  };

  const handleOpenProjectDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) {
      return;
    }
    setQuickDeleteTarget("project");
  };

  const handleOpenCertificateDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) {
      return;
    }
    setQuickDeleteTarget("certificate");
  };

  const handleClearContactFab = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!onClearQuickContact || busy) {
      return;
    }
    try {
      await onClearQuickContact();
    } catch {
      /* status */
    }
  };

  const confirmDeleteProjectRow = async (slug, title) => {
    if (!onDeleteProject || busy) {
      return;
    }
    if (!window.confirm(`حذف المشروع «${title}» نهائياً؟`)) {
      return;
    }
    try {
      await onDeleteProject({ adminToken, slug });
      setQuickDeleteTarget(null);
    } catch {
      /* status */
    }
  };

  const confirmDeleteCertificateRow = async (id, title) => {
    if (!onDeleteCertificate || busy) {
      return;
    }
    if (!window.confirm(`حذف الشهادة «${title}»؟`)) {
      return;
    }
    try {
      await onDeleteCertificate({ adminToken, id });
      setQuickDeleteTarget(null);
    } catch {
      /* status */
    }
  };

  return (
    <>
      {isAdminAuthenticated ? (
        <>
          {/* Floating Admin FAB Button - Positioned safely above the AI Chat button */}
          <motion.button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="fixed bottom-[5.75rem] right-6 z-[95] flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/40 bg-slate-950/90 text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.4)] backdrop-blur-xl transition hover:border-violet-300 hover:bg-violet-600/30 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            title="لوحة تحكم المالك (mart33645@gmail.com)"
            aria-label="Toggle Quick Admin Studio"
          >
            <Shield size={22} className="text-violet-300" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          </motion.button>

          {/* Collapsible Quick Admin Panel - Positioned at bottom-[9.5rem] right-6 so it floats safely above both buttons */}
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed bottom-[9.5rem] right-6 z-[105] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-violet-400/30 bg-slate-950/95 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">لوحة التحكم السريعة</p>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">mart33645</span>
                    </div>
                    <p className="mt-1 text-xs text-white/58">
                      أدوات تظهر لك فقط؛ الزوار لا يرونها ولا يتغيّر شكل الموقع لهم.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/12 hover:text-white transition"
                    aria-label="Close Admin Studio"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); onOpenPhotoEditor(); }}
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/6 p-3 pb-10 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/72 text-cyan-200">
                        <ImagePlus size={18} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-white/88">صورة البروفايل</p>
                      <p className="mt-1 text-[11px] text-white/45">تغيير الصورة</p>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(event) => void handleClearPhotoFab(event)}
                      className={deleteFabClass}
                      title="إعادة الصورة الافتراضية"
                      aria-label="حذف صورة البروفايل المرفوعة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); onOpenProjectCreator(); }}
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/6 p-3 pb-10 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/72 text-cyan-200">
                        <FolderPlus size={18} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-white/88">مشروع جديد</p>
                      <p className="mt-1 text-[11px] text-white/45">إضافة للمعارض</p>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleOpenProjectDelete}
                      className={deleteFabClass}
                      title="حذف مشروع"
                      aria-label="حذف مشروع من المعرض"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); onOpenCertificateCreator(); }}
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/6 p-3 pb-10 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/72 text-cyan-200">
                        <Trophy size={18} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-white/88">شهادة</p>
                      <p className="mt-1 text-[11px] text-white/45">إضافة شهادة</p>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleOpenCertificateDelete}
                      className={deleteFabClass}
                      title="حذف شهادة"
                      aria-label="حذف شهادة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); onOpenContactEditor(); }}
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/6 p-3 pb-10 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/72 text-cyan-200">
                        <MessageSquare size={18} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-white/88">التواصل</p>
                      <p className="mt-1 text-[11px] text-white/45">بريد، هاتف، نص القسم</p>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(event) => void handleClearContactFab(event)}
                      className={deleteFabClass}
                      title="مسح حقول التواصل السريعة"
                      aria-label="مسح بيانات التواصل السريعة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="col-span-2 relative">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); onOpenVault(); }}
                      className="w-full rounded-[1.3rem] border border-cyan-400/20 bg-cyan-400/10 p-3 text-left transition hover:bg-cyan-400/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-slate-950/72 text-cyan-200">
                          <Lock size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white/88">Security Vault</p>
                          <p className="text-[11px] text-cyan-200/50">Level 5 Protected</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] uppercase font-bold text-cyan-300">Open</span>
                    </button>
                  </div>
                </div>

                <a
                  href="/admin"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.3rem] border border-violet-300/25 bg-violet-500/15 py-3 text-xs uppercase tracking-[0.2em] text-violet-100 transition hover:bg-violet-500/25"
                >
                  <ExternalLink size={14} />
                  لوحة تحكم كاملة
                </a>

                <button
                  type="button"
                  onClick={() => { setPanelOpen(false); onLogout(); }}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[1.3rem] border border-white/10 bg-white/6 py-2.5 text-xs uppercase tracking-[0.2em] text-white/72 transition hover:border-rose-300/25 hover:bg-rose-500/15 hover:text-rose-100"
                >
                  <LogOut size={15} />
                  إنهاء الجلسة
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : null}

      <AnimatePresence>
        {adminPromptOpen ? (
          <ModalShell
            eyebrow="Hidden Admin Access"
            title={isAdminAuthenticated ? "Admin mode is active" : "Unlock admin mode"}
            description="وصول خاص بك فقط. استخدم نفس المفتاح PORTFOLIO_ADMIN_TOKEN. افتح اللوحة بـ Ctrl+Shift+A أو نقرتين على اسمك في الهيدر/الفوتر، أو من الصفحة /admin."
            icon={Lock}
            onClose={onCloseAdminPrompt}
          >
            <form onSubmit={handleVerifySubmit} className="grid gap-4">
              <label className="input-shell">
                <span>Admin key</span>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(event) => onAdminTokenChange(event.target.value)}
                  placeholder="Enter your private admin key"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/66">
                After the key is verified, edit controls become visible only in your current session and stay hidden from normal visitors.
              </div>

              <label className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                <input
                  type="checkbox"
                  checked={rememberAdmin}
                  onChange={(event) => onRememberAdminChange(event.target.checked)}
                  className="h-4 w-4 accent-cyan-300"
                />
                <span>Remember on this browser only</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p
                  className={`text-sm ${
                    status.state === "success"
                      ? "text-emerald-300"
                      : status.state === "error"
                        ? "text-rose-300"
                        : "text-white/52"
                  }`}
                >
                  {status.message || "Admin tools stay invisible until you unlock them."}
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? "Checking..." : isAdminAuthenticated ? "Refresh Access" : "Unlock Admin Mode"}
                </button>
              </div>
            </form>
          </ModalShell>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeTool ? (
          <ModalShell
            eyebrow={activeMeta?.label || "Editor"}
            title={mode === "edit" ? activeMeta?.editTitle || "Edit" : activeMeta?.createTitle || "Create"}
            description={activeMeta?.description || "Update the portfolio content from this editor."}
            icon={ActiveIcon}
            onClose={onCloseEditor}
          >
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
                    Choose PNG, JPG, or WEBP. A square or portrait image will fit the avatar badge best.
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-white/48">{photoFile ? photoFile.name : "Select a file to replace the avatar."}</p>
                    <button
                      type="submit"
                      disabled={busy || !photoFile || !isAdminAuthenticated}
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
                    placeholder="What this certificate covered and why it matters..."
                    required
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p
                    className={`text-sm ${
                      status.state === "success"
                        ? "text-emerald-300"
                        : status.state === "error"
                          ? "text-rose-300"
                          : "text-white/52"
                    }`}
                  >
                    {status.message || "Certificates update the public section immediately after saving."}
                  </p>
                  <button
                    type="submit"
                    disabled={busy || !isAdminAuthenticated}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? "Saving..." : mode === "edit" ? "Save Certificate" : "Add Certificate"}
                  </button>
                </div>
              </form>
            ) : null}

            {activeTool === "contact" ? (
              <form onSubmit={handleContactSubmit} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="input-shell">
                    <span>البريد الإلكتروني</span>
                    <input
                      type="email"
                      value={contactValues.email}
                      onChange={(event) => setContactValues((current) => ({ ...current, email: event.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label className="input-shell">
                    <span>الهاتف</span>
                    <input
                      type="text"
                      value={contactValues.phone}
                      onChange={(event) => setContactValues((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="+20..."
                    />
                  </label>
                  <label className="input-shell md:col-span-2">
                    <span>الموقع (يظهر في الموقع)</span>
                    <input
                      type="text"
                      value={contactValues.location}
                      onChange={(event) => setContactValues((current) => ({ ...current, location: event.target.value }))}
                      placeholder="المدينة، الدولة"
                    />
                  </label>
                </div>

                <label className="input-shell">
                  <span>عنوان قسم التواصل</span>
                  <input
                    type="text"
                    value={contactValues.heading}
                    onChange={(event) => setContactValues((current) => ({ ...current, heading: event.target.value }))}
                    placeholder="عنوان يظهر فوق نموذج التواصل"
                  />
                </label>

                <label className="input-shell">
                  <span>نص تقديمي تحت العنوان</span>
                  <textarea
                    rows={4}
                    value={contactValues.intro}
                    onChange={(event) => setContactValues((current) => ({ ...current, intro: event.target.value }))}
                    placeholder="فقرة قصيرة تشرح كيف يمكن التواصل معك"
                  />
                </label>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/64">
                  روابط التواصل السريعة داخل البطاقة (مثل البريد المباشر) تُعدّل من{" "}
                  <a href="/admin" className="text-cyan-200 underline-offset-2 hover:underline">
                    لوحة التحكم الكاملة
                  </a>
                  {` `}لتجنّب حذف بيانات عن طريق الخطأ من هنا.
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p
                    className={`text-sm ${
                      status.state === "success"
                        ? "text-emerald-300"
                        : status.state === "error"
                          ? "text-rose-300"
                          : "text-white/52"
                    }`}
                  >
                    {status.message || "يُحفظ الملف كاملاً؛ المشاريع والشهادات تبقى كما هي."}
                  </p>
                  <button
                    type="submit"
                    disabled={busy || !isAdminAuthenticated}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? "جاري الحفظ..." : "حفظ بيانات التواصل"}
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
                      placeholder="Optional external image URL"
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
                      placeholder="Automation, Realtime, AI-first"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="input-shell">
                    <span>Challenge</span>
                    <textarea
                      rows={4}
                      value={projectValues.challenge}
                      onChange={(event) => setProjectValues((current) => ({ ...current, challenge: event.target.value }))}
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
                      placeholder="How did you implement the solution?"
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
                    placeholder="Portfolio-ready, scalable foundation, AI integration"
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
                      onChange={(event) => setProjectValues((current) => ({ ...current, caseStudy: event.target.value }))}
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p
                    className={`text-sm ${
                      status.state === "success"
                        ? "text-emerald-300"
                        : status.state === "error"
                          ? "text-rose-300"
                          : "text-white/52"
                    }`}
                  >
                    {status.message || "Use commas to separate stack items, metrics, and impact points."}
                  </p>
                  <button
                    type="submit"
                    disabled={busy || !isAdminAuthenticated}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? "Saving..." : mode === "edit" ? "Save Project" : "Add Project"}
                  </button>
                </div>
              </form>
            ) : null}

            {activeTool === "vault" ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <Shield className="text-cyan-400" size={24} />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Advanced Encryption Active</h4>
                    <p className="text-xs text-white/50">AES-256-CBC protocol is shielding visitor data stored on disk.</p>
                  </div>
                  {vaultData.encryptionActive ? (
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] uppercase font-bold text-emerald-400">Secure</span>
                  ) : (
                    <span className="ml-auto rounded-full bg-rose-500/20 px-3 py-1 text-[10px] uppercase font-bold text-rose-400">Key Missing</span>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
                      <MessageSquare size={14} /> Visitor Submissions
                    </h4>
                    <div className="h-[400px] overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-4 space-y-4 scrollbar-hide">
                      {vaultData.submissions.length === 0 ? (
                        <p className="py-10 text-center text-sm text-white/20">No data records found.</p>
                      ) : (
                        vaultData.submissions.map((s) => (
                          <div key={s.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-semibold text-cyan-200">{s.name}</p>
                              <span className="text-[10px] text-white/30">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">{s.message}</p>
                            <div className="mt-3 flex gap-2">
                              <span className="text-[9px] uppercase font-bold text-white/30 border border-white/10 rounded px-1.5 py-0.5">{s.email}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
                      <Lock size={14} /> System Audit Logs
                    </h4>
                    <div className="h-[400px] overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3 font-mono text-[10px] text-white/50 scrollbar-hide">
                      <div className="flex gap-3"><span className="text-cyan-400">[SYSTEM]</span><span>Vault access authorized.</span></div>
                      <div className="flex gap-3"><span className="text-cyan-400">[CRYPTO]</span><span>Decryption loop initiated.</span></div>
                      <div className="flex gap-3"><span className="text-violet-400">[AUTH]</span><span>Permission level 5 granted.</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={onCloseEditor} className="rounded-full bg-white/10 px-6 py-2 text-sm text-white hover:bg-white/20 transition">
                    Close Vault
                  </button>
                </div>
              </div>
            ) : null}
          </ModalShell>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {quickDeleteTarget === "project" ? (
          <ModalShell
            eyebrow="حذف"
            title="حذف مشروع"
            description="اختر مشروعاً لإزالته من الموقع. يمكنك استعادة المحتوى لاحقاً من نسخة احتياطية لـ profile.json إن وُجدت."
            icon={Trash2}
            onClose={() => {
              if (!busy) {
                setQuickDeleteTarget(null);
              }
            }}
          >
            <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1">
              {projectsList.length > 0 ? (
                projectsList.map((p) => (
                  <div
                    key={p.slug}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/68 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{p.title}</p>
                      <p className="mt-1 truncate text-xs text-white/45">{p.slug}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void confirmDeleteProjectRow(p.slug, p.title)}
                      className="shrink-0 rounded-full border border-rose-300/28 bg-rose-500/14 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/22 disabled:opacity-40"
                    >
                      حذف
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.25rem] border border-dashed border-white/14 bg-white/5 px-4 py-6 text-sm leading-6 text-white/55">
                  لا توجد مشاريع محفوظة للحذف. أضف مشروعاً أولاً من البطاقة المجاورة.
                </p>
              )}
            </div>
          </ModalShell>
        ) : null}
        {quickDeleteTarget === "certificate" ? (
          <ModalShell
            eyebrow="حذف"
            title="حذف شهادة"
            description="اختر شهادة لإزالتها من قسم الشهادات في الموقع."
            icon={Trash2}
            onClose={() => {
              if (!busy) {
                setQuickDeleteTarget(null);
              }
            }}
          >
            <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1">
              {certificatesList.length > 0 ? (
                certificatesList.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/68 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{c.title}</p>
                      <p className="mt-1 truncate text-xs text-white/45">{c.issuer}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void confirmDeleteCertificateRow(c.id, c.title)}
                      className="shrink-0 rounded-full border border-rose-300/28 bg-rose-500/14 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/22 disabled:opacity-40"
                    >
                      حذف
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.25rem] border border-dashed border-white/14 bg-white/5 px-4 py-6 text-sm leading-6 text-white/55">
                  لا توجد شهادات للحذف.
                </p>
              )}
            </div>
          </ModalShell>
        ) : null}
      </AnimatePresence>
    </>
  );
}
