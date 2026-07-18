// ─────────────────────────────────────────────────────────────
// Bilingual site content (English + Modern Standard Arabic).
// Brand names, tool names, project names, emails and numbers are
// intentionally kept in Latin script inside the Arabic copy.
// Rich[] lets a headline mark specific words as the orange accent.
// ─────────────────────────────────────────────────────────────

export type Lang = "en" | "ar";
export type Rich = { t: string; accent?: boolean }[];

export interface SiteContent {
  dir: "ltr" | "rtl";
  a11y: { skip: string; menu: string; close: string };
  nav: {
    home: string;
    services: string;
    videos: string;
    about: string;
    work: string;
    process: string;
    contact: string;
    talk: string;
  };
  hero: {
    hello: string;
    line1Pre: string;
    name: string;
    line1Post: string;
    line2: string;
    quote: string;
    ratingNum: string;
    ratingLabel: string;
    ctaWork: string;
    ctaHire: string;
    photoAlt: string;
  };
  services: { title: Rich; lede: string; cards: { title: string; body: string }[] };
  videosSection: {
    head: Rich;
    // Words the first accent slot morphs through (cycle[0] must equal head's
    // first accent word so SSR/first paint matches).
    cycle: string[];
    sub: string;
    // One label per video group — order MUST match VIDEO_GROUPS in index.tsx.
    groups: string[];
    prev: string;
    next: string;
    selectFilm: string;
    durationLabel: string;
  };
  player: {
    play: string;
    pause: string;
    mute: string;
    unmute: string;
    fullscreen: string;
    rewind: string;
    forward: string;
    showDetails: string;
    hideDetails: string;
    seek: string;
  };
  videos: { title: string; tag: string; client: string; description: string }[];
  about: {
    eyebrow: string;
    title: Rich;
    p1: string;
    p2: string;
    stats: { n: string; label: string }[];
    cv: string;
  };
  work: {
    title: Rich;
    lede: string;
    cards: { tag: string; period: string; title: string; body: string }[];
    more: string;
  };
  midCta: { text: string; button: string };
  process: { title: Rich; lede: string; steps: { n: string; t: string; b: string }[] };
  contact: { eyebrow: string; title: Rich; lede: string; whatsapp: string; loc: string };
  footer: string;
}

