# Motion Design and Game Juice for a Text-Heavy Mobile Strategy / Narrative-Management Game (Seat of Power)

Research note on method: this session could not fetch full pages from web.dev, material.io, gamedeveloper.com, swmansion.com or spiral.imperial.ac.uk. Their hosts are outside the session's allowed network. Every finding below comes from search-engine result summaries of those pages, so exact wording, sample sizes and effect sizes were not checked against the full text. Where a source is secondary or weak, the note says so.

## 1. What do juice talks, articles and studies recommend, and what is the evidence that juice improves retention or perceived quality?

### Takeaway
The classic talks (Jonasson and Purho 2012, Nijman 2013) argue that piling small feedback layers onto a plain game transforms how it feels. The controlled studies give a more careful answer:
- **Moderate juice wins.** Medium and High juice beat both None and Extreme on play time, player experience, motivation and performance (Kao 2020, N=3018).
- **Tie feedback to the player's result.** Feedback that depends on the outcome raised every measured motive. Feedback that was simply louder lowered them (Kao et al., CHI 2024).

For Seat of Power, the rule is: juice that tells the player what their decision did, at a moderate level, and never decoration for its own sake.

### Cited Findings
- **Juice it or Lose it (GDC Europe 2012).** Martin Jonasson and Petri Purho start from a plain block-breaking game and add juice one layer at a time: particles, screenshake, sound, animations. — [gamejuice.pages.dev resource page](https://gamejuice.pages.dev/resources/juice-it-or-lose-it)
- **The same talk, as described elsewhere.** It progressively adds flash, shake, particles and sound to a "dull Breakout clone". This is a secondary summary. — [Easton Dev blog](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/)
- **The Art of Screenshake (Control Conference, Amsterdam, 2013).** Jan Willem Nijman of Vlambeer takes a dull side-scrolling shooter and makes 30 small tweaks, each improving it a little. — [Game Developer: Vlambeer co-founder shares advice](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games)
  - Partial list of items: basic animation and sound, lower enemy HP, bigger explosions, smoke "for permanence", a game-over screen "for meaning", and slow motion. — [Univ. Bayreuth GxD-10 Game Feel handout](https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf)
  - Nijman's quote: "Just fill your game with love and tiny details." — [same handout](https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf)
  - A step-by-step recreation lists muzzle flash, hit pause, camera lerp and weapon recoil. — [DK Liao devlog](https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects)
- **Steve Swink, *Game Feel* (2008).** He defines game feel as "real-time control of virtual objects in a simulated space, with interactions emphasized by polish". Juice is usually treated as part of polish. — [Wikipedia: Game feel](https://en.wikipedia.org/wiki/Game_feel)
  - Douglas Wilson separates "Game Feel" (Swink's feeling of control) from "game feel" (any feeling a game communicates). — [Wikipedia: Game feel](https://en.wikipedia.org/wiki/Game_feel)
  - Swink's model centres on real-time physical control. A card-and-menu game falls mainly under the "polish" leg and Wilson's broader sense. — [Liz England review](https://lizengland.com/blog/review-game-feel-by-steve-swink/)
- **Kao 2020, *Entertainment Computing*.** Four identical versions of an action RPG with None, Medium, High and Extreme juice; N=3018, described as the largest juiciness study to date. Both None and Extreme gave significantly lower play time, player experience, intrinsic motivation and performance than Medium and High. — [improbable.com summary](https://improbable.com/tag/rpg/); DOI 10.1016/j.entcom.2020.100359 (full text not retrieved)
- **Kao, Ballou, Gerling, Breitsohl and Deterding, CHI 2024, "How does Juicy Game Feedback Motivate?"**
  - Design: an action RPG in a 2x2+control experiment that varied amplification, success-dependence and variability.
  - Measures: effectance, competence, curiosity, enjoyment, and free-choice playtime.
  - Results: success-dependence enhanced all motives. Amplification unexpectedly reduced them, "possibly because the tested condition unintentionally impeded players' sense of agency".
  - Source: [researchr entry](https://researchr.org/publication/KaoBGBD24); [KIT repository copy](https://publikationen.bibliothek.kit.edu/1000171104/152952099); DOI 10.1145/3613904.3642656
  - A secondary blog summary says playtime rose when feedback varied and was tied to success. — [psych.substack summary](https://psych.substack.com/p/the-juicy-factor-the-science-of-making)
  - The secondary summaries disagree on what curiosity did. One says it did not mediate enjoyment. Another says it was the strongest predictor. The abstract calls "uncertain success affording curiosity" an underappreciated driver. Treat curiosity claims as unresolved. — [universityxp summary](https://www.universityxp.com/research/2026/7/19/how-does-juicy-game-feedback-motivate-testing-curiosity-competence-and-effectance); [psych.substack](https://psych.substack.com/p/the-juicy-factor-the-science-of-making)
- **Hicks, Gerling, Dickinson and Vanden Abeele, CHI PLAY 2019, "Juicy Game Design: Understanding the Impact of Visual Embellishments on Player Experience".** Builds a framework for juicy design from designer surveys, then runs user studies on player experience. — [bibtex record](https://bibtex.github.io/CHI-PLAY-2019-HicksGDA.html)
  - It rests on the DiGRA 2018 "Good Game Feel" framework, which drew on 17 developers. — [DiGRA library](https://dl.digra.org/index.php/dl/article/view/936)
  - Participants said non-juicy versions felt like "something was either missing, or incomplete". The precise results were not retrieved. — [search summary of related work, x-mol / Elsevier entries](https://www.x-mol.com/paper/1307980428882448384)
- **Juice outside games.** A 2025 study compared "juicy" and "dry" interactive infographics for engagement and information retention. This shows the idea is being tested on information-heavy interfaces, though the findings were not retrieved. — [arXiv 2506.17011](https://arxiv.org/pdf/2506.17011)

### Inferences
- **Aim for Medium–High, never Extreme.** Players notice when juice is missing, but excess hurts too. For a text-heavy game, "Medium" probably means one clear motion response per meaningful event, not stacked particles, shake and flash on every tap.
- **Success-dependent feedback is the strongest evidence-backed lever.** Feedback should differ depending on what happened: a meter rising or falling, a letter that is good or bad news. A uniform celebration on every choice adds amplification without information.
- **Screenshake and hit-pause are action-game tools.** In a governance game, keep shake for rare high-stakes moments (a riot, impeachment, the godfather's anger), or replace it with a short card "thud" or tilt.

### Gaps
- Exact effect sizes, the Hicks 2019 results, and the CHI 2024 sample size could not be retrieved (full papers blocked).
- No controlled study was found on juice in narrative, card-based or strategy games specifically. All the experimental evidence comes from action RPGs.
- No published retention data (D1/D7) was found tying juice to retention in commercial mobile games.

## 2. How do comparable games animate decisions and consequences?

### Takeaway
The clearest pattern to borrow is Reigns' pre-commit preview: while the player drags a card, dots appear over the meters it will affect, sized by how big the change will be. Other comparable games add three more lessons:
- **Information first.** Slay the Spire shows enemy intents as exact, trustworthy numbers.
- **Diegetic, tactile objects.** Papers, Please builds its whole interface from documents and stamps on a desk.
- **Consequences surfaced through the fiction.** Suzerain tracks and reports almost every decision, including through newspapers.
- **Always-visible society meters.** Frostpunk's Hope and Discontent meters react to decisions as they happen.

### Cited Findings
- **Reigns:** while the player considers a choice, a dot appears over each faction it will affect, and the dot's size shows the magnitude. — [TechRaptor review](https://techraptor.net/content/reigns-review-addicted-death)
  - A Software Mansion engineering post rebuilds Reigns' swipe mechanic in React Native with Reanimated 2: card drag/rotation with left/right swipe labels. Known from search snippets only; the page could not be fetched. — [Software Mansion blog](https://swmansion.com/blog/building-reigns-how-to-strengthen-reign-over-mobile-game-development-using-reanimated-2-66c127a210e9)
  - Design prototype of the Reigns card interaction. — [Kat Reilly prototyping exercise](https://kat-reilly.squarespace.com/journal/2016/10/14/reigns-card-interaction)
- **Frostpunk:**
  - The Hope and Discontent meters sit at the bottom of the screen and "show you the consequences of your decisions right as they happen". Each new law or building affects at least one of them. — [PC Gamer review](https://www.pcgamer.com/frostpunk-review/); [Slant review](https://www.slantmagazine.com/games/review/frostpunk)
  - The developers made the two meters independent: both can be full, both can be empty. — [PC Gamer developer interview](https://www.pcgamer.com/frostpunk-developers-on-hope-misery-and-the-ultimately-terrifying-book-of-laws)
  - Near 100% Discontent or 0% Hope, the game explicitly warns the player. — [Gamepressure guide](https://gamepressure.com/frostpunk/what-happens-when-discontent-or-hope-reach-critical-values/zfad7c)
  - Criticism: the meter changes sometimes turn out to be "of little consequence". A meter that pulses but doesn't matter weakens trust. — [Slant review](https://www.slantmagazine.com/games/review/frostpunk)
- **Suzerain:** lead developer Ata Sergey Nowak: "Our game is based on consequence as we track and give feedback to most if not all decisions made." The Country Overview reflects player choices. — [articy interview](https://www.articy.com/en/?p=4725)
  - Newspapers, such as The Radical, and characters reading out hostile headlines carry political pressure. — [Superjump](https://www.superjumpmagazine.com/suzerain-does-the-most-terrifying-thing-elects-you-the-leader/); [Unwinnable](https://unwinnable.com/?p=103082)
  - Torpor's design principle: a failed check should "create a different route, cost or consequence rather than stop the story". — [Torpor Games broadcast](https://www.torporgames.com/broadcast)
- **Papers, Please:**
  - Its desk is a "pure gameworld interface" built on players' existing understanding of documents and stamps. — [First Person Scholar](https://www.firstpersonscholar.com/?p=3918)
  - It is called "the ultimate example of skeuomorphism seamlessly adding to the interface", and mastering the interface is part of the experience. — [Game Developer: toy-like interfaces](https://www.gamedeveloper.com/design/building-context-toy-like-interfaces-in-games)
  - Described: "the definitive punch of a bright, haphazard stamp", and a desk that grows crowded with overlapping documents. — [Game Developer: designing Papers Please](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-); [Mechanics of Magic](https://mechanicsofmagic.com/2026/05/15/papers-please-the-weaponization-of-boredom/)
  - Sound carries much of the tactility: papers shuffling, stamps slamming. — [Mechanics of Magic](https://mechanicsofmagic.com/2026/05/15/papers-please-the-weaponization-of-boredom/)
- **Slay the Spire:**
  - Showing enemy intent (an icon plus an exact damage number) is described as what made the game "come together". — [cmcour StS deep dive](https://cmcour.github.io/sts2Showcase/deep-dive/slay-the-spire/); [LessWrong review](https://www.lesswrong.com/posts/MEimkSwwuRgiPaZaY/review-slay-the-spire)
  - Hovering a card over an enemy shows modified damage against that target. — [itch.io forum post](https://itch.io/post/6426648)
  - Design principle: "Telegraphs that lie or omit are worse than no telegraph." — [game-mechanics wiki](https://saschb2b.github.io/game-mechanics/concepts/enemy-intent-telegraph)
- **Empires & Allies (Zynga):** reward text rises and fades, coloured to match the HUD meter it feeds. Each click fires sound, animation, particles and moving text together. This is the classic "reward flies to its counter" pattern. Snippet only. — [Game Developer: Clicking and rewards in Empires & Allies](https://gamedeveloper.com/design/clicking-and-rewards-in-empires-and-allies)
- **Number roll-ups:** numbers that "tick upward instead of simply appearing" are cited as a core reward-juice technique. — [PSU: reward design from arcades to Balatro](https://www.psu.com/news/why-winning-feels-so-good-reward-design-from-arcades-to-balatro/)
  - Designers should be able to tune reward timings without an engineering rebuild. Otherwise "the reward moment will ship at whatever numbers the first implementation happened to use". — [dev.to: The reward moment is the product](https://dev.to/patilrb/the-reward-moment-is-the-product-43h6)

### Inferences (patterns for Seat of Power, with cost estimates for React + CSS/WAAPI)
1. **Meter preview dots while dragging or holding a choice** (Reigns).
   - What it does: shows which of People, Party, Treasury and Godfather a choice touches, and how strongly, without revealing the direction. Preserves uncertainty, which the CHI 2024 abstract links to curiosity, while still informing.
   - Cost: low (about 0.5–1 day). The decision data probably already holds per-meter deltas. Map |delta| to small, medium or large dot sizes. Fade in with opacity and scale.
2. **Cause-to-effect flight after committing.**
   - What it does: a small token (coin, fist, party flag, godfather ring) flies from the chosen card or button to the meter it changes, and the meter pulses on arrival. Links the cause visibly to its effect, as in the Empires & Allies and Frostpunk "as they happen" feedback.
   - Cost: medium (about 1–2 days). Use getBoundingClientRect on the source and target, animate a fixed-position element with `transform: translate()` through WAAPI, and update the meter value on `finished`. Cap it at one token per affected meter.
3. **Success-dependent meter reactions.**
   - What it does: when a meter rises, a green pulse and a quick roll-up of the number; when it falls, a red flash and a small downward "drop". When it crosses a danger threshold, a stronger, one-off warning, like Frostpunk's critical-state alerts. Follows the Kao 2024 finding that feedback should depend on the result rather than simply be louder.
   - Cost: low–medium (about 1 day).
4. **Number roll-up on Treasury (naira) and other numeric values.**
   - What it does: makes changes to money feel significant.
   - Cost: low. Use a requestAnimationFrame counter of about 400–800 ms with tabular-nums so digits don't jitter. Respect reduced-motion by jumping straight to the final value.
5. **Diegetic desk objects** (Papers, Please).
   - What it does: makes the Desk feel like a place. A stamp "thunk" (a scale 1.15→1 overshoot plus a brief shadow) when a decision is signed. Letters slide into the mailbox with a slight rotation. The newspaper spins in and lands, the classic film trope. Tactility comes mainly from short overshoot easing plus sound.
   - Cost: medium per object (about 0.5–1 day each). Mostly CSS keyframes.
6. **Newspaper front page as the consequence summary** (Suzerain).
   - What it does: the post-decision paper restates the consequence in the fiction. A headline drop-in, followed by meter deltas shown as small "column" stats, keeps the cause visible.
   - Cost: low if the layout exists. A single entrance animation of about 300–500 ms.
7. **Honest previews.**
   - What it does: if dots or previews ever disagree with the actual result, trust collapses (Slay the Spire principle). Previews must come from the same data as the resolved effect.
   - Cost: none in animation; a testing discipline.
8. **Ambient life in the Government House hub.**
   - What it does: slow, low-cost loops such as a ceiling fan, flickering NEPA light, a clock, a waiting visitor's silhouette, or a mailbox flag that rises when unread letters exist. A raised mailbox flag doubles as a notification.
   - Cost: low each, if restricted to transform and opacity and paused when off-screen (IntersectionObserver or `animation-play-state`).

### Gaps
- No primary, retrievable sources were found in this session for the animation and UI feedback of Democracy 3/4, Tropico, Plague Inc (world-map spread), This War of Mine, Fallout Shelter, Clash of Clans or Hades. Claims about those games are left out rather than written from memory.
- No developer-authored post-mortem on Reigns' meter-dot animation (timing, easing) was retrievable. The design is known only from reviews.
- No developer post-mortem on Slay the Spire's intent UI was found. Secondary sources only.

## 3. Motion guidance and pitfalls for mobile web: durations, easing, reduced motion, low-end Android performance, animation fatigue

### Takeaway
- **Performance:** animate only `transform` and `opacity`. These run on the compositor and keep going even when the main thread is busy, which matters most on low-end Android phones, which are weakest at single-thread JavaScript.
- **Durations:** short for utility motion (about 200–300 ms), longer (about 400–650 ms) only for rare expressive moments.
- **Frequency:** avoid adding motion to high-frequency actions.
- **Accessibility:** never use motion as the only signal, and honour `prefers-reduced-motion`.

### Cited Findings
- **Performance rules (web.dev):**
  - Where possible, restrict animations to `opacity` and `transform` to keep them on the compositing stage. Avoid properties that trigger layout or paint unless necessary. — [web.dev: How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
  - CSS and Web Animations are typically handled on the compositor thread, so they continue even while the main thread runs expensive tasks. Animations that trigger paint or layout need main-thread work. — [web.dev: Animations and performance](https://web.dev/articles/animations-and-performance); [web.dev: Why are some animations slow?](https://web.dev/animations-overview/)
  - 60 FPS is the accepted target. Use `transform: translateZ(0)` to force a layer where `will-change` isn't supported. — [web.dev animations guide](https://web.dev/articles/animations-guide)
  - Overusing `will-change` creates many compositor layers that consume memory. Secondary source. — [Mintlify optimization reference](https://www.mintlify.com/Aduwoayooluwa/animations/reference/optimization)
- **Low-end devices:**
  - Low-end devices held 57% of the market in developing regions versus 20% in developed ones (2019 data). — [WebMedic, HotMobile '21](https://www.cs.princeton.edu/~ravian/publications/webmedic_hotmobile21.pdf)
  - Web browsing is "largely influenced by clock frequency" and uses no more than two cores, which makes it especially vulnerable on low-end phones. — [Stony Brook: device performance and mobile QoE](https://researchconnect.stonybrook.edu/en/publications/impact-of-device-performance-on-mobile-internet-qoe/)
  - The CPU performance gap is growing for JavaScript-heavy apps. Apple phones extended their single-core lead over contemporary high-end Androids to "a four year advantage". — [The Performance Inequality Gap, 2024 (Alex Russell), mirror](https://git.larlet.fr/davidbgk/larlet-fr-david-cache/src/commit/a59ff254492b75f45a69de55a74f827e811bae5f/cache/2024/0676c7ccf1ab2b380641866789366d26/index.md?lang=de-DE)
  - Real-user CPU benchmarks in South Africa (Wikipedia data) showed a 95th percentile that matched none of the standard lab test phones. Lab testing under-represents African devices. — [Web Performance Calendar 2023](https://calendar.perfplanet.com/2023/wikipedias-worldwide-web-cpu-benchmark/)
- **Durations and easing (Material Design):**
  - Standard easing with short durations, example 300 ms, gives a direct, functional feel. Emphasized easing with long durations, example 650 ms, is more stylized. These are illustrative values, not mobile rules. — [Material Design: motion customization](https://material.io/design/motion/customization.html)
  - Material UI's basic "short" duration is 250 ms. — [MUI transitions source](https://app.unpkg.com/@material-ui/core@4.12.4/files/es/styles/transitions.js)
  - M3 emphasized easing token: `cubic-bezier(0.05, 0.7, 0.1, 1.0)`. Secondhand, not verified against Google's own docs. — [skills.lc M3 summary](https://www.skills.lc/shelbeely/Shelbeely-Agent-skills/shelbeely-shelbeely-agent-skills-skills-material-design-3-motion-skill-md)
  - Legacy Material duration and easing guidance. — [m1.material.io duration-easing](https://m1.material.io/motion/duration-easing.html)
- **Apple Human Interface Guidelines (motion):**
  - Add motion purposefully. Gratuitous or excessive animation can distract people and "make them feel disconnected or physically uncomfortable". — [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion.md)
  - "In apps, generally avoid adding motion to UI interactions that occur frequently." Custom elements shouldn't make people "spend extra time paying attention to unnecessary motion every time they interact". — [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion.md)
  - Don't use motion as the only way to communicate important information. — [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion.md)
- **Reduced motion and accessibility:**
  - WCAG 2.3.3 Animation from Interactions is Level AAA. The CSS `prefers-reduced-motion` media query (technique C39) is a sufficient technique. — [W3C Understanding SC 2.3.3](https://w3c.github.io/wcag/understanding/animation-from-interactions.html)
  - The "essential" exception is narrow. A scroll-triggered card flip is not essential. — [Disability World WCAG 2.3.3](https://www.disabilityworld.org/toolkit/standards/wcag/2-3-3-animation-from-interactions/)
  - The often-quoted "35% of adults over 40 have vestibular disorders" figure has no primary source in the pages found. Treat it as unverified. — [TestParty blog](https://testparty.ai/blog/wcag-animation-interactions-guide); [Passiro](https://passiro.com/web-accessibility/designers/animation-motion)
- **Screen transitions:**
  - Same-document View Transitions (`document.startViewTransition`) became Baseline Newly Available in October 2025: Chrome/Edge 111+, Safari 18, Firefox 144. — [web.dev: same-document view transitions are Baseline](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available?hl=en); [Chrome: View transitions 2025 update](https://developer.chrome.com/blog/view-transitions-in-2025); [MDN startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
  - A dev.to post gives different Firefox and Safari versions (Firefox 133+). This conflicts with Chrome's figures. — [dev.to](https://dev.to/linou518/view-transitions-api-native-browser-page-transitions-no-more-framer-motion-3g7d)

### Inferences (practical rules for Seat of Power)
- **Duration budget:**
  - Button presses and micro-interactions: 100–150 ms.
  - Meter pulses and preview dots: 150–250 ms.
  - Card exit, letter arrival, cause-to-effect token flight: 250–450 ms.
  - Newspaper and end-of-term reveals (rare): up to about 600–800 ms.
  - Use ease-out (or an emphasized decelerate curve) for things entering, and ease-in for things leaving.
- **Never block input.** The next card should be tappable while the previous consequence animation finishes, or a tap should skip it. Apple's high-frequency guidance points to this: the decision loop is the most frequent action in the game, so its motion must be the shortest and must not slow play.
- **Animation fatigue control.**
  - Run the full cause-to-effect flight the first few times, or for large changes only.
  - After that, drop to a meter pulse only.
  - Keep the big moments (godfather fury, impeachment, FAAC day) for thresholds and rare events.
  - This follows the Kao 2020 finding that Extreme juice hurts.
- **Reduced motion.**
  - Wrap every non-essential keyframe in `@media (prefers-reduced-motion: no-preference)`. In JavaScript, check `matchMedia('(prefers-reduced-motion: reduce)')` and swap flights and roll-ups for an instant state change plus a colour or text change ("+5 People").
  - Offer an in-game "Reduce animation" toggle too. The game runs inside Lagos Life's WebView, which may not pass the OS setting through reliably. (This is an inference: the WebView behaviour was not verified.)
- **Low-end Android performance.**
  - Animate only transform and opacity. Never animate width, height, top, left or box-shadow on meters; use `transform: scaleX()` on a meter fill instead of `width`.
  - Avoid large `filter: blur()` and backdrop-filter layers.
  - Limit simultaneous animated elements to about 8–12.
  - Prefer CSS/WAAPI over React state updates every frame. React re-renders run on the main thread that low-end phones struggle with.
  - Test on a real low-end Android phone (or a 4x–6x CPU throttle in DevTools), not a flagship.
- **Screen transitions.** Same-document View Transitions are a cheap way to animate Desk → Mailbox → Newspaper with almost no code.
  - Browser support: needs Chrome 111+, so it works on most Android Chrome WebViews kept up to date.
  - Fallback: treat it as progressive enhancement, doing an instant swap where it's unsupported.
- **Motion is never the only signal.** Every meter change needs a persistent number or arrow after the animation ends (Apple HIG). This also helps players who look away mid-animation.

### Gaps
- No verified data on what share of Lagos Life or Nigerian users run which Android or WebView versions, or how many enable reduced motion.
- No primary source confirmed whether Android System WebView passes `prefers-reduced-motion` from OS settings inside third-party host apps.
- The Material 3 duration tokens (short1–extra-long4) could not be verified from m3.material.io in this session.
- No source was found that quantifies "animation fatigue" (for example, the share of players who want to skip animations) in narrative or strategy games.
