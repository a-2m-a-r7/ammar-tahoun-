import { startTransition, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FolderPlus,
  Globe,
  Layers3,
  LogOut,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";
import {
  createCertificateForm,
  createProjectForm,
  explainAdminVerifyFailure,
  guessImageMimeType,
  readFileAsDataUrl,
  splitCommaValues
} from "./admin-utils";

const adminTabs = [
  { id: "overview", icon: Shield },
  { id: "profile", icon: UserRound },
  { id: "expertise", icon: Sparkles },
  { id: "projects", icon: Briefcase },
  { id: "certificates", icon: Trophy },
  { id: "extras", icon: Layers3 },
  { id: "vault", icon: Shield }
];

const adminCopy = {
  en: {
    langLabel: "AR",
    tabs: {
      overview: "Overview",
      profile: "Profile",
      expertise: "Expertise",
      projects: "Projects",
      certificates: "Certificates",
      extras: "Extras",
      vault: "Security Vault"
    },
    login: {
      kicker: "Private access",
      title: "Dedicated admin page for your portfolio, content updates, and private controls.",
      description:
        "This control center is separate from the public website. After you unlock it with your private admin key, you can update profile details, upload a new image, manage projects, and add certificates from one clean dashboard.",
      back: "Back to portfolio",
      openSite: "Open public site",
      signIn: "Admin sign in",
      unlock: "Unlock dashboard",
      secretHint: "Use the same secret stored in PORTFOLIO_ADMIN_TOKEN.",
      adminKey: "Admin key",
      adminKeyPlaceholder: "Enter your private admin key",
      remember: "Remember on this browser only",
      security:
        "Admin access now uses a private server session with an HttpOnly cookie, strict same-site policy, trusted-request checks, and rate-limited login attempts. Your public portfolio stays separate and clean.",
      apiStatus: "API Status",
      healthy: "Healthy",
      checkServer: "Check Server",
      draftRecovery: "Draft Recovery",
      draftReady: "Ready",
      draftReadyDescription: "Your local draft cache will protect unsaved edits while you work.",
      checking: "Checking...",
      unlockAction: "Unlock Admin"
    },
    common: {
      resetDraft: "Reset Draft",
      saveChanges: "Save Changes",
      saving: "Saving...",
      editing: "Editing",
      unsaved: "You have unsaved changes",
      synced: "Draft matches the saved profile",
      projects: "Projects",
      certificates: "Certificates",
      socialLinks: "Social Links",
      spotlightTech: "Spotlight Tech",
      role: "Role",
      availability: "Availability",
      email: "Email",
      location: "Location",
      uploadPhoto: "Upload Photo",
      uploading: "Uploading...",
      useDefaultAvatar: "Use Default Avatar",
      resetting: "Resetting...",
      add: "Add",
      create: "Create",
      delete: "Delete",
      logout: "Logout",
      lock: "Lock",
      authenticated: "Authenticated",
      locked: "Locked",
      configured: "Configured",
      localOnly: "Local Only",
      healthy: "Healthy",
      needsAttention: "Needs Attention",
      notSetYet: "Not set yet",
      noNewImage: "No new image selected yet.",
      recoveredDraft: "Recovered local draft",
      portfolioOwner: "Portfolio owner"
    },
    overview: {
      controlCenter: "Control Center",
      everythingManaged: "Everything is now managed from one dedicated admin page.",
      everythingManagedDescription:
        "Use the sidebar tabs to edit your public content, upload your image, publish projects, and add certificates without touching the code.",
      downloadBackup: "Download Backup",
      readinessTitle: (score) => `Portfolio readiness: ${score}%`,
      readinessDescription: "A practical score based on the parts recruiters and clients usually expect to see.",
      nextImprovements: "next improvements",
      suggested: "Suggested Upgrades",
      suggestedTitle: "High-impact next steps",
      suggestedDescription:
        "These suggestions are generated from your current content so you know exactly what will improve the portfolio fastest.",
      strongState:
        "Your portfolio is in a strong state. The next gains will likely come from stronger project links, case studies, and real testimonials.",
      runtime: "System Health",
      runtimeTitle: "Runtime checks and editor safety",
      runtimeDescription: "Quick visibility into the private admin environment before you publish changes.",
      lastDraft: "Last Local Draft Save",
      currentSession: "Current Session",
      publicDomain: "Public Domain",
      apiStatusDetail: "Server and API are responding normally.",
      draftDetail: "Unsaved edits are cached locally in this browser while you work.",
      sessionDetail: "Protected by a server session, strict same-site cookie policy, and request validation.",
      domainDetail: "Add your domain in the profile tab when you are ready to publish.",
      quickActions: "Quick Actions",
      quickActionsTitle: "Shortcuts for the things you use most",
      quickActionsDescription:
        "These actions are meant to reduce friction while you are reviewing or preparing the site for launch.",
      openPublicSite: "Open Public Site",
      copyPublicUrl: "Copy Public URL",
      copyAdminUrl: "Copy Admin URL",
      copyEmail: "Copy Email",
      goToProjects: "Go To Projects",
      profileContent: "Profile content",
      profileContentBody: "Update hero text, about section, contact details, stats, highlights, and social links.",
      projectsManager: "Projects manager",
      projectsManagerBody: "Add, edit, or remove projects with descriptions, stacks, links, and visuals.",
      certificatesManager: "Certificates manager",
      certificatesManagerBody: "Publish your learning milestones and keep them organized in one place.",
      liveProfile: "Live profile",
      liveProfileDescription: "Quick snapshot of the currently published identity and contact data."
    },
    sidebar: {
      privateRoute: "Private route",
      privateRouteDescription: "You are inside /admin. Visitors will not see these editing tools on the public site.",
      activePanel: "Active panel",
      securityLayer:
        "Security layer: session cookie, strict same-site policy, trusted-request checks, login rate limits, and server-side session expiry.",
      securityAccess: "Security Access",
      securityAccessTitle: "Admin key control",
      rememberSession: "Remember this admin session on this browser",
      refreshAccess: "Refresh Access",
      siteUrlHint:
        "Leave the site URL empty in the profile tab if you want the public website to use the real domain automatically after deployment."
    },
    profile: {
      toolbarTitle: "Core identity, hero copy, contact details, and profile image.",
      toolbarDescription:
        "These sections affect the public page immediately after you save the profile or upload a new image.",
      profileImage: "Profile Image",
      updateAvatar: "Update your public avatar",
      updateAvatarDescription: "Choose a square or portrait photo for the best result in the about section.",
      newImage: "New image",
      identity: "Site + Personal",
      identityTitle: "Identity and hero section",
      identityDescription: "These fields control the name, role, subtitle, hero summary, and other profile basics.",
      siteTitle: "Site Title",
      siteUrl: "Site URL",
      siteDescription: "Site Description",
      publicName: "Public Name",
      legalName: "Legal Name",
      nativeName: "Native Name",
      role: "Role",
      tagline: "Tagline",
      availability: "Availability",
      location: "Location",
      timezone: "Timezone",
      resumeUrl: "Resume URL",
      email: "Email",
      phone: "Phone",
      heroSummary: "Hero Summary",
      about: "Story",
      aboutTitle: "About section and profile framing",
      aboutDescription:
        "Use these fields to shape your intro, the longer about section, and the lines that appear in supporting content.",
      aboutIntro: "About Intro",
      aboutBody: "About Body",
      highlights: "Highlights",
      principles: "Principles",
      contactLinks: "Contact Direct Links",
      contactLinksDescription: "These appear in the contact card as quick ways to reach you.",
      contactText: "Contact section text",
      contactTextDescription: "This text appears above the contact form on the public portfolio.",
      contactHeading: "Contact Heading",
      contactIntro: "Contact Intro"
    },
    expertise: {
      toolbarTitle: "Technologies, services, process, and growth narrative.",
      toolbarDescription:
        "This tab is where you shape the core expertise and capability story visitors will read.",
      spotlight: "Spotlight Technologies",
      spotlightDescription: "Each card appears in the premium tech grid on the public site.",
      services: "Services",
      servicesDescription: "Service cards that describe what you offer.",
      skillGroups: "Skill Groups",
      skillGroupsDescription: "Grouped skills shown in the skills section.",
      process: "Process",
      processDescription: "Process steps used in your workflow section.",
      experience: "Experience",
      experienceDescription: "Education, timeline entries, and growth milestones."
    },
    projects: {
      section: "Projects",
      title: "Create, edit, and remove portfolio projects.",
      description: "Projects save independently, so you can publish them without touching the rest of the profile.",
      newProject: "New Project",
      totalProjects: "total projects",
      list: "Project List",
      listTitle: "Current portfolio projects",
      listDescription: "Choose a project to edit it, or create a new one.",
      none: "No projects have been added yet. Create the first one from the button above.",
      editing: "Editing",
      creating: "Creating",
      editor: "Project editor",
      createNew: "Create a new project",
      editorDescription: "Fill out the details below to keep your project cards and modal content fully updated.",
      deleteProject: "Delete Project",
      deleting: "Deleting...",
      projectTitle: "Project Title",
      slug: "Slug",
      category: "Category",
      year: "Year",
      artwork: "Project Artwork",
      imagePath: "Internal Image Path",
      useDefaultArtwork: "Use Default Artwork",
      removeSelectedFile: "Remove Selected File",
      summary: "Summary",
      stack: "Stack",
      metrics: "Metrics",
      challenge: "Challenge",
      solution: "Solution",
      impactPoints: "Impact Points",
      liveUrl: "Live URL",
      repoUrl: "Repo URL",
      caseStudyUrl: "Case Study URL",
      saveProject: "Save Project",
      createProject: "Create Project",
      selectedFile: "Selected file:",
      usingInternalImage: "Using an internal image path.",
      usingDefaultArtwork: "Using the smart category default artwork.",
      uploadCover: "Upload a project cover",
      uploadCoverDescription:
        "PNG, JPG, or WEBP. The file will be stored locally and used everywhere the project appears.",
      artworkHint:
        "For the strongest performance and security, use the upload button or a local path like /assets/.... External image URLs are intentionally not used in production mode.",
      commasHint: "Use commas to separate stack items, metrics, and impact points."
    },
    certificates: {
      section: "Certificates",
      title: "Manage learning milestones and credentials.",
      description: "Publish certificates from one place and keep the public learning section updated.",
      newCertificate: "New Certificate",
      totalCertificates: "total certificates",
      list: "Certificate List",
      listTitle: "Current certificates",
      listDescription: "Choose a certificate to edit it, or create a new one.",
      none: "No certificates have been added yet.",
      editor: "Certificate editor",
      createNew: "Create a new certificate",
      editorDescription: "Add title, issuer, year, summary, and an optional public credential link.",
      deleteCertificate: "Delete Certificate",
      titleLabel: "Title",
      issuer: "Issuer",
      yearStatus: "Year / Status",
      credentialUrl: "Credential URL",
      summary: "Summary",
      saveCertificate: "Save Certificate",
      createCertificate: "Create Certificate",
      saveHint: "Certificates update the public learning section as soon as they are saved."
    },
    extras: {
      toolbarTitle: "Testimonials, insights, and FAQ content.",
      toolbarDescription:
        "These sections help polish the public site and make it feel complete when you are ready to use them.",
      testimonials: "Testimonials",
      testimonialsDescription: "Use real quotes here when you start receiving feedback from clients or teammates.",
      insights: "Insights",
      insightsDescription: "Short articles, writing ideas, or product thoughts shown on the public portfolio.",
      faqs: "FAQs",
      faqsDescription: "Questions and answers shown near the end of the public site."
    },
    collection: {
      collection: "Collection",
      item: "Item",
      remove: "Remove",
      emptyStats: "No stats added yet. Create short public stats like years, projects, focus, or response time.",
      emptySocials: "No social links added yet.",
      emptyContactLinks: "No direct contact links added yet.",
      emptyTech: "No spotlight technologies added yet.",
      emptyServices: "No services added yet.",
      emptySkillGroups: "No skill groups added yet.",
      emptyProcess: "No process steps added yet.",
      emptyExperience: "No experience entries added yet.",
      emptyTestimonials: "No testimonials added yet.",
      emptyInsights: "No insights added yet.",
      emptyFaqs: "No FAQ entries added yet.",
      vaultTitle: "Intelligence & Security Vault",
      vaultDescription: "Access encrypted visitor records and monitor the portfolio's active security layers.",
      encryptionActive: "AES-256 Handshake Active",
      encryptionInactive: "Security Key Missing",
      submissions: "Visitor Stream",
      auditLog: "Audit Log (Level 5)"
    }
  },
  ar: {
    langLabel: "EN",
    tabs: {
      overview: "نظرة عامة",
      profile: "الملف الشخصي",
      expertise: "الخبرات",
      projects: "المشاريع",
      certificates: "الشهادات",
      extras: "إضافات",
      vault: "خزنة الأمان"
    },
    login: {
      kicker: "دخول خاص",
      title: "صفحة إدارة خاصة لبورتوفوليوك وتحديث المحتوى والتحكمات الخاصة.",
      description:
        "لوحة التحكم هذه منفصلة عن الموقع العام. بعد فتحها بالمفتاح السري يمكنك تعديل بياناتك ورفع صورتك وإدارة المشاريع وإضافة الشهادات من مكان واحد.",
      back: "العودة للبورتوفوليو",
      openSite: "فتح الموقع العام",
      signIn: "تسجيل دخول الإدارة",
      unlock: "فتح لوحة التحكم",
      secretHint: "استخدم نفس المفتاح السري الموجود في PORTFOLIO_ADMIN_TOKEN.",
      adminKey: "المفتاح السري",
      adminKeyPlaceholder: "اكتب المفتاح السري للإدارة",
      remember: "تذكرني على هذا المتصفح فقط",
      security:
        "وصول الإدارة يستخدم جلسة آمنة على السيرفر مع HttpOnly cookie وسياسة SameSite صارمة والتحقق من الطلبات ومعدل محاولات دخول محدود. الموقع العام يبقى نظيفًا ومنفصلًا.",
      apiStatus: "حالة الـ API",
      healthy: "سليم",
      checkServer: "افحص السيرفر",
      draftRecovery: "استرجاع المسودة",
      draftReady: "جاهز",
      draftReadyDescription: "سيتم حفظ تعديلاتك المحلية مؤقتًا في هذا المتصفح أثناء العمل.",
      checking: "جارٍ التحقق...",
      unlockAction: "فتح الإدارة"
    },
    common: {
      resetDraft: "إعادة المسودة",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ...",
      editing: "تحرير",
      unsaved: "لديك تغييرات غير محفوظة",
      synced: "المسودة مطابقة للبيانات المحفوظة",
      projects: "المشاريع",
      certificates: "الشهادات",
      socialLinks: "روابط التواصل",
      spotlightTech: "التقنيات البارزة",
      role: "الدور",
      availability: "الحالة",
      email: "البريد",
      location: "الموقع",
      uploadPhoto: "رفع الصورة",
      uploading: "جارٍ الرفع...",
      useDefaultAvatar: "استخدام الصورة الافتراضية",
      resetting: "جارٍ الإرجاع...",
      add: "إضافة",
      create: "إنشاء",
      delete: "حذف",
      logout: "تسجيل الخروج",
      lock: "قفل",
      authenticated: "مفعلة",
      locked: "مقفلة",
      configured: "مضاف",
      localOnly: "محلي فقط",
      healthy: "سليم",
      needsAttention: "يحتاج مراجعة",
      notSetYet: "غير مضاف بعد",
      noNewImage: "لم يتم اختيار صورة جديدة بعد.",
      recoveredDraft: "تم استرجاع مسودة محلية",
      portfolioOwner: "صاحب البورتوفوليو"
    },
    overview: {
      controlCenter: "مركز التحكم",
      everythingManaged: "كل شيء الآن يُدار من صفحة إدارة واحدة مخصصة.",
      everythingManagedDescription:
        "استخدم تبويبات الجانب لتعديل المحتوى العام ورفع صورتك ونشر مشاريعك وإضافة الشهادات بدون لمس الكود.",
      downloadBackup: "تحميل نسخة احتياطية",
      readinessTitle: (score) => `جاهزية البورتوفوليو: ${score}%`,
      readinessDescription: "مؤشر عملي مبني على أهم الأشياء التي يتوقعها العملاء والـ recruiters.",
      nextImprovements: "تحسينات قادمة",
      suggested: "اقتراحات",
      suggestedTitle: "أقوى الخطوات التالية",
      suggestedDescription: "هذه الاقتراحات مبنية على بياناتك الحالية حتى تعرف ماذا يحسن الموقع بأسرع شكل.",
      strongState: "البورتوفوليو في حالة جيدة. التحسين القادم الأفضل سيكون عبر روابط أقوى للمشاريع ودراسات حالة وتوصيات حقيقية.",
      runtime: "حالة النظام",
      runtimeTitle: "فحوصات التشغيل وأمان المحرر",
      runtimeDescription: "نظرة سريعة على بيئة الإدارة الخاصة قبل نشر أي تغييرات.",
      lastDraft: "آخر حفظ محلي",
      currentSession: "الجلسة الحالية",
      publicDomain: "الدومين العام",
      apiStatusDetail: "السيرفر والـ API يعملان بشكل طبيعي.",
      draftDetail: "التعديلات غير المحفوظة يتم حفظها محليًا في هذا المتصفح أثناء العمل.",
      sessionDetail: "محمي بجلسة سيرفر وسياسة SameSite صارمة والتحقق من الطلبات.",
      domainDetail: "أضف الدومين من تبويب الملف الشخصي عندما تصبح جاهزًا للنشر.",
      quickActions: "اختصارات",
      quickActionsTitle: "اختصارات للأشياء التي تستخدمها كثيرًا",
      quickActionsDescription: "هذه الاختصارات تقلل الوقت أثناء المراجعة أو التجهيز للنشر.",
      openPublicSite: "فتح الموقع العام",
      copyPublicUrl: "نسخ رابط الموقع",
      copyAdminUrl: "نسخ رابط الإدارة",
      copyEmail: "نسخ البريد",
      goToProjects: "الذهاب للمشاريع",
      profileContent: "محتوى الملف",
      profileContentBody: "عدّل نص الهيرو والنبذة وبيانات التواصل والإحصائيات والروابط.",
      projectsManager: "إدارة المشاريع",
      projectsManagerBody: "أضف أو عدّل أو احذف المشاريع مع الوصف والتقنيات والروابط والصور.",
      certificatesManager: "إدارة الشهادات",
      certificatesManagerBody: "انشر شهاداتك التعليمية ونظمها من مكان واحد.",
      liveProfile: "الملف الحالي",
      liveProfileDescription: "ملخص سريع للهوية وبيانات التواصل المنشورة حاليًا."
    },
    sidebar: {
      privateRoute: "مسار خاص",
      privateRouteDescription: "أنت الآن داخل /admin. الزوار لن يشاهدوا أدوات التعديل هذه في الموقع العام.",
      activePanel: "التبويب الحالي",
      securityLayer:
        "طبقة الأمان: session cookie وسياسة same-site صارمة والتحقق من الطلبات وتحديد معدل محاولات الدخول وانتهاء صلاحية الجلسة على السيرفر.",
      securityAccess: "الوصول الأمني",
      securityAccessTitle: "التحكم في مفتاح الإدارة",
      rememberSession: "تذكر جلسة الإدارة على هذا المتصفح",
      refreshAccess: "تجديد الوصول",
      siteUrlHint: "اترك رابط الموقع فارغًا إذا كنت تريد أن يستخدم الموقع الدومين الحقيقي تلقائيًا بعد النشر."
    },
    profile: {
      toolbarTitle: "الهوية الأساسية ونصوص الهيرو والتواصل والصورة الشخصية.",
      toolbarDescription: "هذه الأجزاء تؤثر مباشرة على الصفحة العامة بعد الحفظ أو رفع صورة جديدة.",
      profileImage: "الصورة الشخصية",
      updateAvatar: "تحديث صورتك العامة",
      updateAvatarDescription: "اختر صورة مربعة أو عمودية للحصول على أفضل شكل داخل قسم النبذة.",
      newImage: "صورة جديدة",
      identity: "الموقع + البيانات الشخصية",
      identityTitle: "الهوية وقسم الهيرو",
      identityDescription: "هذه الحقول تتحكم في الاسم والدور والنص المختصر والوصف الرئيسي وباقي أساسيات الملف.",
      siteTitle: "عنوان الموقع",
      siteUrl: "رابط الموقع",
      siteDescription: "وصف الموقع",
      publicName: "الاسم العام",
      legalName: "الاسم الكامل",
      nativeName: "الاسم الأصلي",
      role: "المسمى",
      tagline: "السطر المختصر",
      availability: "الحالة",
      location: "الموقع",
      timezone: "المنطقة الزمنية",
      resumeUrl: "رابط الـ CV",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      heroSummary: "وصف الهيرو",
      about: "النبذة",
      aboutTitle: "قسم النبذة وطريقة تقديمك",
      aboutDescription: "استخدم هذه الحقول لتشكيل المقدمة والنبذة الأطول والأسطر التي تظهر في الأقسام المساندة.",
      aboutIntro: "مقدمة النبذة",
      aboutBody: "النبذة الكاملة",
      highlights: "النقاط البارزة",
      principles: "المبادئ",
      contactLinks: "روابط التواصل المباشر",
      contactLinksDescription: "هذه الروابط تظهر داخل بطاقة التواصل كوسائل سريعة للوصول إليك.",
      contactText: "نص قسم التواصل",
      contactTextDescription: "هذا النص يظهر أعلى نموذج التواصل في الموقع العام.",
      contactHeading: "عنوان التواصل",
      contactIntro: "مقدمة التواصل"
    },
    expertise: {
      toolbarTitle: "التقنيات والخدمات وطريقة العمل ومسار النمو.",
      toolbarDescription: "هذا التبويب هو المكان الذي تشكل فيه قصة خبرتك والقدرات التي يراها الزائر.",
      spotlight: "التقنيات البارزة",
      spotlightDescription: "كل بطاقة هنا تظهر في شبكة التقنيات المميزة في الموقع العام.",
      services: "الخدمات",
      servicesDescription: "بطاقات الخدمات التي تشرح ما الذي تقدمه.",
      skillGroups: "مجموعات المهارات",
      skillGroupsDescription: "مهارات مجمعة تظهر في قسم المهارات.",
      process: "خطوات العمل",
      processDescription: "الخطوات التي تظهر في قسم workflow.",
      experience: "الخبرات",
      experienceDescription: "التعليم والمراحل الزمنية ومحطات النمو."
    },
    projects: {
      section: "المشاريع",
      title: "إنشاء وتعديل وحذف مشاريع البورتوفوليو.",
      description: "يتم حفظ المشاريع بشكل مستقل حتى تستطيع نشرها بدون تعديل بقية الملف.",
      newProject: "مشروع جديد",
      totalProjects: "إجمالي المشاريع",
      list: "قائمة المشاريع",
      listTitle: "مشاريع البورتوفوليو الحالية",
      listDescription: "اختر مشروعًا لتعديله أو أنشئ مشروعًا جديدًا.",
      none: "لا توجد مشاريع حتى الآن. أنشئ أول مشروع من الزر بالأعلى.",
      editing: "تعديل",
      creating: "إنشاء",
      editor: "محرر المشروع",
      createNew: "إنشاء مشروع جديد",
      editorDescription: "املأ التفاصيل التالية حتى تبقى بطاقات المشاريع والمودال محدثة بالكامل.",
      deleteProject: "حذف المشروع",
      deleting: "جارٍ الحذف...",
      projectTitle: "اسم المشروع",
      slug: "المعرف slug",
      category: "التصنيف",
      year: "السنة",
      artwork: "صورة المشروع",
      imagePath: "مسار الصورة الداخلي",
      useDefaultArtwork: "استخدام الصورة الافتراضية",
      removeSelectedFile: "إزالة الملف المختار",
      summary: "الوصف",
      stack: "التقنيات",
      metrics: "المميزات",
      challenge: "التحدي",
      solution: "الحل",
      impactPoints: "نقاط التأثير",
      liveUrl: "رابط المعاينة",
      repoUrl: "رابط المستودع",
      caseStudyUrl: "رابط دراسة الحالة",
      saveProject: "حفظ المشروع",
      createProject: "إنشاء المشروع",
      selectedFile: "الملف المختار:",
      usingInternalImage: "يتم استخدام مسار صورة داخلي.",
      usingDefaultArtwork: "يتم استخدام الصورة الافتراضية الذكية حسب التصنيف.",
      uploadCover: "رفع غلاف للمشروع",
      uploadCoverDescription: "PNG أو JPG أو WEBP. سيتم حفظ الملف محليًا واستخدامه في كل مكان يظهر فيه المشروع.",
      artworkHint: "لأفضل أداء وأمان استخدم الرفع المباشر أو مسارًا محليًا مثل /assets/.... الروابط الخارجية للصور غير مستخدمة في وضع الإنتاج.",
      commasHint: "استخدم الفواصل للفصل بين عناصر التقنيات والميزات ونقاط التأثير."
    },
    certificates: {
      section: "الشهادات",
      title: "إدارة الشهادات والمحطات التعليمية.",
      description: "انشر شهاداتك من مكان واحد وحافظ على قسم التعلم محدثًا.",
      newCertificate: "شهادة جديدة",
      totalCertificates: "إجمالي الشهادات",
      list: "قائمة الشهادات",
      listTitle: "الشهادات الحالية",
      listDescription: "اختر شهادة لتعديلها أو أنشئ شهادة جديدة.",
      none: "لا توجد شهادات مضافة حتى الآن.",
      editor: "محرر الشهادة",
      createNew: "إنشاء شهادة جديدة",
      editorDescription: "أضف الاسم والجهة والسنة والوصف ورابط التحقق إن وجد.",
      deleteCertificate: "حذف الشهادة",
      titleLabel: "العنوان",
      issuer: "الجهة",
      yearStatus: "السنة / الحالة",
      credentialUrl: "رابط التحقق",
      summary: "الوصف",
      saveCertificate: "حفظ الشهادة",
      createCertificate: "إنشاء الشهادة",
      saveHint: "يتم تحديث قسم الشهادات في الموقع العام فور الحفظ."
    },
    extras: {
      toolbarTitle: "التوصيات والمقالات القصيرة والأسئلة الشائعة.",
      toolbarDescription: "هذه الأقسام تضيف لمسة احترافية للموقع عندما تصبح جاهزًا لاستخدامها.",
      testimonials: "التوصيات",
      testimonialsDescription: "استخدم هنا آراء حقيقية عندما تبدأ في الحصول على feedback من عملاء أو زملاء.",
      insights: "الأفكار والمقالات",
      insightsDescription: "مقالات قصيرة أو أفكار أو ملاحظات تظهر في الموقع العام.",
      faqs: "الأسئلة الشائعة",
      faqsDescription: "أسئلة وأجوبة تظهر قرب نهاية الموقع العام."
    },
    collection: {
      collection: "مجموعة",
      item: "عنصر",
      remove: "حذف",
      emptyStats: "لا توجد إحصائيات بعد. أضف أرقامًا قصيرة مثل سنوات الخبرة أو عدد المشاريع أو مجال التركيز.",
      emptySocials: "لا توجد روابط تواصل بعد.",
      emptyContactLinks: "لا توجد روابط تواصل مباشرة بعد.",
      emptyTech: "لا توجد تقنيات بارزة بعد.",
      emptyServices: "لا توجد خدمات بعد.",
      emptySkillGroups: "لا توجد مجموعات مهارات بعد.",
      emptyProcess: "لا توجد خطوات عمل بعد.",
      emptyExperience: "لا توجد خبرات مضافة بعد.",
      emptyTestimonials: "لا توجد توصيات بعد.",
      emptyInsights: "لا توجد مقالات بعد.",
      emptyFaqs: "لا توجد أسئلة شائعة بعد.",
      vaultTitle: "خزنة الأمان والذكاء",
      vaultDescription: "الوصول إلى سجلات الزوار المشفرة ومراقبة طبقات الحماية النشطة.",
      encryptionActive: "تشفير AES-256 مفعل",
      encryptionInactive: "مفتاح الأمان غير موجود",
      submissions: "رسائل الزوار",
      auditLog: "سجل العمليات"
    }
  }
};

const collectionTemplates = {
  socials: { label: "", handle: "", url: "" },
  stats: { value: "", label: "" },
  directLinks: { label: "", value: "", url: "" },
  spotlightTech: { name: "", category: "", summary: "" },
  services: { title: "", summary: "", points: [] },
  skillGroups: { title: "", items: [] },
  process: { step: "", title: "", description: "" },
  experience: { period: "", role: "", company: "", summary: "", points: [] },
  testimonials: { quote: "", name: "", title: "" },
  insights: { title: "", tag: "", summary: "", url: "" },
  faqs: { question: "", answer: "" }
};

const ADMIN_DRAFT_STORAGE_KEY = "portfolio-admin-draft";

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProfileShape(profile) {
  const source = profile || {};

  return {
    site: {
      title: "",
      description: "",
      url: "",
      ...(source.site || {})
    },
    personal: {
      fullName: "",
      legalName: "",
      nativeName: "",
      role: "",
      tagline: "",
      heroSummary: "",
      availability: "",
      location: "",
      timezone: "",
      resumeUrl: "",
      email: "",
      phone: "",
      profileImage: "",
      ...(source.personal || {})
    },
    highlights: ensureArray(source.highlights),
    socials: ensureArray(source.socials),
    stats: ensureArray(source.stats),
    about: {
      intro: "",
      body: "",
      principles: ensureArray(source.about?.principles),
      ...(source.about || {}),
      principles: ensureArray(source.about?.principles)
    },
    spotlightTech: ensureArray(source.spotlightTech).map((item) => ({
      name: "",
      category: "",
      summary: "",
      ...(item || {})
    })),
    services: ensureArray(source.services).map((item) => ({
      title: "",
      summary: "",
      points: ensureArray(item?.points),
      ...(item || {}),
      points: ensureArray(item?.points)
    })),
    skillGroups: ensureArray(source.skillGroups).map((item) => ({
      title: "",
      items: ensureArray(item?.items),
      ...(item || {}),
      items: ensureArray(item?.items)
    })),
    process: ensureArray(source.process).map((item) => ({
      step: "",
      title: "",
      description: "",
      ...(item || {})
    })),
    projects: ensureArray(source.projects).map((item) => ({
      slug: "",
      title: "",
      category: "",
      year: "",
      summary: "",
      image: "",
      stack: ensureArray(item?.stack),
      metrics: ensureArray(item?.metrics),
      details: {
        challenge: "",
        solution: "",
        impact: ensureArray(item?.details?.impact),
        ...(item?.details || {}),
        impact: ensureArray(item?.details?.impact)
      },
      links: {
        live: "",
        repo: "",
        caseStudy: "",
        ...(item?.links || {})
      },
      ...(item || {})
    })),
    experience: ensureArray(source.experience).map((item) => ({
      period: "",
      role: "",
      company: "",
      summary: "",
      points: ensureArray(item?.points),
      ...(item || {}),
      points: ensureArray(item?.points)
    })),
    certificates: ensureArray(source.certificates).map((item) => ({
      id: "",
      title: "",
      issuer: "",
      year: "",
      summary: "",
      credentialUrl: "",
      ...(item || {})
    })),
    testimonials: ensureArray(source.testimonials).map((item) => ({
      quote: "",
      name: "",
      title: "",
      ...(item || {})
    })),
    insights: ensureArray(source.insights).map((item) => ({
      title: "",
      tag: "",
      summary: "",
      url: "",
      ...(item || {})
    })),
    faqs: ensureArray(source.faqs).map((item) => ({
      question: "",
      answer: "",
      ...(item || {})
    })),
    contact: {
      heading: "",
      intro: "",
      directLinks: ensureArray(source.contact?.directLinks),
      ...(source.contact || {}),
      directLinks: ensureArray(source.contact?.directLinks)
    }
  };
}

function toPath(path) {
  return Array.isArray(path) ? path : path.split(".");
}

function getNestedValue(source, path, fallback = "") {
  const keys = toPath(path);
  let cursor = source;

  for (const key of keys) {
    if (cursor == null) {
      return fallback;
    }

    cursor = cursor[key];
  }

  return cursor ?? fallback;
}

function setNestedValue(source, path, value) {
  const keys = toPath(path);
  if (keys.length === 0) {
    return value;
  }

  const root = Array.isArray(source) ? [...source] : { ...(source || {}) };
  let cursor = root;
  let sourceCursor = source || {};

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;

    if (isLast) {
      cursor[key] = value;
      return;
    }

    const currentSourceValue = sourceCursor?.[key];
    const nextValue = Array.isArray(currentSourceValue) ? [...currentSourceValue] : { ...(currentSourceValue || {}) };
    cursor[key] = nextValue;
    cursor = nextValue;
    sourceCursor = currentSourceValue || {};
  });

  return root;
}

function linesToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildProjectPayload(projectValues) {
  return {
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
  };
}

function getProjectArtwork(projectValues) {
  if (projectValues?.image) {
    return projectValues.image;
  }

  const normalizedCategory = `${projectValues?.category || ""}`.toLowerCase();
  if (normalizedCategory.includes("ai")) {
    return "/assets/project-ai.svg";
  }

  if (normalizedCategory.includes("desktop") || normalizedCategory.includes("simulation")) {
    return "/assets/project-command.svg";
  }

  return "/assets/project-commerce.svg";
}

function Field({ label, as = "input", rows = 4, className = "", ...props }) {
  const Component = as;

  return (
    <label className={`input-shell ${className}`}>
      <span>{label}</span>
      <Component rows={as === "textarea" ? rows : undefined} {...props} />
    </label>
  );
}

function LinesField({ label, value, onChange, placeholder, rows = 5, className = "" }) {
  return (
    <Field
      label={label}
      as="textarea"
      rows={rows}
      className={className}
      value={linesToText(value)}
      onChange={(event) => onChange(textToLines(event.target.value))}
      placeholder={placeholder}
    />
  );
}

function StatusMessage({ status, emptyMessage }) {
  if (!status?.message) {
    return <p className="text-sm text-white/48">{emptyMessage || "Changes are saved only when you use the action buttons in this dashboard."}</p>;
  }

  const statusClass =
    status.state === "success"
      ? "text-emerald-300"
      : status.state === "error"
        ? "text-rose-300"
        : "text-cyan-100/80";

  return <p className={`text-sm ${statusClass}`}>{status.message}</p>;
}

