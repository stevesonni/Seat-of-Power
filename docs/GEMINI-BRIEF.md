# Seat of Power: the career ladder so far, for review

**Who this is for.** This brief is for a design reviewer (Gemini). The owner wants a second opinion before we build the biggest piece, the **Presidency**. Please critique hard, propose concrete changes, and say what you would build. Section 6 lists the specific questions.

**About the game.** *Seat of Power* is a Nigerian political **edutainment** game for phones, published on Lagos Life (Vatar). Players should *feel* what each office is like and *learn* how it really works. All people and parties are fictional.

---

## 1. The benchmark: the governorship (the core game)

The governorship is deep, and it is the standard the new careers are measured against. A full run is a campaign, then up to eight years in office. What makes it robust is **consequences that link up and come back**.

**Money is real**
- One treasury, with FAAC (the federal share) plus taxes the state raises (IGR).
- Salaries must be paid; arrears trigger strikes.
- Debt and loans come with named lenders and conditions.
- A Treasury tab offers revenue reforms.
- Spending is blocked when the bank is empty.

**Projects are a pipeline**
- A need in a named LGA leads to a proposal, a scope, funding (budget line, phasing or a loan), procurement, and contractors with real stats.
- Work happens year by year: quality, delays, abandonment, ribbon cuttings.
- Contractors can be replaced. The godfather can hijack a contract, which raises the price and lowers the quality.

**Institutions**
- **Ministries:** created when a need requires one; commissioners have performance and loyalty, and can be audited, fired or merged.
- **The House of Assembly:** seats, loyalists and deals. The budget must pass, and bills are signed or vetoed.
- **Others:** the courts and election tribunal, the EFCC, traditional rulers, local government elections.

