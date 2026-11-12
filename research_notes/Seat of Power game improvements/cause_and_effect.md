# Cause and Effect: Making Consequences Feel Linked to Player Decisions (for Seat of Power)

Method note: in this session, page fetching was blocked for every host tried (positech.co.uk, pcgamer.com, gamedeveloper.com, failbettergames.com, dspace.mit.edu, wikipedia.org). All findings below come from search result summaries and the URLs they surfaced. Wording attributed to sources is as the search tool summarised it, not checked against the full page. Treat exact quotes as "reported" and check them before using them in public.

## 1. How do Democracy, Frostpunk, Tropico, Suzerain, Reigns, Papers Please, CK3, Civilization and Cities: Skylines show cause and effect?

### Takeaway
The strongest games use one of three devices: (a) **hover/tap a value to see its live inputs** (the Democracy web, CK3 nested tooltips, Civ and Cities overlays); (b) **a preview of which meters a choice will move, before you commit** (Reigns, Frostpunk laws, Frostpunk 2 council votes); (c) **a settlement screen at the end of each period** that lists money in and out and what happened to the people you care about (Papers, Please). Where these devices are missing or incomplete (Civ 6's breakdowns that don't add up), players complain and modders fill the gap.

### Cited Findings
**Democracy 3/4 (Positech)**
- In the official manual, hovering any item on the main screen draws lines linking it to the items it affects and the items that affect it — [Democracy 3 manual (Steam)](https://cdn.steamstatic.com/steam/apps/427470/manuals/D3Manual.pdf?t=1478025016); [manual (2013)](https://cdn1.macgamestore.com/macgamesarcade/manuals/Demoracy3_Manual.pdf)
- When you hover, everything unrelated fades out, and moving red/green arrows show negative or positive relationships — [Indie Game Reviewer](https://indiegamereviewer.com/review-democracy-3-from-positech-games/)
- Manual: green means a positive effect and red a negative one; the faster the arrows move, the stronger the effect — [D3 manual](https://cdn.steamstatic.com/steam/apps/427470/manuals/D3Manual.pdf?t=1478025016)
- Players get confused because red/green shows numerical direction, not good or bad (for example, a policy that pushes crime up shows green). A red arrow is not necessarily bad — [Steam discussion](https://steamcommunity.com/app/245470/discussions/0/558747287687380501); [NamuWiki](https://en.namu.wiki/w/Democracy%203)
- Criticism: the icons have no labels, and hovering one to learn what it is hides the rest of the screen — [Indie Game Reviewer](https://indiegamereviewer.com/review-democracy-3-from-positech-games/)
- Cliff Harris argues the dense interface is deliberate ("Democracy 4's overcomplexity is by design"). He is wary of "streamlined" UIs and wants the focus on "how did they act? And why?" — [Positech blog (search summary)](https://www.positech.co.uk/cliffsblog/wp-json/wp/v2/posts/5764)
- Democracy 4 shows delay on screen. After a policy change, a lighter-coloured bar shows the effect moving gradually from its old position to its final one. The policy screen shows how far a policy has been implemented, with a transparent "ghost" slider marking the final target — [Democracy 4 Basic Gameplay Guide (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711); [GamePretty mirror](https://gamepretty.com/democracy-4-basic-gameplay-guide/)
- Each policy has an implementation period in turns, adjusted by how competent the minister is. Taxes apply almost at once; rail or space programmes take terms. Most effects have zero inertia, but some have a lot — [Democracy 4 modding docs](https://www.positech.co.uk/democracy4/mod_policies.html); [Steam discussion](https://steamcommunity.com/app/1410710/discussions/0/6163789298352068663/)
- Players have asked for long-range graphs, from the first election to now, with events marked, because the in-game graphs "only showcase a tiny fraction of time" — [Steam: Graphs and Statistics](https://steamcommunity.com/app/1410710/discussions/0/3053986162860860161/)

**Frostpunk / Frostpunk 2 (11 bit studios)**
- Lead designer Kuba Stokalski said discontent came naturally out of building the society, while hope came out of research. The Book of Laws put laws in sequence to support a "creeping normality / boiling frog" theme — [PC Gamer interview (search summary)](https://www.pcgamer.com/frostpunk-developers-on-hope-misery-and-the-ultimately-terrifying-book-of-laws)
- Discontent rises when you order workers to do things they don't want to do; hope falls on bad news. Laws, buildings and events all move the meters, some for a while and some for good — [Gamepressure guide](https://www.gamepressure.com/frostpunk/dissatisfaction-and-hope/z4a199)
- Criticism: the system's limits "are painfully apparent" when the hope and discontent changes turn out to matter little to how the city runs. The lesson: shown deltas must have felt consequences — [Slant review](https://slantmagazine.com/games/frostpunk)
- Frostpunk 2 council: a law needs a majority (51 votes), and a failed bill can come back in about 10 weeks. Factions are more likely to vote for you when their trust is higher. "Guided voting" costs a little trust globally and a lot with the groups that wanted to vote the other way. Broken promises cut trust significantly — [Frostpunk 2 wiki: Council](https://frostpunk-2.game-vault.net/wiki/Council); [Gamepressure FP2 council](https://www.gamepressure.com/frostpunk-2/council/zf115fb)
- A player warns that the tooltip tells you up front that recruiting a secret police brings in violent faction members. The consequence is previewed, but in small text that players skip — [Steam discussion](https://steamcommunity.com/app/1601580/discussions/0/4851029693347994942)

**Tropico 5/6 (Haemimont / Limbic)**
- Approval is made of happiness, the economy and election promises. Promises made before an election can raise it sharply — [Gamepressure Tropico 6](https://www.gamepressure.com/tropico-6/happiness-and-approval/zbc04d)
- The Almanac lists each happiness factor with your current grade for it (for example, food scores higher with more variety). Faction leaders are findable there, and their personal happiness sways their faction — [Gamepressure Almanac](https://www.gamepressure.com/tropico-6/almanac/z8c04a); [Tropico manual ch.8](https://discmaster.textfiles.com/file/14560/K-CD_2001-12.iso/Tropico/data1.cab/Manual/chapter8.html)
- Each faction wants different things (in Tropico 5, Religious want churches, Capitalists jobs, Communists housing), so one action reads differently to each group — [Gamepressure T5 Almanac](https://www.gamepressure.com/tropico5/6-almanac/zf642c); [Gamepressure T6 factions](https://www.gamepressure.com/tropico-6/fractions/zdc028)
- Players report revolts after harsh acts (arrests, killings) even when approval was high. This is an example of a consequence that feels unattributed — [Steam discussion](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456)

**Reigns (Nerial)**
- When you drag a card left or right, you "immediately see which categories will be affected by your decision" before you let go. Reviews summarised in the search say the indicator shows which meters move, not in which direction — [Birth.Movies.Death review](https://birthmoviesdeath.com/2016/09/02/reigns-review-swipe-right-to-fight-the-devil.html)
- No developer source on the preview-dot design was found (see Gaps).

**Papers, Please (Lucas Pope)**
- At the end of each day the game settles accounts. Pay comes from the people you processed (plus bribes), minus fines for mistakes. You then pay rent, food, heat and, if someone is sick, medicine. Going into debt ends the game — [Papers, Please wiki](https://papersplease.fandom.com/wiki/Papers,_Please); [Wikiwand](https://www.wikiwand.com/en/articles/Papers_Please)
- The chain is easy to read: too many fines leave you unable to afford heat, and going without heat makes your child sick — [Softpedia review](https://www.softpedia.com/reviews/games/pc/Papers-Please-Review-374140.shtml)
- The family screen was kept deliberately plain: names with tick-box states (hungry, sick, cold), to avoid steering the player's feelings — [PopMatters](https://popmatters.com/183289-papers-please-morality-2495645423.html); [Game Informer](https://gameinformer.com/b/features/archive/2013/11/29/top-50-challenge-papers-please.aspx)

**Crusader Kings 3 (Paradox)**
- Tooltips open inside tooltips: a highlighted term opens its own explanation. A timer lock is the default; middle-click lock is opt-in, so experienced players can turn the extra tooltips off — [Philip Ardeljan, "Tooltips in tooltips"](https://philip.design/blog/tooltips-in-tooltips/)
- Ardeljan flags the risks (a small cursor slip dismisses the tooltip; keyboard and screen-reader access) and suggests a depth limit of about 2–3 — [philip.design](https://philip.design/blog/tooltips-in-tooltips/); [Driftwork Studio on narrating tooltips](https://www.driftworkstudio.com/blog/how-to-narrate-tooltips-in-games)
- In CK3, temporary opinion modifiers decay: halfway through, a modifier is half as strong. Event chains show the effects already applied by earlier events in the same chain (player report on the Paradox forum) — [Paradox forum](https://forum.paradoxplaza.com/forum/threads/adultery-issues-in-the-stream.1411182)
- Patch 1.1 example of a named, long-lived, decaying consequence: refusing an ally's defensive war gives −50 opinion for 25 years, decaying — [Sixth Axis patch notes](https://www.thesixthaxis.com/2020/09/29/crusader-kings-iii-update-1-1-patch-notes/)
- A bug report says the vassal-stance breakdown skips temporary modifiers, so the total doesn't match the parts — [Paradox forum](https://admin-forum.paradoxplaza.com/forum/threads/vassal-stance-totals-skip-over-some-actions.1591366)

**Civilization VI (Firaxis)**
- Players complain that neither the Reports screen nor the City screen shows true total yields, and that the breakdowns don't add up (for example, the amenity bonus is missing) — [CivFanatics: why don't yields add up](https://forums.civfanatics.com/threads/why-dont-yields-add-up.631356); [non-food yield thread](https://forums.civfanatics.com/threads/what-is-considered-a-non-food-yield.669662)
- The popular CQUI mod adds an amenities tooltip showing the city's mood, what that mood does, and the breakdown of gains and losses. This is evidence players want an itemised "why" — [CQUI Community Edition (GitHub)](https://github.com/civfanatics/CQUI_Community-Edition)

**Cities: Skylines I/II (Colossal Order)**
- The Happiness info view gives a quick overview of what makes citizens happy or unhappy and highlights areas to improve. CS1 breaks happiness down by zone type and district — [gameplay.tips CS2 info views](https://gameplay.tips/guides/cities-skylines-ii-info-views-guide.html); [Gamepressure info panel](https://www.gamepressure.com/citiesskylines/information-panel/za7595)
- In CS2, Chirper (the in-game social feed) is "integrated more into the core gameplay as citizens voice their happiness and frustrations": citizens' own voices report feedback — [Paradox: Citizen simulation & lifepath](https://www.paradoxinteractive.com/games/cities-skylines-ii/features/citizen-simulation-lifepath); [MP1st](https://mp1st.com/news/cities-skylines-2-citizen-simulation-and-lifepath-deep-dive-released-game-features-its-own-version-of-twitter)
- Overlays (pollution, noise, crime, land value) let players find the place where a problem comes from — [guidestrats](https://guidestrats.com/cities-skylines-how-to-make-citizens-happy/)

**Suzerain (Torpor Games)**
- The dialogue is backed by political maps and "a constant feed of reports and newspaper articles" — [Wikiwand: Suzerain](https://www.wikiwand.com/en/articles/Suzerain_(video_game))
- Reviewers name "the concrete consequences of your actions" as the core of the loop — [KFJ Writes review](https://kfjwrites.substack.com/p/from-the-archive-suzerain-review); [GamingTrend review](https://gamingtrend.com/reviews/youve-got-my-vote-suzerain-review/)

### Inferences
- For Seat of Power: tapping any meter (Approval, Party, Treasury, godfather, House) should open a short sheet: the current value, the top 3–5 signed contributions this year in plain words, and a "see all" link. This is the CK3/CQUI idea, cut to two levels at most for touch (Ardeljan's depth limit).
- Use good/bad colour, not direction colour. Democracy's red/green-as-direction confuses players. On a phone, "+3 roads (good)" in green and "−5 unpaid salaries" in red, judged by player interest, reads faster.
- A Democracy-style web is too dense for a phone, but its "fade everything except what's linked" idea transfers. When a sheet is open, highlight the related meters at the top of the screen and dim the rest.
- Papers, Please's end-of-day settlement is the closest model for Seat of Power's year-end review: a fixed-order list of money in, money out, then people's states (the godfather, the Assembly, the party, citizens) as short tick-box lines.
- Chirper and Suzerain newspapers suggest the "why" can be voiced by in-world characters (WhatsApp messages, newspaper headlines, a market woman's quote) that name the cause, as long as a plain ledger sits behind them.

### Gaps
- No primary developer source was found on Reigns' preview-dot design (dot size for magnitude, no direction). Commonly stated by players, but I could not confirm it.
- Nothing usable was found on This War of Mine's or Banished's cause-and-effect UI.
- No Torpor Games developer source was found on how Suzerain stores choices and calls them back in newspapers.
- No 11 bit GDC talk on Frostpunk's feedback UI was found.

## 2. Patterns for delayed consequences (flagging, callbacks, ledgers, "because you…", previews, attributed post-turn reports)

### Takeaway
Delayed effects work when the game (1) flags at the moment of choice that the decision is being remembered, (2) shows the pending effect moving toward its target, like Democracy 4's ghost bar, and (3) names the original decision when the consequence lands, as CK3 event chains do. Players reliably fail to connect delayed outcomes to their own past actions unless they are told.

### Cited Findings
- Telltale's "X will remember that": Sean Vanaman said the team worried players would forget their choices mattered over 6–8 weeks between episodes. When the line did *not* appear, that also told players the story was not fixed. Critics say it invites min-maxing — [Game Developer, "T.M.I."](https://www.gamedeveloper.com/design/-t-m-i-preserving-the-suspension-of-disbelief-through-ambiguity)
- New Tales from the Borderlands dropped the prompt, leaving players to infer effects. This shows the trade-off between clarity and immersion — [VG247 mirror](https://vg247ac.pages.dev/posts/telltale-will-remember-that-why-new-tales-from-the-borderlands-dropped-the-infamous-conversation-prompt)
- Game Developer's meaningful-choice guide lists "reminders" as a core criterion: "The player must be reminded of the choice they made after they made it", along with gameplay- and aesthetics-oriented consequences and permanence — [Game Developer: Meaningful choice](https://gamedeveloper.com/design/meaningful-choice-in-games-practical-guide-case-studies)
- Democracy 4 shows an effect still under way as a lighter "ghost" bar moving toward its final position, plus how far each policy has been implemented — [D4 Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- Democracy 4 deliberately makes infrastructure slow, so "the player spends for ages before seeing the benefit" — [Steam discussion](https://steamcommunity.com/app/1410710/discussions/0/6163789298352068663/)
- CK3 event chains show what effects earlier events in the same chain already applied. The callback carries its history — [Paradox forum](https://forum.paradoxplaza.com/forum/threads/adultery-issues-in-the-stream.1411182)
- CK3 names long consequences with a duration and a decay ("−50 for 25 years (decaying)") — [Sixth Axis](https://www.thesixthaxis.com/2020/09/29/crusader-kings-iii-update-1-1-patch-notes/)
- Frostpunk 2: broken promises significantly lower faction trust. The promise is a stored commitment that comes due — [Gamepressure FP2](https://www.gamepressure.com/frostpunk-2/council/zf115fb)
- Sterman's 1989 experiment: subjects poorly appreciated the delays between action and response, were insensitive to how their decisions fed back into the system, and blamed the swings they saw on external events when their own actions caused them — [Sterman 1989, Management Science (RePEc)](https://econpapers.repec.org/RePEc:inm:ormnsc:v:35:y:1989:i:3:p:321-339); [MIT working paper](https://dspace.mit.edu/bitstream/handle/1721.1/2184/SWP-1933-18213539.pdf?sequence=1)

### Inferences
- **"This will come back" tag at decision time.** On mailbox letters and projects whose effects arrive later, show a small clock chip ("Effect in ~2 years") and a one-line memory toast ("The Party Chairman will remember this"). Use it sparingly, only for decisions with real delayed weight, so it keeps its meaning (Vanaman's point that the line's absence also says something).
- **Pending-effects tray (Democracy ghost bar).** Next to each meter, show a faint ghost marker for where queued effects will push it (for example, Treasury ghost at −₦4bn from a road contract due next year). Tapping it lists the pending items and when each is due.
- **Callbacks must name the original decision and its date:** "Because you refused Chief Adewale's contractor in Year 1, his boys are blocking the Assembly vote." Show it with a small "from your decision, Year 1" stamp that opens the original letter.
- **Decision ledger / timeline.** A scrollable "My Record" list of every major decision with its effects so far and its pending effects. This answers the Democracy 4 players' request for long-range history with events marked.
- **Given Sterman, the year-end review should not just list meter changes.** It should split each change into "caused by your decisions" and "outside events" (oil price, FAAC allocation, floods), so players don't misread their own delayed effects as bad luck.
- **Promises as visible debts.** Frostpunk 2-style promises to the House or godfather should sit in a "Promises due" list with a countdown, so the trust hit when one is broken is expected.

### Gaps
- No empirical study was found measuring how much an explicit "will remember" flag improves players' recall or attribution of delayed effects.
- Fetching the Failbetter "decision gap" essay failed, so its argument is not included.

## 3. Breakdown tooltips, waterfall/delta charts, annotated sparklines

### Takeaway
Players expect an itemised, signed breakdown that adds up to the shown total (CK3, CQUI). Breakdowns that are incomplete (Civ 6, the CK3 stance bug) erode trust. History graphs need event annotations and a long enough range (Democracy 4 players' request).

### Cited Findings
- CQUI's amenities tooltip shows the current mood, what that mood does, and the itemised causes of gains and losses — [CQUI GitHub](https://github.com/civfanatics/CQUI_Community-Edition)
- Civ 6 players complain the totals don't match the listed sources ("they pick up some sources of yields, but not all of them") — [CivFanatics](https://forums.civfanatics.com/threads/why-dont-yields-add-up.631356)
- CK3 breakdown bug: totals skip temporary modifiers — [Paradox forum](https://admin-forum.paradoxplaza.com/forum/threads/vassal-stance-totals-skip-over-some-actions.1591366)
- The Tropico Almanac grades each happiness factor separately, so players can see which factor drags the average down — [Gamepressure](https://www.gamepressure.com/tropico-6/almanac/z8c04a)
- Democracy 4 players want graphs from the first election to now, with event timestamps — [Steam](https://steamcommunity.com/app/1410710/discussions/0/3053986162860860161/)
- Nested tooltips should be limited to about 2–3 levels and planned for accidental dismissal — [philip.design](https://philip.design/blog/tooltips-in-tooltips/)

### Inferences (phone-specific)
- **Tap-sheet format for each meter:** "Approval 54% (▲3 since last year)", then rows sorted by size: "+6 Lagos–Ibadan road finished", "+2 paid pensions on time", "−5 teachers' salaries 3 months late", "−2 godfather's thugs at rally", then "Other +2". The rows must sum to the change, using an explicit "Other/rounding" row rather than a mismatch.
- **Waterfall chart in the year-end review:** start bar → a few signed steps (top 4 causes plus "other") → end bar. This fits about 320px wide as a vertical waterfall with labels on the left.
- **Sparkline with pins:** a 4-year mini line per meter, with tappable dots where big decisions happened. Each dot opens the decision.
- **Two-level limit:** meter → contribution row → the original letter or project. No deeper.
- **Long press / tap, not hover.** Hover doesn't exist on mobile. Every Democracy-style hover should become a tap that opens a bottom sheet.

### Gaps
- No published usability study on waterfall charts in games was found.

## 4. Research on perceived agency, causality, meaningful choice and feedback delay

### Takeaway
Feeling agency depends more on specific, immediate feedback that names the choice than on actual branching. Delayed feedback in dynamic systems strongly degrades learning, and people blame external causes. Both point to always attributing, explicitly and quickly.

### Cited Findings
- Fendt et al.: in text stories, branching and non-branching versions mostly produced no significant difference in felt agency when there was immediate feedback about the choice. Generic feedback did not preserve agency; it had to be specific to the choice — [Fendt et al. 2012, Achieving the Illusion of Agency](https://ciigar.csc.ncsu.edu/files/bib/Fendt2012-IllusionOfAgency.pdf)
- A CHI 2021 interview study (28 narrative-game players): agency was higher for choices seen as leading to meaningfully different states than for choices leading to similar states — [ACM CHI 2021, "Naked and on Fire"](https://dl.acm.org/doi/fullHtml/10.1145/3411764.3445540)
- Agency has a local layer (immediate feedback) and a global layer (long-term consequences). Agency measures centre on effectiveness and causal attribution — [DiGRA 2025 paper](https://eprints.whiterose.ac.uk/id/eprint/230214/1/DiGRA25_Redefininf_Play.pdf)
- Agency informing techniques: research specifically on telling players about their agency in interactive narratives — [ResearchGate](https://www.researchgate.net/publication/319364506_Agency_informing_techniques_communicating_player_agency_in_interactive_narratives)
- Sterman (1989): people anchor and adjust, ignore delays and feedbacks, and blame external events for dynamics they caused — [RePEc](https://econpapers.repec.org/RePEc:inm:ormnsc:v:35:y:1989:i:3:p:321-339)
- Follow-on: Langley, Paich & Sterman (1998) applied misperceptions of feedback to market overshoot; Fu & Gonzalez (2006) studied whether learning happens in dynamic decision tasks — [SD proceedings 1998](https://proceedings.systemdynamics.org/1998/PROCEED/00026.PDF); [Fu & Gonzalez 2006](https://www.cmu.edu/dietrich/sds/ddmlab/papers/FuandGonzalezCogSci2006.pdf)
- Sid Meier (GDC 2012, "Interesting Decisions"): stressed trade-offs, long-term vs short-term benefits, and presenting decisions with enough feedback; "something that's interesting you do once doesn't mean it's something interesting to do ten times" — [Game Developer GDC 2012 report](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions); [GDC Vault](https://gdcvault.com/play/1015756/Interesting)

### Inferences
- Every mailbox decision should get an **immediate, specific** reaction line within a second ("The Speaker smiles. House support +4"), even when the main effect is delayed. This covers the "local agency" layer.
- The delayed effect is the "global agency" layer. The callback must name the decision to earn attribution credit (Sterman).
- Show meaningfully different outcomes in the preview ("Option A: Treasury ▼, Godfather ▲; Option B: Approval ▲, Godfather ▼▼") so options don't feel interchangeable.
- Meier's long-term vs short-term trade-off is exactly Seat of Power's road-vs-salary tension. Show both horizons in the preview ("Now: −₦2bn. In 2 years: +Approval").

### Gaps
- No game-specific experiment was found that measures how attribution UI (breakdowns, callbacks) changes players' understanding of a simulation.

## 5. What to avoid

### Takeaway
Avoid shown deltas with no felt consequence, colour schemes that mean direction rather than good/bad, breakdowns that don't add up, harsh events that look disconnected from earlier acts, and hiding the overview whenever an explanation is opened.

### Cited Findings
- Deltas that don't matter make a meter system feel hollow (Frostpunk critique) — [Slant](https://slantmagazine.com/games/frostpunk)
- Red/green as direction rather than value misleads players — [NamuWiki](https://en.namu.wiki/w/Democracy%203); [Steam](https://steamcommunity.com/app/245470/discussions/0/558747287687380501)
- Unlabelled icons, and hovering to explain one that hides the rest of the screen — [Indie Game Reviewer](https://indiegamereviewer.com/review-democracy-3-from-positech-games/)
- Breakdowns that don't reconcile with totals — [CivFanatics](https://forums.civfanatics.com/threads/why-dont-yields-add-up.631356); [Paradox forum](https://admin-forum.paradoxplaza.com/forum/threads/vassal-stance-totals-skip-over-some-actions.1591366)
- Revolts at high approval that feel unexplained (Tropico players) — [Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456)
- Critical consequences buried in tooltip text players skip (Frostpunk 2 secret police) — [Steam](https://steamcommunity.com/app/1601580/discussions/0/4851029693347994942)
- Tooltip density crowds the screen; CK3 made extra layers opt-in, and mods hide event-option tooltips — [philip.design](https://philip.design/blog/tooltips-in-tooltips/)
- Generic feedback doesn't create agency — [Fendt et al.](https://ciigar.csc.ncsu.edu/files/bib/Fendt2012-IllusionOfAgency.pdf)

### Inferences
- **Change budget per moment:** after a decision, animate at most 2–3 meter changes at once, one after another (about 300ms each), then group the rest into "+2 more" so the main cause stays readable on a small screen.
- **Random events must be labelled as outside events** ("Flood in Kogi — not your doing") and kept separate from player-caused rows, so randomness doesn't feel like hidden punishment.
- **No silent consequence:** a rule that every meter change ≥ some threshold must have a named source row in the breakdown. Automated tests could enforce this: every effect object carries a `sourceDecisionId` or `sourceEvent`.
- Put severe outcomes (godfather turns hostile, impeachment risk) in the preview itself as a warning chip, not only in body text.

### Gaps
- No quantitative data was found on the best number of simultaneous changes. The 2–3 figure above is a design inference, not a sourced number.
