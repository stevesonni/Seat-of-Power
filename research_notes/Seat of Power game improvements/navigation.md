# Navigation and Information Architecture for Content-Heavy Mobile Management Games (Seat of Power)

Research note on network limits: nngroup.com, m3.material.io, smashingmagazine.com and discover.therookies.co could not be fetched from this session (host not allowed). Findings from those sites come from search-result summaries and secondary write-ups, not from reading the full pages. Treat the exact figures with that in mind. developer.android.com was fetched in full.

## 1. Mobile navigation research: tab bars vs hamburger, number of tabs, hub vs tabs, back stack, Android back, thumb zones

### Takeaway
Visible navigation beats hidden navigation, and the gap is larger for content you want people to find. On mobile the bottom bar should hold 3 to 5 top-level places. Back must step through a predictable stack that ends at one fixed home screen, and a deep link should rebuild that stack. Seat of Power's three-tab bar is within the guidelines. The risk sits underneath it: many sub-page chips per tab, plus a hamburger menu, add up to a hidden second and third level.

### Cited Findings
**Hidden vs visible navigation (NN/g, 2015/2016 study, 179 participants, 6 sites, phones and desktops)**
- On mobile, participants used hidden (hamburger) navigation in 57% of cases and combo (partly visible) navigation in 86% of cases. — [NN/g, Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/) (via search summary)
- On mobile, task time was 26 s with hidden navigation vs 24 s with combo navigation. NN/g notes that hiding navigation hurts more on desktop than on phones, but it still hurts on phones. — [NN/g](https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/); [NN/g methodology](https://www.nngroup.com/articles/hidden-navigation-methodology/) (via search summary)
- A secondary summary reports that discoverability fell about 20% with hidden navigation and that users were 15% slower on mobile. An NN/g video says hiding the main navigation cuts discoverability "almost in half" (on desktop). The figures differ between sources, so cite the 57% vs 86% usage numbers as the most solid ones. — [Smart Insights](https://www.smartinsights.com/digital-marketing-strategy/are-hamburger-menus-hidden-navigation-good-for-ux/); [NN/g video](https://www.nngroup.com/videos/navigation-menu-visibility/?lm=cdrom&pt=article)

**Industry case reports (company-reported, not peer-reviewed)**
- Redbooth replaced its hamburger with a 5-tab bar on iPhone. It reports that sessions more than doubled and session time rose 70%. — [Redbooth blog](https://redbooth.com/blog/hamburger-menu-iphone-app)
- zeebox moved from a tab bar to a hamburger and reported that engagement dropped almost by half, so it reverted. — [TechCrunch](https://techcrunch.com/?p=1007141); [PhoneArena](https://www.phonearena.com/news/Hamburger-menus-could-kill-your-user-engagement_id54923)
- GoSpotCheck found from internal data that mobile users spent about 6 minutes a day getting around inside the hamburger menu, and moved its most-used features out of it. — [GoSpotCheck](https://www.gospotcheck.com/blog/the-death-of-the-hamburger-menu)

**Number of tabs and the rules for using them**
- Material Design 2: a bottom navigation bar gives access to 3 to 5 top-level destinations. Below 3, use tabs. Above 5, use a drawer or tabs. — [Material bottom navigation](https://material.io/components/bottom-navigation); [Material M1 archive](https://m1.material.io/components/bottom-navigation.html)
- Material 3 navigation bar: 2 to 5 core destinations, spaced evenly; a rail or drawer on tablets. — [SAP Fiori mirror of M3 navigation bar](https://www.sap.com/design-system/fiori-design-android/v26-1/components/m3-standard-components/navigation-bar/usage) (secondary)
- Apple HIG: "Use a tab bar only to enable navigation, not to help people perform actions"; a tab bar is "specifically for navigating between areas of an app" (actions go in toolbars). — [Apple HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars.md); [Apple HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars.md)

**Back stack and Android back (Android Developers, "Principles of navigation", fetched)**
- "Every app you build has a fixed start destination." It is the first screen on launch "and also the last screen the user sees when they return to the launcher after pressing the Back button." — [Android Developers](https://developer.android.com/guide/navigation/principles)
- Navigation state is a stack. "The back stack always has the start destination of the app at the bottom." Back pops the top destination. — [Android Developers](https://developer.android.com/guide/navigation/principles)
- Inside the app, Up and Back behave the same. "The Up button never exits your app"; Back exits only from the start destination. — [Android Developers](https://developer.android.com/guide/navigation/principles)
- "Deep linking simulates manual navigation": a deep link replaces the back stack with a synthetic one (start destination plus target) that "must be realistic," matching a path the user could have taken by hand. — [Android Developers](https://developer.android.com/guide/navigation/principles)

**Back button in a web app inside another app (webview)**
- The common pattern: call `history.pushState` when a modal or sheet opens and close it on `popstate`. When the sheet is closed by an on-screen button, remove the extra entry (e.g. `history.back()`). — [MDBootstrap forum](https://mdbootstrap.com/support/angular/close-modal-on-back-button-click); [Stack Overflow archive](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/a/49954532)
- In a native Android WebView, the hardware back button belongs to the host app. pushState/popstate can work in a browser and still fail on the device. The fix is for the host's `onBackPressed` to call a JS function, or to call `webView.goBack()` when `canGoBack()`. — [Ionic forum](https://forum.ionicframework.com/t/ionic-4-pwa-back-button-not-closing-modal/148663); [Stack Overflow: capture native back in webview](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/32190321/capture-the-native-back-button-event-from-within-webview)
- Chrome's "history manipulation intervention": the browser Back button skips history entries a page added without a user activation (e.g. pushState on load). User activation on any frame makes the entry count. This does not affect `history.back()`. — [Chromium design doc](https://chromium.googlesource.com/chromium/src/+/127.0.6533.99/docs/history_manipulation_intervention.md)

**Thumb zones**
- Hoober's 2013 observation of 1,333 people: 49% held the phone one-handed, 36% cradled it, 15% used two hands. About 75% of touches came from a thumb. — [UXmatters, Hoober](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php?); [mobiForge](https://mobiforge.com/?p=8007)
- Hoober also found people tap the centre of the screen most easily and accurately, and they shift their grip often. One secondary source says Hoober later called the popular green/yellow/red thumb-zone chart wrong (not verified at source). — [The Team W summary](https://www.blog.theteamw.com/?p=9357); [Monterail](https://www.monterail.com/blog/thumb-friendly-navigation-word-oriented-design)
- Smashing Magazine's "Thumb Zone" article (2016) argues for putting primary navigation and actions at the bottom of large phones. — [Smashing Magazine](https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users) (not fetched)

### Inferences
- The three tabs are fine. The trouble is the second level of chips: State has 4+ chips and People has 4+, and chips scroll sideways, so the later ones are effectively hidden navigation. NN/g's 57% vs 86% gap suggests that sub-pages past the first visible chips get used much less. Options: limit each tab to 3 or 4 chips that all fit on screen without scrolling, or turn the tab's landing page into a short list of labelled rows, one per sub-page, each with a one-line status ("Treasury: ₦4.2bn, 2 leaks").
- Whatever lives only in the hamburger menu will be rarely found. Keep it to settings, save/load, language and help. Nothing needed to play should live there.
- Back rule for Seat of Power. The stack is Desk/Compound (fixed start) → tab → sub-page → sheet. Back closes the top sheet first, then returns to the tab root, then to Desk. At Desk it asks "Leave the game?" rather than exiting. Because the game runs inside Lagos Life, the host's back handler and the game's history entries have to agree. Push history entries only after a tap (because of Chrome's activation rule) and test on a real Android device.
- Adviser and notification links should rebuild a realistic stack. Example: tapping "Treasury leak" opens State › Treasury with that item highlighted, and Back then goes to State, then to Desk, never out of the game.

### Gaps
- Could not read NN/g's full article (blocked host), so exact study figures come from secondary summaries.
- Found no research on how the Android predictive-back gesture behaves inside third-party webviews such as Lagos Life's. The game team would need to test it.
- No usable data on how many sub-tabs or chips per tab is too many. The 3-to-5 rule applies to the top level only.

## 2. How mobile management and strategy games structure navigation

### Takeaway
Successful mobile management games use one of two models. (a) A diegetic hub (a vault, village or town) where you tap things, plus a small, always-visible bottom bar or HUD for menus that aren't places. (b) One screen with one gesture (Reigns). Games with many menus (Football Manager, Civ VI, Pocket City) draw the most "buried in menus" complaints. Their fixes are a home "portal" that gathers what matters and a turn button that takes you to whatever is pending.

### Cited Findings
- **Clash Royale**: the main menu has shortcuts along the bottom edge for moving between screens, always visible. All main functions (menu bar, chests, deck) sit low on the screen so the game can be played one-handed. — [The Rookies breakdown](https://discover.therookies.co/2020/02/24/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/) (via search summary); [GameGrin](https://www.gamegrin.com/articles/what-can-online-apps-learn-from-clash-royales-user-interface)
- Clash Royale's 2024 relaunch: Supercell removed and replaced the whole Events tab, and the main bar showed a placeholder "under construction" button for a while. Even Supercell rebuilds its bar contents when features change. — [mobilegamer.biz](https://mobilegamer.biz/supercell-explains-clash-royales-big-comeback/)
- **Fallout Shelter**: the vault is the hub. Zooming out gives a flat 2D overview; double-tapping a room zooms in; double-tapping empty space or pinching zooms back out. Most actions take one or two taps, and dwellers are moved by drag and drop. Players complained that selecting a dweller, selecting a room and scrolling get in each other's way, and one reviewer found the first-run UI "scatterbrained." — [hyperlogos](https://hyperlogos.org/blog/drink/Whats-Wrong-Fallout-Shelter); [Destructoid](https://destructoid.com/?p=190054); [MobileSyrup](https://mobilesyrup.com/2015/08/16/fallout-shelter-review-perfect-for-mobile-but-lacks-depth/); [Boing Boing](https://boingboing.net/2015/06/16/fallout-shelter-makes-you-shut.html); [gamesas forum](https://www.gamesas.com/post5159025.html)
- **Pocket City / Pocket City 2**: menus plus drag and drop. Reviewers note UI quirks that are "annoying, especially in portrait mode," wish they could place several things without going back through the menu, and say some things are "too buried in menus." Other reviewers praise the controls. — [iMore](https://www.imore.com/pocket-city-review); [TouchArcade, Pocket City 2](https://toucharcade.com/2023/04/18/pocket-city-2-review-mobile-iphone-ipad-premium-city-builder/); [Pocket Gamer](https://www.pocketgamer.com/pocket-city/review/)
- **Reigns** (a political game, so the closest match in genre): pitched as "Tinder and Game of Thrones." It is one screen, one card and a binary swipe, deliberately mocking "complex politics boiled down to yes-or-no situations." — [Game Developer](https://gamedeveloper.com/design/how-i-reigns-i-lead-developer-made-politics-feel-as-goofy-as-tinder); [Gaming Trend interview](https://gamingtrend.com/feature/interviews/one-night-with-the-king-reigns-developer-interviewed-on-games-success)
- **Football Manager (many menus)**: FM26 replaced the old inbox-as-hub with a "Portal" that holds your inbox and quick links to calendar, next opponent and league table. Navigation became the single biggest complaint about FM26 on Steam, Reddit and SI's forums, including pop-ups with no back button. For FM27, SI moved navigation into primary and secondary menus at the top with drop-downs so "you can reach the section you want without loading multiple pages," aims to "reduce the need to hunt for details behind a message," and redesigned FM27 Touch on iPhone "from the ground up" with refined text and button sizes. — [FM26 reimagined UI](https://footballmanager.com/fm26/features/fm26s-reimagined-user-interface); [FM27 Clearer Interface & Smoother Navigation](https://www.footballmanager.com/fm27/features/fm27-clearer-interface-smoother-navigation); [FRVR on FM26](https://frvr.com/blog/news/9-things-football-manager-26-needs-to-fix-immediately-to-get-back-on-side); [The Sixth Axis](https://www.thesixthaxis.com/2026/09/22/football-manager-27s-first-deep-dive-video-is-all-about-the-ui-and-navigation/)
- **Civilization VI**: the End Turn button doubles as a queue of what needs you. It shows "!" or an icon (unit needs orders, choose research, choose production), and tapping it jumps to the next item; once nothing is pending it becomes End Turn. Player complaints: it can get stuck when the game loses track of a unit, its meaning changes with context, and players want to turn off auto-cycling and to skip anyway. — [Steam discussions](https://steamcommunity.com/app/289070/discussions/0/312265327165650851); [CivFanatics](https://forums.civfanatics.com/threads/not-able-to-finish-turn-in-certain-circumstances-stuck-on-units-orders.603521); [Gamepressure tips](https://www.gamepressure.com/sidmeierscivilization6/gameplay/z192bd)

### Inferences
- Seat of Power mixes both models (a compound map of buildings plus tabs with chips), which gives two routes to the same screens. Choose one as the main route. Option A: the Compound is home and each building is a door to one sub-page (Treasury building opens Treasury). The tabs become shortcuts with the same names and icons as the buildings, so the two can be learned together. Option B: tabs are the main route and the Compound becomes a decoration or summary.
- A Civ VI-style "Next" button is the most direct answer to "doesn't show clearly where to click." It is one persistent button in the thumb zone that always says what it will do ("Sign the budget", "Answer the Commissioner", "End the week"). It must never get stuck, and the player must always be able to skip.
- FM's move from inbox to Portal backs a Desk "Today" page that combines the mailbox, deadlines and key meters. The FM26 backlash also warns that a full redesign at once can make things worse. Change in steps and test each one.
- Reigns shows that for a politics game the decision itself can be the whole interface. Decision sheets should stay full-screen with one choice, and should not open more navigation.

### Gaps
- Could not get primary UI teardowns of Township, Hay Day, SimCity BuildIt, Tropico mobile or Plague Inc mobile in the call budget. From general knowledge (unverified here): Hay Day, Township and SimCity BuildIt use a town hub with tappable buildings plus corner HUD buttons; Plague Inc uses a world map with a few bottom buttons and pop-up bubbles to tap.
- No Lagos-built or African management games with a documented navigation design were found. Not searched in depth.
- No GDC talk specifically on Supercell's navigation bar was found. The Brawl Stars GDC 2019 design talk exists ([GDC](https://gdconf.com/news/go-inside-design-supercells-new-hit-game-brawl-stars-gdc-2019)) but was not reviewed.
- Game UI Database, Deconstructor of Fun and Mobile Free To Play were not reached.

## 3. Patterns: "what needs you" inbox, badges, deep links, breadcrumbs, search, HUD, diegetic hubs, depth, one primary action

### Takeaway
The best-supported patterns are: one queue of what needs you, reached from a single always-visible button. Deep links that drop the player on the exact screen and item, with a realistic back stack. Badges only for things that need an action. One visually dominant action per screen. Breadcrumbs and search add little at Seat of Power's depth (3 levels). A clear "you are here" and a predictable Back matter more.

### Cited Findings
- Queue-as-button: Civ VI's End Turn button shows the next required action and jumps to it. Failure modes are a stuck state and a meaning that shifts with context. — [Steam](https://steamcommunity.com/app/289070/discussions/0/312265327165650851); [CivFanatics](https://forums.civfanatics.com/threads/upgrading-ship-leads-to-unit-awaiting-orders-reproduceable.602354/latest)
- Hub with inbox: FM26's Portal gathers inbox, calendar, next opponent and standings on the home screen. FM27 tries to stop players jumping between the inbox and separate screens to act on a message. — [FM26](https://footballmanager.com/fm26/features/fm26s-reimagined-user-interface); [FM27](https://www.footballmanager.com/fm27/features/fm27-clearer-interface-smoother-navigation)
- Deep links must build a synthetic back stack that matches a path the user could have taken by hand. — [Android Developers](https://developer.android.com/guide/navigation/principles)
- In-game notification hub: practitioners recommend batching notifications into a hub players can read when they choose. — [ngrow.ai](https://www.ngrow.ai/blog/the-dark-side-of-push-notifications-avoiding-user-overload) (vendor blog)
- Persistent, low HUD/bar: Clash Royale keeps its navigation always visible and low on the screen for one hand. — [GameGrin](https://www.gamegrin.com/articles/what-can-online-apps-learn-from-clash-royales-user-interface)
- One primary action: Hick's Law says decision time grows (roughly logarithmically) with the number of options. Practitioner advice is to make the main call to action stand out and play down the rest, aim for "one call-to-action per section," and help the user take "the next logical step, not every possible one." Measured A/B evidence for a single CTA is thin; most of it is design writing. — [think.design](https://think.design/blog/understanding-hicks-law-ux-design/); [UX Magazine](https://uxmag.com/?p=4359); [Webreality](https://www.webreality.co.uk/insights/choice-overload-the-ux-problem-costing-you-conversions/)
- Tabs carry navigation only, not actions (Apple). — [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/tab-bars.md)

### Inferences
- **Pattern 1, "Needs you" queue.** Use one ordered list on Desk/Today. Each row has a verb, who is asking, a deadline and a single button that opens the exact sheet. A matching persistent "Next" button in the bottom-right thumb area works through the same queue. When the queue is empty the button reads "End week" or "Advance time."
- **Pattern 2, deep links everywhere.** Every adviser line, mail item, meter alert and end-of-week summary that mentions a place should open it with the relevant row highlighted, and Back should return to where the player came from. This answers "no clear instructions": the game shows the place instead of describing it.
- **Pattern 3, "you are here."** Highlight the active tab and chip, and give every sub-page a title such as "State › Treasury." A full breadcrumb trail isn't needed at 3 levels.
- **Pattern 4, depth limit.** No more than tab → sub-page → sheet. Never open a sheet on top of a sheet. A sheet that needs more detail should expand in place.
- **Pattern 5, first-time spotlight.** The first time a player reaches each sub-page, dim everything except the one control to use, with one sentence of instruction. Show it once and keep it re-openable from help. This addresses "doesn't show clearly where to click." It is an inference from the evidence on primary CTAs; no game-specific study was found.
- **Pattern 6, search.** Low priority. With about 15 destinations, labelled rows on each tab root do the job better than a search box.

### Gaps
- No controlled study found on diegetic hubs vs menus for findability in games.
- No research found on breadcrumbs specifically in mobile games.

## 4. Evidence on badge overload, banner blindness, and how many calls-to-action a screen can carry

### Takeaway
Users learn to ignore anything that looks like an ad or is always present. A red dot that never clears stops meaning anything. The evidence is strong for banner blindness (NN/g eyetracking, repeated over years) and mostly practitioner opinion for badge fatigue. No reliable number exists for the maximum CTAs per screen. Guidance comes down to one dominant action per section.

### Cited Findings
- Banner blindness persists: NN/g's 2018 eyetracking update says users still ignore content that looks like ads or sits where ads usually sit, and that real content with ad-like traits (bright boxed promos, right rails, promos inside text) is ignored too. — [NN/g, Banner Blindness Revisited: Old and New Findings](https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/?hl=nb-NO) (via search summary)
- In NN/g's original eyetracking work, participants read the page text but looked very little, if at all, at ad-like elements. — [NN/g original eyetracking](https://www.nngroup.com/articles/banner-blindness-original-eyetracking/); [NN/g video](https://www.nngroup.com/videos/banner-blindness/)
- Red-dot badging: a dot that is always visible "eliminates impact." Treating informational and action-needed badges the same causes badge fatigue. Clear the badge as soon as the prompt is no longer needed. — [Braze](https://www.braze.com/resources/articles/beware-red-dot-badging.md); [Dolfy](https://www.dolfy.ai/blog/notification-badge-problem-red-dot-mobile-apps); [Reteno](https://reteno.com/blog/what-are-app-icon-badges-definition-tips-for-mobile-marketing) (vendor blogs)
- Reteno cites a claim that 27% of users give too many badges or notifications as a reason for abandoning an app. The original source is not named, so treat it as unverified. — [Reteno](https://reteno.com/blog/what-are-app-icon-badges-definition-tips-for-mobile-marketing)
- Mobile-game fatigue lists red dots alongside long daily-quest lists and check-in demands as meta-game pressure. — [Gamota](https://gamota.com/en_GB/?p=2753%2F)
- CTA count: "one call-to-action per section" and stressing a single primary action over secondary ones (high-contrast primary, muted secondary) is the common practitioner rule. No controlled study on a maximum number was found. — [UX Magazine](https://uxmag.com/?p=4359); [fatskills study guide](https://www.fatskills.com/user-interface-design-user-experience-design/chapter/ux-ui-product-design-hicks-law-fittss-law-and-millers-law)

### Inferences
- **Badge budget for Seat of Power.** A badge appears only when there is a decision the player can act on now. Use a number for counts and no badge for news. A tab badge equals the sum of its chip badges, and opening the item clears it. Cap visible badges at about 3 at once across the bar and chips. That cap is a working rule, not a figure from research.
- Two badge styles at most: red for "needs you, with a deadline" and a neutral dot for "new to read." Never use red for marketing or new features.
- Banner blindness warns against putting key instructions in coloured boxes or banners at the top or side of a page. Put the instruction on the button itself ("Approve ₦2bn road contract").
- One filled primary button per screen or sheet, in the bottom thumb area. Other actions use outline or text style. Sheets with 2 to 3 choices (Reigns-like) are fine, as long as no one choice looks like an ad and the safe or default option is clear.

### Gaps
- No peer-reviewed study found on badge counts in games, or on the maximum number of CTAs per mobile screen.
- Could not read the full NN/g banner-blindness article to give its 2018 sample size and method.
