# Seat of Power — status (4 Oct)

## Removed: inauguration / First 100 Days and budget padding (Steve's decision)
- `public/sop-first100.js` deleted (every DAY scene, including "The oath, and then the microphone", the three speech drafts and the "Name the missing ₦40bn" line), plus its script tag.
- Budget padding step deleted: all "Padding your PA flagged" envelope cards (every sector) and their four choices, plus the Speaker's late-night constituency-project demand that lived in the same step. The budget itself (Batch F) stays; after a turn, play now goes straight to the budget.
- Readers removed or rewritten: godfather road rule, ledger padding/tribunal lines, SA signals, Wikipedia "First 100 days" section (now "Cabinet"), DAY-location citations, EFCC cause, and adviser and news wording that mentioned padding.
- Old saves: `scrubRemovedContent()` (inside `migrateSave`) moves a save sitting in the old padding phase to the budget and drops the DAY/padding ledger entries (and anything caused by them), logs, wiki events, the signature-road project and its procurement entries.

## Checks
- Codebase search ("padding", "inauguration", "oath", "First 100 Days", "₦40bn", scene titles): the only remaining hits are the scrubber's own patterns and comments, which never show to the player. Neutral "sworn in" mentions (wiki, tribunal) stay.
- Old-build save in the padding phase, with 3 DAY entries, loads on the new build cleanly on the Desk, with none of those entries left.
- Two in-game years (4 turns) each as Edo and as Lagos: 0 console errors, 0 traces of either group in screens, logs or the ledger, and turn 1 lands on the Desk.

## News anchors
- Permanent faces: Ibrahim Danjuma (navy suit, glasses) and Funmi Okeowo (burgundy suit).
