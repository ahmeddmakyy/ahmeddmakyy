-- ─────────────────────────────────────────────────────────────
-- Seed: an exact copy of what the live site renders today, so the
-- database starts out matching the site instead of empty.
--
-- ON CONFLICT DO NOTHING everywhere — re-running this will never
-- overwrite an edit made from the dashboard.
--
-- Text is dollar-quoted ($t$…$t$) so apostrophes and Arabic quotation
-- marks pass through untouched.
-- ─────────────────────────────────────────────────────────────

-- ── reels (17, in their current order) ───────────────────────
-- category: 0 Cinematic AI Ads · 1 Motion Graphics & Type · 2 UI Animation
-- poster_url stays null: the bundled webp posters already in the app are used.
insert into public.reels
  (slug, sort_order, category, is_featured, video_url,
   title_en, title_ar, tag_en, tag_ar, client_en, client_ar, description_en, description_ar)
values
  ($t$renew-story$t$, 0, 0, true,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334179/compressO-renew_media_motion_graphic_ybku0x.mp4$t$,
   $t$Renew Media — The Story You Remember$t$,
   $t$Renew Media — الحكاية التي تتذكّرها$t$,
   $t$Stop-Motion$t$, $t$ستوب موشن$t$,
   $t$Agency · Egypt$t$, $t$وكالة · مصر$t$,
   $t$AI stop-motion reel for the agency’s own 2026 slate — nostalgic Egyptian storytelling, hand-directed shot by shot.$t$,
   $t$ريلز ستوب موشن بالذكاء الاصطناعي لأجندة الوكالة لسنة 2026 — حكاية مصرية فيها حنية لزمان، متخرجة لقطة لقطة بإيدي.$t$),

  ($t$renew-star$t$, 1, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334122/compressO-RENEW_MEDIA_MOTION_KSA_kjlqd8.mp4$t$,
   $t$Renew Media — Star of the Party$t$,
   $t$Renew Media — نجم الحفلة$t$,
   $t$Stop-Motion$t$, $t$ستوب موشن$t$,
   $t$Agency · KSA$t$, $t$وكالة · السعودية$t$,
   $t$AI stop-motion reel written in Saudi dialect, cut to a VO-first edit — the same system, a new voice.$t$,
   $t$ريلز ستوب موشن بالذكاء الاصطناعي متكتب باللهجة السعودية، ومونتاجه ماشي ورا الڤويس أوفر — نفس النظام بصوت جديد.$t$),

  ($t$easy-way$t$, 2, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784335254/easy_way_iwy4h2.mp4$t$,
   $t$Easy Way — The Thief Who Stole the Name$t$,
   $t$Easy Way — اللص الذي سرق الاسم$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Legal / IP$t$, $t$قانوني / ملكية فكرية$t$,
   $t$Cinematic AI reel produced end to end: script, character sheets, Veo shots, Arabic voice-over, final edit.$t$,
   $t$ريلز سينمائي بالذكاء الاصطناعي متعمل من أوله لآخره: سيناريو، وأوراق شخصيات، ولقطات Veo، وڤويس أوفر عربي، ومونتاج نهائي.$t$),

  ($t$golf-city$t$, 3, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334512/compressO-%D8%AC%D9%88%D9%84%D9%81_%D8%B3%D9%8A%D8%AA%D9%8A_zzudoe.mp4$t$,
   $t$Golf City Club — All Sports in One Place$t$,
   $t$Golf City Club — كل الرياضات في مكان واحد$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Sports Club$t$, $t$نادي رياضي$t$,
   $t$Vertical cinematic sports reel cut from Veo 3.1 clips with morph transitions for a club with 188K followers.$t$,
   $t$ريلز رياضي سينمائي طولي متجمّع من لقطات Veo 3.1 بانتقالات مورف، لنادي بيتابعه 188 ألف شخص.$t$),

  ($t$alwassef$t$, 4, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334088/elwaseef_final_hfkw8g.mp4$t$,
   $t$Alwassef Motors — Your Day, Your Car$t$,
   $t$الوصيف موتورز — يومُك… وسيارتُك$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Car Dealership$t$, $t$معرض عربيات$t$,
   $t$A cinematic AI ad for a car dealership — a day-in-the-life story that carries one driver from his morning coffee to the wheel of his new car, written, directed and produced end to end with AI.$t$,
   $t$إعلان سينمائي بالذكاء الاصطناعي لمعرض عربيات — حكاية يوم كامل بتمشي مع سواق من قهوة الصبح لحد ما يمسك عجلة عربيته الجديدة، متكتبة ومتخرجة ومتعملة بالكامل بالذكاء الاصطناعي.$t$),

  ($t$dr-elkashef$t$, 5, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784335848/0625_1_1_l1vbcl.mp4$t$,
   $t$Dr. Ahmed ElKashef — Move Without Pain$t$,
   $t$د. أحمد الكاشف — حركة بلا ألم$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Spine & Joint Clinic$t$, $t$عيادة عمود فقري ومفاصل$t$,
   $t$A cinematic AI ad for an orthopedic spine-and-joint clinic — a father sidelined by back pain watches life move on without him, before the clinic’s mark resolves in a glowing animated spine. Story, shots and logo animation all AI-directed.$t$,
   $t$إعلان سينمائي بالذكاء الاصطناعي لعيادة عظام متخصصة في العمود الفقري والمفاصل — أب تعبان من وجع ضهره وبيتفرّج على الحياة ماشية من غيره، لحد ما لوجو العيادة يظهر في رسمة عمود فقري منوّرة. الحكاية واللقطات وأنيميشن اللوجو كلها بتوجيه الذكاء الاصطناعي.$t$),

  ($t$story-problem$t$, 6, 1, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334599/text-motion_muphmj.mp4$t$,
   $t$Reels With Maki — It’s a Story Problem$t$,
   $t$Reels With Maki — إنها مشكلة حكاية$t$,
   $t$Kinetic Type$t$, $t$تايبوغرافي متحرّكة$t$,
   $t$Personal Brand$t$, $t$براند شخصي$t$,
   $t$A kinetic-typography pitch reel for my own brand: the case for story over just “more content” — I don’t hold the camera, I direct the idea, then point AI at it until it’s a reel.$t$,
   $t$ريلز تايبوغرافي متحرك عملته لبراندي الشخصي: الفكرة إن المشكلة محتاجة حكاية مش مجرد «محتوى أكتر» — أنا مش ماسك الكاميرا، أنا بوجّه الفكرة وبعدين بصوّب الذكاء الاصطناعي عليها لحد ما تبقى ريلز.$t$),

  ($t$lets-go-big$t$, 7, 1, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334583/lets-go-big_jhm6wz.mp4$t$,
   $t$Reels With Maki — Let’s Go Big$t$,
   $t$Reels With Maki — لِنُفكّر بحجم أكبر$t$,
   $t$Motion Graphics$t$, $t$موشن جرافيك$t$,
   $t$Personal Brand$t$, $t$براند شخصي$t$,
   $t$A pure motion-graphics promo built in my own orange system — equalizer bars, nodes, and kinetic shapes on one message: stop playing small, AI means no big budget, let’s go big.$t$,
   $t$برومو موشن جرافيك خالص بنظام الألوان البرتقالي بتاعي — بارات إيكولايزر ونقط وأشكال متحركة على رسالة واحدة: بطّل تلعب على الصغير، الذكاء الاصطناعي معناه إنك مش محتاج ميزانية ضخمة… يلا نكبّر.$t$),

  ($t$portfolio-in-motion$t$, 8, 1, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784336497/portfolio-hyperframe_ptwnet.mp4$t$,
   $t$Reels With Maki — Portfolio in Motion$t$,
   $t$Reels With Maki — الموقع يتحرّك$t$,
   $t$HyperFrames$t$, $t$هايبرفريم$t$,
   $t$Personal Brand$t$, $t$براند شخصي$t$,
   $t$This very website turned into an animated reel with HyperFrames — sections, tools, and selected work rebuilt as motion graphics from the site’s own design.$t$,
   $t$الموقع ده نفسه اتحوّل لريلز متحرك بـ HyperFrames — الأقسام والأدوات والشغل المختار اتعمل تاني موشن جرافيك من تصميم الموقع نفسه.$t$),

  ($t$abbas-app$t$, 9, 2, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334048/compressO-%D9%85%D8%AD%D9%85%D8%AF_%D8%B9%D8%A8%D8%A7%D8%B3_ui_animation_vid_fbcazt.mp4$t$,
   $t$Mohamed Abbas Motors — Finance It$t$,
   $t$محمد عباس موتورز — قسّطها$t$,
   $t$UI Animation$t$, $t$أنيميشن واجهات$t$,
   $t$Car Dealership$t$, $t$معرض عربيات$t$,
   $t$A light, playful UI-animation concept for a car dealership that sells new and used cars on easy installments — not a real app. The lineup scrolls, one tap on “Finance it” under a Toyota Fortuner, and instant approval: the whole pitch as a smooth in-app flow, built entirely in code, directed with AI.$t$,
   $t$فكرة أنيميشن واجهات خفيفة ولذيذة لمعرض عربيات بيبيع جديد ومستعمل بالتقسيط — مش تطبيق حقيقي. العربيات بتعدّي، وضغطة على «قسّطها» تحت تويوتا فورتشنر، وموافقة فورية: العرض كله في شكل واجهة تطبيق، متعمل بالكامل بالكود بتوجيه الذكاء الاصطناعي.$t$),

  ($t$abbas-chat$t$, 10, 2, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334561/abbas-motors-chatgpt-ad_kbei7j.mp4$t$,
   $t$Mohamed Abbas Motors — Ask ChatGPT$t$,
   $t$محمد عباس موتورز — اسأل ChatGPT$t$,
   $t$UI Animation$t$, $t$أنيميشن واجهات$t$,
   $t$Car Dealership$t$, $t$معرض عربيات$t$,
   $t$A scroll-stopping hook built as a pixel-perfect ChatGPT recreation: ask for Egypt’s best car-installment dealership — the answer reveals the brand.$t$,
   $t$هوك بيوقّف السكرول، معمول كنسخة طبق الأصل من واجهة ChatGPT: اسأل عن أحسن معرض تقسيط عربيات في مصر — والجواب بيكشف البراند.$t$),

  ($t$quick-loan$t$, 11, 2, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334687/quick-loan-ui-animation_ebdlro.mp4$t$,
   $t$Quick Loan — Cars & Financing$t$,
   $t$Quick Loan — سيارات وتمويل$t$,
   $t$UI Animation$t$, $t$أنيميشن واجهات$t$,
   $t$Automotive · Finance$t$, $t$عربيات · تمويل$t$,
   $t$A UI animation reel for a car dealership and financing brand — designed and animated entirely in code, directed with AI, from the brand’s own assets.$t$,
   $t$ريلز أنيميشن واجهات لمعرض عربيات وشركة تمويل — متصمّم ومتحرك بالكامل بالكود بتوجيه الذكاء الاصطناعي من أصول البراند نفسه.$t$),

  ($t$demo-star$t$, 12, 2, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784334649/demo-star-ui-animation_k10svm.mp4$t$,
   $t$Demo Star — Men’s Fashion, In Motion$t$,
   $t$Demo Star — أزياء رجالية بتتحرك$t$,
   $t$UI Animation$t$, $t$أنيميشن واجهات$t$,
   $t$Menswear$t$, $t$أزياء رجالية$t$,
   $t$A menswear product reel animated entirely in code — HTML, CSS and JS directed with AI, rendered as a vertical showcase for the brand.$t$,
   $t$ريلز أزياء رجالية متحرك بالكامل بالكود — HTML وCSS وJS بتوجيه الذكاء الاصطناعي، معمول كعرض منتجات طولي للبراند.$t$),

  ($t$alwassef-geely$t$, 13, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784573775/ELWASEEF_GEELY_biqo85.mp4$t$,
   $t$Alwassef Motors — He’s Never Driven One$t$,
   $t$الوصيف موتورز — عمره ما ساقه$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Car Dealership · Geely EX2$t$, $t$معرض عربيات · جيلي EX2$t$,
   $t$A cinematic AI reel for the electric Geely EX2 launch: a cafe know-it-all warns against Chinese cars, until the man who actually drove one answers him with the keys in his hand. Characters, shots and Arabic voice-over all AI-directed, shot by shot.$t$,
   $t$ريلز سينمائي بالذكاء الاصطناعي لإطلاق جيلي EX2 الكهربائية: فزلوكة القهوة قاعد يخوّف من العربيات الصيني، لحد ما الراجل اللي ساقها فعلاً يرد عليه والمفتاح في إيده. الشخصيات واللقطات والڤويس أوفر العربي كلهم بتوجيه الذكاء الاصطناعي، لقطة لقطة.$t$),

  ($t$trust-motors$t$, 14, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784673874/chance_v2_oxaram.mp4$t$,
   $t$Trust Motors — The Opportunity Won’t Wait$t$,
   $t$تراست موتورز — الفرصة الحلوة ما بتستناش$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Car Dealership · Cairo$t$, $t$معرض عربيات · القاهرة$t$,
   $t$A cinematic AI teaser for a multi-brand Cairo dealership — one gleaming car held under a spotlight while a warehouse of dust-covered classics looks on, all on a single line: some opportunities won’t wait. AI cinematic footage, Arabic voice-over and kinetic Arabic type, directed shot by shot.$t$,
   $t$تيزر سينمائي بالذكاء الاصطناعي لمعرض عربيات متعدد الماركات في القاهرة — عربية واحدة لامعة واقفة تحت سبوت لايت وسط مخزن مليان عربيات قديمة متغطية بالتراب، على جملة واحدة: في فرص ما بتستناش. اللقطات السينمائية والڤويس أوفر العربي والتايبوغرافي المتحركة كلها بتوجيه الذكاء الاصطناعي، لقطة لقطة.$t$),

  ($t$trust-summer$t$, 15, 0, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784738431/compressO-START_YOUR_SUMMER_sohhcs.mp4$t$,
   $t$Trust Motors — Summer Coast Trip$t$,
   $t$تراست موتورز — رحلة صيف عالساحل$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Car Dealership · Social Reel$t$, $t$معرض عربيات · ريلز سوشيال$t$,
   $t$A vertical social reel for a car dealership, made entirely with AI: an Egyptian family sets off on their North Coast summer holiday in their new car — the father shutting the packed boot in the driveway, a hood-mounted shot of the family mid-drive, and a drone sweep of the car alone on the coastal road, over an Egyptian-Arabic summer voice-over on one line: the coast is waiting, and we’re ready. The hard part was keeping the car and the four family members identical across every shot — AI tends to redraw a car’s features and move them oddly — so I locked reference sheets for the car and the family and wrote physics-aware prompts, and it holds its shape and moves believably. Directed shot by shot.$t$,
   $t$ريلز سوشيال طولي لمعرض عربيات، متعمل بالكامل بالذكاء الاصطناعي: عيلة مصرية طالعة تصيّف على الساحل الشمالي في عربيتهم الجديدة — الأب بيقفل شنطة العربية المليانة في الجراج، لقطة من على كابوت العربية للعيلة وهي مبسوطة في الطريق، ولقطة درون للعربية لوحدها على طريق الساحل، وفوقها ڤويس أوفر صيفي بالمصري على جملة واحدة: الساحل مستنّي، واحنا جاهزين. أصعب حاجة كانت إني أخلّي العربية والأربع أفراد شكلهم ثابت في كل لقطة — الـ AI بيميل يعيد رسم ملامح العربية ويحرّكها غلط — فقفلت أوراق ريفرانس للعربية وللعيلة وكتبت برومبتات واعية بالفيزياء، فالعربية حافظت على شكلها واتحركت بتصديق. متخرجة لقطة لقطة.$t$),

  ($t$golf-star$t$, 16, 2, false,
   $t$https://res.cloudinary.com/ahmedmakyy/video/upload/v1784764047/0607_Golf_Star_Motors_vvscid.mp4$t$,
   $t$Golf Star Motors — Your Next Car?$t$,
   $t$Golf Star Motors — عربيتك الجاية؟$t$,
   $t$UI Animation$t$, $t$أنيميشن واجهات$t$,
   $t$Car Dealership · Cairo$t$, $t$معرض عربيات · القاهرة$t$,
   $t$A UI-animation reel that rebuilds the whole way a buyer finds a dealership — a Google search for “Golf Star Motors”, then a pixel-perfect Facebook page, then a run of Facebook Stories that reveal the MG ONE 2026 card by card: a bold design, a 12.3-inch CarPlay screen, 168 hp, six airbags and a 360° camera — closing on the hook that actually sells here: the lowest down payment in Egypt, the rest in easy installments. The Facebook and Google interfaces are rebuilt in code and the car is AI-generated, directed frame by frame.$t$,
   $t$ريلز أنيميشن واجهات بيعيد بناء رحلة أي حد بيدوّر على معرض — بحث جوجل على «جولف ستار موتورز»، وبعدين صفحة فيسبوك متعملة طبق الأصل، وبعدها سلسلة ستوريهات فيسبوك بتكشف الـ MG ONE موديل 2026 كارت ورا كارت: تصميم جريء، وشاشة 12.3 بوصة بـ CarPlay، و168 حصان، و6 إيرباج وكاميرا 360° — وتقفل على الهوك اللي بيبيع فعلاً هنا: أقل مقدم في مصر، والباقي أقساط مريحة. واجهات فيسبوك وجوجل متبنية بالكود والعربية بالذكاء الاصطناعي، متخرجة لقطة لقطة.$t$)