const en: SiteContent = {
  dir: "ltr",
  a11y: { skip: "Skip to content", menu: "Menu", close: "Close" },
  nav: {
    home: "Home",
    services: "Services",
    videos: "Videos",
    about: "About",
    work: "Work",
    process: "Process",
    contact: "Contact",
    talk: "Let's talk",
  },
  hero: {
    hello: "Hello!",
    line1Pre: "I'm ",
    name: "Ahmed",
    line1Post: ",",
    line2: "AI-Native Content Creator",
    quote:
      "The idea, the brief, the taste, and the final call — that part is mine. AI does the heavy lifting.",
    ratingNum: "15+",
    ratingLabel: "Clients Served",
    ctaWork: "See My Work",
    ctaHire: "Let's talk",
    photoAlt: "Ahmed Mekki, AI-native content creator and AI video director",
  },
  services: {
    title: [{ t: "Services", accent: true }],
    lede: "Research first, then the idea, then production. Every brand gets a voice built for it — not a template reused fifteen times.",
    cards: [
      {
        title: "Brand Strategy & Content Planning",
        body: "Competitor teardowns, one owned proposition per brand, weighted content pillars, and content plans sized to the brand and budget — from a single month to a multi-month catalog of fully specified ideas.",
      },
      {
        title: "AI Video Production",
        body: "End to end: idea → storyboard → character sheets → Veo prompts → Arabic voice-over → final cut. Consistent characters, shot to shot.",
      },
      {
        title: "Copywriting & Brand Voice",
        body: "A distinct voice per client in real Egyptian Arabic — written how people actually talk, reviewed until no AI flavor is left.",
      },
    ],
  },
  videosSection: {
    head: [
      { t: "Every " },
      { t: "film", accent: true },
      { t: " starts with an " },
      { t: "idea.", accent: true },
    ],
    cycle: ["film", "reel", "story", "spot", "ad"],
    sub: "Script, direction, AI production, edit.",
    groups: ["Cinematic AI Films", "Motion Graphics & Type", "UI Animation"],
    prev: "Previous film",
    next: "Next film",
    selectFilm: "Select film",
    durationLabel: "duration",
  },
  player: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
    fullscreen: "Fullscreen",
    rewind: "Rewind 15 seconds",
    forward: "Forward 15 seconds",
    showDetails: "Show details",
    hideDetails: "Hide details",
    seek: "Seek",
  },
  videos: [
    {
      title: "Renew Media — The Story You Remember",
      tag: "Stop-Motion",
      client: "Agency · Egypt",
      description:
        "AI stop-motion film for the agency's own 2026 slate — nostalgic Egyptian storytelling, hand-directed shot by shot.",
    },
    {
      title: "Renew Media — Star of the Party",
      tag: "Stop-Motion",
      client: "Agency · KSA",
      description:
        "AI stop-motion film written in Saudi dialect, cut to a VO-first edit — the same system, a new voice.",
    },
    {
      title: "Easy Way — The Thief Who Stole the Name",
      tag: "AI Film",
      client: "Legal / IP",
      description:
        "Cinematic AI reel produced end to end: script, character sheets, Veo shots, Arabic voice-over, final edit.",
    },
    {
      title: "Golf City Club — All Sports in One Place",
      tag: "AI Film",
      client: "Sports Club",
      description:
        "Vertical cinematic sports film cut from Veo 3.1 clips with morph transitions for a club with 188K followers.",
    },
    {
      title: "Alwassef Motors — Your Day, Your Car",
      tag: "AI Film",
      client: "Car Showroom",
      description:
        "A cinematic AI ad film for a car showroom — a day-in-the-life story that carries one driver from his morning coffee to the wheel of his new car, written, directed and produced end to end with AI.",
    },
    {
      title: "Dr. Ahmed ElKashef — Move Without Pain",
      tag: "AI Film",
      client: "Spine & Joint Clinic",
      description:
        "A cinematic AI brand film for an orthopedic spine-and-joint clinic — a father sidelined by back pain watches life move on without him, before the clinic's mark resolves in a glowing animated spine. Story, shots and logo animation all AI-directed.",
    },
    {
      title: "Reels With Maki — It's a Story Problem",
      tag: "Kinetic Type",
      client: "Personal Brand",
      description:
        "A kinetic-typography pitch film for my own brand: the case for story over just “more content” — I don't hold the camera, I direct the idea, then point AI at it until it's a film.",
    },
    {
      title: "Reels With Maki — Let's Go Big",
      tag: "Motion Graphics",
      client: "Personal Brand",
      description:
        "A pure motion-graphics promo built in my own orange system — equalizer bars, nodes, and kinetic shapes on one message: stop playing small, AI means no big budget, let's go big.",
    },
    {
      title: "Reels With Maki — Portfolio in Motion",
      tag: "Hyperframe",
      client: "Personal Brand",
      description:
        "This very website turned into an animated film with Hyperframes — sections, tools, and selected work rebuilt as motion graphics from the site's own design.",
    },
    {
      title: "Mohamed Abbas Motors — Finance It",
      tag: "UI Animation",
      client: "Car Showroom",
      description:
        "A light, playful UI-animation concept for a car showroom that sells new and used cars on easy installments — not a real app. The lineup scrolls, one tap on “Finance it” under a Toyota Fortuner, and instant approval: the whole pitch as a smooth in-app flow, built entirely in code.",
    },
    {
      title: "Mohamed Abbas Motors — Ask ChatGPT",
      tag: "UI Animation",
      client: "Car Showroom",
      description:
        "A scroll-stopping hook built as a pixel-perfect ChatGPT recreation: ask for Egypt's best car-installment showroom — the answer reveals the brand.",
    },
    {
      title: "Quick Loan — Cars & Financing",
      tag: "UI Animation",
      client: "Automotive · Finance",
      description:
        "A UI animation reel for a car showroom and financing brand — designed and animated entirely in code from the brand's own assets.",
    },
    {
      title: "Demo Star — Men's Fashion Experience",
      tag: "UI Animation",
      client: "Menswear",
      description:
        "A product showcase animated entirely in code — HTML, CSS and JS directed with AI, rendered as a vertical fashion reel for the menswear brand.",
    },
  ],
  about: {
    eyebrow: "About Me",
    title: [{ t: "Law grad turned " }, { t: "creative", accent: true }],
    p1: "I studied law at Ain Shams, then went where the ideas were. At Renew Media I'm the creative mind behind 15+ brands: I do the research, find the one line a brand can own, and turn it into content plans, campaigns, and films.",
    p2: "I don't operate cameras or write code. I direct AI tools (Veo, FLUX, Gemini, Claude) the way a director runs a set: the idea, the brief, and the final call are mine. And every word ships in real Egyptian Arabic, reviewed until nothing reads as machine-made.",
    stats: [
      { n: "15+", label: "Clients" },
      { n: "10", label: "Industries" },
      { n: "2", label: "Markets · Egypt & KSA" },
    ],
    cv: "Download CV",
  },
  work: {
    title: [{ t: "Selected " }, { t: "Work", accent: true }],
    lede: "Real briefs, real clients, real deliverables: strategy, idea catalogs, and AI films that shipped.",
    cards: [
      {
        tag: "Rebranding",
        period: "Menswear",
        title: "Demo Star",
        body: "Repositioned a 1998 garment factory into a consumer menswear brand: a teardown of six local labels, the campaign line “Present For Your Day. Ready For Every Day.”, and a 150-idea content catalog.",
      },
      {
        tag: "AI Film",
        period: "Legal / IP",
        title: "Easy Way",
        body: "“The Thief Who Stole the Name” — a cinematic AI reel produced end to end: script, character sheets, Veo shots, voice-over, final edit. Plus a 24-idea post bank covering all eight services.",
      },
      {
        tag: "AI Film",
        period: "Sports Club",
        title: "Golf City Club",
        body: "“All Sports in One Place” — a vertical cinematic sports film cut from Veo 3.1 clips with morph transitions, plus 20 scripted reel concepts for a club with 188K followers.",
      },
      {
        tag: "Brand Foundation",
        period: "Manufacturing",
        title: "Como Tech",
        body: "Full foundation for a new wiring-devices maker: identity, tone of voice, a teardown of a 57-year incumbent, a content strategy, and a 60-idea catalog in consumer and B2B editions.",
      },
      {
        tag: "Insight & Ideas",
        period: "Automotive",
        title: "M.A. Motors",
        body: "One insight carried the account: buyers fear the “how much do you earn?” question more than the price. Twenty scored concepts built on “no employment check”, plus a 15-second AI reel.",
      },
      {
        tag: "Content Engine",
        period: "Agency · Egypt & KSA",
        title: "Renew Media",
        body: "The agency's own engine: a 150-idea catalog for 2026 and two AI stop-motion films, “The Story You Remember” for Egypt and “Star of the Party” written in Saudi dialect.",
      },
    ],
    more: "…plus Geroland, Quick Loan, Trust Motors, Access Laptop, and more across 10 industries.",
  },
  midCta: { text: "Seen enough? Tell me what you're building.", button: "Let's talk" },
  process: {
    title: [{ t: "How I " }, { t: "Work", accent: true }],
    lede: "A full content system, not one-off posts: research, strategy, ideas, and production — the same way for every brand.",
    steps: [
      { n: "01", t: "Research & insight", b: "Market, competitors, and audience first. I dig for the one real insight a brand can build on — before a single idea." },
      { n: "02", t: "Strategy & pillars", b: "One proposition the brand can own and weighted content pillars, so the feed has a direction instead of random posts." },
      { n: "03", t: "Ideas & content plan", b: "A content plan sized to the brand and budget — a month or several — with fully specified ideas: the hook, the format, the shot, and the caption — ready to shoot." },
      { n: "04", t: "Production", b: "From shoot lists to AI films. I direct the tools (Veo, FLUX, Gemini) and the camera the same way: idea, references, and final call are mine." },
      { n: "05", t: "Humanize & QA", b: "Review passes until nothing reads as AI — copy, pronunciation, and Arabic letter by letter, in real Egyptian dialect." },
      { n: "06", t: "Deliver & iterate", b: "Staged revisions, organized folders, nothing deleted — then read the numbers and sharpen the next batch." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: [{ t: "Got a brand that needs a " }, { t: "voice", accent: true }, { t: "?" }],
    lede: "Tell me what you're building — I'll tell you how it should sound.",
    whatsapp: "WhatsApp",
    loc: "Cairo, Egypt",
  },
  footer: "© 2026 Ahmed Mekki — built by directing the same tools I use for clients.",
};

const ar: SiteContent = {
  // Layout stays LTR in Arabic too (by request) — see i18n.tsx.
  dir: "ltr",
  a11y: { skip: "تخطَّ إلى المحتوى", menu: "القائمة", close: "إغلاق" },
  nav: {
    home: "الرئيسية",
    services: "الخدمات",
    videos: "الفيديوهات",
    about: "عنّي",
    work: "أعمالي",
    process: "المنهجية",
    contact: "تواصل",
    talk: "لنتحدث",
  },
  hero: {
    hello: "مرحبًا!",
    line1Pre: "أنا ",
    name: "أحمد",
    line1Post: "،",
    line2: "صانع محتوى بالذكاء الاصطناعي",
    quote:
      "الفكرة، والتوجيه، والذوق، والقرار النهائي — هذا الجزء لي. والذكاء الاصطناعي يتولّى العمل الشاق.",
    ratingNum: "+15",
    ratingLabel: "عميل خدمتُهم",
    ctaWork: "شاهد أعمالي",
    ctaHire: "لنتحدث",
    photoAlt: "أحمد مكي، صانع محتوى ومخرج فيديو بالذكاء الاصطناعي",
  },
  services: {
    title: [{ t: "خدماتي", accent: true }],
    lede: "البحث أولًا، ثم الفكرة، ثم الإنتاج. كل علامة تجارية تحصل على صوت مصمَّم لها — لا قالب مُعاد استخدامه خمس عشرة مرة.",
    cards: [
      {
        title: "استراتيجية العلامة وتخطيط المحتوى",
        body: "تحليل المنافسين، وطرح واحد تمتلكه كل علامة، وركائز محتوى موزونة، وخطط محتوى على مقاس العلامة والميزانية — من شهر واحد إلى كتالوج لعدة أشهر من الأفكار المحدَّدة بالكامل.",
      },
      {
        title: "إنتاج الفيديو بالذكاء الاصطناعي",
        body: "من البداية إلى النهاية: الفكرة ← السيناريو المصوَّر ← أوراق الشخصيات ← أوامر Veo ← التعليق الصوتي العربي ← المونتاج النهائي. شخصيات ثابتة من لقطة إلى أخرى.",
      },
      {
        title: "كتابة المحتوى وصوت العلامة",
        body: "صوت مميَّز لكل عميل بالعامية المصرية الحقيقية — مكتوب كما يتحدّث الناس فعلًا، ومُراجَع حتى تختفي أي نكهة آلية.",
      },
    ],
  },
  videosSection: {
    head: [
      { t: "كل " },
      { t: "فيلم", accent: true },
      { t: " يبدأ بـ" },
      { t: "فكرة.", accent: true },
    ],
    cycle: ["فيلم", "ريّل", "حكاية", "لقطة", "إعلان"],
    sub: "سيناريو، وإخراج، وإنتاج بالذكاء الاصطناعي، ومونتاج.",
    groups: ["أفلام سينمائية بالذكاء الاصطناعي", "موشن جرافيك وتايبوغرافي", "أنيميشن واجهات"],
    prev: "الفيلم السابق",
    next: "الفيلم التالي",
    selectFilm: "اختر فيلمًا",
    durationLabel: "المدة",
  },
  player: {
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
    fullscreen: "ملء الشاشة",
    rewind: "إرجاع 15 ثانية",
    forward: "تقديم 15 ثانية",
    showDetails: "إظهار التفاصيل",
    hideDetails: "إخفاء التفاصيل",
    seek: "التنقّل في الفيديو",
  },
  videos: [
    {
      title: "Renew Media — الحكاية التي تتذكّرها",
      tag: "ستوب موشن",
      client: "وكالة · مصر",
      description:
        "فيلم ستوب موشن بالذكاء الاصطناعي لأجندة الوكالة لعام 2026 — حكاية مصرية حنينة، مُخرَجة لقطةً بلقطة.",
    },
    {
      title: "Renew Media — نجم الحفلة",
      tag: "ستوب موشن",
      client: "وكالة · السعودية",
      description:
        "فيلم ستوب موشن بالذكاء الاصطناعي مكتوب باللهجة السعودية، بمونتاج يقوده التعليق الصوتي — النظام نفسه بصوت جديد.",
    },
    {
      title: "Easy Way — اللص الذي سرق الاسم",
      tag: "فيلم AI",
      client: "قانوني / ملكية فكرية",
      description:
        "ريّل سينمائي بالذكاء الاصطناعي من البداية إلى النهاية: سيناريو، وأوراق شخصيات، ولقطات Veo، وتعليق صوتي عربي، ومونتاج نهائي.",
    },
    {
      title: "Golf City Club — كل الرياضات في مكان واحد",
      tag: "فيلم AI",
      client: "نادٍ رياضي",
      description:
        "فيلم رياضي سينمائي عمودي مُجمَّع من لقطات Veo 3.1 بانتقالات تحوّلية، لنادٍ يتابعه 188 ألف شخص.",
    },
    {
      title: "الوصيف موتورز — يومُك… وسيارتُك",
      tag: "فيلم AI",
      client: "معرض سيارات",
      description:
        "فيلم إعلاني سينمائي بالذكاء الاصطناعي لمعرض سيارات — حكاية يومٍ كامل تُرافق سائقًا من قهوة الصباح حتى مقود سيارته الجديدة، مكتوبةً ومُخرَجةً ومُنتَجةً بالكامل بالذكاء الاصطناعي.",
    },
    {
      title: "د. أحمد الكاشف — حركة بلا ألم",
      tag: "فيلم AI",
      client: "عيادة عمود فقري ومفاصل",
      description:
        "فيلم علامة سينمائي بالذكاء الاصطناعي لعيادة عظام متخصّصة في العمود الفقري والمفاصل — أبٌ أنهكه ألم الظهر يرى الحياة تتحرّك من دونه، ثم يتجلّى شعار العيادة في رسمٍ متوهّج للعمود الفقري. الحكاية واللقطات وأنيميشن الشعار كلّها بتوجيه الذكاء الاصطناعي.",
    },
    {
      title: "Reels With Maki — إنها مشكلة حكاية",
      tag: "تايبوغرافي متحرّكة",
      client: "علامة شخصية",
      description:
        "فيلم تايبوغرافي متحرّك صنعتُه لعلامتي الشخصية: الحجّة أن المشكلة حكاية لا مجرّد «محتوى أكثر» — لا أُمسك الكاميرا، بل أُوجّه الفكرة ثم أُصوّبها بالذكاء الاصطناعي حتى تصير فيلمًا.",
    },
    {
      title: "Reels With Maki — لِنُفكّر بحجم أكبر",
      tag: "موشن جرافيك",
      client: "علامة شخصية",
      description:
        "فيلم موشن جرافيك خالص بنظام الألوان البرتقالي الخاص بي — أشرطة إيكولايزر وعُقَد وأشكال متحرّكة تحمل رسالة واحدة: كُفَّ عن اللعب على الصغير، فالذكاء الاصطناعي يعني ألّا حاجة لميزانية ضخمة… لِنَبدأ كبيرًا.",
    },
    {
      title: "Reels With Maki — الموقع يتحرّك",
      tag: "هايبرفريم",
      client: "علامة شخصية",
      description:
        "هذا الموقع نفسه تحوّل إلى فيلم متحرّك بتقنية Hyperframes — الأقسام والأدوات والأعمال المختارة أُعيد بناؤها موشن جرافيك من تصميم الموقع ذاته.",
    },
    {
      title: "محمد عباس موتورز — قسّطها",
      tag: "أنيميشن واجهات",
      client: "معرض سيارات",
      description:
        "فكرة أنيميشن واجهات خفيفة ولذيذة لمعرض سيارات بيبيع جديد ومستعمل بالتقسيط — مش تطبيق حقيقي. السيارات بتعدّي، وضغطة على «قسّطها» تحت تويوتا فورتشنر، فموافقة فورية: العرض كله في شكل واجهة تطبيق، متعمِل بالكامل بالكود.",
    },
    {
      title: "محمد عباس موتورز — اسأل ChatGPT",
      tag: "أنيميشن واجهات",
      client: "معرض سيارات",
      description:
        "خُطّاف يوقف التمرير بإعادة بناء دقيقة لواجهة ChatGPT: اسأل عن أفضل معرض تقسيط سيارات في مصر — فيأتي الجواب كاشفًا عن العلامة.",
    },
    {
      title: "Quick Loan — سيارات وتمويل",
      tag: "أنيميشن واجهات",
      client: "سيارات · تمويل",
      description:
        "ريّل أنيميشن واجهات لمعرض سيارات وشركة تمويل — مُصمَّم ومتحرّك بالكامل بالكود من أصول العلامة نفسها.",
    },
    {
      title: "Demo Star — تجربة أزياء رجالية",
      tag: "أنيميشن واجهات",
      client: "أزياء رجالية",
      description:
        "عرض منتج متحرّك بالكامل بالكود — HTML وCSS وJS بتوجيه الذكاء الاصطناعي، كريّل أزياء عمودي للعلامة.",
    },
  ],
  about: {
    eyebrow: "نبذة عنّي",
    title: [{ t: "خريج حقوق تحوّل إلى " }, { t: "الإبداع", accent: true }],
    p1: "درستُ الحقوق في جامعة عين شمس، ثم اتجهتُ حيث الأفكار. في Renew Media أنا العقل الإبداعي خلف أكثر من 15 علامة تجارية: أُجري البحث، وأجد الجملة الواحدة التي يمكن أن تمتلكها العلامة، وأحوّلها إلى خطط محتوى وحملات وأفلام.",
    p2: "لا أُشغّل الكاميرات ولا أكتب الأكواد. أُوجّه أدوات الذكاء الاصطناعي (Veo وFLUX وGemini وClaude) كما يدير المخرج موقع التصوير: الفكرة والتوجيه والقرار النهائي لي. وكل كلمة تصدر بالعامية المصرية الحقيقية، مُراجَعة حتى لا يبدو أي شيء مصنوعًا آليًا.",
    stats: [
      { n: "+15", label: "عميل" },
      { n: "10", label: "مجالات" },
      { n: "2", label: "سوقان · مصر والسعودية" },
    ],
    cv: "تحميل السيرة الذاتية",
  },
  work: {
    title: [{ t: "أعمال " }, { t: "مختارة", accent: true }],
    lede: "بريفات حقيقية، وعملاء حقيقيون، وتسليمات حقيقية: استراتيجيات، وكتالوجات أفكار، وأفلام بالذكاء الاصطناعي خرجت إلى النور.",
    cards: [
      {
        tag: "إعادة علامة",
        period: "أزياء رجالية",
        title: "Demo Star",
        body: "إعادة تموضع مصنع ملابس من 1998 إلى علامة أزياء رجالية استهلاكية: تحليل ست علامات محلية، والجملة الحملية «حاضر ليومك. جاهز لكل يوم.»، وكتالوج محتوى من 150 فكرة.",
      },
      {
        tag: "فيلم AI",
        period: "قانوني / ملكية فكرية",
        title: "Easy Way",
        body: "«اللص الذي سرق الاسم» — ريّل سينمائي بالذكاء الاصطناعي من البداية إلى النهاية: سيناريو، وأوراق شخصيات، ولقطات Veo، وتعليق صوتي، ومونتاج نهائي. بالإضافة إلى بنك من 24 فكرة يغطّي الخدمات الثماني كلها.",
      },
      {
        tag: "فيلم AI",
        period: "نادٍ رياضي",
        title: "Golf City Club",
        body: "«كل الرياضات في مكان واحد» — فيلم رياضي سينمائي عمودي مُجمَّع من لقطات Veo 3.1 بانتقالات تحوّلية، مع 20 فكرة ريّل مكتوبة لنادٍ يتابعه 188 ألف شخص.",
      },
      {
        tag: "تأسيس علامة",
        period: "تصنيع",
        title: "Como Tech",
        body: "تأسيس كامل لمُصنّع أجهزة توصيلات جديد: هوية، ونبرة صوت، وتحليل لمنافس عمره 57 عامًا، واستراتيجية محتوى، وكتالوج من 60 فكرة بنسختين استهلاكية وB2B.",
      },
      {
        tag: "رؤى وأفكار",
        period: "سيارات",
        title: "M.A. Motors",
        body: "رؤية واحدة حملت الحساب كله: المشترون يخشون سؤال «بتكسب كام؟» أكثر من السعر نفسه. عشرون فكرة مُقيَّمة مبنية على «بدون إثبات دخل»، مع ريّل بالذكاء الاصطناعي مدته 15 ثانية.",
      },
      {
        tag: "محرّك محتوى",
        period: "وكالة · مصر والسعودية",
        title: "Renew Media",
        body: "محرّك الوكالة نفسها: كتالوج من 150 فكرة لعام 2026 وفيلمَا ستوب موشن بالذكاء الاصطناعي، «الحكاية التي تتذكّرها» لمصر و«نجم الحفلة» مكتوب باللهجة السعودية.",
      },
    ],
    more: "…بالإضافة إلى Geroland وQuick Loan وTrust Motors وAccess Laptop، وغيرها عبر 10 مجالات.",
  },
  midCta: { text: "رأيت ما يكفي؟ أخبرني بما تبنيه.", button: "لنتحدث" },
  process: {
    title: [{ t: "طريقة " }, { t: "عملي", accent: true }],
    lede: "نظام محتوى متكامل، لا منشورات متفرّقة: بحث، واستراتيجية، وأفكار، وإنتاج — بالطريقة نفسها لكل علامة.",
    steps: [
      { n: "01", t: "البحث والرؤية", b: "السوق والمنافسون والجمهور أولًا. أُنقّب عن الرؤية الحقيقية الواحدة التي تبني عليها العلامة — قبل أي فكرة." },
      { n: "02", t: "الاستراتيجية والركائز", b: "طرح واحد تمتلكه العلامة وركائز محتوى موزونة، ليكون للحساب اتجاه بدل منشورات عشوائية." },
      { n: "03", t: "الأفكار وخطة المحتوى", b: "خطة محتوى على مقاس العلامة والميزانية — شهر أو أكثر — بأفكار محدَّدة بالكامل: الخطّاف، والقالب، واللقطة، والكابشن — جاهزة للتصوير." },
      { n: "04", t: "الإنتاج", b: "من قوائم التصوير إلى أفلام الذكاء الاصطناعي. أُوجّه الأدوات (Veo وFLUX وGemini) والكاميرا بالطريقة نفسها: الفكرة والمراجع والقرار النهائي لي." },
      { n: "05", t: "الأنسنة والمراجعة", b: "جولات مراجعة حتى لا يبدو أي شيء آليًا — النص والنطق والعربية حرفًا حرفًا، بالعامية المصرية الحقيقية." },
      { n: "06", t: "التسليم والتحسين", b: "مراجعات على مراحل، ومجلدات منظّمة، ولا شيء يُحذف — ثم أقرأ الأرقام وأُحسّن الدفعة التالية." },
    ],
  },
  contact: {
    eyebrow: "تواصل",
    title: [{ t: "عندك علامة تجارية تحتاج " }, { t: "صوتًا", accent: true }, { t: "؟" }],
    lede: "احكِ لي عمّا تبنيه — وسأخبرك كيف ينبغي أن يبدو صوته.",
    whatsapp: "واتساب",
    loc: "القاهرة، مصر",
  },
  footer: "© 2026 أحمد مكي — بُنيَ بتوجيه الأدوات نفسها التي أستخدمها لعملائي.",
};

export const CONTENT: Record<Lang, SiteContent> = { en, ar };
