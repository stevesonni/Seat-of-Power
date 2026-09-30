# Seat of Power — Presentation and Identity Reset

Native app wrapper is on hold. The browser experience has to be excellent at phone size first.

## The diagnosis we're acting on

The simulation is strong. The presentation is generic. Executive Command reads well not because its fonts are big, but because its stylised characters, chunky controls and clear feedback make complicated decisions instantly legible. Seat of Power currently looks like a large web page with game systems attached, spread across one 6,400-line HTML file plus seven overlay modules that each carry their own styling. One change to body text or button height has to be made in eight places, which is why the look never converges.

So this is not "make every font larger". It is a design system, a Nigerian visual identity, and one polished vertical slice built with it.

## Milestone: Vertical Slice — First 100 Days

Not a rewrite. One continuous playable stretch, rebuilt with the final visual language and mobile typography, no placeholder UI from the old system:

candidate creation → inauguration → first godfather meeting → first budget problem → one procurement decision → one ministry appointment → one media story → one faction backlash → one adviser intervention → one ledger consequence → end-of-quarter summary.

The slice passes only if, on a phone in landscape, a first-time player can read every important sentence without zooming, say why each decision mattered, recognise the setting as Nigerian, name three characters, point to one consequence that came back later, and tell public, administrative and private spaces apart at a glance.

## Step 1 — One design system

A single shared source for: type scale, spacing, buttons, cards, dialogue bubbles, character staging, stat chips, alert banners, decision modals, document views, and mobile navigation. Everything reads from it; nothing hardcodes its own pixel values.

Mobile-first hierarchy rather than a scaled-down desktop composition:
- one decision, one screen — headline, stakes, two to four options, no competing panels
- body text sized off screen height, not off the 1080 artboard, targeting the iCivics band of roughly 3.5–4% of screen height
- controls at a real thumb size with generous spacing, not shrunken desktop buttons
- long content scrolls in a single column; nothing sits in a side rail on a phone

## Step 2 — Three visual modes

The world should look different depending on where you are standing:
- **Public** — rallies, television, the anchor desk: warm, bright, character-forward
- **Administrative** — budget, ministries, procurement: paper register, forms, stamps, serif
- **Private** — godfather calls, adviser confidences, back rooms: dim, close, intimate

Same design system, three moods. This is where the Nigerian identity lives beyond green and names — the texture of memos, the look of a state broadcast, the feel of a night meeting.

## Step 3 — Make the politics visible

The depth exists but the player can't see it. Add persistent, glanceable representations of:
- who owes whom — the godfather, the House caucus, the deputy, district bosses
- what your last decision did, shown immediately and attributed
- which consequences are still pending and when they land
- the people, so they're remembered: recurring faces with names, states of origin and history with you

## Step 4 — Migrate, don't rewrite

Move only the most visible screens onto the design system first: opening, candidate creation, campaign hub, turn agenda, decision card, newspaper, budget, election night, ending cards. As each moves, strip the duplicate styling out of the overlay module that was patching it. The seven modules shrink into shared components over time instead of being replaced in one risky pass.

## Technical notes

- Design tokens live in `src/styles.css`; shared components under `src/components/sop/`.
- `public/seat-of-power.html` stays the running game during migration — screens move out of it one at a time so the game is never broken mid-way.
- The seven `public/sop-*.js` overlays lose their inline pixel styling as their screens migrate; no more per-module scaling passes.
- The abandoned native rewrite (`src/game/sop/`, `src/routes/campaign|election|gov|legacy|new.tsx`) is dead code and gets removed so it can't confuse future work.
- Verification per screen at 844×390 and 926×428 phone landscape, plus 1366×768 and 2435×1125.

## Order of work

1. Design system and mobile type scale
2. Decision interface redesign (the single highest-impact screen)
3. Three visual modes
4. First 100 Days slice, screen by screen
5. Visible political relationships
6. Overlay cleanup and dead-code removal

Say the word and I'll start with step 1 and 2 together, since the decision card is the thing that proves the system works.