on conflict (slug) do nothing;

-- ── work_cards (Selected Work, 6) ────────────────────────────
insert into public.work_cards
  (sort_order, title, tag_en, tag_ar, period_en, period_ar, body_en, body_ar)
select * from (values
  (0, $t$Demo Star$t$,
   $t$Rebranding$t$, $t$ريبراندنج$t$,
   $t$Menswear$t$, $t$أزياء رجالية$t$,
   $t$Repositioned a 1998 garment factory into a consumer menswear brand: a teardown of six local labels, the campaign line “Present For Your Day. Ready For Every Day.”, and a 150-idea content catalog.$t$,
   $t$ريبراندنج لمصنع هدوم من 1998 لبراند أزياء رجالي استهلاكي: تفكيك 6 براندات محلية، لاين الحملة «حاضر ليومك. جاهز لكل يوم.»، وكتالوج محتوى فيه 150 فكرة.$t$),

  (1, $t$Easy Way$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Legal / IP$t$, $t$قانوني / ملكية فكرية$t$,
   $t$“The Thief Who Stole the Name” — a cinematic AI reel produced end to end: script, character sheets, Veo shots, voice-over, final edit. Plus a 24-idea post bank covering all eight services.$t$,
   $t$«اللص الذي سرق الاسم» — ريلز سينمائي بالـ AI من أول لقطة لآخر قطع: سيناريو، بروفايل الشخصيات، لقطات Veo، ڤويس أوفر، ومونتاج نهائي. ومعاه بنك 24 فكرة بيغطي الـ 8 خدمات كلهم.$t$),

  (2, $t$Golf City Club$t$,
   $t$AI Ad$t$, $t$إعلان AI$t$,
   $t$Sports Club$t$, $t$نادي رياضي$t$,
   $t$“All Sports in One Place” — a vertical cinematic sports reel cut from Veo 3.1 clips with morph transitions, plus 20 scripted reel concepts for a club with 188K followers.$t$,
   $t$«كل الرياضات في مكان واحد» — ريلز رياضي سينمائي بالطول متجمّع من لقطات Veo 3.1 بانتقالات مورف، مع 20 فكرة ريلز جاهزة لنادي بيتابعه 188 ألف شخص.$t$),

  (3, $t$Como Tech$t$,
   $t$Brand Foundation$t$, $t$تأسيس براند$t$,
   $t$Manufacturing$t$, $t$تصنيع$t$,
   $t$Full foundation for a new wiring-devices maker: identity, tone of voice, a teardown of a 57-year incumbent, a content strategy, and a 60-idea catalog in consumer and B2B editions.$t$,
   $t$تأسيس كامل لمصنّع أجهزة توصيلات جديد: هوية، نبرة صوت، تحليل للمنافس الكبير (57 سنة في السوق)، استراتيجية محتوى، وكتالوج 60 فكرة بنسختين استهلاكية وB2B.$t$),

  (4, $t$Mohamed Abbas Motors$t$,
   $t$Insight & Ideas$t$, $t$رؤى وأفكار$t$,
   $t$Automotive$t$, $t$عربيات$t$,
   $t$One insight carried the account: buyers fear the “how much do you earn?” question more than the price. Twenty scored concepts built on “no employment check”, plus a 15-second AI reel.$t$,
   $t$إنسايت واحد شال الحساب كله: «الناس بتخاف من سؤال ‘بتكسب كام؟’ أكتر من السعر نفسه». 20 فكرة متقيمة مبنية على «من غير إثبات دخل»، مع ريلز بالـ AI مدته 15 ثانية.$t$),

  (5, $t$Renew Media$t$,
   $t$Content Engine$t$, $t$محرّك محتوى$t$,
   $t$Agency$t$, $t$وكالة$t$,
   $t$The agency’s own engine: a 150-idea catalog for 2026 and two AI stop-motion reels, “The Story You Remember” for Egypt and “Star of the Party” written in Saudi dialect.$t$,
   $t$مكنة المحتوى بتاعة الوكالة نفسها: كتالوج 150 فكرة لسنة 2026، واتنين ريلز ستوب موشن بالـ AI: «الحكاية التي تتذكّرها» لمصر، و«نجم الحفلة» مكتوب باللهجة السعودية.$t$)
) as v
where not exists (select 1 from public.work_cards);

