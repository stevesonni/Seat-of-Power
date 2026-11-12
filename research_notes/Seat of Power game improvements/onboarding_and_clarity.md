# Onboarding and Clarity: How Complex Strategy/Sim Games Become Understandable to New, Casual, Mobile Players

Research context: Seat of Power is a 2D React mobile web game (govern a Nigerian state). Player feedback: "confusing", "too much English", "can't understand abbreviations", "so many things happening at once", "no clear instructions", "I need a guide". Many players are young Nigerians on phones; some read English as a second language.

Method note: Searches ran 12 Nov 2026. Several primary hosts could not be fetched from this session (gamedeveloper.com, grail.cs.washington.edu, gameanalytics.com were outside the allowed network domains), so some findings rest on search-result summaries of those pages, not full reads. Where that matters it is flagged.

## 1. What research and practice say about game onboarding (progressive disclosure, learning by doing, one thing at a time, contextual help, FTUE metrics)

### Takeaway
The best evidence says: teach through play, not text; show only what matters now and reveal the rest when it becomes relevant; and put tutorial effort where the game is truly complex. Andersen et al. (CHI 2012, 45,000+ players) found tutorials raised play time by up to 29% only in the most complex game and had negligible effect in simpler ones. Seat of Power is a complex game, so guidance pays off here, but only if it arrives in context, one idea at a time.

### Cited Findings
**Academic evidence on tutorials**
- Andersen, O'Rourke, Liu, Snider, Lowdermilk, Truong, Cooper, Popović (2012), "The impact of tutorials on games of varying complexity", CHI 2012, pp. 59–68. Eight tutorial designs were built into three games (Refraction, Hello Worlds, Foldit) and tested on more than 45,000 players. — [UW GRAIL project page](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/)
- Tutorials raised play time by up to 29% in the most complex game (Foldit). The effect in the two simpler games was "surprisingly negligible". — [UW GRAIL / CHI 2012 PDF](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf)
- Authors' conclusion: putting effort into tutorials "may not be justified for games with mechanics that can be discovered through experimentation." — [UW GRAIL](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/)

