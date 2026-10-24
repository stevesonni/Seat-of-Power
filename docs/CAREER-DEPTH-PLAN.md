# Career depth: the merged plan (Claude + Gemini)

**The goal:** the LGA Chairman, Senator and Ambassador should feel like *lives*, as the governorship does. Choices come back, people remember, a resource forces trade-offs, and one record follows the player up the ladder. Then the Presidency is built on top.

## The four pillars (shared by every career)

### 1. A tight resource (Gemini's point)
Every option shows its cost before you choose, and you can't afford everything.

| Career | Resource | Earned by | Spent on |
|---|---|---|---|
| Chairman | **Council purse** (₦M), already exists, made tighter | The allocation (minus the governor's cut) | Fixing problems, councillors, the governor's demands |
| Senator | **Influence** | Committee chair, backing winners, favours | Trading votes for projects, pushing your bill, killing a hearing, surviving a scandal |
| Ambassador | **Political capital** with Abuja | Obeying cables, deals, the President's visit | Pushing back on a cable, escalating a citizen's case, buying time |

### 2. "It comes back": seeds and callbacks (both reviewers)
- **Seed:** a notable choice plants a tag in the player's record, for example `land_to_governors_friend`, `took_minister_envelope` or `freed_emeka`.
- **Callback:** 1–3 turns later the seed sprouts as a **named callback card** at the top of the queue, marked **"It comes back"**, with the person's portrait.
- **Callbacks are themselves choices:** they can plant new seeds, so stories chain.
- **Good deeds come back too.** It is not only punishment.
- **Rule (Gemini's cut):** every card must feed a resource, a named person, or a seed. If a card is pure flavour, cut it.

### 3. Three named people per career, with a relationship that moves (Gemini's 3)
Each person has a name (generated per run), a portrait with moods, and a relationship from 0 to 100 that options change. They appear in callbacks and decide endings.

| Career | Overlord | Gatekeeper | Internal threat |
|---|---|---|---|
| Chairman | The Governor | The Party Chairman (decides the ticket) | A Troublesome Councillor (leads impeachment) |
| Senator | The Senate President (committee seats) | Your Party Leader (ticket, whip) | A Rival Senator (blocks your bill, runs against you) |
| Ambassador | The Foreign Minister (your evaluator) | The Host Foreign Minister (expulsion) | The Diaspora Leader (the community's voice) |

### 4. One life: the Player Record (both reviewers)
- **Where it is kept:** `sop_record`, saved on the server.
- **What it holds:**
  - offices held and how each ended;
  - lifetime corruption;
  - the seed tags still alive;
  - named allies and enemies (name, role, office where met);
  - companies.
- **How it is used:** each career start reads it and plants **cross-career seeds**. For example:
  - The councillor you fought as Chairman is a **House of Assembly member** when you are Governor.
  - The motor-park eviction is on your Senate opponent's posters.
  - The mechanic you freed abroad funds your Aso Rock campaign.
  - Your Senate votes are read out at the presidential debate.

## The order of work
1. **Phase 1, the engine:** `game/systems/consequence.js`, plus a shared card for callbacks and named people, plus the Player Record. Tested with simulations.
2. **Phase 2, retrofit the three careers:**
   - **Chairman first:** a tighter purse; the Governor, Party Chairman and Councillor; about 10 seeds and callbacks.
   - **Senator:** Influence; the Senate President, Party Leader and Rival Senator; about 10 callbacks.
   - **Ambassador:** political capital; the Foreign Minister, Host Minister and Diaspora Leader; about 10 callbacks.
   - **Cross-career seeds** between them.
3. **Phase 3, the Presidency.** Built on the governorship engine, plus:
   - the **Federal Executive Council**: ministers with sectional loyalty who can leak;
   - the **Governors' Forum**: 36 governors bargaining over FAAC;
   - **macro-shocks**: oil price, the naira, security flare-ups, coup rumours;
   - the **National Assembly**, reusing the Senate mechanics but hostile and fractured.

   The term is 4 game-years, intense and fast.

## Teaching tied to survival (Gemini)
The "How it really works" notes stay, but each one is attached to the move that uses the rule. For example, the Chairman's court case is *the* way to get Section 162 money back. The note explains the rule exactly when the player needs it.

---

## Revision after Perplexity's review (this supersedes the order above)

**Prove it in one career first.** We build a complete **LGA Chairman** and put it in front of players, and only then retrofit the Senator and Ambassador. The test: do players remember names, events and regrets, or only scores?

### What the Chairman proof adds
1. **Commitment → warning → intervention.** One persistent project per term: **the market road**.
   - The contract choice is the commitment.
   - Next half-year, a named trader sends a warning (for example, "the drains are too shallow").
   - You can intervene: demand repairs (angering your sponsor), commission an inspection (time and money), or open on schedule.
   - The rainy season then tests the road, and the result follows from the whole chain.
   - Good choices create complications too: the competent contractor delivers, but your sponsor's protection is gone.
2. **Attention: choose what to ignore.** Each half-year, matters arrive in an **in-tray**. You handle **two** yourself. The rest are delegated to a named person with a plain, lower-quality outcome, and a problem left alone can get worse and come back.
3. **People with interests.** Each of the three people shows **what they want**. Promises you make are tracked as kept or broken.
4. **A four-part verdict** instead of one grade: **Delivery, Integrity, Survival, Promises**, plus a short story that names your actual decisions ("You gave the motor-park land to the governor's friend…").
5. **One recognition scene** when the chairman becomes a governor. The traders you protected, or displaced, meet you on day one.
6. **One question at the end:** "Which decision would you change?" It goes to the feedback page, so we learn what players remember.

### Teaching
- Every note keeps its source.
- Before the careers are promoted, a separate accuracy check goes through every note against its source.
- Abuses (for example, dissolving councils) are presented as pressure that the courts have ruled unlawful, never as a legal power.

### Career identities (the design compass)

| Career | The question |
|---|---|
| Chairman | Who gets the little we have? |
| Senator | What must I trade to get this through? |
| Ambassador | How do I persuade people I cannot command? |
| Governor | Can I deliver what I promised? |
| President | What do I protect when I cannot protect everything? |

The Presidency (later) will have one sustained crisis, three national commitments, a cabinet that implements, and a coalition of power centres, not 36 governors simulated at once.