function SectionCard({ eyebrow, title, description, action, children }) {
  return (
    <section className="glow-border glass-panel rounded-[2rem] p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow ? <p className="display-meta text-cyan-200/76">{eyebrow}</p> : null}
          <h2 className="display-heading-lg mt-3 text-white">{title}</h2>
          {description ? <p className="mt-3 text-sm leading-7 text-white/64 md:text-base">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CollectionEditor({
  title,
  description,
  items,
  fields,
  onAdd,
  onRemove,
  onFieldChange,
  addLabel,
  itemTitle,
  emptyText,
  collectionLabel = "Collection",
  itemLabel = "Item",
  removeLabel = "Remove"
}) {
  return (
    <SectionCard
      eyebrow={collectionLabel}
      title={title}
      description={description}
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16"
        >
          <FolderPlus size={14} />
          {addLabel}
        </button>
      }
    >
      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article
              key={item.id || item.slug || item.title || item.label || `${title}-${index}`}
              className="rounded-[1.7rem] border border-white/10 bg-slate-950/68 p-4 md:p-5"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{itemTitle(item, index)}</p>
                  <p className="display-meta mt-1 text-white/38">{`${itemLabel} ${index + 1}`}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300/18 bg-rose-300/10 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-rose-200 transition hover:bg-rose-300/16"
                >
                  <Trash2 size={13} />
                  {removeLabel}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => {
                  const fieldValue = getNestedValue(item, field.key, field.type === "list" ? [] : "");
                  const colSpanClass = field.colSpan === 2 ? "md:col-span-2" : "";

                  if (field.type === "textarea") {
                    return (
                      <Field
                        key={field.key}
                        label={field.label}
                        as="textarea"
                        rows={field.rows || 4}
                        className={colSpanClass}
                        value={fieldValue}
                        onChange={(event) => onFieldChange(index, field.key, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    );
                  }

                  if (field.type === "list") {
                    return (
                      <LinesField
                        key={field.key}
                        label={field.label}
                        rows={field.rows || 5}
                        className={colSpanClass}
                        value={fieldValue}
                        onChange={(value) => onFieldChange(index, field.key, value)}
                        placeholder={field.placeholder}
                      />
                    );
                  }

                  return (
                    <Field
                      key={field.key}
                      label={field.label}
                      type={field.type || "text"}
                      className={colSpanClass}
                      value={fieldValue}
                      onChange={(event) => onFieldChange(index, field.key, event.target.value)}
                      placeholder={field.placeholder}
                    />
                  );
                })}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.7rem] border border-dashed border-white/12 bg-slate-950/56 p-6 text-sm leading-7 text-white/62">
            {emptyText}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function AdminLoading({ error }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-6 text-white">
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      <div className="gradient-veil" />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="blob blob-one" />
        <div className="blob blob-two" />
        <div className="blob blob-three" />
      </div>

      <motion.div
        className="glow-border glass-panel relative z-[1] w-full max-w-xl rounded-[2rem] p-8 text-center md:p-10"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          {error ? <AlertTriangle size={24} /> : <Shield size={24} />}
        </div>
        <p className="display-meta mt-6 text-cyan-200/78">Admin Console</p>
        <h1 className="section-title mt-4 text-white">
          {error ? "Unable to load admin data" : "Booting control center"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/64 md:text-base">
          {error || "Loading your portfolio data, management modules, and secure editing tools."}
        </p>
      </motion.div>
    </div>
  );
}

export default function AdminApp() {
  const [adminLanguage, setAdminLanguage] = useState(() => {
    if (typeof window === "undefined") {
      return "ar";
    }

    const storedLanguage = window.localStorage.getItem("portfolio-admin-language");
    if (storedLanguage === "ar" || storedLanguage === "en") {
      return storedLanguage;
    }

    return "ar";
  });
  const [profile, setProfile] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [rememberAdmin, setRememberAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [busyAction, setBusyAction] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [photoFile, setPhotoFile] = useState(null);
  const [projectDraft, setProjectDraft] = useState(createProjectForm());
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [projectMode, setProjectMode] = useState("create");
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [certificateDraft, setCertificateDraft] = useState(createCertificateForm());
  const [certificateMode, setCertificateMode] = useState("create");
  const [selectedCertificateId, setSelectedCertificateId] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [draftRecoveryMessage, setDraftRecoveryMessage] = useState("");
  const [vaultData, setVaultData] = useState({ submissions: [], stats: {}, auditLogs: [] });
  const [vaultPassword, setVaultPassword] = useState("");
  const [decryptedRecords, setDecryptedRecords] = useState({});
  const isArabic = adminLanguage === "ar";
  const copy = adminCopy[adminLanguage];
  const localizedAdminTabs = adminTabs.map((item) => ({ ...item, label: copy.tabs[item.id] }));

  const clearStoredAdminAccess = () => {
    window.sessionStorage.removeItem("portfolio-admin-remember");
    window.localStorage.removeItem("portfolio-admin-remember");
    window.sessionStorage.removeItem("portfolio-admin-token");
    window.localStorage.removeItem("portfolio-admin-token");
  };

  const persistAdminPreference = (shouldRemember) => {
    const currentStorage = shouldRemember ? window.localStorage : window.sessionStorage;
    const otherStorage = shouldRemember ? window.sessionStorage : window.localStorage;

    otherStorage.removeItem("portfolio-admin-remember");
    currentStorage.setItem("portfolio-admin-remember", "true");
  };

  const applyServerProfile = (nextProfile, { mergeDraft } = {}) => {
    startTransition(() => {
      setProfile(nextProfile);
      setDraftProfile((currentDraft) => {
        if (mergeDraft && currentDraft) {
          return mergeDraft(currentDraft, nextProfile);
        }

        return cloneValue(nextProfile);
      });
    });
  };

  const runAdminRequest = async (endpoint, payload, action) => {
    try {
      setBusyAction(action);
      setStatus({ state: "idle", message: "" });

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 503) {
          clearStoredAdminAccess();
          setIsAdminAuthenticated(false);
        }

        throw new Error(result.message || "Unable to complete this admin action right now.");
      }

      setStatus({
        state: "success",
        message: result.message || "Action completed successfully."
      });

      return result.data;
    } catch (requestError) {
      setStatus({
        state: "error",
        message: requestError.message || "Unable to complete this admin action right now."
      });
      throw requestError;
    } finally {
      setBusyAction("");
    }
  };

  const verifyAdminAccess = async (tokenValue, { silent = false, rememberOverride } = {}) => {
    const nextToken = tokenValue.trim();
    const shouldRemember = rememberOverride ?? rememberAdmin;

    if (!nextToken) {
      if (!silent) {
        setStatus({ state: "error", message: "Admin key is required." });
      }

      setIsAdminAuthenticated(false);
      return false;
    }

    try {
      setBusyAction("verify");
      if (!silent) {
        setStatus({ state: "idle", message: "" });
      }

      const response = await fetch("/api/admin/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ adminToken: nextToken, remember: shouldRemember })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(explainAdminVerifyFailure(response, result));
      }

      setIsAdminAuthenticated(true);
      persistAdminPreference(shouldRemember);
      setAdminToken("");

      if (!silent) {
        setStatus({
          state: "success",
          message: result.message || "Admin access granted."
        });
      }

      return true;
    } catch (verifyError) {
      clearStoredAdminAccess();
      setIsAdminAuthenticated(false);

      if (!silent) {
        setStatus({
          state: "error",
          message: verifyError.message || "Unable to verify the admin key."
        });
      }

      return false;
    } finally {
      setBusyAction("");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Unable to load the current portfolio data.");
        }

        const payload = await response.json();
        if (!active) {
          return;
        }

        const normalizedProfile = normalizeProfileShape(payload.data);
        let nextDraft = cloneValue(normalizedProfile);

        try {
          const storedDraft = window.sessionStorage.getItem(ADMIN_DRAFT_STORAGE_KEY);
          if (storedDraft) {
            const parsedDraft = JSON.parse(storedDraft);
            const normalizedStoredDraft = normalizeProfileShape(parsedDraft?.profile);

            if (JSON.stringify(normalizedStoredDraft) !== JSON.stringify(normalizedProfile)) {
              nextDraft = cloneValue(normalizedStoredDraft);
              setDraftRecoveryMessage(
                parsedDraft?.updatedAt
                  ? `Recovered a local draft saved on ${new Date(parsedDraft.updatedAt).toLocaleString()}.`
                  : "Recovered a local draft from this browser."
              );
            } else {
              window.sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY);
            }
          }
        } catch {
          window.sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY);
        }

        setProfile(normalizedProfile);
        setDraftProfile(nextDraft);
      } catch (error) {
        if (error.name !== "AbortError" && active) {
          setLoadError(error.message || "Unable to load the portfolio data.");
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
    window.localStorage.removeItem("portfolio-admin-token");

    const isRemembered =
      window.localStorage.getItem("portfolio-admin-remember") === "true" ||
      window.sessionStorage.getItem("portfolio-admin-remember") === "true";

    setRememberAdmin(isRemembered);

    const controller = new AbortController();

    async function restoreSession() {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "same-origin",
          signal: controller.signal
        });

        if (!response.ok) {
          clearStoredAdminAccess();
          setIsAdminAuthenticated(false);
          return;
        }

        const result = await response.json().catch(() => ({}));
        if (result.ok) {
          setIsAdminAuthenticated(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setIsAdminAuthenticated(false);
        }
      }
    }

    void restoreSession();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousLang = document.documentElement.lang;
    const previousDir = document.documentElement.dir;

    document.documentElement.lang = isArabic ? "ar" : "en";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    window.localStorage.setItem("portfolio-admin-language", adminLanguage);

    return () => {
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
    };
  }, [adminLanguage, isArabic]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSystemHealth() {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Health check failed with HTTP ${response.status}.`);
        }

        const result = await response.json();
        setSystemHealth({
          ok: Boolean(result?.ok),
          status: result?.status || "healthy",
          timestamp: result?.timestamp || "",
          message: result?.ok
            ? isArabic
              ? "السيرفر والـ API يعملان بشكل طبيعي."
              : "Server and API are responding normally."
            : isArabic
              ? "نقطة فحص الصحة أعادت تحذيرًا."
              : "Health endpoint responded with a warning."
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setSystemHealth({
            ok: false,
            status: "unreachable",
            timestamp: "",
            message: isArabic
              ? "تعذر الوصول إلى نقطة فحص الصحة."
              : error.message || "Unable to reach the health endpoint."
          });
        }
      }
    }

    void loadSystemHealth();

    return () => controller.abort();
  }, [isArabic]);

  const previewUrl = useMemo(() => {
    if (photoFile) {
      return URL.createObjectURL(photoFile);
    }

    return draftProfile?.personal?.profileImage || "/assets/avatar-monogram.svg";
  }, [draftProfile?.personal?.profileImage, photoFile]);

  const projectPreviewUrl = useMemo(() => {
    if (projectImageFile) {
      return URL.createObjectURL(projectImageFile);
    }

    return getProjectArtwork(projectDraft);
  }, [projectDraft, projectImageFile]);

  useEffect(() => {
    if (!photoFile) {
      return undefined;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile, previewUrl]);

  useEffect(() => {
    if (!projectImageFile) {
      return undefined;
    }

    return () => URL.revokeObjectURL(projectPreviewUrl);
  }, [projectImageFile, projectPreviewUrl]);

  const hasProfileChanges = useMemo(() => {
    if (!profile || !draftProfile) {
      return false;
    }

    return JSON.stringify(profile) !== JSON.stringify(draftProfile);
  }, [draftProfile, profile]);

  const safeProfile = useMemo(() => normalizeProfileShape(profile), [profile]);
  const safeDraftProfile = useMemo(() => normalizeProfileShape(draftProfile), [draftProfile]);
  const draftSite = safeDraftProfile.site;
  const draftPersonal = safeDraftProfile.personal;
  const draftAbout = safeDraftProfile.about;
  const draftContact = safeDraftProfile.contact;
  const draftHighlights = safeDraftProfile.highlights;
  const draftSocials = safeDraftProfile.socials;
  const draftStats = safeDraftProfile.stats;
  const draftSpotlightTech = safeDraftProfile.spotlightTech;
  const draftServices = safeDraftProfile.services;
  const draftSkillGroups = safeDraftProfile.skillGroups;
  const draftProcess = safeDraftProfile.process;
  const draftExperience = safeDraftProfile.experience;
  const draftTestimonials = safeDraftProfile.testimonials;
  const draftInsights = safeDraftProfile.insights;
  const draftFaqs = safeDraftProfile.faqs;

  useEffect(() => {
    if (!draftProfile) {
      return;
    }

    try {
      const updatedAt = new Date().toISOString();
      window.sessionStorage.setItem(
        ADMIN_DRAFT_STORAGE_KEY,
        JSON.stringify({
          profile: draftProfile,
          updatedAt
        })
      );
      setDraftSavedAt(updatedAt);
    } catch {
      // Ignore storage failures and keep the dashboard usable.
    }
  }, [draftProfile]);

  const updateDraftField = (path, value) => {
    setDraftProfile((current) => setNestedValue(current, path, value));
  };

  const updateCollectionItem = (path, index, key, value) => {
    setDraftProfile((current) => {
      const currentItems = Array.isArray(getNestedValue(current, path, [])) ? [...getNestedValue(current, path, [])] : [];
      const nextItem = setNestedValue(currentItems[index] || {}, key, value);
      currentItems[index] = nextItem;
      return setNestedValue(current, path, currentItems);
    });
  };

  const addCollectionItem = (path, template) => {
    setDraftProfile((current) => {
      const currentItems = Array.isArray(getNestedValue(current, path, [])) ? [...getNestedValue(current, path, [])] : [];
      currentItems.push(cloneValue(template));
      return setNestedValue(current, path, currentItems);
    });
  };

  const removeCollectionItem = (path, index) => {
    setDraftProfile((current) => {
      const currentItems = Array.isArray(getNestedValue(current, path, [])) ? [...getNestedValue(current, path, [])] : [];
      currentItems.splice(index, 1);
      return setNestedValue(current, path, currentItems);
    });
  };

  const handleLoadVault = async (password = "") => {
    try {
      setBusyAction("load-vault");
      const response = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ vaultPassword: password || vaultPassword })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Access denied.");
      
      setVaultData(result.data);
      if (result.data.decryptedSubmissions) {
        setDecryptedRecords(result.data.decryptedSubmissions);
      }
      setStatus({ state: "success", message: isArabic ? "تم الوصول لمستودع البيانات بنجاح." : "Security vault access granted." });
    } catch (err) {
      setStatus({ state: "error", message: err.message });
      setVaultData({ submissions: [], stats: {}, auditLogs: [] });
    } finally {
      setBusyAction("");
    }
  };

  const handleSaveProfile = async () => {
    if (!draftProfile) {
      return;
    }

    const nextProfile = await runAdminRequest(
      "/api/admin/profile",
      {
        profile: draftProfile
      },
      "save-profile"
    );

    applyServerProfile(nextProfile);
    setDraftRecoveryMessage("");
  };

  const handleResetDraft = () => {
    if (!profile) {
      return;
    }

    setDraftProfile(cloneValue(profile));
    setDraftRecoveryMessage("");
    setStatus({
      state: "success",
      message: isArabic ? "تمت إعادة المسودة إلى آخر نسخة محفوظة." : "Draft reset to the last saved profile state."
    });
  };

  const handlePhotoUpload = async (event) => {
    event.preventDefault();

    if (!photoFile) {
      setStatus({ state: "error", message: isArabic ? "اختر صورة أولًا." : "Choose an image first." });
      return;
    }

    const dataBase64 = await readFileAsDataUrl(photoFile);
    const nextProfile = await runAdminRequest(
      "/api/admin/profile-image",
      {
        fileName: photoFile.name,
        mimeType: guessImageMimeType(photoFile),
        dataBase64
      },
      "upload-photo"
    );

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, ["personal", "profileImage"], serverProfile.personal?.profileImage || "")
    });
    setPhotoFile(null);
  };

  const handleClearPhoto = async () => {
    const nextProfile = await runAdminRequest("/api/admin/profile-image/clear", {}, "clear-photo");

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, ["personal", "profileImage"], serverProfile.personal?.profileImage || "")
    });
    setPhotoFile(null);
  };

  const beginCreateProject = () => {
    setProjectMode("create");
    setSelectedProjectSlug("");
    setProjectImageFile(null);
    setProjectDraft(createProjectForm());
  };

  const selectProject = (project) => {
    setProjectMode("edit");
    setSelectedProjectSlug(project.slug);
    setProjectImageFile(null);
    setProjectDraft(createProjectForm(project));
  };

  const handleProjectFieldChange = (key, value) => {
    setProjectDraft((current) => ({ ...current, [key]: value }));
  };

  const handleClearProjectArtwork = () => {
    setProjectImageFile(null);
    setProjectDraft((current) => ({
      ...current,
      image: ""
    }));
    setStatus({
      state: "success",
      message: isArabic
        ? "تمت إعادة صورة المشروع إلى المعاينة الافتراضية حسب التصنيف. احفظ لنشر التغيير."
        : "Project artwork reset to the category-based default preview. Save to publish the change."
    });
  };

  const handleSaveProject = async (event) => {
    event.preventDefault();

    const imageUpload = projectImageFile
      ? {
          fileName: projectImageFile.name,
          mimeType: guessImageMimeType(projectImageFile),
          dataBase64: await readFileAsDataUrl(projectImageFile)
        }
      : null;

    const nextProfile = await runAdminRequest(
      "/api/admin/projects",
      {
        project: buildProjectPayload(projectDraft),
        imageUpload
      },
      "save-project"
    );

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, "projects", cloneValue(serverProfile.projects || []))
    });

    const savedProject =
      nextProfile.projects.find((item) => item.slug === projectDraft.slug) ||
      nextProfile.projects.find((item) => item.title === projectDraft.title) ||
      nextProfile.projects[0];

    if (savedProject) {
      setProjectMode("edit");
      setSelectedProjectSlug(savedProject.slug);
      setProjectImageFile(null);
      setProjectDraft(createProjectForm(savedProject));
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectSlug) {
      return;
    }

    const nextProfile = await runAdminRequest(
      "/api/admin/projects/delete",
      {
        slug: selectedProjectSlug
      },
      "delete-project"
    );

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, "projects", cloneValue(serverProfile.projects || []))
    });

    if (nextProfile.projects.length > 0) {
      selectProject(nextProfile.projects[0]);
      return;
    }

    beginCreateProject();
  };

  const beginCreateCertificate = () => {
    setCertificateMode("create");
    setSelectedCertificateId("");
    setCertificateDraft(createCertificateForm());
  };

  const selectCertificate = (certificate) => {
    setCertificateMode("edit");
    setSelectedCertificateId(certificate.id);
    setCertificateDraft(createCertificateForm(certificate));
  };

  const handleCertificateFieldChange = (key, value) => {
    setCertificateDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSaveCertificate = async (event) => {
    event.preventDefault();

    const nextProfile = await runAdminRequest(
      "/api/admin/certificates",
      {
        certificate: certificateDraft
      },
      "save-certificate"
    );

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, "certificates", cloneValue(serverProfile.certificates || []))
    });

    const savedCertificate =
      nextProfile.certificates.find((item) => item.id === certificateDraft.id) ||
      nextProfile.certificates.find((item) => item.title === certificateDraft.title) ||
      nextProfile.certificates[0];

    if (savedCertificate) {
      setCertificateMode("edit");
      setSelectedCertificateId(savedCertificate.id);
      setCertificateDraft(createCertificateForm(savedCertificate));
    }
  };

  const handleDeleteCertificate = async () => {
    if (!selectedCertificateId) {
      return;
    }

    const nextProfile = await runAdminRequest(
      "/api/admin/certificates/delete",
      {
        id: selectedCertificateId
      },
      "delete-certificate"
    );

    applyServerProfile(nextProfile, {
      mergeDraft: (currentDraft, serverProfile) =>
        setNestedValue(currentDraft, "certificates", cloneValue(serverProfile.certificates || []))
    });

    if (nextProfile.certificates.length > 0) {
      selectCertificate(nextProfile.certificates[0]);
      return;
    }

    beginCreateCertificate();
  };

  const handleLogout = async () => {
    try {
      setBusyAction("logout");
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: "{}"
      });
    } catch {
      // Ignore network errors and clear the local state anyway.
    } finally {
      clearStoredAdminAccess();
      window.sessionStorage.removeItem(ADMIN_DRAFT_STORAGE_KEY);
      setAdminToken("");
      setRememberAdmin(false);
      setIsAdminAuthenticated(false);
      setBusyAction("");
      setStatus({
        state: "success",
        message: isArabic ? "تم إغلاق وصول الإدارة على هذا المتصفح." : "Admin access has been cleared from this browser."
      });
    }
  };

  if (loading) {
    return <AdminLoading />;
  }

  if (loadError || !profile || !draftProfile) {
    return <AdminLoading error={loadError || "Unable to render the admin dashboard."} />;
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-white md:px-6">
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <div className="gradient-veil" />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="blob blob-one" />
          <div className="blob blob-two" />
          <div className="blob blob-three" />
        </div>

        <div className="relative z-[1] mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <p className="section-kicker">
                <span className="section-kicker__dot" />
                {copy.login.kicker}
              </p>
              <h1 className="section-title max-w-xl">
                {copy.login.title}
              </h1>
              <p className="subtle-copy max-w-2xl text-base md:text-lg">
                {copy.login.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white/82 transition hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  {copy.login.back}
                </a>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/16"
                >
                  <ExternalLink size={16} />
                  {copy.login.openSite}
                </a>
              </div>
            </div>

            <motion.div
              className="glow-border glass-panel rounded-[2rem] p-6 md:p-8"
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="display-meta text-cyan-200/76">{copy.login.signIn}</p>
                  <h2 className="section-title mt-3 text-white">{copy.login.unlock}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/64">
                    {copy.login.secretHint}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminLanguage((current) => (current === "ar" ? "en" : "ar"))}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white/78 transition hover:bg-white/10"
                  >
                    {copy.langLabel}
                  </button>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                    <Shield size={24} />
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  await verifyAdminAccess(adminToken);
                }}
                className="grid gap-4"
              >
                <Field
                  label={copy.login.adminKey}
                  type="password"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  placeholder={copy.login.adminKeyPlaceholder}
                  autoComplete="current-password"
                  required
                />

                <label className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                  <input
                    type="checkbox"
                    checked={rememberAdmin}
                    onChange={(event) => setRememberAdmin(event.target.checked)}
                    className="h-4 w-4 accent-cyan-300"
                  />
                  <span>{copy.login.remember}</span>
                </label>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/64">
                  {copy.login.security}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/68 p-4">
                    <p className="display-meta text-white/40">{copy.login.apiStatus}</p>
                    <p className={`display-heading-sm mt-3 ${systemHealth.ok ? "text-emerald-200" : "text-amber-200"}`}>
                      {systemHealth.ok ? copy.login.healthy : copy.login.checkServer}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/56">{systemHealth.message}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/68 p-4">
                    <p className="display-meta text-white/40">{copy.login.draftRecovery}</p>
                    <p className="display-heading-sm mt-3 text-cyan-100">
                      {draftRecoveryMessage ? copy.common.recoveredDraft : copy.login.draftReady}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/56">
                      {draftRecoveryMessage || copy.login.draftReadyDescription}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <StatusMessage
                    status={status}
                    emptyMessage={
                      isArabic
                        ? "يتم حفظ التعديلات فقط عند استخدام أزرار الحفظ داخل لوحة الإدارة."
                        : "Changes are saved only when you use the action buttons in this dashboard."
                    }
                  />
                  <button
                    type="submit"
                    disabled={busyAction === "verify"}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-300/22 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === "verify" ? copy.login.checking : copy.login.unlockAction}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const renderContentToolbar = (title, description) => (
    <SectionCard
      eyebrow={copy.common.editing}
      title={title}
      description={description}
      action={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleResetDraft}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/78 transition hover:bg-white/10"
          >
            <RefreshCw size={14} />
            {copy.common.resetDraft}
          </button>
          <button
            type="button"
            onClick={() => void handleSaveProfile()}
            disabled={busyAction === "save-profile" || !hasProfileChanges}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save size={14} />
            {busyAction === "save-profile" ? copy.common.saving : copy.common.saveChanges}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-white/72">
          {hasProfileChanges ? (
            <AlertTriangle size={14} className="text-amber-300" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-300" />
          )}
          {hasProfileChanges ? copy.common.unsaved : copy.common.synced}
        </div>
        <StatusMessage
          status={status}
          emptyMessage={
            isArabic
              ? "يتم حفظ التعديلات فقط عند استخدام أزرار الحفظ داخل لوحة الإدارة."
              : "Changes are saved only when you use the action buttons in this dashboard."
          }
        />
      </div>
    </SectionCard>
  );

  const currentProjects = safeProfile.projects;
  const currentCertificates = safeProfile.certificates;
  const contentRecommendations = (() => {
    const recommendations = [];
    const liveProjectCount = currentProjects.filter(
      (project) => project.links?.live && project.links.live !== "#" && !project.links.live.includes("localhost")
    ).length;
    const repoProjectCount = currentProjects.filter((project) => project.links?.repo && project.links.repo !== "#").length;
    const hasCustomPhoto = draftPersonal.profileImage && !draftPersonal.profileImage.includes("avatar-monogram");
    const hasResume = draftPersonal.resumeUrl && draftPersonal.resumeUrl !== "#";
    const hasCertificates = currentCertificates.length > 0;
    const hasRealTestimonials = draftTestimonials.some(
      (item) => item.name && !/sample|replace/i.test(`${item.name} ${item.title} ${item.quote}`)
    );
    const hasCustomDomain = draftSite.url && !draftSite.url.includes("localhost") && draftSite.url !== "#";

    if (!hasCustomPhoto) {
      recommendations.push({
        title: isArabic ? "أضف صورة شخصية حقيقية" : "Upload a personal photo",
        detail: isArabic
          ? "الصورة الحقيقية تعطي ثقة مباشرة وتكمل شكل قسم النبذة."
          : "A real photo strengthens trust immediately and makes the about section feel complete."
      });
    }

    if (!hasResume) {
      recommendations.push({
        title: isArabic ? "أضف رابط الـ CV" : "Add your CV link",
        detail: isArabic
          ? "غالبًا يتوقع الـ recruiters وجود رابط للسيرة الذاتية خاصة عند المراجعة السريعة."
          : "Recruiters often expect a resume link, especially when they want to move fast."
      });
    }

    if (liveProjectCount === 0) {
      recommendations.push({
        title: isArabic ? "انشر معاينة حية لمشروع واحد على الأقل" : "Publish at least one live demo",
        detail: isArabic
          ? "رابط حي واحد يعمل يرفع مصداقية البورتوفوليو أكثر بكثير من بطاقات المشاريع الثابتة."
          : "One working live link gives your portfolio far more credibility than static project cards alone."
      });
    }

    if (repoProjectCount < Math.min(currentProjects.length, 2)) {
      recommendations.push({
        title: isArabic ? "أضف روابط كود أكثر" : "Connect more source code links",
        detail: isArabic
          ? "وجود أكثر من مستودع عام يساعد الزائر على الوثوق بعمق تنفيذك."
          : "A couple of public repos help visitors trust the depth of your implementation."
      });
    }

    if (!hasCertificates) {
      recommendations.push({
        title: isArabic ? "أضف أول شهادة لك" : "Add your first certificate",
        detail: isArabic
          ? "حتى شهادة واحدة مناسبة يمكنها تقوية مسارك في الذكاء الاصطناعي وأنت ما زلت في بداية الطريق."
          : "Even one relevant credential can reinforce your AI learning path while you are still early-stage."
      });
    }

    if (!hasRealTestimonials) {
      recommendations.push({
        title: isArabic ? "استبدل التوصيات الوهمية بتوصيات حقيقية" : "Replace placeholder testimonials",
        detail: isArabic
          ? "التوصيات الحقيقية من زميل أو دكتور أو عميل تجعل الموقع أكثر نضجًا واحترافية."
          : "Real feedback from a teammate, instructor, or client will make this portfolio feel much more mature."
      });
    }

    if (!hasCustomDomain) {
      recommendations.push({
        title: isArabic ? "استخدم دومين مخصص" : "Use a custom domain",
        detail: isArabic
          ? "الدومين المخصص يجعل البورتوفوليو يبدو أرقى وأقرب لنسخة production فورًا."
          : "A clean custom domain instantly makes the portfolio feel more premium and production-ready."
      });
    }

    return recommendations;
  })();

  const readinessScore = (() => {
    const checks = [
      Boolean(draftPersonal.fullName),
      Boolean(draftPersonal.heroSummary),
      Boolean(draftPersonal.resumeUrl && draftPersonal.resumeUrl !== "#"),
      Boolean(draftPersonal.profileImage && !draftPersonal.profileImage.includes("avatar-monogram")),
      currentProjects.length >= 3,
      currentProjects.some((project) => project.links?.live && project.links.live !== "#"),
      currentProjects.some((project) => project.links?.repo && project.links.repo !== "#"),
      currentCertificates.length > 0,
      draftSocials.length >= 3,
      Boolean(draftContact.heading && draftContact.intro),
      draftTestimonials.some((item) => item.name && !/sample|replace/i.test(`${item.name} ${item.title}`)),
      Boolean(draftSite.url && !draftSite.url.includes("localhost") && draftSite.url !== "#")
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  })();

  const handleDownloadBackup = () => {
    const blob = new Blob([JSON.stringify(draftProfile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `portfolio-profile-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus({
      state: "success",
      message: isArabic ? "تم تحميل النسخة الاحتياطية بنجاح." : "Profile backup downloaded successfully."
    });
  };

  const handleCopyText = async (label, value) => {
    const nextValue = `${value || ""}`.trim();
    if (!nextValue) {
      setStatus({
        state: "error",
        message: isArabic ? `لا يوجد ${label} لنسخه الآن.` : `No ${label.toLowerCase()} is available to copy yet.`
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(nextValue);
      setStatus({
        state: "success",
        message: isArabic ? `تم نسخ ${label} بنجاح.` : `${label} copied successfully.`
      });
    } catch {
      setStatus({
        state: "error",
        message: isArabic ? `تعذر نسخ ${label} على هذا المتصفح.` : `Unable to copy ${label.toLowerCase()} on this browser.`
      });
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <SectionCard
        eyebrow={copy.overview.controlCenter}
        title={copy.overview.everythingManaged}
        description={copy.overview.everythingManagedDescription}
        action={
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/78 transition hover:bg-white/10"
          >
            <Download size={14} />
            {copy.overview.downloadBackup}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: copy.common.projects, value: currentProjects.length, icon: Briefcase },
            { label: copy.common.certificates, value: currentCertificates.length, icon: Trophy },
            { label: copy.common.socialLinks, value: draftSocials.length, icon: Globe },
            { label: copy.common.spotlightTech, value: draftSpotlightTech.length, icon: Sparkles }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="display-meta text-white/42">{item.label}</p>
                    <p className="display-heading-lg mt-4 text-white">{item.value}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                    <Icon size={20} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow={copy.overview.controlCenter}
          title={copy.overview.readinessTitle(readinessScore)}
          description={copy.overview.readinessDescription}
        >
          <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <div className="display-meta mt-5 flex flex-wrap gap-3 text-white/52">
              <span>{`${currentProjects.length} ${copy.common.projects}`}</span>
              <span>{`${currentCertificates.length} ${copy.common.certificates}`}</span>
              <span>{`${contentRecommendations.length} ${copy.overview.nextImprovements}`}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={copy.overview.suggested}
          title={copy.overview.suggestedTitle}
          description={copy.overview.suggestedDescription}
        >
          <div className="space-y-3">
            {contentRecommendations.length > 0 ? (
              contentRecommendations.map((item) => (
                <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/68 p-4">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">{item.detail}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-300/18 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
                {copy.overview.strongState}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow={copy.overview.runtime}
          title={copy.overview.runtimeTitle}
          description={copy.overview.runtimeDescription}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                label: copy.login.apiStatus,
                value: systemHealth.ok ? copy.common.healthy : copy.common.needsAttention,
                detail: systemHealth.message,
                tone: systemHealth.ok ? "text-emerald-200" : "text-amber-200"
              },
              {
                label: copy.overview.lastDraft,
                value: draftSavedAt
                  ? new Date(draftSavedAt).toLocaleTimeString(isArabic ? "ar-EG" : "en-US")
                  : copy.common.notSetYet,
                detail: copy.overview.draftDetail,
                tone: "text-cyan-100"
              },
              {
                label: copy.overview.publicDomain,
                value: draftSite.url && !draftSite.url.includes("localhost") ? copy.common.configured : copy.common.localOnly,
                detail: draftSite.url || copy.overview.domainDetail,
                tone:
                  draftSite.url && !draftSite.url.includes("localhost") ? "text-emerald-200" : "text-white/82"
              },
              {
                label: copy.overview.currentSession,
                value: isAdminAuthenticated ? copy.common.authenticated : copy.common.locked,
                detail: copy.overview.sessionDetail,
                tone: isAdminAuthenticated ? "text-cyan-100" : "text-white/82"
              }
            ].map((item) => (
              <article key={item.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/68 p-4">
                <p className="display-meta text-white/40">{item.label}</p>
                <p className={`display-heading-sm mt-3 ${item.tone}`}>{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{item.detail}</p>
              </article>
            ))}
          </div>
          {draftRecoveryMessage ? (
            <div className="mt-4 rounded-[1.4rem] border border-cyan-300/18 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
              {draftRecoveryMessage}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          eyebrow={copy.overview.quickActions}
          title={copy.overview.quickActionsTitle}
          description={copy.overview.quickActionsDescription}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                label: copy.overview.openPublicSite,
                icon: ExternalLink,
                onClick: () => window.open("/", "_blank", "noopener,noreferrer")
              },
              {
                label: copy.overview.copyPublicUrl,
                icon: Copy,
                onClick: () => void handleCopyText(copy.overview.copyPublicUrl, draftSite.url || window.location.origin)
              },
              {
                label: copy.overview.copyAdminUrl,
                icon: Copy,
                onClick: () => void handleCopyText(copy.overview.copyAdminUrl, `${window.location.origin}/admin`)
              },
              {
                label: copy.overview.copyEmail,
                icon: Copy,
                onClick: () => void handleCopyText(copy.overview.copyEmail, draftPersonal.email)
              },
              {
                label: copy.overview.goToProjects,
                icon: Briefcase,
                onClick: () => setActiveTab("projects")
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/68 px-4 py-4 text-left text-sm text-white/82 transition hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-white/6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-cyan-300/16 bg-cyan-300/10 text-cyan-100">
                    <Icon size={16} />
                  </span>
                  <span className="display-heading-sm text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            id: "profile",
            title: copy.overview.profileContent,
            body: copy.overview.profileContentBody,
            icon: UserRound
          },
          {
            id: "projects",
            title: copy.overview.projectsManager,
            body: copy.overview.projectsManagerBody,
            icon: Briefcase
          },
          {
            id: "certificates",
            title: copy.overview.certificatesManager,
            body: copy.overview.certificatesManagerBody,
            icon: Trophy
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="glow-border glass-panel rounded-[2rem] p-6 text-left transition hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                <Icon size={20} />
              </span>
              <h3 className="display-heading-md mt-5 text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/64">{item.body}</p>
            </button>
          );
        })}
      </div>

      <SectionCard
        eyebrow={copy.overview.liveProfile}
        title={draftPersonal.fullName || copy.common.portfolioOwner}
        description={copy.overview.liveProfileDescription}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: copy.common.role, value: draftPersonal.role },
            { label: copy.common.availability, value: draftPersonal.availability },
            { label: copy.common.email, value: draftPersonal.email },
            { label: copy.common.location, value: draftPersonal.location }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/68 p-4">
              <p className="display-meta text-white/40">{item.label}</p>
              <p className="mt-3 text-sm leading-6 text-white/80">{item.value || copy.common.notSetYet}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {renderContentToolbar(
        copy.profile.toolbarTitle,
        copy.profile.toolbarDescription
      )}

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <SectionCard
          eyebrow={copy.profile.profileImage}
          title={copy.profile.updateAvatar}
          description={copy.profile.updateAvatarDescription}
          action={
            <button
              type="button"
              onClick={() => void handleClearPhoto()}
              disabled={busyAction === "clear-photo"}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/78 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RefreshCw size={14} />
              {busyAction === "clear-photo" ? copy.common.resetting : copy.common.useDefaultAvatar}
            </button>
          }
        >
          <form onSubmit={handlePhotoUpload} className="grid gap-5">
            <div className="overflow-hidden rounded-[1.7rem] border border-cyan-300/14 bg-slate-950/76">
              <img src={previewUrl} alt="Profile preview" className="h-[360px] w-full object-cover" />
            </div>

            <Field
              label={copy.profile.newImage}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/50">{photoFile ? photoFile.name : copy.common.noNewImage}</p>
              <button
                type="submit"
                disabled={busyAction === "upload-photo" || !photoFile}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Upload size={14} />
                {busyAction === "upload-photo" ? copy.common.uploading : copy.common.uploadPhoto}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow={copy.profile.identity}
          title={copy.profile.identityTitle}
          description={copy.profile.identityDescription}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={copy.profile.siteTitle}
              value={draftSite.title}
              onChange={(event) => updateDraftField(["site", "title"], event.target.value)}
              placeholder="Ammar Tahoon | Portfolio"
            />
            <Field
              label={copy.profile.siteUrl}
              type="url"
              value={draftSite.url}
              onChange={(event) => updateDraftField(["site", "url"], event.target.value)}
              placeholder="Leave empty to use the deployed domain automatically"
            />
            <Field
              label={copy.profile.siteDescription}
              as="textarea"
              rows={4}
              className="md:col-span-2"
              value={draftSite.description}
              onChange={(event) => updateDraftField(["site", "description"], event.target.value)}
              placeholder="Short SEO-ready portfolio description"
            />
            <Field
              label={copy.profile.publicName}
              value={draftPersonal.fullName}
              onChange={(event) => updateDraftField(["personal", "fullName"], event.target.value)}
              placeholder="Ammar Tahoon"
            />
            <Field
              label={copy.profile.legalName}
              value={draftPersonal.legalName}
              onChange={(event) => updateDraftField(["personal", "legalName"], event.target.value)}
              placeholder="Full legal name"
            />
            <Field
              label={copy.profile.nativeName}
              value={draftPersonal.nativeName}
              onChange={(event) => updateDraftField(["personal", "nativeName"], event.target.value)}
              placeholder="Arabic or native spelling"
            />
            <Field
              label={copy.profile.role}
              value={draftPersonal.role}
              onChange={(event) => updateDraftField(["personal", "role"], event.target.value)}
              placeholder="AI Engineer"
            />
            <Field
              label={copy.profile.tagline}
              value={draftPersonal.tagline}
              onChange={(event) => updateDraftField(["personal", "tagline"], event.target.value)}
              placeholder="Short line under your name"
            />
            <Field
              label={copy.profile.availability}
              value={draftPersonal.availability}
              onChange={(event) => updateDraftField(["personal", "availability"], event.target.value)}
              placeholder="Student, Open to internships..."
            />
            <Field
              label={copy.profile.location}
              value={draftPersonal.location}
              onChange={(event) => updateDraftField(["personal", "location"], event.target.value)}
              placeholder="10th of Ramadan City, Egypt"
            />
            <Field
              label={copy.profile.timezone}
              value={draftPersonal.timezone}
              onChange={(event) => updateDraftField(["personal", "timezone"], event.target.value)}
              placeholder="Africa/Cairo"
            />
            <Field
              label={copy.profile.resumeUrl}
              type="url"
              value={draftPersonal.resumeUrl}
              onChange={(event) => updateDraftField(["personal", "resumeUrl"], event.target.value)}
              placeholder="https://..."
            />
            <Field
              label={copy.profile.email}
              type="email"
              value={draftPersonal.email}
              onChange={(event) => updateDraftField(["personal", "email"], event.target.value)}
              placeholder="you@example.com"
            />
            <Field
              label={copy.profile.phone}
              value={draftPersonal.phone}
              onChange={(event) => updateDraftField(["personal", "phone"], event.target.value)}
              placeholder="+20..."
            />
            <Field
              label={copy.profile.heroSummary}
              as="textarea"
              rows={5}
              className="md:col-span-2"
              value={draftPersonal.heroSummary}
              onChange={(event) => updateDraftField(["personal", "heroSummary"], event.target.value)}
              placeholder="Describe what you build in one strong paragraph."
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow={copy.profile.about}
        title={copy.profile.aboutTitle}
        description={copy.profile.aboutDescription}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={copy.profile.aboutIntro}
            as="textarea"
            rows={5}
            value={draftAbout.intro}
            onChange={(event) => updateDraftField(["about", "intro"], event.target.value)}
            placeholder="Short personal introduction"
          />
          <Field
            label={copy.profile.aboutBody}
            as="textarea"
            rows={5}
            value={draftAbout.body}
            onChange={(event) => updateDraftField(["about", "body"], event.target.value)}
            placeholder="Longer story about your focus and growth"
          />
          <LinesField
            label={copy.profile.highlights}
            rows={5}
            value={draftHighlights}
            onChange={(value) => updateDraftField("highlights", value)}
            placeholder="One highlight per line"
          />
          <LinesField
            label={copy.profile.principles}
            rows={5}
            value={draftAbout.principles}
            onChange={(value) => updateDraftField(["about", "principles"], value)}
            placeholder="One principle per line"
          />
        </div>
      </SectionCard>

      <CollectionEditor
        title={isArabic ? "الإحصائيات" : "Stats"}
        description={isArabic ? "أرقام أو عبارات قصيرة تظهر في قسم النبذة." : "Short numbers or labels that appear in your about section."}
        items={draftStats}
        fields={[
          { key: "value", label: "Value", placeholder: "5+" },
          { key: "label", label: "Label", placeholder: "Projects Built" }
        ]}
        addLabel={isArabic ? "إضافة إحصائية" : "Add Stat"}
        itemTitle={(item, index) => item.label || (isArabic ? `إحصائية ${index + 1}` : `Stat ${index + 1}`)}
        onAdd={() => addCollectionItem("stats", collectionTemplates.stats)}
        onRemove={(index) => removeCollectionItem("stats", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("stats", index, key, value)}
        emptyText={copy.collection.emptyStats}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={isArabic ? "روابط التواصل" : "Social Links"}
        description={isArabic ? "هذه الروابط تشغل أزرار وروابط التواصل العامة." : "These links power the social pills and public networking buttons."}
        items={draftSocials}
        fields={[
          { key: "label", label: "Label", placeholder: "GitHub" },
          { key: "handle", label: "Handle", placeholder: "@username" },
          { key: "url", label: "URL", type: "url", placeholder: "https://..." }
        ]}
        addLabel={isArabic ? "إضافة رابط" : "Add Social"}
        itemTitle={(item, index) => item.label || (isArabic ? `رابط ${index + 1}` : `Social ${index + 1}`)}
        onAdd={() => addCollectionItem("socials", collectionTemplates.socials)}
        onRemove={(index) => removeCollectionItem("socials", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("socials", index, key, value)}
        emptyText={copy.collection.emptySocials}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CollectionEditor
          title={copy.profile.contactLinks}
          description={copy.profile.contactLinksDescription}
          items={draftContact.directLinks}
          fields={[
            { key: "label", label: "Label", placeholder: "Email" },
            { key: "value", label: "Value", placeholder: "mart33645@gmail.com" },
            { key: "url", label: "URL", type: "url", placeholder: "mailto:..." }
          ]}
          addLabel={isArabic ? "إضافة وسيلة تواصل" : "Add Contact Link"}
          itemTitle={(item, index) => item.label || (isArabic ? `رابط ${index + 1}` : `Link ${index + 1}`)}
          onAdd={() => addCollectionItem(["contact", "directLinks"], collectionTemplates.directLinks)}
          onRemove={(index) => removeCollectionItem(["contact", "directLinks"], index)}
          onFieldChange={(index, key, value) =>
            updateCollectionItem(["contact", "directLinks"], index, key, value)
          }
          emptyText={copy.collection.emptyContactLinks}
          collectionLabel={copy.collection.collection}
          itemLabel={copy.collection.item}
          removeLabel={copy.collection.remove}
        />

        <SectionCard
          eyebrow={isArabic ? "نص التواصل" : "Contact Copy"}
          title={copy.profile.contactText}
          description={copy.profile.contactTextDescription}
        >
          <div className="grid gap-4">
            <Field
              label={copy.profile.contactHeading}
              value={draftContact.heading}
              onChange={(event) => updateDraftField(["contact", "heading"], event.target.value)}
              placeholder="Let's build something impossible to ignore"
            />
            <Field
              label={copy.profile.contactIntro}
              as="textarea"
              rows={5}
              value={draftContact.intro}
              onChange={(event) => updateDraftField(["contact", "intro"], event.target.value)}
              placeholder="Short paragraph for the contact section"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const renderExpertiseTab = () => (
    <div className="space-y-6">
      {renderContentToolbar(
        copy.expertise.toolbarTitle,
        copy.expertise.toolbarDescription
      )}

      <CollectionEditor
        title={copy.expertise.spotlight}
        description={copy.expertise.spotlightDescription}
        items={draftSpotlightTech}
        fields={[
          { key: "name", label: "Name", placeholder: "Python" },
          { key: "category", label: "Category", placeholder: "AI / Framework / Frontend" },
          {
            key: "summary",
            label: "Summary",
            type: "textarea",
            rows: 4,
            colSpan: 2,
            placeholder: "How this technology fits your work"
          }
        ]}
        addLabel={isArabic ? "إضافة تقنية" : "Add Technology"}
        itemTitle={(item, index) => item.name || (isArabic ? `تقنية ${index + 1}` : `Technology ${index + 1}`)}
        onAdd={() => addCollectionItem("spotlightTech", collectionTemplates.spotlightTech)}
        onRemove={(index) => removeCollectionItem("spotlightTech", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("spotlightTech", index, key, value)}
        emptyText={copy.collection.emptyTech}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.expertise.services}
        description={copy.expertise.servicesDescription}
        items={draftServices}
        fields={[
          { key: "title", label: "Title", placeholder: "AI Model Development" },
          { key: "summary", label: "Summary", type: "textarea", rows: 4, placeholder: "Short description of the service" },
          { key: "points", label: "Points", type: "list", rows: 5, colSpan: 2, placeholder: "One point per line" }
        ]}
        addLabel={isArabic ? "إضافة خدمة" : "Add Service"}
        itemTitle={(item, index) => item.title || (isArabic ? `خدمة ${index + 1}` : `Service ${index + 1}`)}
        onAdd={() => addCollectionItem("services", collectionTemplates.services)}
        onRemove={(index) => removeCollectionItem("services", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("services", index, key, value)}
        emptyText={copy.collection.emptyServices}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.expertise.skillGroups}
        description={copy.expertise.skillGroupsDescription}
        items={draftSkillGroups}
        fields={[
          { key: "title", label: "Title", placeholder: "AI and Machine Learning" },
          { key: "items", label: "Items", type: "list", rows: 6, colSpan: 2, placeholder: "One item per line" }
        ]}
        addLabel={isArabic ? "إضافة مجموعة" : "Add Skill Group"}
        itemTitle={(item, index) => item.title || (isArabic ? `مجموعة ${index + 1}` : `Skill Group ${index + 1}`)}
        onAdd={() => addCollectionItem("skillGroups", collectionTemplates.skillGroups)}
        onRemove={(index) => removeCollectionItem("skillGroups", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("skillGroups", index, key, value)}
        emptyText={copy.collection.emptySkillGroups}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.expertise.process}
        description={copy.expertise.processDescription}
        items={draftProcess}
        fields={[
          { key: "step", label: "Step Number", placeholder: "01" },
          { key: "title", label: "Title", placeholder: "Decode the Vision" },
          { key: "description", label: "Description", type: "textarea", rows: 4, colSpan: 2, placeholder: "Explain the step" }
        ]}
        addLabel={isArabic ? "إضافة خطوة" : "Add Step"}
        itemTitle={(item, index) => item.title || (isArabic ? `خطوة ${index + 1}` : `Step ${index + 1}`)}
        onAdd={() => addCollectionItem("process", collectionTemplates.process)}
        onRemove={(index) => removeCollectionItem("process", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("process", index, key, value)}
        emptyText={copy.collection.emptyProcess}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.expertise.experience}
        description={copy.expertise.experienceDescription}
        items={draftExperience}
        fields={[
          { key: "period", label: "Period", placeholder: "First Year" },
          { key: "role", label: "Role", placeholder: "University Student" },
          { key: "company", label: "Institution / Company", placeholder: "Innovation University" },
          { key: "summary", label: "Summary", type: "textarea", rows: 4, colSpan: 2, placeholder: "Describe this stage" },
          { key: "points", label: "Points", type: "list", rows: 5, colSpan: 2, placeholder: "One point per line" }
        ]}
        addLabel={isArabic ? "إضافة خبرة" : "Add Experience"}
        itemTitle={(item, index) => item.role || (isArabic ? `خبرة ${index + 1}` : `Experience ${index + 1}`)}
        onAdd={() => addCollectionItem("experience", collectionTemplates.experience)}
        onRemove={(index) => removeCollectionItem("experience", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("experience", index, key, value)}
        emptyText={copy.collection.emptyExperience}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <SectionCard
        eyebrow={copy.projects.section}
        title={copy.projects.title}
        description={copy.projects.description}
        action={
          <button
            type="button"
            onClick={beginCreateProject}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16"
          >
            <FolderPlus size={14} />
            {copy.projects.newProject}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-white/72">
            <Briefcase size={14} className="text-cyan-200" />
            {`${currentProjects.length} ${copy.projects.totalProjects}`}
          </div>
          <StatusMessage
            status={status}
            emptyMessage={
              isArabic
                ? "يتم حفظ التعديلات فقط عند استخدام أزرار الحفظ داخل لوحة الإدارة."
                : "Changes are saved only when you use the action buttons in this dashboard."
            }
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          eyebrow={copy.projects.list}
          title={copy.projects.listTitle}
          description={copy.projects.listDescription}
        >
          <div className="space-y-3">
            {currentProjects.length > 0 ? (
              currentProjects.map((project) => {
                const active = selectedProjectSlug === project.slug;

                return (
                  <button
                    key={project.slug}
                    type="button"
                    onClick={() => selectProject(project)}
                    className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition ${
                      active
                        ? "border-cyan-300/26 bg-cyan-300/12"
                        : "border-white/10 bg-slate-950/66 hover:bg-white/6"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="display-meta text-cyan-200/76">{project.category}</p>
                        <h3 className="mt-3 text-base font-medium text-white">{project.title}</h3>
                      </div>
                      <span className="display-meta text-white/38">{project.year}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/62">{project.summary}</p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.7rem] border border-dashed border-white/12 bg-slate-950/56 p-6 text-sm leading-7 text-white/62">
                {copy.projects.none}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={projectMode === "edit" ? copy.projects.editing : copy.projects.creating}
          title={projectMode === "edit" ? copy.projects.editor : copy.projects.createNew}
          description={copy.projects.editorDescription}
          action={
            projectMode === "edit" ? (
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                disabled={busyAction === "delete-project"}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/18 bg-rose-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-rose-200 transition hover:bg-rose-300/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 size={14} />
                {busyAction === "delete-project" ? copy.projects.deleting : copy.projects.deleteProject}
              </button>
            ) : null
          }
        >
          <form onSubmit={handleSaveProject} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Project Title" value={projectDraft.title} onChange={(event) => handleProjectFieldChange("title", event.target.value)} placeholder="Smart Vision Assistant" />
              <Field label="Slug" value={projectDraft.slug} onChange={(event) => handleProjectFieldChange("slug", event.target.value)} placeholder="smart-vision-assistant" />
              <Field label="Category" value={projectDraft.category} onChange={(event) => handleProjectFieldChange("category", event.target.value)} placeholder="AI, Desktop, Backend..." />
              <Field label="Year" value={projectDraft.year} onChange={(event) => handleProjectFieldChange("year", event.target.value)} placeholder="Recent" />
              <div className="md:col-span-2 rounded-[1.7rem] border border-white/10 bg-slate-950/62 p-4 md:p-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/78">
                    <div className="aspect-[4/3] bg-slate-900/80">
                      <img
                        src={projectPreviewUrl}
                        alt={projectDraft.title || "Project artwork preview"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="border-t border-white/8 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/48">
                      {projectImageFile
                        ? `Selected file: ${projectImageFile.name}`
                        : projectDraft.image
                          ? "Using an internal image path."
                          : "Using the smart category default artwork."}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.4rem] border border-cyan-300/16 bg-cyan-300/6 p-4">
                      <p className="display-meta text-cyan-200/76">Project Artwork</p>
                      <label className="mt-4 flex cursor-pointer flex-wrap items-center gap-4 rounded-[1.25rem] border border-dashed border-white/14 bg-slate-950/72 px-4 py-4 transition hover:border-cyan-300/22 hover:bg-white/5">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setProjectImageFile(file);

                            if (file) {
                              setStatus({
                                state: "success",
                                message: `${file.name} selected. Save the project to publish the new artwork.`
                              });
                            }
                          }}
                        />
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/12 text-cyan-100">
                          <Upload size={18} />
                        </span>
                        <div className="min-w-[220px] flex-1">
                          <p className="text-sm font-medium text-white">Upload a project cover</p>
                          <p className="mt-1 text-sm leading-6 text-white/56">
                            PNG, JPG, or WEBP. The file will be stored locally and used everywhere the project appears.
                          </p>
                        </div>
                      </label>
                    </div>

                    <Field
                      label="Internal Image Path"
                      className="md:col-span-2"
                      value={projectDraft.image}
                      onChange={(event) => handleProjectFieldChange("image", event.target.value)}
                      placeholder="/assets/my-project-cover.webp or leave empty for the default artwork"
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleClearProjectArtwork}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:bg-white/8"
                      >
                        <RefreshCw size={14} />
                        Use Default Artwork
                      </button>
                      {projectImageFile ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProjectImageFile(null);
                            setStatus({
                              state: "success",
                              message: "Selected project file removed. Save to keep the current artwork."
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:bg-white/8"
                        >
                          <Trash2 size={14} />
                          Remove Selected File
                        </button>
                      ) : null}
                    </div>

                    <p className="text-sm leading-7 text-white/48">
                      For the strongest performance and security, use the upload button or a local path like <code>/assets/...</code>.
                      External image URLs are intentionally not used in production mode.
                    </p>
                  </div>
                </div>
              </div>
              <Field label="Summary" as="textarea" rows={4} className="md:col-span-2" value={projectDraft.summary} onChange={(event) => handleProjectFieldChange("summary", event.target.value)} placeholder="Describe the project in a portfolio-ready paragraph" />
              <Field label="Stack" value={projectDraft.stack} onChange={(event) => handleProjectFieldChange("stack", event.target.value)} placeholder="Python, TensorFlow, OpenCV" />
              <Field label="Metrics" value={projectDraft.metrics} onChange={(event) => handleProjectFieldChange("metrics", event.target.value)} placeholder="Realtime, AI-first, Learning utility" />
              <Field label="Challenge" as="textarea" rows={4} value={projectDraft.challenge} onChange={(event) => handleProjectFieldChange("challenge", event.target.value)} placeholder="What challenge did this project solve?" />
              <Field label="Solution" as="textarea" rows={4} value={projectDraft.solution} onChange={(event) => handleProjectFieldChange("solution", event.target.value)} placeholder="How did you solve it?" />
              <Field label="Impact Points" className="md:col-span-2" value={projectDraft.impact} onChange={(event) => handleProjectFieldChange("impact", event.target.value)} placeholder="One, Two, Three" />
              <Field label="Live URL" type="url" value={projectDraft.live} onChange={(event) => handleProjectFieldChange("live", event.target.value)} placeholder="Optional" />
              <Field label="Repo URL" type="url" value={projectDraft.repo} onChange={(event) => handleProjectFieldChange("repo", event.target.value)} placeholder="Optional" />
              <Field label="Case Study URL" type="url" value={projectDraft.caseStudy} onChange={(event) => handleProjectFieldChange("caseStudy", event.target.value)} placeholder="Optional" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/48">Use commas to separate stack items, metrics, and impact points.</p>
              <button
                type="submit"
                disabled={busyAction === "save-project"}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Save size={14} />
                {busyAction === "save-project" ? "Saving..." : projectMode === "edit" ? "Save Project" : "Create Project"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  );

  const renderCertificatesTab = () => (
    <div className="space-y-6">
      <SectionCard
        eyebrow={copy.certificates.section}
        title={copy.certificates.title}
        description={copy.certificates.description}
        action={
          <button
            type="button"
            onClick={beginCreateCertificate}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16"
          >
            <Trophy size={14} />
            {copy.certificates.newCertificate}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-white/72">
            <Trophy size={14} className="text-cyan-200" />
            {`${currentCertificates.length} ${copy.certificates.totalCertificates}`}
          </div>
          <StatusMessage
            status={status}
            emptyMessage={
              isArabic
                ? "يتم حفظ التعديلات فقط عند استخدام أزرار الحفظ داخل لوحة الإدارة."
                : "Changes are saved only when you use the action buttons in this dashboard."
            }
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <SectionCard eyebrow={copy.certificates.list} title={copy.certificates.listTitle} description={copy.certificates.listDescription}>
          <div className="space-y-3">
            {currentCertificates.length > 0 ? (
              currentCertificates.map((certificate) => {
                const active = selectedCertificateId === certificate.id;

                return (
                  <button
                    key={certificate.id}
                    type="button"
                    onClick={() => selectCertificate(certificate)}
                    className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition ${
                      active
                        ? "border-cyan-300/26 bg-cyan-300/12"
                        : "border-white/10 bg-slate-950/66 hover:bg-white/6"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="display-meta text-cyan-200/76">{certificate.year}</p>
                        <h3 className="mt-3 text-base font-medium text-white">{certificate.title}</h3>
                      </div>
                      <span className="display-meta text-white/38">{certificate.issuer}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/62">{certificate.summary}</p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.7rem] border border-dashed border-white/12 bg-slate-950/56 p-6 text-sm leading-7 text-white/62">
                {copy.certificates.none}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={certificateMode === "edit" ? copy.projects.editing : copy.projects.creating}
          title={certificateMode === "edit" ? copy.certificates.editor : copy.certificates.createNew}
          description={copy.certificates.editorDescription}
          action={
            certificateMode === "edit" ? (
              <button
                type="button"
                onClick={() => void handleDeleteCertificate()}
                disabled={busyAction === "delete-certificate"}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/18 bg-rose-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-rose-200 transition hover:bg-rose-300/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 size={14} />
                {busyAction === "delete-certificate" ? copy.projects.deleting : copy.certificates.deleteCertificate}
              </button>
            ) : null
          }
        >
          <form onSubmit={handleSaveCertificate} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" value={certificateDraft.title} onChange={(event) => handleCertificateFieldChange("title", event.target.value)} placeholder="AI Fundamentals" />
              <Field label="Issuer" value={certificateDraft.issuer} onChange={(event) => handleCertificateFieldChange("issuer", event.target.value)} placeholder="Coursera, Udemy, Google..." />
              <Field label="Year / Status" value={certificateDraft.year} onChange={(event) => handleCertificateFieldChange("year", event.target.value)} placeholder="2026 or In Progress" />
              <Field label="Credential URL" type="url" value={certificateDraft.credentialUrl} onChange={(event) => handleCertificateFieldChange("credentialUrl", event.target.value)} placeholder="Optional verification link" />
              <Field label="Summary" as="textarea" rows={5} className="md:col-span-2" value={certificateDraft.summary} onChange={(event) => handleCertificateFieldChange("summary", event.target.value)} placeholder="What this certificate covered and why it matters" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/48">Certificates update the public learning section as soon as they are saved.</p>
              <button
                type="submit"
                disabled={busyAction === "save-certificate"}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Save size={14} />
                {busyAction === "save-certificate"
                  ? "Saving..."
                  : certificateMode === "edit"
                    ? "Save Certificate"
                    : "Create Certificate"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  );

  const renderExtrasTab = () => (
    <div className="space-y-6">
      {renderContentToolbar(
        copy.extras.toolbarTitle,
        copy.extras.toolbarDescription
      )}

      <CollectionEditor
        title={copy.extras.testimonials}
        description={copy.extras.testimonialsDescription}
        items={draftTestimonials}
        fields={[
          { key: "quote", label: "Quote", type: "textarea", rows: 4, colSpan: 2, placeholder: "Write the testimonial quote" },
          { key: "name", label: "Name", placeholder: "Client name" },
          { key: "title", label: "Title", placeholder: "Role or company" }
        ]}
        addLabel={isArabic ? "إضافة توصية" : "Add Testimonial"}
        itemTitle={(item, index) => item.name || (isArabic ? `توصية ${index + 1}` : `Testimonial ${index + 1}`)}
        onAdd={() => addCollectionItem("testimonials", collectionTemplates.testimonials)}
        onRemove={(index) => removeCollectionItem("testimonials", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("testimonials", index, key, value)}
        emptyText={copy.collection.emptyTestimonials}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.extras.insights}
        description={copy.extras.insightsDescription}
        items={draftInsights}
        fields={[
          { key: "title", label: "Title", placeholder: "Why recruiters notice premium UI" },
          { key: "tag", label: "Tag", placeholder: "Motion / Brand / AI" },
          { key: "summary", label: "Summary", type: "textarea", rows: 4, colSpan: 2, placeholder: "Short insight summary" },
          { key: "url", label: "URL", type: "url", colSpan: 2, placeholder: "Optional article link" }
        ]}
        addLabel={isArabic ? "إضافة فكرة" : "Add Insight"}
        itemTitle={(item, index) => item.title || (isArabic ? `فكرة ${index + 1}` : `Insight ${index + 1}`)}
        onAdd={() => addCollectionItem("insights", collectionTemplates.insights)}
        onRemove={(index) => removeCollectionItem("insights", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("insights", index, key, value)}
        emptyText={copy.collection.emptyInsights}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />

      <CollectionEditor
        title={copy.extras.faqs}
        description={copy.extras.faqsDescription}
        items={draftFaqs}
        fields={[
          { key: "question", label: "Question", placeholder: "Is this portfolio ready right away?" },
          { key: "answer", label: "Answer", type: "textarea", rows: 4, colSpan: 2, placeholder: "Answer the question clearly" }
        ]}
        addLabel={isArabic ? "إضافة سؤال" : "Add FAQ"}
        itemTitle={(item, index) => item.question || (isArabic ? `سؤال ${index + 1}` : `FAQ ${index + 1}`)}
        onAdd={() => addCollectionItem("faqs", collectionTemplates.faqs)}
        onRemove={(index) => removeCollectionItem("faqs", index)}
        onFieldChange={(index, key, value) => updateCollectionItem("faqs", index, key, value)}
        emptyText={copy.collection.emptyFaqs}
        collectionLabel={copy.collection.collection}
        itemLabel={copy.collection.item}
        removeLabel={copy.collection.remove}
      />
    </div>
  );

  const renderVaultTab = () => (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Security Operations"
        title={copy.collection.vaultTitle}
        description={copy.collection.vaultDescription}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-5">
            <p className="display-meta text-white/42">{isArabic ? "حالة التشفير" : "Encryption Status"}</p>
            <div className="mt-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <span className="text-sm font-medium text-white">{copy.collection.encryptionActive}</span>
            </div>
          </article>
          <article className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-5">
            <p className="display-meta text-white/42">{isArabic ? "قوة المفتاح" : "Key Strength"}</p>
            <p className="mt-4 text-white">AES-256-GCM / CBC</p>
          </article>
          <article className="rounded-[1.7rem] border border-white/10 bg-slate-950/70 p-5">
            <p className="display-meta text-white/42">{isArabic ? "نشاط السيرفر" : "Server Activity"}</p>
            <p className="mt-4 text-emerald-300">Live & Responding</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard 
        eyebrow="Access Control" 
        title={isArabic ? "فتح الخزنة" : "Unlock Vault"}
        description={isArabic ? "اكتب كلمة مرور الخزنة للوصول للبيانات المشفرة." : "Enter the vault password to access encrypted visitor data and audit logs."}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <Field
            label={isArabic ? "كلمة مرور الخزنة" : "Vault Password"}
            type="password"
            className="flex-1"
            value={vaultPassword}
            onChange={(e) => setVaultPassword(e.target.value)}
          />
          <button
            onClick={() => handleLoadVault()}
            disabled={busyAction === "load-vault"}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-8 py-3 text-xs uppercase tracking-widest text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"
          >
            {busyAction === "load-vault" ? (isArabic ? "جاري الفتح..." : "Unlocking...") : (isArabic ? "فتح السجلات" : "Access Records")}
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard eyebrow="Inbound" title={copy.collection.submissions}>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {vaultData.submissions.length > 0 ? (
              vaultData.submissions.map((sub, idx) => (
                <div key={idx} className="rounded-[1.5rem] border border-white/5 bg-white/2 p-5">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-white/40">{new Date(sub.timestamp).toLocaleString()}</span>
                    <span className="text-cyan-300/60 uppercase">{sub.id.split('-')[0]}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Sender</p>
                      <p className="text-sm font-medium text-white">{sub.name} <span className="text-white/40 font-normal">({sub.email})</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Message</p>
                      <p className="text-sm leading-relaxed text-white/80 bg-white/5 rounded-xl p-4 border border-white/5">
                        {decryptedRecords[sub.id] || "••••••••••••••••••••"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-white/40">No records found.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="System" title={copy.collection.auditLog}>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {(vaultData.auditLogs || []).map((log, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs py-3 border-b border-white/5 last:border-0">
                <span className="text-white/30 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${log.type === 'SUCCESS' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>{log.type}</span>
                <span className="text-white/70 truncate">{log.message}</span>
              </div>
            ))}
            {(!vaultData.auditLogs || vaultData.auditLogs.length === 0) && (
              <div className="p-10 text-center text-white/40">No audit logs available.</div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const activeTabConfig = localizedAdminTabs.find((item) => item.id === activeTab) || localizedAdminTabs[0];

  return (
    <div className="admin-shell relative min-h-screen overflow-hidden bg-[#020617] text-white" lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      <div className="gradient-veil" />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="blob blob-one" />
        <div className="blob blob-two" />
        <div className="blob blob-three" />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1600px] px-4 py-5 md:px-6 md:py-6">
        <header className="glow-border glass-panel rounded-[2rem] px-5 py-5 md:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <p className="display-meta text-cyan-200/76">{isArabic ? "إدارة البورتوفوليو" : "Portfolio Admin"}</p>
              <h1 className="section-title text-white">
                {isArabic
                  ? `${(draftPersonal.fullName || copy.common.portfolioOwner).trim()} - لوحة التحكم`
                  : `${(draftPersonal.fullName || copy.common.portfolioOwner).trim()} Control Center`}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/64 md:text-base">
                {isArabic
                  ? "صفحة إدارة مخصصة لتحديثاتك الخاصة. يبقى الموقع العام نظيفًا بينما تجمع هذه اللوحة رفع الصور وتعديل المحتوى وإدارة المشاريع والشهادات في مكان واحد."
                  : "Dedicated management page for your private content updates. The public site stays clean, while this dashboard keeps image uploads, content edits, projects, and certificates organized in one place."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAdminLanguage((current) => (current === "ar" ? "en" : "ar"))}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-xs uppercase tracking-[0.14em] text-white/78 transition hover:bg-white/10"
              >
                {copy.langLabel}
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/78 transition hover:bg-white/10"
              >
                <ArrowLeft size={14} />
                {copy.login.openSite}
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/18 bg-rose-300/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-rose-200 transition hover:bg-rose-300/16"
              >
                <LogOut size={14} />
                {copy.common.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="glow-border glass-panel rounded-[2rem] p-4">
              <div className="mb-4 rounded-[1.5rem] border border-cyan-300/18 bg-cyan-300/10 p-4">
                <p className="display-meta text-cyan-200/76">{copy.sidebar.privateRoute}</p>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {copy.sidebar.privateRouteDescription}
                </p>
              </div>

              <nav className="space-y-2">
                {localizedAdminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`admin-tab-button ${active ? "admin-tab-button-active" : ""}`}
                    >
                      <span className="admin-tab-button__icon">
                        <Icon size={17} />
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="glow-border glass-panel rounded-[2rem] p-4">
              <p className="display-meta text-cyan-200/76">{copy.sidebar.activePanel}</p>
              <h2 className="display-heading-lg mt-3 text-white">
                {activeTabConfig.label}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-white/64">
                <div className="flex items-center justify-between gap-4">
                  <span>{copy.common.projects}</span>
                  <span>{currentProjects.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>{copy.common.certificates}</span>
                  <span>{currentCertificates.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>{copy.common.unsaved}</span>
                  <span>{hasProfileChanges ? (isArabic ? "نعم" : "Yes") : isArabic ? "لا" : "No"}</span>
                </div>
              </div>
              <div className="mt-5 rounded-[1.3rem] border border-emerald-300/18 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
                {copy.sidebar.securityLayer}
              </div>
            </div>

            <div className="glow-border glass-panel rounded-[2rem] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="display-meta text-cyan-200/76">{copy.sidebar.securityAccess}</p>
                  <h2 className="display-heading-lg mt-3 text-white">{copy.sidebar.securityAccessTitle}</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                  <Shield size={18} />
                </span>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  await verifyAdminAccess(adminToken);
                }}
                className="grid gap-4"
              >
                <Field
                  label={copy.login.adminKey}
                  type="password"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  placeholder={
                    isAdminAuthenticated
                      ? (isArabic ? "أعد كتابة المفتاح السري لتجديد الوصول" : "Re-enter your admin key to refresh access")
                      : copy.login.adminKeyPlaceholder
                  }
                  autoComplete="current-password"
                />

                <label className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                  <input
                    type="checkbox"
                    checked={rememberAdmin}
                    onChange={(event) => setRememberAdmin(event.target.checked)}
                    className="h-4 w-4 accent-cyan-300"
                  />
                  <span>{copy.sidebar.rememberSession}</span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={busyAction === "verify"}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-cyan-300/22 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === "verify"
                      ? copy.login.checking
                      : isAdminAuthenticated
                        ? copy.sidebar.refreshAccess
                        : copy.login.unlockAction}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78 transition hover:bg-white/10"
                  >
                    {copy.common.lock}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-sm leading-6 text-white/56">
                {copy.sidebar.siteUrlHint}
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 18, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {activeTab === "overview" ? renderOverviewTab() : null}
                {activeTab === "profile" ? renderProfileTab() : null}
                {activeTab === "expertise" ? renderExpertiseTab() : null}
                {activeTab === "projects" ? renderProjectsTab() : null}
                {activeTab === "certificates" ? renderCertificatesTab() : null}
                {activeTab === "extras" ? renderExtrasTab() : null}
                {activeTab === "vault" ? renderVaultTab() : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