**Learning by doing vs text tutorials**
- A playtest study of 26 casual and core apps found that the strongest onboarding gets players acting quickly and teaches mostly through gameplay rather than text. — [Liquid & Grit FTUE Toolkit](https://liquidandgrit.com/first-time-user-experience-ftue-toolkit)
- Unity's FTUE guidance says onboarding must explain the rules, show how features work, and make the game seem worth the time. — [Unity: 10 FTUE tips](https://unity.com/how-to/10-first-time-user-experience-tips-games)
- Don't try to explain every mechanic in the first couple of minutes. — [Udonis FTUE guide](https://www.blog.udonis.co/mobile-marketing/mobile-games/first-time-user-experience)
- Clash Royale is cited as a polished FTUE that throws players into action shortly after launch. — [PocketGamer.biz](https://www.pocketgamer.biz/ftue-clash-royale/); [PlaytestCloud](https://blog.playtestcloud.com/first-time-user-experience-can-make-or-break-your-game/)
- A Game Developer UX comparison of Clash of Clans and Rival Kingdoms cites churn of 40–60% in the first one to two minutes at one point, and 20–40% later in the same piece. The figures are inconsistent, so treat them as rough. — [Game Developer: UX comparison CoC vs Rival Kingdoms](https://gamedeveloper.com/business/ux-comparison-clash-of-clans-vs-rival-kingdoms) (summary only, not read in full)

**Progressive and staged disclosure**
- Jakob Nielsen's definition: progressive disclosure "initially shows the user only the most important options and reveals the specialized ones only when he or she asks for them, on a secondary display." Staged disclosure is a fixed sequence of steps, "AKA the wizard". — [Jakob Nielsen, Substack](https://jakobnielsenphd.substack.com/p/progressive-disclosure)
- Sources disagree on where the term came from (Carroll and Rosson at IBM in the 1980s vs Nielsen in 1995). Not material for design. — [Wikipedia: Progressive disclosure](https://en.wikipedia.com/wiki/Progressive_disclosure)

**Game examples**
- **Reigns (near-zero tutorial):** Nerial's François Alliot said that once the character was put inside a card, players naturally started dragging it. That change "removes any need to have a tutorial." The whole game was built around one loop: swipe left or right, and see the impact. — [PC Gamer: How Reigns makes its 'Tinderocracy' work](https://pcgamer.com/how-reigns-and-its-forthcoming-sequel-make-their-tinderocracy-work)
- Reigns is simple on the surface but has "a wealth of depth"; it sold to millions. — [GamesRadar](https://gamesradar.com/how-reigns-convinced-two-million-people-to-swipe-right-to-rule-their-kingdom-and-captured-the-game-of-thrones-license); GDC 2017 talk "The Casual (but Regal) Swipe" — [GDC Vault](https://gdcvault.com/play/1024278/The-Casual-(but-Regal)-Swipe)
- **Plague Inc:** Ndemic tells new players to start in Casual mode, the gentlest difficulty, "until you get the hang of things". First-time players start with one pathogen (bacteria), and other plague types unlock as you play. The screen centres on three components: Transmission, Symptoms, Abilities. — [Ndemic Creations guide](https://www.ndemiccreations.com/en/news/194-plague-inc-scenario-creator-the-basics); [Gamezebo walkthrough](https://www.gamezebo.com/walkthroughs/plague-inc-walkthrough/)
- **Civilization VII advisors:** four Advisors lead players through quests on different systems, and players choose which are active. Once past the basics, players can switch to "Only Warnings", where advisors speak up only when a major setback is coming (Ed Beach, creative director). The tutorial gives tips "exactly when you first encounter something new." — [Game8: Civ 7 tutorial](https://game8.co/articles/latest/civilization-7-tutorial-recommended-for-veterans-and-newcomers-alike); [Civ VII beginners guide (2K)](https://civilization.2k.com/en-GB/civ-vii/news/civilization-vii-beginners-guide/)
- A search summary claimed that in Civ VI the tutorial and advisors were separate systems, the advisors could not point at UI, and telemetry showed few players ran the tutorial. I could NOT confirm this from a primary source, so do not cite it as fact (see Gaps).
- **Democracy 3/4 (Positech):** developer Cliff Harris wrote that the core mechanic (policy sliders) needed careful explaining "in tutorials and tooltips and help windows". — [Positech blog](https://www.positech.co.uk/cliffsblog/?p=2230). Democracy 4 has a "totally revamped user-interface" meant to be "much more streamlined and easy-to-understand". — [Positech D4 page](https://positech.co.uk/democracy4); [Shacknews impressions](https://www.shacknews.com/article/120748/democracy-4-impressions-political-disaster-simulation-evolved). On Positech's forum, new players still say they get lost and ask for strategy guides. — [Positech forum](https://forums.positech.co.uk/t/just-played-it-suggestions/15883)
- **Into the Breach (telegraphing):** every enemy shows its next move before your turn, which turns each turn into a readable puzzle. Kotaku credits clear information with letting players "see into the future". — [Kotaku review](https://kotaku.com/into-the-breach-the-kotaku-review-1823365331); [Game Developer: Road to the IGF](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-). The GDC 2019 "Into the Breach Design Postmortem" (Matthew Davis) covers this; transcript not retrieved. — [GoNintendo listing](https://gonintendo.com/stories/334421-full-gdc-2019-dev-panel-into-the-breach-design-postmortem)
- **Duolingo:** delayed sign-up until the user hit a milestone (A/B tested). Retention is most fragile in the first 7 days, and changing a button from "continue" to "commit to my goal" raised retention. — [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding); [Lenny's Newsletter: How Duolingo reignited user growth](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth); [Lenny's: Duolingo streaks](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks). One unverified Substack claims D1 retention went from 15% to over 50%; treat this as anecdote.

**FTUE measurement**
- Treat tutorial steps as a funnel, which can have 100+ steps, to see where players churn. — [devtodev: How to optimize your game tutorial](https://www.devtodev.com/resources/articles/how-to-optimize-your-game-tutorial); [devtodev: FTUE metrics](https://www.devtodev.com/resources/articles/main-metrics-ftue)
- Drop-off tends to cluster at single steps rather than declining steadily (e.g. a "huge" drop between steps 2 and 3; the biggest drop before an intro video ends). — [Unity: standard events, onboarding](https://blog.unity.com/technology/standard-events-explained-part-1-onboarding); [Medium / TDS: incremental data science](https://medium.com/data-science/incremental-data-science-for-mobile-game-development-955bb059e8a6)
- A rule of thumb from one blog: D1 below 25% means a broken first session. — [Game Growth Advisor 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-retention-strategies-2026/)

### Inferences
- Seat of Power is closer to Foldit (complex, not guessable by experiment) than to Refraction, so guidance is worth investing in. But it should be in context and interactive (Civ VII style), not a front-loaded text tutorial.
- The Reigns lesson: when the core action is a familiar physical gesture (swipe or tap a card with two choices), the first minute needs no instructions at all. Lead with the card and its meters, and add budgets, ministries and the legislature later, as gated unlocks (as Plague Inc does with pathogens).
- Into the Breach's telegraphing maps onto "show what each choice will do before you choose": arrows or ghost-deltas on the meters (e.g. "Money ↓, Trust ↑") before you confirm. This cuts reading and builds the sense of cause and effect.
- Civ VII's "Only Warnings" setting is a good model for a two-level adviser: full hand-holding in the first term, then warnings only.
- Measure each FTUE step separately (screen reached, first decision, first budget, end of year 1) and look for single-step cliffs rather than averages.

### Gaps
- Full Andersen et al. results on contextual vs non-contextual tutorials and on-demand help could not be read (host blocked). I recall the paper also compared context-sensitive delivery and help on demand, but this is not verified, so don't cite it.
- No primary source found on Civ VI tutorial telemetry or for Fallout Shelter's FTUE design.
- No Suzerain-specific source on its codex or glossary was found (searches returned generic glossary pages).

## 2. How text-heavy games reduce reading load (short cards, icons + numbers, voice/portraits, visual summaries, plain language, reading level, localisation)

### Takeaway
Reading load falls when each decision is one short card with a face, two choices, and icon+number consequences; when sentences average about 14–15 words (comprehension is over 90% at 14 words); and when the text is truly localised (Pidgin/Hausa/Yoruba/Igbo) rather than just translated. For low-literacy and novice users, research shows text-only interfaces fail, and graphics plus voice work much better.

### Cited Findings
- **Text-free UIs:** Medhi et al. found that "textual interfaces are unusable by first-time low-literacy users, and error prone for literate but novice users", and compared them with spoken-dialog, graphical and live-operator interfaces. — [Medhi, Patnaik, Brunskill, ToCHI (Microsoft Research PDF)](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ToCHI2711_Medhi.pdf)
- Medhi, Sagar, Toyama (2007): text-free designs, using graphics and photos for visual information and voice in place of text, were "strongly preferred" over text-based interfaces. — [Text-Free UIs for Illiterate and Semi-literate Users](https://courses.cs.washington.edu/courses/cse490c/18au/readings/medhi-2007.pdf)
- The Microsoft Research programme ran 700+ field hours with 570 low-literate participants in India, the Philippines and South Africa, and found a strong preference for non-textual designs. — [MSR project page](https://www.microsoft.com/en-us/research/project/uis-low-literate-users/)
- **Sentence length:** American Press Institute research, cited by Siteimprove: at an average of 14 words per sentence readers understand more than 90%; 8 words or fewer is "very easy" and 29+ is "very difficult". — [Siteimprove help](https://help.siteimprove.com/support/solutions/articles/80000447968)
- King County plain-writing guide: average 20 words, some up to 30 if familiar. For limited-English readers, repeat nouns rather than pronouns; short sentences avoid ambiguities that hurt translation. — [King County style guide](https://kingcounty.gov/help/editorial-style-guide/plainwriting/simplesentences.aspx)
- Average 15 words for a general audience, 25 at most for technical text. — [Content Manual (AU)](https://contentmanual.com.au/structure-writing/readability/structure-wording-for-readability); Ulster University: 15–20 words, and split sentences in two where you can. — [Ulster University](https://ulster.ac.uk/accessibility-standards/writing-in-plain-english)
- Complex sentence structure is especially hard for ESL readers whose first language has a different word order. — [Content Manual](https://contentmanual.com.au/structure-writing/readability/structure-wording-for-readability)
- **Reigns pattern:** one card, one character portrait, two swipe choices, a few meters at the top. — [PC Gamer](https://pcgamer.com/how-reigns-and-its-forthcoming-sequel-make-their-tinderocracy-work)
- **Plague Inc pattern:** the whole screen hangs on three named components (Transmission, Symptoms, Abilities). — [Gamezebo](https://www.gamezebo.com/walkthroughs/plague-inc-walkthrough/)
- **Localisation (Nigeria):** Pidgin is a second language for many Nigerians; one study argues it has pushed English to third language for some, behind the indigenous language. — [WAJOFEL paper](https://wajofel.org/index.php/wajofel/article/download/327/253/951)
- Early literacy is usually built in the native tongue, which supports localising for Pidgin/Yoruba speakers. — [Phillips Consulting](https://phillipsconsulting.net/articles_post/unlocking-nigerias-digital-learning-potential-through-language-localisation/)
- Nigerian apps already localise: Uniccon's Omeife works in Igbo, Hausa, Yoruba and Pidgin. — [ITWeb Africa](https://itweb.africa/content/8OKdWqDXK2jqbznQ). Pidgin became the first African language fully live on the Oppia Android learning app (July 2023). — [Guardian Nigeria](https://guardian.ng/?p=2577811)
- Nigerian digital-entrepreneurship texts often mix English with Pidgin, indigenous expressions or internet slang. — [UNILAG paper](https://ihafa.unilag.edu.ng/article/download/607/493)

### Inferences
- Target 8–14 words per sentence on cards, and at most 2 sentences per card body. Put the numbers on icons rather than in prose ("₦ −2bn", a red down arrow).
- Repeat nouns ("the Assembly") rather than pronouns, and use English word order, to help ESL and Pidgin-first readers.
- A portrait plus a name tag ("Commissioner for Finance") does the work of a paragraph of context. Voice lines are a stretch goal; on low data budgets (see Q3) prefer short, cached audio clips or none at all.
- A Pidgin option that reads naturally (mixed, as Nigerians write online) may beat formal translation. The project already has Pidgin/Yoruba/Hausa/Igbo, so audit them for plainness, not just accuracy.

### Gaps
- No usability study found on Pidgin-localised game UIs specifically.
- No primary source on how Suzerain or Democracy 4 measured reading load.

## 3. Evidence on tutorials, FTUE retention, and mobile D1 benchmarks (incl. Nigeria/West Africa constraints)

### Takeaway
Median mobile D1 retention is about 22% (GameAnalytics, early 2025), with the top quartile around 30%, the top decile around 40%, and median D7 under 4%. The first session decides most of this. In Nigeria, cheap Android phones, data cost and uneven English reading levels are extra friction, so a lightweight, low-text, fast-loading first session matters more than usual.

### Cited Findings
- GameAnalytics 2025 benchmarks: median (P50) D1 retention about 22% at the start of 2025, after a decline in 2024. The top quartile is just over 30%, the top decile about 40%, and the top 1% hit 64–68%. Median D7 is under 4%. — [GameDevReports summary of GameAnalytics 2025](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks); [2025 GameAnalytics PDF (InvestGame mirror)](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf)
- The 2026 GameAnalytics report covers 16,262 titles with 1,000+ MAU. — [GameDevReports 2026](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game); [2026 retention PDF](https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf)
- Conflict: some third-party sites put 2025 average D1 at about 27%, roughly flat. — [Business of Apps](https://businessofapps.com/?p=96421); [AppAgent](https://appagent.com/?p=61637). The different populations probably explain the gap; prefer GameAnalytics as primary.
- Duolingo: retention is most fragile in the first 7 days; if users stay that week, long-term retention rises sharply. — [Lenny's Newsletter](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks)
- Tutorial value scales with game complexity (+29% play time in the complex game, negligible in simple ones). — [Andersen et al. 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/)
- **Nigeria context:**
  - English literacy (NBS National Literacy Survey 2010): youth 76.3%, adults 57.9%; highest in the South East, lowest in the North West. — [NBS](https://nigerianstat.gov.ng/download/43)
  - MICS 2021 national youth literacy is 48.9%, and possibly lower (the test was reading one short simple statement). UNESCO gives 81.4% for youth in 2024. The figures vary widely by method. — [BusinessDay](https://businessday.ng/?p=443095); [MeasuredWorld/UNESCO](https://measuredworld.com/countries/nigeria/education)
  - EF English Proficiency Index: Nigeria 568 ("high"), rank 29 of 123. This measures self-selected adult test-takers, not typical youth. — [MeasuredWorld](https://measuredworld.com/countries/nigeria/education)
  - Median entry-level smartphone in Nigeria-like markets is about $54 (2024), up from $50 (2023); six in ten Nigerians are offline mainly because handsets cost too much (GSMA via TechCabal). — [TechCabal](https://techcabal.com/?p=167676)
  - Average 1GB of mobile data in Nigeria is about $0.38 (attributed to GSMA by some outlets and to ITU by others), among the cheapest in Africa. But device cost and digital skills/literacy are the main barriers. — [Leadership.ng](https://leadership.ng/nigerias-mobile-data-costs-average-0-38-lowest-in-west-africa-report); [Broadcast Media Africa](https://news.broadcastmediaafrica.com/2025/01/16/nigeria-offers-most-affordable-mobile-data-in-africa-report)
  - About 86% of Nigerian smartphone users are on Android (methodology unclear). — [Nairametrics](https://nairametrics.com/2026/09/16/gsma-warns-rising-smartphone-costs-could-deepen-nigerias-mobile-internet-gap/)

### Inferences
- A reasonable target for Seat of Power is D1 of 30% or more (top quartile). Below 25% suggests the first session is broken.
- Design for low-end Android: small bundle, few heavy images, no autoplay video intro (intro videos are a known drop-off point, see Q1), and offline-safe saves.
- English reading level varies a lot by region and education. Assume a sizeable share of players read English slowly, and default to the shortest wording, with an easy language switch on the first screen.

### Gaps
- No published benchmark for the typical % of players lost inside a tutorial; only per-game funnel examples.
- No Nigeria-specific mobile game retention benchmark found.
- GameAnalytics figures come from summaries and mirrors; the primary site was not reachable from this session.

## 4. Explaining jargon (budget law, IGR, FAAC) without walls of text

### Takeaway
Use three layers: (1) plain words in the main text ("money the state raises itself" instead of IGR), (2) a tap-to-define underline giving a one-line definition in place, and (3) an optional codex/glossary for the curious. Deliver it through a diegetic adviser character rather than system text where you can.

### Cited Findings
- Hover/tap glossary pattern: underlined terms show definitions in place, "providing contextual clarity without navigating away". — [DeveloperHub docs glossary](https://docs.developerhub.io/support-center/glossary); dashed-underline pop-ups — [World Anvil preview](https://www.worldanvil.com/w/WorldAnvilCodex/a/preview)
- Players in other games ask for a way to hover any keyword for its definition, and get confused by near-synonym terms (e.g. Intoxicate vs Poison). — [itch.io forum post](https://itch.io/post/13914295)
- Weather Factory's essay "It's Not a Codex" argues a codex can be optional or core, and that relying on it can make the core experience depend on outside reading. — [Weather Factory](https://weatherfactory.biz/?p=15141)
- Civilization VII publishes an official glossary alongside in-game advisers. — [Civ VII glossary](https://civilization.2k.com/en-GB/civ-vii/glossary/)
- Democracy series: the core mechanic was explained via "tutorials and tooltips and help windows". — [Positech blog](https://www.positech.co.uk/cliffsblog/?p=2230)
- Plain language: repeat nouns and use familiar words for limited-English readers. — [King County](https://kingcounty.gov/help/editorial-style-guide/plainwriting/simplesentences.aspx)

### Inferences
- Never show a bare abbreviation the first time. Write "FAAC money (from Abuja)" and "IGR – money we raise ourselves", or swap in the plain word everywhere and keep the acronym only in the glossary.
- The definition should be one line of 12 words or fewer, plus an icon. Example: "FAAC: monthly share of oil money sent from Abuja."
- An adviser (Chief of Staff, Commissioner for Finance) can say the definition in-world the first time ("Oga, FAAC money don land – na our share from Abuja"). This doubles as localisation.
- Avoid near-synonyms for one concept (budget / appropriation / spending plan); pick one term and use it everywhere.

### Gaps
- No Suzerain-specific source found on its codex/glossary implementation.
- No controlled study found comparing tap-definitions with glossary screens for comprehension in games.

## 5. "What should I do next?" guidance: objectives, markers, adviser hints, highlighting, one clear next action

### Takeaway
Show one primary next action at a time (a highlighted button or card plus a short adviser line), a short objective list (3 items at most) for the medium term, and warnings-only nudges once the player is competent. Show the consequences of choices before they are made (Into the Breach style), so "what do I do?" becomes "which of these two do I prefer?".

### Cited Findings
- Civ VII: advisers lead players through "a series of quests"; players can choose which advisers are active and later switch to "Only Warnings". — [Game8](https://game8.co/articles/latest/civilization-7-tutorial-recommended-for-veterans-and-newcomers-alike)
- Civ VII tutorial tips arrive "exactly when you first encounter something new". — [Civ VII beginners guide](https://civilization.2k.com/en-GB/civ-vii/news/civilization-vii-beginners-guide/)
- Into the Breach: enemy intentions are always shown before your turn, so the player's job becomes prioritising, not guessing. — [Kotaku](https://kotaku.com/into-the-breach-the-kotaku-review-1823365331); [bugnet: designing telegraphs](https://bugnet.io/blog/how-to-design-enemy-attack-telegraphs)
- Reigns: the game was built so the player "would be able to swipe again and carry on". There is always exactly one thing to do next. — [PC Gamer](https://pcgamer.com/how-reigns-and-its-forthcoming-sequel-make-their-tinderocracy-work)
- Duolingo's change from "continue" to "commit to my goal" raised retention, so the wording of the next-action button matters. — [Lenny's Newsletter](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks)
- Duolingo delays sign-up until after a first win, so value comes before friction. — [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding)
- Plague Inc: Casual mode and one starting pathogen keep early choices few. — [Ndemic](https://www.ndemiccreations.com/en/news/194-plague-inc-scenario-creator-the-basics)

### Inferences
- "So many things happening at once" means competing calls to action. Pick one pulsing primary action per screen, and dim or badge the rest.
- A persistent "Next:" chip from the Chief of Staff ("Next: approve the budget before 1 March") answers "what do I do?" in about 8 words.
- The objective list should hold 3 items at most, each a verb plus an object ("Pay salaries", "Pass the budget", "Fix one road").
- "I need a guide": put an always-available "?" or "Ask Chief of Staff" button that explains the current screen in 2–3 lines. This is help on demand, alongside the gated tutorial.
- Turn the hand-holding down over time (full guidance in year 1, warnings only later), as Civ VII does.

### Gaps
- No quantitative study found comparing quest markers vs adviser hints vs objective lists in strategy games.
- No Fallout Shelter or Clash of Clans primary FTUE teardown retrieved (only secondary summaries).