**People with memory**
- A living **godfather**: his demands (a contract, a nephew's ministry) have consequences years later, such as an investor pulling out by letter, or the nephew's ministry draining money every year.
- A deputy governor.
- A Chief of Staff with traits, who decides when you delegate, visibly.
- A special adviser who briefs you.
- Named rivals.

**Time and memory**
- **Delayed effects** (`delayedFx`) and **hidden threats** that surface later.
- A **ledger** of every corrupt or risky act (`SOP_LEDGER`). The EFCC later cites it: "the file starts with…"
- Three **promises** per term, one per senatorial zone, judged at re-election.
- A **succession** race at the end.

**Presentation**
- A Desk of **letters** (the mailbox) and newspaper front pages.
- TV anchors at big moments.
- A result card for every decision showing exactly what changed.

**Re-election** is a full campaign in which the record, promises, money and scandals all count.

**Retention features:** a Daily Decision with a global vote, streaks, a career map, badges with perks, player-owned companies that every player sees, and the career ladder below.

---

## 2. What we built: three careers (release 1)

All three share one structure. A choice of start, then a fixed number of **turns**, each turn a short **queue of decision cards**. Every card has 2–3 options that move 4–5 **meters**. Between turns, meters **drift**. Then come the endings and an **A–F grade**.

Each card carries a **"📘 How it really works"** note from the Constitution or the law; these collect in a per-career **notebook**. Each career's first year is free, then it is a one-off unlock (₦500–1,000). Every picture the art team made is used.

### 2a. LGA Chairman (3 years, 6 half-years)
- **Meters:** the people, the governor's favour, the council, corruption, the council purse (₦M).
- **Start:** in the player's real home LGA. Choose how you got the ticket: the governor's choice, the people's favourite, or the wealthy returnee.
- **Each half-year:**
  1. **The allocation** comes down through the state joint account. The governor's deduction scales with his favour, and salaries come off first. You accept it, protest, or **go to court citing the July 2024 Supreme Court ruling** on direct payment.
  2. **Problems with faces:**
     - a health centre with no paid nurse;
     - a washed-out market road;
     - a market fire;
     - a land dispute between villages;
     - children without birth certificates;
     - a refuse heap;
     - teachers unpaid because the state deducted their salaries.

     Each problem has options with costs in ₦M.
  3. Alternating each half-year:
     - **The council chamber:** councillors' "allowances", an okada bye-law, a market levy, impeachment whispers when the council is unhappy.
     - **The governor's requests:** buses of supporters for his rally, council land for his friend, a drainage contract for his man.
- **Endings:**
  - the governor **dissolves the council** (caretaker committee) when his favour is very low;
  - councillors **impeach** you (two-thirds);
  - otherwise the **council election** run by the state's electoral commission (SIEC). The governor's favour decides whether you get the ticket.
- **Ladder:** a re-elected chairman can "Run for Governor", which starts a governorship with the same profile.
- **Teaching:** 15 notes, including the 774 LGAs and Section 7, the Fourth Schedule, Section 162(6), the 2024 ruling, SIECs, caretaker committees, impeachment, levies, bye-laws, births, teachers' deductions, primary health care, traditional rulers and the Land Use Act.

### 2b. Senator (4 years, 8 sessions)
- **Meters:** support at home, standing in Abuja, party loyalty, corruption, war chest.
- **Two ways in:**
  - **Story:** a finished governor runs for Senate, and approval, score, corruption and the campaign fund carry over.
  - **Free play:** former governor, popular activist, or the godfather's candidate.
- **The race:** four weeks of moves in your senatorial district (rallies, traditional rulers, run on your record, radio, cash "mobilisation" at the polling units).
- **The Senate President election:** back the Villa's choice, the rebel or the opposition's man. Backing the winner earns a committee chair (Appropriations, Public Accounts, Petroleum).
- **Each session:**
  - **Two bills.** The President's bill and a floor bill; the Appropriation Bill every second session. Bills include fuel deregulation, state police, external loans, grazing routes, youth fund, tax harmonisation, Electoral Act, presidential immunity, primary health care, social media regulation, LG autonomy, mining royalties, minimum wage. You vote yes, no, or **"yes for a federal project in my district"**, which only works with standing. The Senate divides with a seat count; the President may **veto** a bill and you can lead an override (73 of 109).
  - Either an **oversight hearing** (grill on TV, send a report to the EFCC, or take the minister's "appreciation") or the **₦1B constituency fund** (pick projects, or "manage" the leftover).
  - **An event:**
    - a defection offer;
    - a lobbyist with a briefcase;
    - bandits at home;
    - budget padding;
    - the lecturers' strike;
    - your sponsor's nephew;
    - ministerial screening ("take a bow").
  - Once a year, **sponsor your own bill**. Its chance depends on standing.
- **Endings:**
  - **recall** (Section 69) if home support is below 20;
  - re-election, where the party may deny a disloyal senator the ticket.
- **Teaching:** 29 notes, including Section 48, Section 50, Section 58 and the veto override, Sections 88/89, Section 147 screening, Section 68 defection, Section 69 recall, and one note per bill.

### 2c. Ambassador (3 years, 6 half-years), in invented countries
- **Meters:** Abuja's confidence, the host government, Nigerians abroad, deals won, corruption.
- **Start:** posting to Valdoria, Ostrava or Meridia. Background: career diplomat, political appointee, or diaspora champion. Then **present the letter of credence**.
- **Each half-year:**
  - **A cable from Abuja:**
    - win their vote for our UN seat;
    - sign the trade deal by Friday;
    - deny the forged-visa story;
    - ask for a loan;
    - the President's state visit;
    - a budget cut.
  - **A Nigerian in trouble:**
    - a mechanic held without charge (consular access);
    - unpaid scholarship students;
    - traders' goods seized at the port;
    - the passport backlog;
    - riots needing an evacuation;
    - a death-row plea.
  - **The host or the community:**
    - the host minister's visa threat (reciprocity);
    - a trade fair;
    - a diaspora town hall;
    - the Independence reception;
    - a foreign investor;
    - a Super Eagles match.
- **Endings:** **recalled** if Abuja's confidence collapses, **expelled** (persona non grata) if the host's does, otherwise posting complete or **promoted to Foreign Minister**.
- **Teaching:** 14 notes, including Section 171, credentials, both Vienna Conventions, passports, evacuations, NiDCOM, remittances, cables, non-oil exports, UN vote-trading, visa reciprocity, death row and diaspora voting.

**Balance:** each career was simulated over about 2,000 runs. Careful play wins (A/B); random play lands on C/D or loses.

---

## 3. Our honest assessment: the careers are much thinner than the governorship

**1. No memory, no linkage.**
- Each card is self-contained: choose, see the meters move, and it is gone forever.
- The governorship's delayed effects and the ledger the EFCC reads are not used in the careers.
- The minister you shielded never comes back to repay or betray you. The land you gave the governor's friend never becomes a scandal. The federal project you traded your vote for is "won", but never built, delayed or stolen.

**2. No persistent people.** There are no named councillors, senators, host ministers or rivals with relationships that change. The Senate President you backed doesn't reappear.

**3. No persistent things.**
- The chairman's road is "fixed", but it never deteriorates or gets opened.
- The senator's constituency projects aren't visible anywhere.
- The ambassador's evacuated citizens aren't tracked.

**4. Meters, not systems.**
- The council purse is the only real economy.
- The senator's war chest barely matters.
- Abuja's confidence is a number, not a relationship with a Foreign Minister who has moods and an agenda.

**5. Weak cross-career story.**
- A governor's record passes only four numbers into the Senate.
- Chairman → governor passes nothing except the profile.
- Ambassador isn't connected to anything.
- The Presidency (Road to Aso Rock) reads only the governor's record.

**6. Presentation is lighter.** There is no Desk or mailbox of letters, no newspaper, no adviser, no TV anchors, and no year-end report. It is one card after another.

**7. Choices are visible but not strategic.** There is little planning across turns: no budget to allocate over a year, no pipeline to manage.

---

## 4. The Presidency (not built yet): what we have

**Art delivered:**
- **Rooms:** Villa office, Federal Executive Council room, situation room, state banquet.
- **People:** Chief of Army Staff, Central Bank governor, Governors' Forum chair.
- **Scenes:** fuel queue, inauguration at Eagle Square, national broadcast.
- **Statesman badge.**
- **From the Senate pack, reusable:** the President with moods, the Senate President, the Senate chamber, the National Assembly.

**Existing hook:** Road to Aso Rock already plays the presidential **race**: primary, running mate, six campaign weeks, and election night under the real 25%-in-24-states rule. Winning currently ends the game.

**Our instinct** is to build the Presidency on the **governorship engine scaled up**, not on the card engine:
- the federal budget and FAAC to 36 states;
- the National Assembly in place of the House;
- ministers in place of commissioners;
- 36 governors as actors;
- the Central Bank, oil and the exchange rate;
- security across six zones;
- coup rumours;
- foreign policy, which reuses the Ambassador's countries.

---

## 5. Constraints

- **Mobile first:** short sessions, big tap targets, little text per screen.
- **Edutainment:** every mechanic should teach something true about Nigerian government, with a source in the Constitution or the law.
- **Fictional:** all people and parties are invented. No real politicians or lookalikes, no real party logos or national crest. Foreign countries in the Ambassador career are invented.
- **Money:** careers are one-off unlocks with the first year free. Paid items must sell **more play, not a better result**, so leaderboards stay fair.
- **Art:** the art team (Lovable) can make more, but every picture must be used.

---

## 6. What we want from you

1. **Depth:** what are the 3–5 highest-impact changes that would make the LGA Chairman, Senator and Ambassador feel as consequential as the governorship, without making them as long?
2. **Memory and linkage:** design a shared **consequence system** for all careers. How should past choices come back, and with what kinds of named callbacks? Give 3 examples per career.
3. **People:** which named characters should each career have, with what relationships and arcs?
4. **The ladder:** what should carry from office to office (Chairman → Governor → Senator/Ambassador → President)? Make the story feel like one life.
5. **The Presidency:** what is its core loop, its 4–6 signature systems, and its key moments? What makes it feel different from the governorship and not just bigger? How long is a term in play-time?
6. **Teaching:** what more should each career teach, and how do we teach without lecturing?
7. **Retention and money:** what would bring players back to each career? What could be sold without becoming pay-to-win?
8. **Cut:** what would you cut or simplify?

**Please answer concretely:** mechanics, example events, numbers where useful.