-- ── services (3) ─────────────────────────────────────────────
insert into public.services (sort_order, title_en, title_ar, body_en, body_ar)
select * from (values
  (0,
   $t$Brand Strategy & Content Planning$t$,
   $t$استراتيجية البراند وتخطيط المحتوى$t$,
   $t$Competitor teardowns, one proposition each brand can own, weighted content pillars, and content plans sized to the brand and budget — from a single month to a multi-month catalog of fully specified ideas.$t$,
   $t$تفكيك المنافسين، وزاوية واحدة كل براند يملكها، وركائز محتوى موزونة، وخطة محتوى على مقاس البراند والميزانية — من شهر واحد لحد كتالوج أفكار متفصّلة بالكامل لكذا شهر.$t$),

  (1,
   $t$AI Video Production$t$,
   $t$إنتاج الفيديو بالـ AI$t$,
   $t$End to end: idea → storyboard → character sheets → Veo prompts → Arabic voice-over → final cut. Consistent characters, shot to shot.$t$,
   $t$من الألف للياء: الفكرة ← الاستوري بورد ← أوراق الشخصيات ← برومبتات Veo ← الڤويس أوفر العربي ← المونتاج النهائي. شخصيات ثابتة من لقطة للتانية.$t$),

  (2,
   $t$Copywriting & Brand Voice$t$,
   $t$كتابة الكوبي وصوت البراند$t$,
   $t$A distinct voice per client in real Egyptian Arabic — written how people actually talk, reviewed until no AI flavor is left.$t$,
   $t$صوت مختلف لكل عميل بعامية مصرية حقيقية — متكتب زي ما الناس بتتكلم فعلاً، ومتراجَع لحد ما محدش يحس إنه AI.$t$)
) as v
where not exists (select 1 from public.services);
