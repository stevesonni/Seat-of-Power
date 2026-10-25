/* The glossary (rules only, no React). Every abbreviation and piece of
   political slang the game uses, in plain words: the full name, then one
   line on what it means for you. The page underlines each one where it
   appears; a tap shows this. */
export const GLOSSARY = {
  // Money
  FAAC: ["Federation Account Allocation Committee", "Shares the country's oil and tax money out to the states every month: most of a state's income."],
  IGR: ["Internally Generated Revenue", "The taxes, levies and fees your state collects itself, on top of its share from Abuja."],
  VAT: ["Value Added Tax", "A tax on goods and services, shared between Abuja, the states and the councils."],
  TSA: ["Treasury Single Account", "All government money kept in one account at the Central Bank, so none can hide in secret accounts."],
  DMO: ["Debt Management Office", "The federal office that approves and tracks government borrowing."],
  CBN: ["Central Bank of Nigeria", "Prints the naira, sets interest rates, and holds the government's account."],
  IMF: ["International Monetary Fund", "A world lender of last resort. Its loans come with tough conditions."],
  GDP: ["Gross Domestic Product", "The value of everything the economy produces in a year."],
  BVN: ["Bank Verification Number", "Each Nigerian's fingerprint-linked bank ID; it catches ghost names on payrolls."],
  IPPIS: ["Integrated Payroll and Personnel Information System", "The federal payroll that pays workers by fingerprint and catches ghost workers."],
  UTAS: ["University Transparency and Accountability Solution", "The payroll system university lecturers want instead of IPPIS."],
  MW: ["Megawatts", "A measure of electricity: how much power a plant or the grid delivers."],
  // Government and the law
  FG: ["Federal Government", "The government in Abuja: the President, the ministers and the federal agencies."],
  FEC: ["Federal Executive Council", "The President's cabinet: the ministers meet every Wednesday and approve federal contracts."],
  NSC: ["National Security Council", "The President, the service chiefs, the police and the intelligence chiefs."],
  NSA: ["National Security Adviser", "The President's chief adviser on security; runs the National Security Council's work."],
  NASS: ["National Assembly", "The federal parliament: the Senate and the House of Representatives."],
  FCT: ["Federal Capital Territory", "Abuja and the land around it, run by a minister instead of a governor."],
  LGA: ["Local Government Area", "A council district. Every state is divided into them; each has an elected chairman."],
  LGAs: ["Local Government Areas", "Council districts. Every state is divided into them; each has an elected chairman."],
  LG: ["Local Government", "The council: the third tier of government, below the state."],
  JAAC: ["Joint Account Allocation Committee", "Where the state and its councils share the councils' money. Governors often control it."],
  SIEC: ["State Independent Electoral Commission", "Runs local council elections in the state."],
  INEC: ["Independent National Electoral Commission", "Runs the presidential, governorship and National Assembly elections."],
  BVAS: ["Bimodal Voter Accreditation System", "The device that checks a voter's fingerprint or face at the polling unit."],
  SAN: ["Senior Advocate of Nigeria", "The highest rank a Nigerian lawyer can hold."],
  NIC: ["National Industrial Court", "The court for disputes between workers, unions and employers."],
  EIA: ["Environmental Impact Assessment", "The study a big project must pass before work starts."],
  // Anti-corruption and security
  EFCC: ["Economic and Financial Crimes Commission", "Investigates fraud, money laundering and stolen public money."],
  ICPC: ["Independent Corrupt Practices Commission", "Investigates bribery and abuse of office by public officials."],
  DSS: ["Department of State Services", "The secret police: intelligence inside the country."],
  JTF: ["Joint Task Force", "Soldiers, police and navy working as one unit in a trouble spot."],
  SBS: ["Special Boat Service", "The Navy's commandos."],
  IDP: ["Internally Displaced Persons", "People driven from their homes by violence or floods, still inside Nigeria."],
  NEMA: ["National Emergency Management Agency", "Responds to floods, fires and disasters."],
  // Unions
  NLC: ["Nigeria Labour Congress", "The umbrella body of Nigeria's trade unions. When it strikes, the country stops."],
  ASUU: ["Academic Staff Union of Universities", "The university lecturers' union, famous for long strikes."],
  NUT: ["Nigeria Union of Teachers", "The public school teachers' union."],
  NUATE: ["National Union of Air Transport Employees", "Airport and airline workers. They can ground every flight."],
  NUEE: ["National Union of Electricity Employees", "Power workers. They can switch off the grid."],
  NUPENG: ["National Union of Petroleum and Natural Gas Workers", "Oil workers and tanker drivers. They can stop the fuel."],
  JOHESU: ["Joint Health Sector Unions", "Nurses, pharmacists, lab staff and other health workers."],
  MoU: ["Memorandum of Understanding", "A signed promise. It is not yet money."],
  MOU: ["Memorandum of Understanding", "A signed promise. It is not yet money."],
  // Education and health
  WAEC: ["West African Examinations Council", "Sets the school-leaving exams taken across West Africa."],
  UBEC: ["Universal Basic Education Commission", "Federal money for primary and junior secondary schools."],
  SUBEB: ["State Universal Basic Education Board", "Runs the state's primary schools."],
  HND: ["Higher National Diploma", "The polytechnic qualification; many employers rank it below a degree."],
  VCs: ["Vice-Chancellors", "The heads of universities."],
  PHCs: ["Primary Health Centres", "The small clinics nearest the people: midwives, vaccines, first care."],
  NCDC: ["Nigeria Centre for Disease Control", "Tracks and fights outbreaks like cholera."],
  WHO: ["World Health Organization", "The United Nations' health agency."],
  UNICEF: ["United Nations Children's Fund", "The UN agency for children: vaccines, schools, nutrition."],
  VAPP: ["Violence Against Persons (Prohibition) Act", "The law against rape, domestic violence and other abuse."],
  NESREA: ["National Environmental Standards and Regulations Enforcement Agency", "Enforces environmental rules on companies."],
  // The world
  ECOWAS: ["Economic Community of West African States", "The fifteen West African countries' regional bloc."],
  UN: ["United Nations", "The world body of 193 countries."],
  // Slang of Nigerian politics
  "security vote": ["Security vote", "Money a governor or President can spend on security without the usual audits. Easy to abuse."],
  "ghost workers": ["Ghost workers", "Names on the payroll of people who do not exist, or no longer work. Someone collects their pay."],
  "mobilisation fee": ["Mobilisation fee", "The advance paid to a contractor to start work: often 15% of the contract."],
  japa: ["Japa", "Yoruba for \"run away\": to leave Nigeria for good, usually for the UK, Canada or the US."],
  deve: ["Deve", "The \"development fee\" land grabbers demand before anyone can build."],
  "omo onile": ["Omo onile", "\"Children of the land\": family members who claim land and demand fees from anyone building on it."],
  "national cake": ["The national cake", "The country's oil and tax money, seen as something every group wants a slice of."],
  "Ways and Means": ["Ways and Means", "The Central Bank lending to the government, in effect printing money. It fuels inflation."],
  godfather: ["Godfather", "A political kingmaker who funds a candidate, then expects contracts and appointments in return."],
  "sit-at-home": ["Sit-at-home", "Orders by separatists in the South-East for everyone to stay indoors, often on Mondays."],
};

// The words to look for, longest first, so "LGAs" wins over "LGA".
export const glossaryTerms = () => Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
// One regex for them all: whole words only, abbreviations exactly as written.
export const glossaryRegex = () => new RegExp("(^|[^A-Za-z0-9-])(" + glossaryTerms().map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![A-Za-z0-9])", "g");
export const explain = (term) => GLOSSARY[term] || null;
