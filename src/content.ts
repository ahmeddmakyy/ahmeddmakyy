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
    name: string;
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
    line2: "AI Content Creator & Video Editor",
    quote:
      "The idea, the brief, the edit, and the final call — that part is mine. AI does the heavy lifting.",
    ratingNum: "15+",
    ratingLabel: "Clients Served",
    ctaWork: "See My Work",
    ctaHire: "Let's talk",
    photoAlt: "Ahmed Maki, AI content creator and video editor",
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
    name: "Ahmed Maki",
    eyebrow: "About Me",
    title: [{ t: "Law grad turned " }, { t: "creative", accent: true }],
    p1: "I studied law at Ain Shams, then went where the ideas were. At Renew Media I'm the creative mind behind 15+ brands: I do the research, find the one line a brand can own, and turn it into content plans, campaigns, and films.",
    p2: "I don't operate cameras or write code. I direct AI tools — Veo, FLUX, Gemini, Claude — the way a director runs a set, then edit the footage into the finished film: pacing, sound, and the final cut. The idea, the brief, and the final call are mine. And every word ships in real Egyptian Arabic, reviewed until nothing reads as machine-made.",
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
  footer: "© 2026 Ahmed Maki — built by directing the same tools I use for clients.",
};

const ar: SiteContent = {
  // Layout stays LTR in Arabic too (by request) — see i18n.tsx.
  dir: "ltr",
  a11y: { skip: "روح للمحتوى", menu: "القائمة", close: "اقفل" },
  nav: {
    home: "الرئيسية",
    services: "الخدمات",
    videos: "الفيديوهات",
    about: "عنّي",
    work: "شغلي",
    process: "طريقتي",
    contact: "كلّمني",
    talk: "يلا نتكلم",
  },
  hero: {
    hello: "أهلاً!",
    line1Pre: "أنا ",
    name: "أحمد",
    line1Post: "،",
    line2: "صانع محتوى بالذكاء الاصطناعي ومونتير",
    quote:
      "الفكرة، والبريف، والمونتاج، والقرار النهائي — الجزء ده بتاعي. والذكاء الاصطناعي بيشيل الحِمل التقيل.",
    ratingNum: "+15",
    ratingLabel: "عميل اشتغلت معاهم",
    ctaWork: "شوف شغلي",
    ctaHire: "يلا نتكلم",
    photoAlt: "أحمد مكي، صانع محتوى بالذكاء الاصطناعي ومونتير فيديو",
  },
  services: {
    title: [{ t: "خدماتي", accent: true }],
    lede: "الأول بحث، بعدين الفكرة، بعدين الإنتاج. كل براند بياخد صوت متعمِل مخصوص ليه — مش قالب واحد بنكرّره خمستاشر مرة.",
    cards: [
      {
        title: "استراتيجية البراند وتخطيط المحتوى",
        body: "تفكيك المنافسين، وزاوية واحدة كل براند يملكها، وركائز محتوى موزونة، وخطة محتوى على مقاس البراند والميزانية — من شهر واحد لحد كتالوج أفكار متفصّلة بالكامل لكذا شهر.",
      },
      {
        title: "إنتاج الفيديو بالذكاء الاصطناعي",
        body: "من الألف للياء: الفكرة ← الاستوري بورد ← أوراق الشخصيات ← برومبتات Veo ← الڤويس أوفر العربي ← المونتاج النهائي. شخصيات ثابتة من لقطة للتانية.",
      },
      {
        title: "كتابة المحتوى وصوت البراند",
        body: "صوت مختلف لكل عميل بعامية مصرية حقيقية — متكتب زي ما الناس بتتكلم فعلاً، ومتراجَع لحد ما محدش يحس إنه AI.",
      },
    ],
  },
  videosSection: {
    head: [
      { t: "كل " },
      { t: "فيلم", accent: true },
      { t: " بيبدأ بـ" },
      { t: "فكرة.", accent: true },
    ],
    cycle: ["فيلم", "ريلز", "حكاية", "لقطة", "إعلان"],
    sub: "سيناريو، وإخراج، وإنتاج بالذكاء الاصطناعي، ومونتاج.",
    groups: ["أفلام سينمائية بالذكاء الاصطناعي", "موشن جرافيك وتايبوغرافي", "أنيميشن واجهات"],
    prev: "الفيلم اللي فات",
    next: "الفيلم اللي بعده",
    selectFilm: "اختار فيلم",
    durationLabel: "المدة",
  },
  player: {
    play: "شغّل",
    pause: "وقّف",
    mute: "اكتم الصوت",
    unmute: "شغّل الصوت",
    fullscreen: "ملء الشاشة",
    rewind: "رجّع 15 ثانية",
    forward: "قدّم 15 ثانية",
    showDetails: "افتح التفاصيل",
    hideDetails: "اقفل التفاصيل",
    seek: "التنقل في الفيديو",
  },
  videos: [
    {
      title: "Renew Media — الحكاية التي تتذكّرها",
      tag: "ستوب موشن",
      client: "وكالة · مصر",
      description:
        "فيلم ستوب موشن بالذكاء الاصطناعي لأجندة الوكالة لسنة 2026 — حكاية مصرية فيها حنية لزمان، متخرجة لقطة لقطة بإيدي.",
    },
    {
      title: "Renew Media — نجم الحفلة",
      tag: "ستوب موشن",
      client: "وكالة · السعودية",
      description:
        "فيلم ستوب موشن بالذكاء الاصطناعي متكتب باللهجة السعودية، ومونتاجه ماشي ورا الڤويس أوفر — نفس النظام بصوت جديد.",
    },
    {
      title: "Easy Way — اللص الذي سرق الاسم",
      tag: "فيلم AI",
      client: "قانوني / ملكية فكرية",
      description:
        "ريلز سينمائي بالذكاء الاصطناعي متعمل من أوله لآخره: سيناريو، وأوراق شخصيات، ولقطات Veo، وڤويس أوفر عربي، ومونتاج نهائي.",
    },
    {
      title: "Golf City Club — كل الرياضات في مكان واحد",
      tag: "فيلم AI",
      client: "نادي رياضي",
      description:
        "فيلم رياضي سينمائي طولي متجمّع من لقطات Veo 3.1 بانتقالات مورف، لنادي بيتابعه 188 ألف شخص.",
    },
    {
      title: "الوصيف موتورز — يومُك… وسيارتُك",
      tag: "فيلم AI",
      client: "معرض عربيات",
      description:
        "فيلم إعلاني سينمائي بالذكاء الاصطناعي لمعرض عربيات — حكاية يوم كامل بتمشي مع سواق من قهوة الصبح لحد ما يمسك عجلة عربيته الجديدة، متكتبة ومتخرجة ومتعملة بالكامل بالذكاء الاصطناعي.",
    },
    {
      title: "د. أحمد الكاشف — حركة بلا ألم",
      tag: "فيلم AI",
      client: "عيادة عمود فقري ومفاصل",
      description:
        "فيلم براند سينمائي بالذكاء الاصطناعي لعيادة عظام متخصصة في العمود الفقري والمفاصل — أب تعبان من وجع ضهره وبيتفرّج على الحياة ماشية من غيره، لحد ما لوجو العيادة يظهر في رسمة عمود فقري منوّرة. الحكاية واللقطات وأنيميشن اللوجو كلها بتوجيه الذكاء الاصطناعي.",
    },
    {
      title: "Reels With Maki — إنها مشكلة حكاية",
      tag: "تايبوغرافي متحرّكة",
      client: "براند شخصي",
      description:
        "فيلم تايبوغرافي متحرك عملته لبراندي الشخصي: الفكرة إن المشكلة محتاجة حكاية مش مجرد «محتوى أكتر» — أنا مش ماسك الكاميرا، أنا بوجّه الفكرة وبعدين بصوّب الذكاء الاصطناعي عليها لحد ما تبقى فيلم.",
    },
    {
      title: "Reels With Maki — لِنُفكّر بحجم أكبر",
      tag: "موشن جرافيك",
      client: "براند شخصي",
      description:
        "برومو موشن جرافيك خالص بنظام الألوان البرتقالي بتاعي — بارات إيكولايزر ونقط وأشكال متحركة على رسالة واحدة: بطّل تلعب على الصغير، الذكاء الاصطناعي معناه إنك مش محتاج ميزانية ضخمة… يلا نكبّر.",
    },
    {
      title: "Reels With Maki — الموقع يتحرّك",
      tag: "هايبرفريم",
      client: "براند شخصي",
      description:
        "الموقع ده نفسه اتحوّل لفيلم متحرك بـ Hyperframes — الأقسام والأدوات والشغل المختار اتعمل تاني موشن جرافيك من تصميم الموقع نفسه.",
    },
    {
      title: "محمد عباس موتورز — قسّطها",
      tag: "أنيميشن واجهات",
      client: "معرض عربيات",
      description:
        "فكرة أنيميشن واجهات خفيفة ولذيذة لمعرض عربيات بيبيع جديد ومستعمل بالتقسيط — مش تطبيق حقيقي. العربيات بتعدّي، وضغطة على «قسّطها» تحت تويوتا فورتشنر، وموافقة فورية: العرض كله في شكل واجهة تطبيق، متعمل بالكامل بالكود.",
    },
    {
      title: "محمد عباس موتورز — اسأل ChatGPT",
      tag: "أنيميشن واجهات",
      client: "معرض عربيات",
      description:
        "هوك بيوقّف السكرول، معمول كنسخة طبق الأصل من واجهة ChatGPT: اسأل عن أحسن معرض تقسيط عربيات في مصر — والجواب بيكشف البراند.",
    },
    {
      title: "Quick Loan — سيارات وتمويل",
      tag: "أنيميشن واجهات",
      client: "عربيات · تمويل",
      description:
        "ريلز أنيميشن واجهات لمعرض عربيات وشركة تمويل — متصمّم ومتحرك بالكامل بالكود من أصول البراند نفسه.",
    },
    {
      title: "Demo Star — تجربة أزياء رجالية",
      tag: "أنيميشن واجهات",
      client: "أزياء رجالية",
      description:
        "عرض منتج متحرك بالكامل بالكود — HTML وCSS وJS بتوجيه الذكاء الاصطناعي، كريلز أزياء طولي للبراند.",
    },
  ],
  about: {
    name: "أحمد مكي",
    eyebrow: "شوية عنّي",
    title: [{ t: "خريج حقوق بقى " }, { t: "مبدع", accent: true }],
    p1: "درست حقوق في عين شمس، وبعدين رحت ورا الأفكار. في Renew Media أنا العقل الإبداعي ورا أكتر من 15 براند: بعمل البحث، وبلاقي الجملة الواحدة اللي البراند يقدر يملكها، وبحوّلها لخطط محتوى وحملات وأفلام.",
    p2: "أنا مش بشغّل كاميرات ولا بكتب كود. أنا بوجّه أدوات الذكاء الاصطناعي — Veo وFLUX وGemini وClaude — زي ما المخرج بيدير موقع التصوير، وبعدين بمنتج اللقطات بنفسي لحد الفيلم النهائي: الإيقاع، والصوت، والقطع النهائي. الفكرة والبريف والقرار النهائي بتاعي. وكل كلمة بتطلع بعامية مصرية حقيقية، متراجعة لحد ما محدش يحس إن فيه أي حاجة معمولة بالـ AI.",
    stats: [
      { n: "+15", label: "عميل" },
      { n: "10", label: "مجالات" },
      { n: "2", label: "سوقين · مصر والسعودية" },
    ],
    cv: "نزّل الـ CV",
  },
  work: {
    title: [{ t: "شغل " }, { t: "مختار", accent: true }],
    lede: "بريفات حقيقية، وعملاء حقيقيين، وتسليمات حقيقية: استراتيجيات، وكتالوجات أفكار، وأفلام بالذكاء الاصطناعي طلعت للنور فعلاً.",
    cards: [
      {
        tag: "ريبراندنج",
        period: "أزياء رجالية",
        title: "Demo Star",
        body: "إعادة تموضع مصنع هدوم من 1998 لبراند أزياء رجالي استهلاكي: تفكيك ست براندات محلية، ولاين الحملة «حاضر ليومك. جاهز لكل يوم.»، وكتالوج محتوى 150 فكرة.",
      },
      {
        tag: "فيلم AI",
        period: "قانوني / ملكية فكرية",
        title: "Easy Way",
        body: "«اللص الذي سرق الاسم» — ريلز سينمائي بالذكاء الاصطناعي من أول لقطة لآخر قطع: سيناريو، وأوراق شخصيات، ولقطات Veo، وڤويس أوفر، ومونتاج نهائي. وكمان بنك 24 فكرة بيغطي الخدمات الـ8 كلها.",
      },
      {
        tag: "فيلم AI",
        period: "نادي رياضي",
        title: "Golf City Club",
        body: "«كل الرياضات في مكان واحد» — فيلم رياضي سينمائي طولي متجمّع من لقطات Veo 3.1 بانتقالات مورف، مع 20 فكرة ريلز متكتبة لنادي بيتابعه 188 ألف شخص.",
      },
      {
        tag: "تأسيس براند",
        period: "تصنيع",
        title: "Como Tech",
        body: "تأسيس كامل لمصنّع أجهزة توصيلات جديد: هوية، ونبرة صوت، وتفكيك المنافس الكبير اللي عمره 57 سنة، واستراتيجية محتوى، وكتالوج 60 فكرة بنسختين استهلاكية وB2B.",
      },
      {
        tag: "رؤى وأفكار",
        period: "عربيات",
        title: "M.A. Motors",
        body: "إنسايت واحد شال الحساب كله: الناس بتخاف من سؤال «بتكسب كام؟» أكتر من السعر نفسه. عشرين فكرة متقيّمة مبنية على «من غير إثبات دخل»، مع ريلز بالذكاء الاصطناعي مدته 15 ثانية.",
      },
      {
        tag: "محرّك محتوى",
        period: "وكالة · مصر والسعودية",
        title: "Renew Media",
        body: "ماكينة المحتوى بتاعت الوكالة نفسها: كتالوج 150 فكرة لسنة 2026 وفيلمين ستوب موشن بالذكاء الاصطناعي، «الحكاية التي تتذكّرها» لمصر و«نجم الحفلة» متكتب باللهجة السعودية.",
      },
    ],
    more: "…وكمان Geroland وQuick Loan وTrust Motors وAccess Laptop، وغيرهم في 10 مجالات.",
  },
  midCta: { text: "شوفت كفاية؟ قوللي بتبني إيه.", button: "يلا نتكلم" },
  process: {
    title: [{ t: "طريقة " }, { t: "شغلي", accent: true }],
    lede: "نظام محتوى متكامل، مش بوستات متفرّقة: بحث، واستراتيجية، وأفكار، وإنتاج — بنفس الطريقة لكل براند.",
    steps: [
      { n: "01", t: "البحث والإنسايت", b: "السوق والمنافسين والجمهور الأول. بدوّر على الإنسايت الحقيقي الواحد اللي البراند يبني عليه — قبل أي فكرة." },
      { n: "02", t: "الاستراتيجية والركائز", b: "زاوية واحدة البراند يملكها وركائز محتوى موزونة، عشان الحساب يبقى ليه اتجاه بدل بوستات عشوائية." },
      { n: "03", t: "الأفكار وخطة المحتوى", b: "خطة محتوى على مقاس البراند والميزانية — شهر أو أكتر — بأفكار محددة بالكامل: الهوك، والفورمات، واللقطة، والكابشن — جاهزة للتصوير." },
      { n: "04", t: "الإنتاج", b: "من ليستة التصوير لأفلام الذكاء الاصطناعي. بوجّه الأدوات (Veo وFLUX وGemini) والكاميرا بنفس الطريقة: الفكرة والمراجع والقرار النهائي بتاعي." },
      { n: "05", t: "اللمسة البشرية والمراجعة", b: "جولات مراجعة لحد ما محدش يحس إن فيه أي حاجة معمولة بالـ AI — النص والنطق والعربي حرف حرف، بعامية مصرية حقيقية." },
      { n: "06", t: "التسليم والتحسين", b: "مراجعات على مراحل، وفولدرات منظّمة، ومحدش بيمسح حاجة — وبعدين بقرا الأرقام وبحسّن الدفعة اللي بعدها." },
    ],
  },
  contact: {
    eyebrow: "كلّمني",
    title: [{ t: "عندك براند محتاج " }, { t: "صوت", accent: true }, { t: "؟" }],
    lede: "احكيلي بتبني إيه — وأنا هقوللك صوته المفروض يبقى عامل إزاي.",
    whatsapp: "واتساب",
    loc: "القاهرة، مصر",
  },
  footer: "© 2026 أحمد مكي — متعمل بتوجيه نفس الأدوات اللي بستخدمها مع عملائي.",
};

export const CONTENT: Record<Lang, SiteContent> = { en, ar };
