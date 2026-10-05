/* ============================================================================
   SEAT OF POWER — REALISM MODULE
   Adds: Rich indigenous NPC name pools, persistent NPC registry,
         Ministries (create/merge/dismantle), Projects & Procurement lifecycle
         (competitive bidding / sole source / EIA / contractor selection /
         nepotism tracking), Traditional Rulers Council, live Wikipedia Bio,
         and an Enhanced Special Adviser with real memory.
   All systems mount into pre-reserved React tab hosts and mutate live game
   state through the window.SOP bridge.
============================================================================ */
(function () {
  "use strict";

  // ─────────────────────────── EXPANDED NAME POOLS ───────────────────────────
  // Every ethnic group deep-listed. Merged into window.SNAMES_REF at boot so
  // every existing genName() call in the base game picks these up.
  const POOLS = {
    yoruba: {
      fn: ["Adebayo","Adeola","Adetokunbo","Adewale","Adunni","Akin","Akinola","Ayodele","Ayomide","Babajide","Babatunde","Bimbo","Bisola","Bolaji","Bukola","Damilola","Dapo","Ebun","Femi","Folake","Folasade","Funke","Gbenga","Gbolahan","Ibukun","Iyabo","Kayode","Kehinde","Kunle","Lade","Modupe","Morayo","Niyi","Nike","Olabisi","Oladele","Olamide","Olatunji","Olawale","Olumide","Oluwaseun","Omolara","Opeyemi","Segun","Simisola","Subomi","Sola","Sunmbo","Taiwo","Titi","Tobi","Tola","Tope","Tunde","Wale","Yemi","Yetunde","Yewande","Yinka"],
      ln: ["Adebayo","Adekunle","Adeleke","Adeoye","Adesanya","Adesina","Aderemi","Adewale","Ajayi","Ajimobi","Akande","Akinlade","Akinola","Akinyemi","Alabi","Ariwoola","Awolowo","Ayeni","Bakare","Balogun","Bamidele","Fajemirokun","Falae","Fashola","Fatai","Fowowe","Ige","Ilori","Kayode","Ladapo","Lawal","Ogundipe","Ogunlesi","Ojo","Olabisi","Olatunji","Olusanya","Osoba","Oyebanji","Oyedepo","Salami","Sanwo-Olu","Soyinka","Tinubu","Ogundimu","Aiyedatiwa","Adegoke","Bamgbose","Onadipe"],
    },
    igbo: {
      fn: ["Adaeze","Adaobi","Amaka","Anayo","Arinze","Azuka","Chibuzor","Chidiebere","Chidera","Chidinma","Chidozie","Chiedu","Chika","Chike","Chikwendu","Chima","Chinasa","Chinedu","Chinelo","Chinenye","Chinonso","Chinwe","Chinyere","Chioma","Chizoba","Chukwuemeka","Ebuka","Ekene","Emeka","Emenike","Enyinnaya","Ezinne","Gozie","Ifeanyi","Ifeoma","Ijeoma","Ike","Ikechukwu","Ikenna","Ikenne","Ndidi","Ngozi","Nkechi","Nnamdi","Nneka","Nnenna","Nonso","Obiageli","Obinna","Obiora","Odera","Ogechi","Okechukwu","Onyeka","Somtochukwu","Tochi","Tochukwu","Uche","Uchechi","Uchenna","Ugochukwu","Uju","Uzo"],
      ln: ["Abaribe","Achebe","Ararume","Anyim","Chime","Ekweremadu","Ekwueme","Elechi","Ezeife","Ihedioha","Ikpeazu","Iwu","Kalu","Madumere","Mbadinuju","Mbah","Nnamani","Nwodo","Nwobodo","Nwokocha","Nwoye","Nyerere","Obi","Obiano","Ohaneze","Ohakim","Okorocha","Okwuosa","Onu","Onyeama","Orji","Otti","Soludo","Ubah","Ugwuanyi","Umahi","Uwazuruike","Uzodinma","Wabara","Nweze","Ogbonnaya","Nwifuru","Anigbogu","Ekwueme","Obinwa","Emelue"],
    },
    hausa: {
      fn: ["Abba","Abdullahi","AbdulRahman","AbdulRazaq","Abubakar","Adamu","Aliyu","Aminu","Auwal","Bala","Bashir","Bello","Danlami","Dauda","Habib","Halim","Hamza","Haruna","Hassan","Hussaini","Ibrahim","Idris","Isa","Ishaku","Iyabo","Jamilu","Jibril","Kabir","Lawal","Lukman","Maikano","Muhammadu","Mukhtar","Murtala","Musa","Mustapha","Nafi'u","Nasir","Nuhu","Sa'idu","Sadiq","Salihu","Sani","Sule","Sulaiman","Suleiman","Tijjani","Umar","Usman","Uwais","Yahaya","Yakubu","Yusuf","Zubair","Aisha","Amina","Aishatu","Bilkisu","Fadila","Fatima","Hadiza","Halima","Hauwa","Hussaina","Jamila","Khadija","Maryam","Rabi","Sadiya","Safiya","Salamatu","Zainab","Zarah","Zulaikha"],
      ln: ["Abubakar","Adamu","Aliyu","Ahmed","Aminu","Bagudu","Balarabe","Bello","Buhari","Buni","Dan-Musa","Dangote","Dankwambo","Danladi","Dantata","El-Rufai","Fintiri","Ganduje","Garba","Geidam","Gumel","Hunkuyi","Ibrahim","Idris","Inuwa","Kwankwaso","Lamido","Lawal","Maccido","Mahmud","Marafa","Masari","Matawalle","Muhammadu","Muazu","Namadi","Ningi","Radda","Rabiu","Ribadu","Saminaka","Sani","Sanusi","Shekarau","Shema","Sule","Sultan","Tafawa-Balewa","Tambuwal","Umar","Wamakko","Yakowa","Yar'Adua","Yari","Yero","Yuguda","Yusuf","Zubairu"],
    },
    ijaw: {
      fn: ["Amanyanabo","Boma","Belema","Diepreye","Diri","Doubra","Ebi","Ebipade","Ebiye","Ekiye","Ere","Ereboye","Fine","Goodluck","Ibim","Iniobong","Iniye","Isoun","Iyakoregha","Iyalla","Iyoro","Kalanwei","Karibo","Kienbenei","Kingsley","Magnus","Miebi","Mieebi","Ngo","Ogonipreye","Ogueme","Ozorometa","Pere","Perekabowei","Piriye","Pondei","Preye","Prosper","Sotonye","Tamuno","Tarila","Tarilate","Timipa","Timipre","Tonye","Tubotamuno","Wari"],
      ln: ["Alaibe","Alamieyeseigha","Asari","Ateke","Ayebo","Belema","Briggs","Brisibe","Dagogo","Dickson","Diepreye","Diri","Dokpesi","Dokubo","Ebiye","Enai","Feekpi","Fubara","Fyneface","Igbadumhe","Igbikiowubo","Ikuli","Ikwut","Iniekong","Isaac","Jonathan","Kanu","Karibo","Numa","Oki","Okoro","Preye","Sekibo","Sylva","Tarila","Timipre","Wilson"],
    },
    efik_ibibio: {
      fn: ["Aniefiok","Anietie","Asuquo","Bassey","Edem","Edet","Edidiong","Edikan","Effiong","Ekaette","Ekemini","Ekere","Ekong","Ekpo","Emem","Emmanuel","Ene","Enobong","Ete","Etim","Idara","Idongesit","Ime","Imoh","Ini","Iniobong","Inyang","Iquo","Iso","Itoro","Kufre","Mbang","Mfon","Mkpouto","Nkoyo","Nseobong","Nsikan","Nyakno","Obot","Ofonime","Okon","Onyema","Opeyemi","Otu","Ubong","Udo","Udofia","Ukeme","Umoh","Uwem","Uyai"],
      ln: ["Akpabio","Akpan","Antai","Archibong","Attah","Ayade","Bassey","Bob","Bob-Manuel","Ekpo","Ekpenyong","Ekpo","Emmanuel","Ene","Ering","Essien","Etim","Eyo","Henshaw","Idem","Ime","Imoke","Inyang","Isong","Nsima","Nyong","Obot","Okon","Onoyom","Otu","Udoedehe","Udom","Umana","Umoh","Usoro"],
    },
    tiv_idoma: {
      fn: ["Aondo","Aondowase","Ayila","Doosuur","Emmanuel","Enemona","Hyacinth","Iorwuese","Ityavyar","Kudu","Manasseh","Mngusoor","Msuur","Ngutor","Ochuko","Ochigbo","Ode","Odumu","Ogbu","Ojotu","Oche","Ochanya","Onyeche","Suswam","Terhemen","Terkuma","Terwase","Tor","Ukange","Utyo","Vershima","Yohanna"],
      ln: ["Agbo","Akume","Alia","Angwe","Ayu","Gbillah","Gemade","Ihagh","Iorpuu","Jime","Manger","Mark","Ochigbo","Ochoga","Odey","Ogiri","Ojotu","Ortom","Suswam","Tarzoor","Ternenge","Tsav","Ugbah","Utuama","Wantaregh","Yandev"],
    },
    kanuri: {
      fn: ["Babagana","Bintu","Bukar","Falmata","Fatima","Fugu","Goni","Kachalla","Kaka","Kashim","Lawan","Mai","Modu","Mohammed","Muhammad","Yagana","Yerima","Zainab","Zannah"],
      ln: ["Ali-Modu","Bukar","Damaturu","Geidam","Goni","Imam","Kachalla","Kolo","Kyari","Lawan","Maina","Modu","Monguno","Sheriff","Shettima","Zulum","Buni","Alkali"],
    },
    nupe_gbagyi: {
      fn: ["Aliyu","Etsu","Garba","Ibrahim","Kolo","Kudu","Liman","Musa","Ndagi","Ndako","Suleman","Tsado","Umaru","Yahaya","Yisa","Aisha","Amina","Fati","Hajara","Halima","Ndagi"],
      ln: ["Bago","Bawa","Bida","Dantsoho","Etsu","Ibeto","Kolo","Kuta","Ndako","Sani-Bello","Yahaya","Tsado","Ubandoma","Marafa","Kontagora"],
    },
    igala: {
      fn: ["Achimugu","Ademu","Audu","Ejeh","Enema","Idakwo","Idris","Ochanya","Ochigbo","Onoja","Onyeche","Salifu","Yahaya"],
      ln: ["Abah","Abubakar","Achimugu","Ada","Audu","Bello","Idris","Ododo","Ocholi","Onoja","Salifu","Yahaya","Wada"],
    },
    berom_plateau: {
      fn: ["Caleb","Choji","Dachung","Dachung","Davou","Gwom","Hanatu","Joshua","Mangut","Mwadkwon","Nanmwa","Pam","Pwajok","Yakubu","Yohanna"],
      ln: ["Bot","Damishi","Dariye","Gyang","Jang","Lalong","Mutfwang","Pam","Plang","Pwajok","Bwala"],
    },
    edo_esan: {
      fn: ["Adams","Aigbe","Aimufia","Aiseosa","Amenaghawon","Efosa","Esosa","Godwin","Imuetinyan","Isoken","Iyayi","Iyobosa","Monday","Nosa","Osagie","Osahon","Osaze","Uyi"],
      ln: ["Aigboje","Aiyegbeni","Aiyekooto","Akhigbe","Anenih","Igbinedion","Iyamu","Ize-Iyamu","Obaseki","Ogiemwonyi","Okpebholo","Oshiomhole","Uwaifo","Ogbomo"],
    },
    urhobo_isoko_itsekiri: {
      fn: ["Avwerosuo","Efe","Ejiroghene","Emuobo","Erhuvwu","Esiri","Eyituoyo","Ighoro","Kessiena","Ogaga","Oghenetega","Onome","Onoriode","Oritsegbubemi","Ovie","Sheriff","Toritsemwuwa","Ufuoma","Uruemu","Voke","Wilson","Zino"],
      ln: ["Ibori","Ibru","Ijaw","Oborevwori","Ogboru","Ogeah","Okowa","Okumagba","Okpekpe","Omo-Agege","Onanefe","Otuaro","Sagay","Tsekiri","Uduaghan","Uduebor"],
    },
    ogoni_kalabari: {
      fn: ["Barile","Baribor","Boma","Dagogo","Ibim","Ibinabo","Ijeoma","Iyalla","Karibo","Kienka","Ledum","Nyieda","Owei","Preye","Saro","Sotonye","Tamuno","Tonye","Wari"],
      ln: ["Amaechi","Amayanabo","Ateke","Briggs","Dokubo","Fubara","Fyneface","Kobani","Kpoburi","Kuku","Numbere","Odili","Peterside","Saro-Wiwa","Sekibo","Tolofari","Wike"],
    },
    jukun_kuteb: {
      fn: ["Agbu","Ashi","Bala","Bwacha","Danladi","Darius","Emmanuel","Hosea","Ishaya","Jolly","Manasseh","Ndudi","Rimamsikwe","Sabo","Suntai"],
      ln: ["Agbu","Ande","Awuese","Bogoro","Bwacha","Ishaku","Kefas","Kente","Nyame","Puje","Salihu","Suntai","Zuru"],
    },
  };

  // State → ethnic pool key(s). Multiple = we blend so cabinet reflects diversity.
  const STATE_ETHNIC_MAP = {
    Lagos: ["yoruba"], Oyo: ["yoruba"], Ogun: ["yoruba"], Osun: ["yoruba"], Ondo: ["yoruba"], Ekiti: ["yoruba"], Kwara: ["yoruba","nupe_gbagyi","hausa"],
    Anambra: ["igbo"], Imo: ["igbo"], Abia: ["igbo"], Enugu: ["igbo"], Ebonyi: ["igbo"],
    Kano: ["hausa"], Kaduna: ["hausa"], Katsina: ["hausa"], Sokoto: ["hausa"], Zamfara: ["hausa"], Kebbi: ["hausa"], Jigawa: ["hausa"],
    Borno: ["kanuri","hausa"], Yobe: ["kanuri","hausa"], Adamawa: ["hausa","tiv_idoma"], Bauchi: ["hausa","jukun_kuteb"], Gombe: ["hausa","jukun_kuteb"], Taraba: ["jukun_kuteb","hausa","tiv_idoma"],
    Akwa_Ibom: ["efik_ibibio"], Cross_River: ["efik_ibibio"],
    Bayelsa: ["ijaw"], Rivers: ["ijaw","ogoni_kalabari","igbo"], Delta: ["urhobo_isoko_itsekiri","ijaw","igbo"], Edo: ["edo_esan"],
    Benue: ["tiv_idoma"], Plateau: ["berom_plateau","hausa","jukun_kuteb"], Kogi: ["igala","yoruba","hausa"], Niger: ["nupe_gbagyi","hausa"], Nassarawa: ["hausa","tiv_idoma"], FCT: ["hausa","yoruba","igbo","nupe_gbagyi"],
  };

  // Patch base-game SNAMES with expanded pools so all existing genName calls upgrade.
  // Names of serving and former politicians and other public figures. They
  // are left out of every pool: every person in the game is invented.
  const BLOCK = new Set(("Ajimobi Akande Ariwoola Awolowo Fajemirokun Falae Fashola Osoba Oyebanji Oyedepo Sanwo-Olu Soyinka Tinubu Aiyedatiwa Adeleke Babajide " +
    "Abaribe Achebe Ararume Anyim Chime Ekweremadu Ekwueme Elechi Ezeife Ihedioha Ikpeazu Iwu Kalu Madumere Mbadinuju Mbah Nnamani Nwodo Nwobodo Nyerere Obi Obiano Ohaneze Ohakim Okorocha Onu Onyeama Orji Otti Soludo Ubah Ugwuanyi Umahi Uwazuruike Uzodinma Wabara Nwifuru Bakare " +
    "Bagudu Balarabe Buhari Buni Dangote Dankwambo Dantata El-Rufai Fintiri Ganduje Geidam Gumel Hunkuyi Kwankwaso Lamido Maccido Masari Matawalle Muazu Namadi Ningi Radda Ribadu Saminaka Sanusi Shekarau Shema Sultan Tafawa-Balewa Tambuwal Wamakko Yakowa Yar'Adua Yari Yero Yuguda Marafa AbdulRazaq Muhammadu " +
    "Alaibe Alamieyeseigha Asari Ateke Dickson Diri Dokpesi Dokubo Fubara Jonathan Sekibo Sylva Timipre Kanu Goodluck " +
    "Akpabio Attah Ayade Imoke Udom Umana Akume Alia Ayu Gbillah Gemade Mark Ortom Suswam Tarzoor Hyacinth Ali-Modu Sheriff Shettima Zulum Bago Sani-Bello Ododo Wada " +
    "Dariye Jang Lalong Mutfwang Pwajok Damishi Anenih Igbinedion Ize-Iyamu Obaseki Okpebholo Oshiomhole Aiyegbeni Ibori Ibru Oborevwori Ogboru Okowa Omo-Agege Otuaro Sagay Uduaghan " +
    "Amaechi Odili Peterside Saro-Wiwa Wike Bwacha Ishaku Kefas Nyame Suntai Darius Jolly Nyesom Siminalayi").split(" "));
  Object.values(POOLS).forEach(p => { p.fn = p.fn.filter(x => !BLOCK.has(x)); p.ln = p.ln.filter(x => !BLOCK.has(x)); });
  window.SOP_NAME_BLOCK = BLOCK;

  function patchSNAMES() {
    const S = window.SNAMES_REF; if (!S) return;
    Object.entries(STATE_ETHNIC_MAP).forEach(([st, keys]) => {
      const fn = new Set(S[st]?.fn || []); const ln = new Set(S[st]?.ln || []);
      keys.forEach(k => { (POOLS[k].fn||[]).forEach(x=>fn.add(x)); (POOLS[k].ln||[]).forEach(x=>ln.add(x)); });
      S[st] = { fn: Array.from(fn), ln: Array.from(ln) };
    });
    window.SNAMES_PATCHED = true;
  }

  // Rich NPC generator — persistent identity with LGA, age, background, one liability.
  const BACKGROUNDS = ["Ex-permanent secretary", "Former House of Assembly member", "Retired Army colonel", "Ex-banker (First Bank)", "Former LGA chairman", "Ex-federal permanent secretary", "Ex-university professor", "SAN (Senior Advocate)", "Former SSG", "Ex-commissioner of finance", "Former APC chairman ward level", "Ex-NDDC director", "Ex-military governor's aide", "Retired customs deputy comptroller", "Former Central Bank director"];
  const LIABILITIES = ["EFCC probe pending from 2018 tenure","brother-in-law owns 3 state contracts","daughter's private university received a state grant","known womanizer, one paternity suit pending","ICPC has an open file","alleged link to a cult confraternity","spouse's NGO receives ₦40M yearly from the state","owes ₦120M to a commercial bank","named in the Pandora Papers","land grab dispute in home LGA","has quietly funded opposition candidates","child studies at ₦18M/yr school in UK","personal Range Rover convoy of 8","associated with a bureau de change under FIU scrutiny"];

  function seededPick(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
  function newNpc(state, seed, role) {
    const pool = window.SNAMES_REF[state] || window.SNAMES_REF.FCT;
    const fn = seededPick(pool.fn, seed);
    const ln = seededPick(pool.ln, seed * 7 + 13);
    return {
      name: fn + " " + ln,
      age: 42 + (Math.abs(seed) % 26),
      lga: "LGA " + ((Math.abs(seed) % 20) + 1),
      background: seededPick(BACKGROUNDS, seed * 3),
      liability: seededPick(LIABILITIES, seed * 11 + 7),
      loyalty: 40 + (Math.abs(seed * 13) % 50),
      competence: 30 + (Math.abs(seed * 17) % 60),
      corruption: 10 + (Math.abs(seed * 19) % 70),
      role: role || "Aide",
    };
  }

  // ─────────────────── DEFAULT MINISTRIES ───────────────────
  const DEFAULT_MINISTRIES = [
    { id:"works", name:"Works & Infrastructure", icon:"🏗️", budget:0, staff:1240, perf:55, cor:35, key:"infra" },
    { id:"health", name:"Health", icon:"🏥", budget:0, staff:8900, perf:55, cor:30, key:"hp" },
    { id:"educ", name:"Education", icon:"🎓", budget:0, staff:14200, perf:55, cor:28, key:"lit" },
    { id:"agric", name:"Agriculture & Rural Dev", icon:"🌾", budget:0, staff:420, perf:50, cor:32, key:"agr" },
    { id:"sec", name:"Security & Home Affairs", icon:"🛡️", budget:0, staff:180, perf:55, cor:38, key:"sec" },
    { id:"fin", name:"Finance & Economic Planning", icon:"💰", budget:0, staff:340, perf:60, cor:40, key:null },
    { id:"just", name:"Justice", icon:"⚖️", budget:0, staff:210, perf:55, cor:25, key:null },
    { id:"info", name:"Information & Strategy", icon:"📡", budget:0, staff:150, perf:50, cor:30, key:null },
    { id:"lg", name:"Local Government & Chieftaincy", icon:"🏘️", budget:0, staff:280, perf:45, cor:45, key:null },
    { id:"wom", name:"Women Affairs & Social Welfare", icon:"👩", budget:0, staff:190, perf:50, cor:25, key:null },
  ];

  // ─────────────────── CONTRACTORS (invented bidders) ───────────────────
  const CONTRACTOR_POOL = [
    { name:"Kestrel Construction Nig. PLC", tier:"A", track:88, markup:1.00, note:"World-class delivery, transparent, expensive." },
    { name:"Great Wall Road & Rail (Nig.) Ltd", tier:"A", track:82, markup:0.92, note:"Fast, cheap, quality varies. Foreign loan strings." },
    { name:"Riverside Construction Co.", tier:"A", track:78, markup:1.03, note:"Old reliable. Nigerian-owned." },
    { name:"Sentinel Roads Nigeria Ltd", tier:"A", track:80, markup:0.98, note:"Roads specialist. Solid track record." },
    { name:"Danbala & Partners", tier:"B", track:70, markup:1.05, note:"Northern-owned, decent execution." },
    { name:"Levant Construction Ltd", tier:"B", track:65, markup:1.08, note:"Lebanese-owned, mid-tier delivery." },
    { name:"Cranfield Builders", tier:"B", track:72, markup:1.00, note:"Lagos-based, competitive on urban work." },
    { name:"Bastion Construction", tier:"C", track:52, markup:1.15, note:"Party-affiliated. Delivery patchy." },
    { name:"Rainbow Ventures Ltd (in-law owned)", tier:"D", track:35, markup:1.45, note:"⚠️ Owned by your wife's cousin. NEPOTISM.", nepotism:true },
    { name:"Alhaji Muhammad & Sons Ltd (godfather-linked)", tier:"D", track:42, markup:1.35, note:"⚠️ Godfather's front company.", nepotism:true },
    { name:"Continental Consortium (offshore Cayman)", tier:"C", track:48, markup:1.55, note:"⚠️ Beneficial owner unknown. FIU risk.", nepotism:true },
    { name:"Best Choice Global Concept", tier:"C", track:45, markup:1.22, note:"BVN check: sole director is 24yo." },
  ];

  // ─────────────────── PROCUREMENT METHODS ───────────────────
  const PROC_METHODS = [
    { id:"open", name:"Open Competitive Bidding", speed:3, discount:0.85, integrity:+8, cor:-4, risk:"None (Public Procurement Act §24 compliant)", desc:"Advertise nationally 6 weeks. Sealed bids opened publicly. Legally airtight." },
    { id:"selective", name:"Selective/Restricted Bidding", speed:2, discount:1.00, integrity:+2, cor:0, risk:"Minor: unsuccessful bidders may petition BPP", desc:"Pre-qualified vendors only. Common for specialised works." },
    { id:"single", name:"Sole-Source / Direct Procurement", speed:1, discount:1.35, integrity:-10, cor:+8, risk:"HIGH: BPP query likely, EFCC in extreme cases", desc:"Award without competition. Requires waiver justification (rarely truthful)." },
    { id:"emergency", name:"Emergency Certificate (§43)", speed:0, discount:1.60, integrity:-15, cor:+12, risk:"SEVERE: PAC probe, media exposé virtually guaranteed", desc:"Bypasses ALL controls. Only lawful for genuine emergencies." },
  ];

  // ─────────────────── EIA REQUIREMENTS ───────────────────
  const EIA_REQUIRED_TYPES = ["road","bridge","dam","market","housing","hospital","landfill","power","industrial"];

  // ─────────────────── TRADITIONAL COUNCIL ───────────────────
  const TITLE_STYLES = {
    yoruba: ["Alaafin","Ooni","Awujale","Timi","Owa","Deji","Oba","Olowo"],
    igbo: ["Obi","Igwe","Eze","Obong"],
    hausa: ["Emir","Sarki","Sultan","Etsu","Sarkin"],
    kanuri: ["Shehu","Mai"],
    ijaw: ["Amanyanabo","Pere","Ibenanaowei"],
    efik_ibibio: ["Obong","Edidem","Ndidem","Muri"],
    tiv_idoma: ["Tor","Och'Idoma","Ter"],
    edo_esan: ["Oba","Onojie"],
    urhobo_isoko_itsekiri: ["Ovie","Olu","Odio-Ologbo"],
    berom_plateau: ["Gbong Gwom","Long"],
    igala: ["Attah","Ejeh"],
    ogoni_kalabari: ["Amanyanabo","Gbenemene"],
    jukun_kuteb: ["Aku","Kuru"],
    nupe_gbagyi: ["Etsu","Sarki"],
  };
  function makeCouncil(state, seedBase) {
    const ekeys = STATE_ETHNIC_MAP[state] || ["hausa"];
    const rulers = [];
    for (let i = 0; i < 6; i++) {
      const ek = ekeys[i % ekeys.length];
      const style = TITLE_STYLES[ek] || ["Chief"];
      const title = style[i % style.length];
      const domain = ["Central","Eastern","Western","Northern","Southern","Riverine"][i];
      const npc = newNpc(state, seedBase + i * 91, "Traditional ruler");
      rulers.push({
        id: "trad_" + i, title, domain, name: title + " " + npc.name,
        stool: ["First-class","Second-class","Third-class"][i % 3],
        rel: 55 + (i * 7) % 30, influence: 40 + (i * 13) % 55,
        bloc: ek, age: 62 + (i * 5) % 25,
        stance: ["Loyal","Independent","Godfather-aligned","Opposition-aligned","Reformist","Traditionalist"][i],
      });
    }
    return { rulers, chair: rulers[0].id, dissolved: false };
  }

  // ─────────────────── ENHANCED SA MEMORY ───────────────────
  function saAdvice(SOP) {
    const { s, turn, cab, ministries, projects, nepotismCount, council, bud } = SOP;
    const advice = [];
    if (s.cor > 0.45) advice.push({ tone:"red", txt:`Corruption is at ${Math.round(s.cor*100)}%. ICPC has an open file on your Works Ministry. Every naira loses ~${Math.round(s.cor*100)}% to leakage.` });
    if (s.app < 40) advice.push({ tone:"org", txt:`Approval at ${Math.round(s.app)}%. Two more bad quarters and the House will scent blood. Lagos '05 lost a governor at 38%.` });
    if (s.sec < 0.35) advice.push({ tone:"red", txt:`Security is at ${Math.round(s.sec*100)}%. If you push federal too hard now, DSS may hand-brief the president. Recall what happened to El-Rufai/Wike axis.` });
    if (nepotismCount >= 3) advice.push({ tone:"red", txt:`${nepotismCount} nepotism flags on your record. Wikipedia editors have added a "Controversies" section. EFCC probability rising.` });
    if (ministries) {
      const worst = [...ministries].sort((a,b)=>b.cor - a.cor)[0];
      if (worst && worst.cor > 55) advice.push({ tone:"org", txt:`${worst.name} corruption index is ${worst.cor}. That ministry is a leaking bucket. Consider merging under Finance or replacing the Perm Sec.` });
    }
    if (projects && projects.length) {
      const stalled = projects.filter(p => p.status === "in_progress" && p.progress < 25 && turn - p.startTurn > 2);
      if (stalled.length) advice.push({ tone:"org", txt:`${stalled.length} project(s) stalled below 25% progress. Opposition will list these as "abandoned" at re-election. Recommend site visit or contractor termination.` });
    }
    if (bud) {
      const cap = (bud.infrastructure || 0) + (bud.education || 0) + (bud.health || 0);
      const rec = (bud.salaries || 0) + (bud.administration || 0);
      if (rec > cap) advice.push({ tone:"org", txt:`Recurrent spend (${rec}%) > capital (${cap}%). You are running a payroll not a government.` });
    }
    if (council && !council.dissolved) {
      const hostile = council.rulers.filter(r => r.rel < 40).length;
      if (hostile >= 3) advice.push({ tone:"org", txt:`${hostile} traditional rulers openly cold. Rural approval bleeds through them. Palace visit costs ₦40M and yields +6 approval per ruler warmed.` });
    }
    if (!advice.length) advice.push({ tone:"grn", txt:`Numbers look stable, sir. Use this quiet window — sign that bill you've been sitting on before the next shock lands.` });
    return advice.slice(0, 5);
  }

  // ─────────────────── DECISION CONSEQUENCE ENGINE ───────────────────
  // Called by procurement flow to write outcomes back into the game state.
  function pushWiki(SOP, event) {
    if (SOP.setWikiEvents) SOP.setWikiEvents(w => [{ turn: SOP.turn, ...event }, ...(w || [])]);
  }

  function applyProcurement(SOP, project, method, contractor) {
    const cost = project.baseCost * method.discount * contractor.markup;
    const min = SOP.ministries.find(m => m.id === project.ministryId);
    const leakage = contractor.nepotism ? 0.35 : (method.id === "single" ? 0.22 : method.id === "emergency" ? 0.30 : 0.08);
    const effectiveDelivery = 1 - leakage;
    project.contractor = contractor.name;
    project.method = method.name;
    project.cost = +cost.toFixed(2);
    project.leakage = leakage;
    project.effective = effectiveDelivery;
    project.status = "in_progress";
    project.progress = 5;
    project.startTurn = SOP.turn;
    project.eia = project.eiaDone;
    project.nepotism = !!contractor.nepotism;

    // Immediate stat impact
    SOP.setS(p => ({ ...p, cor: Math.min(1, p.cor + (method.cor / 100) + (contractor.nepotism ? 0.04 : 0)), debt: p.debt + cost * 0.4 }));
    if (min) {
      min.budget = (min.budget || 0) + cost;
      min.cor = Math.min(99, min.cor + (contractor.nepotism ? 8 : method.cor));
      SOP.setMinistries([...SOP.ministries]);
    }
    // Nepotism → Wikipedia + counter
    if (contractor.nepotism) {
      SOP.setNepotismCount(n => (n || 0) + 1);
      pushWiki(SOP, { section:"Controversies", txt:`Awarded ${project.title} (₦${cost.toFixed(1)}B) to ${contractor.name} without competitive bidding. Media coverage described it as "brazen".` });
      SOP.addL && SOP.addL(`⚠️ NEPOTISM: ${project.title} awarded to ${contractor.name}. Corruption +4%, Wikipedia updated.`, "scandal");
      try { window.SOPX_onDecision && window.SOPX_onDecision("sole_source_contract", { contractor: contractor.name, project: project.title, nepotism: true }); } catch(e){}
      try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"nepotism_flag", target: contractor.name, gravity:4, evidence:3, corruptionDelta:+4, note:`${project.title} awarded to ${contractor.name} (family/friend front)`, meta:{ project: project.title, cost }}); } catch(e){}
    } else if (method.id === "open") {
      pushWiki(SOP, { section:"Governorship", txt:`Awarded ${project.title} via open competitive tender to ${contractor.name}. Praised by BudgIT and civil society.` });
      SOP.addL && SOP.addL(`✅ ${project.title} awarded transparently to ${contractor.name}. Integrity +8.`, "success");
    } else {
      pushWiki(SOP, { section:"Governorship", txt:`Awarded ${project.title} to ${contractor.name} via ${method.name} at ₦${cost.toFixed(1)}B.` });
      SOP.addL && SOP.addL(`📋 ${project.title} awarded to ${contractor.name} via ${method.name}. Cost ₦${cost.toFixed(1)}B.`, "policy");
    }
    // Every award → contract_awarded ledger entry (covers open/selective/single/emergency)
    try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"contract_awarded", target: contractor.name, gravity: method.id==="emergency"?4:method.id==="single"?3:1, evidence: method.id==="open"?1:3, corruptionDelta: method.cor|0, note:`${project.title} via ${method.name}`, meta:{ method: method.id, cost, project: project.title, nepotism: !!contractor.nepotism }}); } catch(e){}
    // EIA skip → future court injunction
    if (project.needsEIA && !project.eiaDone) {
      project.eiaBomb = SOP.turn + 2;
      pushWiki(SOP, { section:"Controversies", txt:`Broke ground on ${project.title} without NESREA-approved Environmental Impact Assessment.` });
      try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"eia_bypass", target: project.title, gravity:3, evidence:4, note:`${project.title} broke ground with no NESREA EIA`, meta:{ project: project.title }}); } catch(e){}
    }

    SOP.setProcLog([{ turn: SOP.turn, txt: `${project.title} → ${contractor.name} via ${method.name} @ ₦${cost.toFixed(1)}B (leakage ${(leakage*100).toFixed(0)}%)` }, ...SOP.procLog].slice(0, 30));
    SOP.setProjects(prev => {
      const list = prev || [];
      return list.some(p => p.id === project.id) ? list.map(p => p.id === project.id ? project : p) : [...list, project];
    });
  }

  // Tick projects each turn
  function tickProjects(SOP) {
    if (!SOP.projects || !SOP.projects.length) return;
    let changed = false;
    SOP.projects.forEach(p => {
      if (p.status !== "in_progress") return;
      const rate = 15 + Math.random() * 20 - (p.nepotism ? 8 : 0) - (p.method?.includes("Emergency") ? 5 : 0);
      p.progress = Math.min(100, p.progress + Math.max(3, rate));
      // random event
      const r = Math.random();
      if (r < 0.08) { p.events = (p.events||[]).concat(`T${SOP.turn}: Cost variation order +₦${(p.cost*0.12).toFixed(2)}B (rain damage).`); p.cost *= 1.12; }
      else if (r < 0.13) { p.events = (p.events||[]).concat(`T${SOP.turn}: Community protest halted works 3 weeks.`); p.progress = Math.max(p.progress - 12, 5); }
      else if (r < 0.16 && p.nepotism) { p.events = (p.events||[]).concat(`T${SOP.turn}: Contractor abandoned site. Advance already paid.`); p.status = "abandoned"; }
      // EIA bomb
      if (p.eiaBomb && SOP.turn >= p.eiaBomb && p.status === "in_progress") {
        p.events = (p.events||[]).concat(`T${SOP.turn}: NESREA court order — works suspended pending EIA.`); p.status = "suspended";
        SOP.addL && SOP.addL(`⚖️ Court suspends ${p.title} — no EIA. -6 approval.`, "crisis");
        SOP.setS(x => ({ ...x, app: Math.max(0, x.app - 6) }));
      }
      if (p.progress >= 100) {
        p.status = "delivered";
        p.deliveredTurn = SOP.turn;
        const bonus = Math.round(6 * p.effective);
        SOP.addL && SOP.addL(`🎉 ${p.title} DELIVERED (${p.contractor}). Approval +${bonus}.`, "success");
        SOP.setS(x => ({ ...x, app: Math.min(100, x.app + bonus) }));
        pushWiki(SOP, { section:"Governorship", txt:`Commissioned ${p.title} — completed ${SOP.turn - p.startTurn} turns after award.` });
      }
      changed = true;
    });
    if (changed) SOP.setProjects([...SOP.projects]);
  }

  // ═════════════════════════ REACT COMPONENTS ═════════════════════════
  function mountTab(host, Component, SOP) {
    if (!host || host.dataset.mounted === "1") return;
    host.dataset.mounted = "1";
    const { React, useState } = SOP;
    const root = ReactDOM.createRoot(host);
    root.render(React.createElement(Component, { SOP }));
    host._reactRoot = root;
  }
  function remountAll(SOP) {
    // Re-render existing mounted roots with fresh SOP snapshot
    document.querySelectorAll('[data-nav]').forEach(host => {
      if (!host._reactRoot) return;
      const nav = host.dataset.nav;
      const Comp = COMPONENTS[nav];
      if (Comp) host._reactRoot.render(SOP.React.createElement(Comp, { SOP }));
    });
  }

  const CL = () => window.CL_REF || { grn:"#008751", red:"#cc3333", org:"#c2410c", bdr:"#d0d8c4", card:"#fff", txt:"#1a2e05", tm:"#4a5e3a", td:"#7a8b6a", teal:"#0d9488", pur:"#6d28d9" };
  const F = () => window.F_REF || { d:"serif", b:"sans-serif", m:"monospace" };

  const Card = ({ children, style }) => {
    const c = CL();
    return SOP_H('div', { style: { background: c.card, border: "1px solid " + c.bdr, borderRadius: 17, padding: 36, marginBottom: 29, ...(style||{}) } }, children);
  };
  const Btn = ({ onClick, children, tone="grn", disabled, style }) => {
    const c = CL();
    return SOP_H('button', { onClick, disabled, style: { padding: "22px 43px", borderRadius: 13, border:"1px solid "+c[tone], background: disabled? "#eee" : c[tone]+"18", color: disabled? "#888" : c[tone], fontSize: TS(38), fontFamily:F().b, cursor: disabled?"not-allowed":"pointer", ...(style||{}) } }, children);
  };
  let SOP_H;
  function setH(React) { SOP_H = React.createElement; }

  // The default Executive Council (also called from the Desk's "before you govern" step).
  function initMinistries(SOP) {
        const seed = (SOP.state?.length||1)*77;
        const mandates = SOP.setup?.gfMandates || [];
        const mins = DEFAULT_MINISTRIES.map((m, i) => {
          const mandate = mandates.find(x => x.type === "commissioner" && x.ministryId === m.id);
          return { ...m, minister: mandate?.name || newNpc(SOP.state, seed + i*13, "Commissioner").name, permSec: newNpc(SOP.state, seed + i*29 + 5, "Permanent Secretary").name, loyalty: mandate ? 88 : 45 + ((seed + i * 17) % 45), cor: mandate ? Math.max(m.cor, 52) : m.cor, godfatherMandate: mandate || null };
        });
        SOP.setMinistries(mins);
        const forced = mins.filter(m => m.godfatherMandate);
        pushWiki(SOP, { section:"Governorship", txt:`Convened the first Executive Council with ${mins.length} ministries, making the ministries the sole cabinet structure of the administration.${forced.length ? " Godfather-backed appointment: Hon. " + forced.map(m => m.minister + " as Commissioner for " + m.name).join("; Hon. ") + "." : ""}` });
        if (forced.length) SOP.addL(`🎩 Godfather condition honoured: ${forced.map(m => m.minister + " installed in " + m.name).join("; ")}.`, "political");
  }
  function conveneCouncil(SOP) { SOP.setCouncil(makeCouncil(SOP.state, (SOP.state||"").length * 33)); }
  window.SOP_REALISM = Object.assign(window.SOP_REALISM || {}, { initMinistries: () => initMinistries(window.SOP), conveneCouncil: () => conveneCouncil(window.SOP) });

  // Ministries panel
  function MinistriesPanel({ SOP }) {
    setH(SOP.React);
    const c = CL();
    const [showCreate, setShowCreate] = SOP.useState(false);
    const [mergeSel, setMergeSel] = SOP.useState([]);
    const [newName, setNewName] = SOP.useState("");
    if (!SOP.ministries) return SOP_H('div', { style:{padding: 72}}, [
      SOP_H('div',{style:{marginBottom: 36, fontSize: TS(43)}}, "No ministries initialised. Click below to load the default state ministry structure."),
      SOP_H(Btn,{ onClick:()=>initMinistries(SOP)}, "Initialise Ministries")
    ]);
    return SOP_H('div', {}, [
      SOP_H('h3',{style:{margin: "0 0 29px",color:c.txt,fontFamily:F().d,fontSize: TS(58),fontWeight:600}}, `🏛️ Ministries of ${SOP.state} State`),
      SOP_H('div',{style:{fontSize: TS(36),color:c.td,marginBottom: 29}}, "Nigerian state governors have executive powers under §5(2) to create, merge, or abolish ministries — subject to House of Assembly approval on budget lines."),
      SOP_H('div',{style:{display:"flex",gap: 22,marginBottom: 29,flexWrap:"wrap"}}, [
        SOP_H(Btn,{onClick:()=>setShowCreate(!showCreate), tone:"blu"}, "➕ Create Ministry"),
        SOP_H(Btn,{onClick:()=>{
          if (mergeSel.length !== 2) { alert("Select exactly 2 ministries to merge."); return; }
          const [a,b] = mergeSel.map(id => SOP.ministries.find(m=>m.id===id));
          const merged = { ...a, id:a.id+"_"+b.id, name:a.name+" & "+b.name, staff:a.staff+b.staff, budget:(a.budget||0)+(b.budget||0), perf: Math.round((a.perf+b.perf)/2)-8, cor: Math.round((a.cor+b.cor)/2)+5 };
          const rest = SOP.ministries.filter(m => !mergeSel.includes(m.id));
          SOP.setMinistries([...rest, merged]);
          SOP.setS(p=>({...p, pStab: Math.max(0, p.pStab - 8), app: Math.max(0, p.app - 3)}));
          SOP.addL(`🔀 Merged ${a.name} + ${b.name}. 14,000 civil servants restructured. -8 party stability.`, "political");
          pushWiki(SOP, {section:"Governorship",txt:`Merged the ministries of ${a.name} and ${b.name} in a cost-cutting reform.`});
          setMergeSel([]);
        }, tone:"org", disabled: mergeSel.length!==2}, `🔀 Merge Selected (${mergeSel.length}/2)`),
      ]),
      showCreate && SOP_H(Card,{},[
        SOP_H('div',{style:{fontSize: TS(38),marginBottom: 22,fontWeight:600}},"Create New Ministry (₦2B setup + House approval risk)"),
        SOP_H('input',{value:newName,onChange:e=>setNewName(e.target.value),placeholder:"e.g. Ministry of Digital Economy",style:{padding: 22,border:"1px solid "+c.bdr,borderRadius: 8,width:"100%",fontSize: TS(38),marginBottom: 22}}),
        SOP_H(Btn,{onClick:()=>{
          if (!newName.trim()) return;
          const seed = newName.length * 91;
          const nm = { id:"m_"+Date.now(), name:newName, icon:"🏢", budget:0, staff:60, perf:40, cor:15, key:null,
            minister: newNpc(SOP.state, seed, "Commissioner").name, permSec: newNpc(SOP.state, seed+7, "Permanent Secretary").name, loyalty: 55 };
          SOP.setMinistries([...SOP.ministries, nm]);
          SOP.setS(p=>({...p, debt: p.debt + 2}));
          SOP.addL(`🏢 Created ${newName}. ₦2B setup. Awaiting House ratification.`, "policy");
          pushWiki(SOP, {section:"Governorship",txt:`Created the ${newName}, expanding the Executive Council and appointing Hon. ${nm.minister} as commissioner.`});
          setNewName(""); setShowCreate(false);
        }}, "Confirm")
      ]),
      ...SOP.ministries.map(m => SOP_H(Card,{key:m.id, style:{borderLeft:"3px solid "+(m.cor>55?c.red:m.perf>60?c.grn:c.org)}},[
        SOP_H('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},[
          SOP_H('div',{},[
            SOP_H('div',{style:{fontSize: TS(48),fontWeight:600,color:c.txt}}, `${m.icon} ${m.name}`),
            SOP_H('div',{style:{fontSize: TS(34),color:c.tm,marginTop: 7}}, `Minister: ${m.minister} · PS: ${m.permSec} · Staff: ${m.staff.toLocaleString()}`),
            m.godfatherMandate && SOP_H('div',{style:{fontSize: TS(31),color:c.red,marginTop: 10,fontWeight:700}}, `🎩 Godfather-imposed appointment from campaign bailout`),
            ...((m.record || []).slice(-2).reverse().map((e, i) => SOP_H('div',{key:"rec"+i, style:{fontSize: TS(29), color: e.kind === "praise" ? c.grn : c.red, marginTop: 8, lineHeight: 1.35}}, (e.kind === "praise" ? "🏅 " : "⚠️ ") + "Half-year " + e.t + ": " + e.text))),
          ]),
          SOP_H('div',{style:{display:"flex",gap: 14}},[
            SOP_H('input',{type:"checkbox", checked: mergeSel.includes(m.id), onChange:e=>{
              setMergeSel(e.target.checked ? [...mergeSel,m.id].slice(-2) : mergeSel.filter(x=>x!==m.id));
            }, title:"Select for merge"}),
            SOP_H(Btn,{onClick:async ()=>{
              const gf = !!m.godfatherMandate;
              if (!gf && window.SOP_PERSONNEL) { await window.SOP_PERSONNEL.fire(m.id); return; }
              const warn = gf
                ? `Fire Hon. ${m.minister}?\n\nThis was a GODFATHER-IMPOSED appointment from your campaign bailout. Firing WILL trigger retaliation:\n• Godfather recalls ₦0.6B loan (treasury hit)\n• -20 party stability, -15 loyalty across party\n• Public feud logged on your Wikipedia\n• Future godfather bailouts locked`
                : `Fire Hon. ${m.minister} as Commissioner for ${m.name}?\n\nA new commissioner will be sworn in. Party may grumble.`;
              if (!(await window.SOP_confirm(warn))) return;
              const oldName = m.minister;
              const seed = Date.now() % 9999;
              const replacement = newNpc(SOP.state, seed, "Commissioner").name;
              SOP.setMinistries(SOP.ministries.map(x => x.id===m.id ? {...x, minister: replacement, loyalty: 40, godfatherMandate: null, perf: Math.max(20, x.perf-8)} : x));
              if (gf) {
                SOP.setS(p => ({...p,
                  pStab: Math.max(0, p.pStab - 20),
                  treas: Math.max(0, (p.treas||0) - 0.6),
                  debt: (p.debt||0) + 0.6,
                  app: Math.max(0, p.app - 4)
                }));
                SOP.addL(`🔥 FIRED Hon. ${oldName} (godfather appointee). Godfather has RECALLED his ₦0.6B campaign loan. -20 party stability. Feud is public.`, "crisis");
                pushWiki(SOP, {section:"Controversies", txt:`Sacked Hon. ${oldName} as Commissioner for ${m.name} — the appointment had been imposed by the godfather during the campaign bailout. The governor's former patron publicly recalled the ₦0.6B loan and vowed political reprisal. Analysts described the move as either a decisive break from patronage or a fatal miscalculation.`});
                SOP.setSaMemory && SOP.setSaMemory(mm => ({...(mm||{}), godfatherHostile:true, godfatherFiredOn: SOP.turn}));
                try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"minister_fired", target: oldName, gravity:5, evidence:5, approvalDelta:-4, note:`Sacked godfather-imposed Hon. ${oldName} at ${m.name}`, meta:{ ministry:m.name, godfather:true }}); } catch(e){}
                try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"godfather_betrayal", target: oldName, gravity:5, evidence:5, note:`Godfather recalled ₦0.6B loan after ${oldName} sacking`, meta:{ ministry:m.name }}); } catch(e){}
              } else {
                SOP.setS(p => ({...p, pStab: Math.max(0, p.pStab - 4)}));
                SOP.addL(`🔄 Replaced Hon. ${oldName} with Hon. ${replacement} at ${m.name}.`, "political");
                pushWiki(SOP, {section:"Governorship", txt:`Reshuffled the cabinet, replacing Hon. ${oldName} with Hon. ${replacement} as Commissioner for ${m.name}.`});
                try { window.SOP_LEDGER && window.SOP_LEDGER.append({ kind:"minister_fired", target: oldName, gravity:2, evidence:2, note:`Cabinet reshuffle: ${oldName} → ${replacement} at ${m.name}`, meta:{ ministry:m.name, godfather:false }}); } catch(e){}
              }
            }, tone:"org", style:{fontSize: TS(34),padding: "10px 22px"}}, m.godfatherMandate ? "🔥 Fire GF" : "🔄 Fire"),
            SOP_H(Btn,{onClick:async ()=>{
              if (!(await window.SOP_confirm(`Dismantle ${m.name}? Civil servants will sue. Party will revolt.`))) return;
              SOP.setMinistries(SOP.ministries.filter(x=>x.id!==m.id));
              SOP.setS(p=>({...p, pStab: Math.max(0,p.pStab-12), app: Math.max(0,p.app-5)}));
              SOP.addL(`💥 Dismantled ${m.name}. NIC lawsuits filed. -12 party, -5 approval.`, "crisis");
              pushWiki(SOP, {section:"Controversies",txt:`Abolished the ${m.name} — sparked NLC picket and NIC litigation.`});
            }, tone:"red", style:{fontSize: TS(34),padding: "10px 22px"}}, "✕"),
          ])
        ]),
        SOP_H('div',{style:{display:"flex",gap: 29,marginTop: 22,fontSize: TS(34)}},[
          SOP_H('span',{},`Performance: `),SOP_H('span',{style:{color:m.perf>60?c.grn:c.red,fontWeight:600}},m.perf),
          SOP_H('span',{style:{marginLeft: 29}},`Corruption: `),SOP_H('span',{style:{color:m.cor>50?c.red:c.grn,fontWeight:600}},m.cor+"%"),
          SOP_H('span',{style:{marginLeft: 29}},`Budget: `),SOP_H('span',{style:{fontFamily:F().m}},`₦${(m.budget||0).toFixed(1)}B`),
        ]),
      ]))
    ]);
  }

  // Projects panel — with procurement launcher
  function ProjectsPanel({ SOP }) {
    setH(SOP.React);
    const c = CL();
    const [showNew, setShowNew] = SOP.useState(false);
    const [draft, setDraft] = SOP.useState({ title:"", type:"road", baseCost:2, ministryId:"works", needsEIA:true, eiaDone:false });
    if (SOP.pendingProc) return ProcurementModal({ SOP, project: SOP.pendingProc });
    return SOP_H('div',{},[
      SOP_H('h3',{style:{margin: "0 0 22px",color:c.txt,fontFamily:F().d,fontSize: TS(58),fontWeight:600}},`🏗️ Projects Portfolio`),
      SOP_H('div',{style:{fontSize: TS(36),color:c.td,marginBottom: 29}}, "Every capital project runs a real lifecycle: need → procurement method → EIA → contractor → execution → delivery. Shortcuts leak treasury and bio."),
      SOP_H(Btn,{onClick:()=>setShowNew(!showNew)},"➕ Initiate New Project"),
      showNew && SOP_H(Card,{style:{marginTop: 29}},[
        SOP_H('div',{style:{fontSize: TS(38),fontWeight:600,marginBottom: 22}},"New Capital Project"),
        SOP_H('input',{value:draft.title,onChange:e=>setDraft({...draft,title:e.target.value}),placeholder:"e.g. Ikeja–Agege 4-lane arterial road",style:{padding: 22,border:"1px solid "+c.bdr,borderRadius: 8,width:"100%",fontSize: TS(38),marginBottom: 22}}),
        SOP_H('div',{style:{display:"flex",gap: 22,marginBottom: 22}},[
          SOP_H('select',{value:draft.type,onChange:e=>setDraft({...draft,type:e.target.value,needsEIA:EIA_REQUIRED_TYPES.includes(e.target.value)}),style:{padding: 19,fontSize: TS(38),border:"1px solid "+c.bdr,borderRadius: 8}},
            ["road","bridge","hospital","school","market","dam","housing","water","power","vehicles","cctv","landfill","industrial"].map(t=>SOP_H('option',{key:t,value:t},t))),
          SOP_H('input',{type:"number",step:0.5,value:draft.baseCost,onChange:e=>setDraft({...draft,baseCost:+e.target.value}),style:{padding: 19,fontSize: TS(38),border:"1px solid "+c.bdr,borderRadius: 8,width: 228}}),
          SOP_H('span',{style:{fontSize: TS(36),color:c.td,alignSelf:"center"}},"₦B base cost"),
          SOP_H('select',{value:draft.ministryId,onChange:e=>setDraft({...draft,ministryId:e.target.value}),style:{padding: 19,fontSize: TS(38),border:"1px solid "+c.bdr,borderRadius: 8}},
            (SOP.ministries||[]).map(m=>SOP_H('option',{key:m.id,value:m.id},m.name))),
        ]),
        draft.needsEIA && SOP_H('div',{style:{fontSize: TS(36),color:c.org,marginBottom: 22}}, `⚠️ ${draft.type.toUpperCase()} projects require an EIA (EIA Act Cap E12, 2004). Skipping = NESREA court risk.`),
        SOP_H('div',{style:{display:"flex",gap: 22}},[
          SOP_H(Btn,{onClick:()=>{
            if (!draft.title.trim()) return;
            if (!SOP.ministries || !SOP.ministries.length) { alert("Initialise Ministries first."); return; }
            const proj = { id:"p_"+Date.now(), status:"pending_procurement", progress:0, events:[], ...draft };
            const min = SOP.ministries.find(m=>m.id===draft.ministryId);
            pushWiki(SOP, {section:"Governorship",txt:`Initiated ${draft.title} under ${min?.name || "a state ministry"}, with an estimated base cost of ₦${(+draft.baseCost || 0).toFixed(1)}B${draft.needsEIA ? (draft.eiaDone ? " after commissioning an Environmental Impact Assessment." : ", despite requiring an Environmental Impact Assessment.") : "."}`});
            SOP.addL && SOP.addL(`🏗️ PROJECT INITIATED: ${draft.title} under ${min?.name || "a state ministry"}. Proceed to procurement.`, "policy");
            SOP.setProjects(prev => [ ...(prev || []), proj ]);
            SOP.setPendingProc(proj);
            setShowNew(false);
          }},"→ Proceed to Procurement"),
          draft.needsEIA && SOP_H(Btn,{onClick:()=>setDraft({...draft,eiaDone:!draft.eiaDone}), tone:"teal"}, draft.eiaDone?"✅ EIA commissioned (₦120M, +1 turn delay)":"⏳ Commission EIA (₦120M)"),
        ]),
      ]),
      SOP_H('div',{style:{marginTop: 36}},
        (!SOP.projects || !SOP.projects.length) ? SOP_H('div',{style:{fontSize: TS(38),color:c.td,padding: 43,textAlign:"center"}},"No projects yet.") :
        SOP.projects.map(p => {
          const isStalled = p.status === "in_progress" && (p.progress || 0) < 40 && (SOP.turn - (p.startTurn || SOP.turn)) >= 1;
          const isSuspended = p.status === "suspended" || p.status === "abandoned";
          const canAct = isStalled || isSuspended;
          const actVisit = () => {
            p.events = (p.events||[]).concat(`T${SOP.turn}: Governor site visit — contractor recommitted timelines.`);
            p.progress = Math.min(100, (p.progress||0) + 8);
            if (p.status === "suspended") p.status = "in_progress";
            SOP.setProjects([...SOP.projects]);
            SOP.setS && SOP.setS(prev => ({ ...prev, app: Math.min(100, (prev.app||0) + 2) }));
            SOP.addL && SOP.addL(`👞 Site visit to ${p.title} — +8% progress, +2 approval.`, "policy");
            pushWiki(SOP, {section:"Governorship",txt:`Made an inspection visit to ${p.title}, pushing the contractor to accelerate delivery.`});
          };
          const actAudit = () => {
            const leakBefore = p.leakage || 0;
            p.leakage = Math.max(0, (p.leakage||0) - 0.15);
            p.events = (p.events||[]).concat(`T${SOP.turn}: Independent audit — leakage cut from ${(leakBefore*100).toFixed(0)}% to ${(p.leakage*100).toFixed(0)}%.`);
            SOP.setPersonalFund && SOP.setPersonalFund(f => Math.max(0, f - 0.15));
            SOP.setS && SOP.setS(prev => ({ ...prev, cor: Math.max(0, (prev.cor||0) - 0.03) }));
            SOP.setProjects([...SOP.projects]);
            SOP.addL && SOP.addL(`🧾 Forensic audit ordered on ${p.title} (₦0.15B) — leakage down, corruption down 3%.`, "success");
            pushWiki(SOP, {section:"Governorship",txt:`Commissioned a forensic audit of ${p.title}, reducing reported leakage and restoring public confidence.`});
          };
          const actRenegotiate = () => {
            const savings = (p.cost||p.baseCost||1) * 0.12;
            p.cost = Math.max(0.3, (p.cost||p.baseCost||1) - savings);
            p.events = (p.events||[]).concat(`T${SOP.turn}: Contract renegotiated — ₦${savings.toFixed(2)}B saved, delivery pushed 1 turn.`);
            p.progress = Math.max(0, (p.progress||0) - 5);
            if (p.status === "suspended") p.status = "in_progress";
            SOP.setProjects([...SOP.projects]);
            SOP.addL && SOP.addL(`🤝 Renegotiated ${p.title} — saved ₦${savings.toFixed(2)}B, contractor grumbling.`, "policy");
          };
          const actTerminate = async () => {
            if (!(await window.SOP_confirm(`Terminate ${p.title}? Contractor may sue for breach; a scar goes on your record.`))) return;
            p.status = "abandoned";
            p.events = (p.events||[]).concat(`T${SOP.turn}: Contract terminated by executive order. Contractor threatens litigation.`);
            SOP.setProjects([...SOP.projects]);
            SOP.setS && SOP.setS(prev => ({ ...prev, app: Math.max(0, (prev.app||0) - 3), pStab: Math.max(0, (prev.pStab||0) - 4) }));
            SOP.addL && SOP.addL(`❌ Terminated ${p.title}. Voters will notice the abandoned site.`, "crisis");
            pushWiki(SOP, {section:"Controversies",txt:`Cancelled ${p.title} mid-execution; the site was abandoned and became an opposition talking point.`});
          };
          return SOP_H(Card,{key:p.id,style:{borderLeft:"3px solid "+(p.status==="delivered"?c.grn: p.status==="abandoned"?c.red: p.status==="suspended"?c.org: p.nepotism?c.red: c.teal)}},[
            SOP_H('div',{style:{display:"flex",justifyContent:"space-between"}},[
              SOP_H('div',{style:{fontSize: TS(43),fontWeight:600}}, `${p.title} `, SOP_H('span',{style:{fontSize: TS(34),color:c.td}},`[${p.type}]`)),
              SOP_H('span',{style:{fontSize: TS(36),color: p.status==="delivered"?c.grn:p.status==="abandoned"?c.red:p.status==="suspended"?c.org:c.org, fontWeight:600, textTransform:"uppercase"}}, p.status.replace("_"," ")),
            ]),
            p.contractor && SOP_H('div',{style:{fontSize: TS(36),color:c.tm,marginTop: 10}}, `${p.method} → ${p.contractor} · ₦${p.cost?.toFixed(2)}B · leakage ${(p.leakage*100).toFixed(0)}%${p.nepotism?" · ⚠️ NEPOTISM":""}`),
            p.status === "pending_procurement" && SOP_H('div',{style:{marginTop: 22}}, SOP_H(Btn,{onClick:()=>SOP.setPendingProc(p), tone:"org", style:{fontSize: TS(34),padding: "14px 29px"}}, "Resume Procurement")),
            p.status !== "pending_procurement" && SOP_H('div',{style:{marginTop: 14,background:"#eee",borderRadius: 6,height: 22,overflow:"hidden"}},SOP_H('div',{style:{width:`${p.progress}%`,height:"100%",background:p.status==="abandoned"?c.red:p.status==="suspended"?c.org:c.grn}})),
            p.events?.length ? SOP_H('div',{style:{fontSize: TS(34),color:c.td,marginTop: 14,fontStyle:"italic"}}, p.events.slice(-2).join(" | ")) : null,
            canAct && SOP_H('div',{style:{display:"flex",flexWrap:"wrap",gap: 14,marginTop: 22}},[
              SOP_H(Btn,{onClick:actVisit, tone:"teal", style:{fontSize: TS(34),padding: "14px 29px"}}, "👞 Site Visit"),
              SOP_H(Btn,{onClick:actAudit, style:{fontSize: TS(34),padding: "14px 29px"}}, "🧾 Audit (₦0.15B)"),
              SOP_H(Btn,{onClick:actRenegotiate, tone:"org", style:{fontSize: TS(34),padding: "14px 29px"}}, "🤝 Renegotiate"),
              SOP_H(Btn,{onClick:actTerminate, tone:"red", style:{fontSize: TS(34),padding: "14px 29px"}}, "❌ Terminate"),
            ]),
          ]);
        })
      )
    ]);
  }

  function ProcurementModal({ SOP, project }) {
    setH(SOP.React);
    const c = CL();
    const [method, setMethod] = SOP.useState(null);
    const [contractor, setContractor] = SOP.useState(null);
    return SOP_H('div',{style:{padding: 29}},[
      SOP_H('div',{style:{background:c.pur+"15",padding: 36,borderRadius: 13,marginBottom: 36}},[
        SOP_H('div',{style:{fontSize: TS(50),fontWeight:600,color:c.pur}}, `📋 Procurement: ${project.title}`),
        SOP_H('div',{style:{fontSize: TS(36),color:c.tm,marginTop: 10}}, `Base cost ₦${project.baseCost}B · Ministry: ${SOP.ministries.find(m=>m.id===project.ministryId)?.name} · EIA: ${project.eiaDone?"✅ done":project.needsEIA?"⚠️ skipped":"n/a"}`),
      ]),
      SOP_H('div',{style:{fontSize: TS(43),fontWeight:600,margin: "29px 0 14px"}},"Step 1: Choose procurement method"),
      SOP_H('div',{style:{display:"grid",gap: 22}},PROC_METHODS.map(m=>SOP_H('div',{key:m.id,onClick:()=>setMethod(m),style:{padding: 29,border:"2px solid "+(method?.id===m.id?c.grn:c.bdr),borderRadius: 13,cursor:"pointer",background:method?.id===m.id?c.grn+"10":"#fff"}},[
        SOP_H('div',{style:{fontSize: TS(43),fontWeight:600}}, m.name),
        SOP_H('div',{style:{fontSize: TS(36),color:c.tm,marginTop: 7}}, m.desc),
        SOP_H('div',{style:{fontSize: TS(34),color:c.td,marginTop: 10}}, `Speed: ${["Instant","Fast","Medium","Slow"][m.speed]} · Cost mod: ×${m.discount} · Integrity: ${m.integrity>0?"+":""}${m.integrity} · Corruption: ${m.cor>0?"+":""}${m.cor}`),
        SOP_H('div',{style:{fontSize: TS(34),color:c.red,marginTop: 7}}, `Risk: ${m.risk}`),
      ]))),
      method && SOP_H('div',{},[
        SOP_H('div',{style:{fontSize: TS(43),fontWeight:600,margin: "43px 0 14px"}},"Step 2: Select contractor from bidders"),
        SOP_H('div',{style:{display:"grid",gap: 19}},CONTRACTOR_POOL.map(k=>SOP_H('div',{key:k.name,onClick:()=>setContractor(k),style:{padding: 22,border:"2px solid "+(contractor?.name===k.name?c.grn:c.bdr),borderRadius: 11,cursor:"pointer",background:k.nepotism?c.red+"08":"#fff"}},[
          SOP_H('div',{style:{display:"flex",justifyContent:"space-between",fontSize: TS(38)}},[
            SOP_H('span',{style:{fontWeight:600}}, `[Tier ${k.tier}] ${k.name}`),
            SOP_H('span',{style:{fontFamily:F().m,color:k.markup>1.2?c.red:c.grn}}, `₦${(project.baseCost*method.discount*k.markup).toFixed(2)}B`),
          ]),
          SOP_H('div',{style:{fontSize: TS(34),color:c.tm,marginTop: 7}}, `Track record: ${k.track}% · ${k.note}`),
        ]))),
      ]),
      SOP_H('div',{style:{display:"flex",gap: 22,marginTop: 36}},[
        SOP_H(Btn,{onClick:()=>SOP.setPendingProc(null), tone:"red"}, "Cancel"),
        SOP_H(Btn,{onClick:()=>{
          applyProcurement(SOP, project, method, contractor);
          SOP.setPendingProc(null);
        }, disabled: !method || !contractor}, "✅ Award Contract"),
      ])
    ]);
  }

  function ProcLogPanel({ SOP }) {
    setH(SOP.React); const c = CL();
    return SOP_H('div',{},[
      SOP_H('h3',{style:{margin: "0 0 29px",fontFamily:F().d,fontSize: TS(58),color:c.txt,fontWeight:600}}, `📋 Procurement Log`),
      SOP_H('div',{style:{fontSize: TS(36),color:c.td,marginBottom: 29}}, "Every contract award — visible to media, civil society and (potentially) the EFCC."),
      (!SOP.procLog || !SOP.procLog.length) ? SOP_H('div',{style:{fontSize: TS(38),color:c.td}},"No awards yet.") :
      SOP.procLog.map((e,i)=>SOP_H('div',{key:i,style:{padding: 22,borderBottom:"1px solid "+c.bdr,fontSize: TS(36)}},[
        SOP_H('span',{style:{color:c.td,fontFamily:F().m,marginRight: 22}},`T${e.turn}`),
        SOP_H('span',{style:{color:c.txt}},e.txt),
      ]))
    ]);
  }

  function CouncilPanel({ SOP }) {
    setH(SOP.React); const c = CL();
    if (!SOP.council) return SOP_H('div',{style:{padding: 72}},[
      SOP_H('div',{style:{marginBottom: 36,fontSize: TS(43)}}, "The Traditional Rulers Council has not been convened. Under state law, the Governor is patron-in-chief."),
      SOP_H(Btn,{onClick:()=>SOP.setCouncil(makeCouncil(SOP.state, (SOP.state||"").length * 33))}, "👑 Convene Council"),
    ]);
    if (SOP.council.dissolved) return SOP_H('div',{style:{padding: 72,fontSize: TS(43),color:c.red}},"⚠️ You dissolved the Council. Rural stakeholders remain in open opposition.");
    return SOP_H('div',{},[
      SOP_H('h3',{style:{margin: "0 0 22px",fontFamily:F().d,fontSize: TS(58),color:c.txt,fontWeight:600}}, `👑 Traditional Rulers Council`),
      SOP_H('div',{style:{fontSize: TS(36),color:c.td,marginBottom: 29}}, "Constitutionally advisory (5th Sched., Part II) — politically decisive in rural mobilisation and inter-communal peace."),
      SOP_H('div',{style:{display:"flex",gap: 22,marginBottom: 29,flexWrap:"wrap"}},[
        SOP_H(Btn,{onClick:async ()=>{
          if (!(await window.SOP_confirm("Dissolve the entire Council? Historic first — rural bloc will revolt."))) return;
          SOP.setCouncil({...SOP.council, dissolved:true});
          SOP.setS(p=>({...p, app: Math.max(0,p.app-12), sec: Math.max(0,p.sec-0.05)}));
          SOP.addL("👑 DISSOLVED Traditional Rulers Council. Approval -12. Rural areas restive.", "crisis");
          SOP.setWikiEvents([{turn:SOP.turn,section:"Controversies",txt:`Dissolved the Traditional Rulers Council — unprecedented since 1979.`}, ...SOP.wikiEvents]);
        }, tone:"red"},"💥 Dissolve Council"),
      ]),
      ...SOP.council.rulers.map(r => SOP_H(Card,{key:r.id,style:{borderLeft:"3px solid "+(r.rel>60?c.grn:r.rel>40?c.org:c.red)}},[
        SOP_H('div',{style:{display:"flex",justifyContent:"space-between"}},[
          SOP_H('div',{},[
            SOP_H('div',{style:{fontSize: TS(48),fontWeight:600}}, `${r.name}`, r.id===SOP.council.chair && SOP_H('span',{style:{fontSize: TS(34),marginLeft: 22,color:c.gold||c.grn}},"[CHAIR]")),
            SOP_H('div',{style:{fontSize: TS(36),color:c.tm}}, `${r.stool} · ${r.domain} district · Age ${r.age} · Bloc: ${r.bloc.replace("_"," ")}`),
            SOP_H('div',{style:{fontSize: TS(34),color:c.td,marginTop: 7,fontStyle:"italic"}}, `Stance: ${r.stance} · Influence ${r.influence} · Relations ${r.rel}`),
          ]),
          SOP_H('div',{style:{display:"flex",gap: 14,flexDirection:"column"}},[
            SOP_H(Btn,{onClick:()=>{
              r.rel = Math.min(100, r.rel + 15);
              SOP.setS(p=>({...p, debt: p.debt + 0.04}));
              SOP.setCouncil({...SOP.council});
              SOP.addL(`👑 Palace visit to ${r.name}. +15 relations. ₦40M "welfare".`, "political");
            }, style:{fontSize: TS(34),padding: "10px 22px"}}, "Palace visit ₦40M"),
            SOP_H(Btn,{onClick:async ()=>{
              if (!(await window.SOP_confirm(`Depose ${r.name}? Court challenge is virtually certain.`))) return;
              SOP.setCouncil({...SOP.council, rulers: SOP.council.rulers.filter(x=>x.id!==r.id)});
              SOP.setS(p=>({...p, app: Math.max(0,p.app-6), pStab: Math.max(0,p.pStab-4)}));
              SOP.addL(`⚖️ Deposed ${r.name}. Court injunction incoming.`, "political");
              SOP.setWikiEvents([{turn:SOP.turn,section:"Controversies",txt:`Deposed ${r.name} — Supreme Court petition filed by the ${r.bloc.replace("_"," ")} ruling house.`}, ...SOP.wikiEvents]);
            }, tone:"red", style:{fontSize: TS(34),padding: "10px 22px"}}, "Depose"),
            r.id !== SOP.council.chair && SOP_H(Btn,{onClick:()=>{
              SOP.setCouncil({...SOP.council, chair:r.id});
              SOP.addL(`👑 ${r.name} appointed Council Chair.`, "political");
            }, tone:"teal", style:{fontSize: TS(34),padding: "10px 22px"}}, "Make Chair"),
          ])
        ])
      ]))
    ]);
  }

  function BioPanel({ SOP }) {
    setH(SOP.React); const c = CL();
    const sections = { "Early life": [], "Political career":[], "Governorship":[], "Capital projects & procurement":[], "Controversies":[], "Personal life":[] };
    (SOP.wikiEvents||[]).forEach(e => { (sections[e.section] || (sections[e.section]=[])).push(e); });
    (SOP.projects || []).forEach(p => {
      const min = (SOP.ministries || []).find(m => m.id === p.ministryId);
      sections["Capital projects & procurement"].push({ turn:p.startTurn || SOP.turn, txt:
        p.contractor
          ? `Initiated ${p.title} under ${min?.name || "a state ministry"}; contract awarded to ${p.contractor} via ${p.method || "procurement"}${p.cost ? ` at ₦${p.cost.toFixed(1)}B` : ""}. Status: ${String(p.status || "pending").replace("_", " ")}.`
          : `Initiated ${p.title} under ${min?.name || "a state ministry"} with estimated base cost ₦${(+p.baseCost || 0).toFixed(1)}B. Procurement status: ${String(p.status || "pending procurement").replace("_", " ")}.`
      });
    });
    // Auto-fill baseline
    if (!sections["Early life"].length) sections["Early life"].push({turn:0, txt:`${SOP.pName} was born in ${SOP.state} State. Educated locally and abroad, they entered politics via the ${SOP.party} party.`});
    if (!sections["Political career"].length) sections["Political career"].push({turn:0, txt:`Elected Governor of ${SOP.state} State on the ${SOP.party} platform, promising a "${SOP.setup?.agenda||"reform"}" agenda.`});
    return SOP_H('div',{style:{background:"#fdfdf6",padding: 50,border:"1px solid "+c.bdr,borderRadius: 13}},[
      SOP_H('div',{style:{borderBottom:"2px solid "+c.txt,paddingBottom: 29,marginBottom: 43}},[
        SOP_H('div',{style:{fontSize: TS(34),color:c.td,fontFamily:F().m}},"WIKIPEDIA — The Free Encyclopedia"),
        SOP_H('h1',{style:{fontFamily:"'Fraunces',Georgia,serif",fontSize: TS(94),margin: "14px 0 0",fontWeight:400,color:c.txt}}, SOP.pName),
        SOP_H('div',{style:{fontSize: TS(38),color:c.tm,marginTop: 7}}, `Governor of ${SOP.state} State (incumbent) · ${SOP.party}`),
      ]),
      SOP_H('div',{style:{fontSize: TS(38),color:c.tm,marginBottom: 43,padding: 29,background:c.card,border:"1px solid "+c.bdr,borderRadius: 8}},[
        SOP_H('div',{style:{fontWeight:600,marginBottom: 14}},"Career summary"),
        SOP_H('div',{},`Approval rating: ${Math.round(SOP.s.app)}% · Nepotism flags on record: ${SOP.nepotismCount} · Projects delivered: ${(SOP.projects||[]).filter(p=>p.status==="delivered").length} · Projects abandoned: ${(SOP.projects||[]).filter(p=>p.status==="abandoned").length} · Turn: ${SOP.turn}/8`),
      ]),
      ...Object.entries(sections).map(([sec,items])=>SOP_H('div',{key:sec,style:{marginBottom: 50}},[
        SOP_H('h2',{style:{fontFamily:"'Fraunces',Georgia,serif",fontSize: TS(65),fontWeight:400,borderBottom:"1px solid "+c.bdr,paddingBottom: 7,margin: "0 0 22px",color: sec==="Controversies"?c.red:c.txt}}, sec),
        items.length===0 ? SOP_H('div',{style:{fontSize: TS(38),color:c.td,fontStyle:"italic"}},"No entries.") :
        items.map((e,i)=>SOP_H('p',{key:i,style:{fontSize: TS(38),color:c.txt,margin: "14px 0",lineHeight:1.5}}, e.txt, e.turn>0 && SOP_H('sup',{style:{color:c.td,marginLeft: 14}}, `[T${e.turn}]`)))
      ]))
    ]);
  }

  const COMPONENTS = { min: MinistriesPanel, prj: ProjectsPanel, proc: ProcLogPanel, coun: CouncilPanel, bio: BioPanel };

  // ─────────────────── ENHANCED SA FLOATING PANEL ───────────────────
  function mountSAFloat(SOP) {
    // Disabled: the React Executive Command desk in seat-of-power.html is now
    // the single source of truth for Special Adviser UI and firing logic.
    return;
    if (document.getElementById("sop-sa-float")) return;
    const el = document.createElement('div');
    el.id = "sop-sa-float";
    el.style.cssText = "position:fixed;bottom: 18px;right: 18px;width: 510px;max-height:60vh;overflow:auto;background:#fdfdf6;border:2px solid #1a6d2e;border-radius: 15px;padding: 15px;box-shadow:0 8px 30px rgba(0,0,0,.2);font-family:'Plus Jakarta Sans',sans-serif;font-size: 34px;z-index:9999;display:none;";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d0d8c4;padding-bottom: 9px;margin-bottom: 9px"><b style="color:#1a6d2e">🎓 Special Adviser (Live)</b><button id="sop-sa-close" style="background:none;border:none;cursor:pointer;font-size: 47px">✕</button></div><div id="sop-sa-body"></div>`;
    document.body.appendChild(el);
    document.getElementById('sop-sa-close').onclick = () => el.style.display='none';

    const toggle = document.createElement('button');
    toggle.textContent = "🎓 SA";
    toggle.style.cssText = "position:fixed;bottom: 18px;right: 18px;background:#008751;color:#fff;border:none;border-radius: 30px;padding: 15px 24px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;cursor:pointer;z-index:9998;box-shadow:0 4px 15px rgba(0,0,0,.25)";
    toggle.onclick = () => { el.style.display = el.style.display==='none'?'block':'none'; toggle.style.display = el.style.display==='block'?'none':'block'; refreshSA(); };
    document.body.appendChild(toggle);

    window._sopRefreshSA = refreshSA;
    function refreshSA() {
      const body = document.getElementById('sop-sa-body');
      if (!body || !window.SOP) return;
      const advice = saAdvice(window.SOP);
      body.innerHTML = advice.map(a => `<div style="padding: 9px 0;border-bottom:1px dashed #d0d8c4;color:${a.tone==='red'?'#cc3333':a.tone==='org'?'#c2410c':'#008751'}">${a.txt}</div>`).join('') +
        `<div style="font-size: 24px;color:#7a8b6a;margin-top: 9px;font-style:italic">Based on live state at T${window.SOP.turn}. Advice updates each turn.</div>`;
    }
  }

  // ─────────────────── MOUNT LOOP ───────────────────
  let lastTurn = -1;
  function scanAndMount() {
    if (!window.SOP) return;
    patchSNAMES();
    ["min","prj","proc","coun","bio"].forEach(k => {
      const host = document.getElementById('sop-realism-'+k);
      if (host && !host.dataset.mounted) {
        // Clear placeholder
        host.innerHTML = "";
        mountTab(host, COMPONENTS[k], window.SOP);
      }
    });
    mountSAFloat(window.SOP);
    // On turn change, tick projects & refresh
    if (window.SOP.turn !== lastTurn) {
      if (lastTurn !== -1) tickProjects(window.SOP);
      lastTurn = window.SOP.turn;
    }
    remountAll(window.SOP);
    window._sopRefreshSA && window._sopRefreshSA();
  }

  // Poll periodically (game re-renders frequently; DOM hosts appear/disappear via nav)
  setInterval(scanAndMount, 700);
  window.addEventListener('sop-state', scanAndMount);
  window.addEventListener('sop-log', () => window._sopRefreshSA && window._sopRefreshSA());

  console.log("[SOP-Realism] loaded: ministries, projects/procurement, council, wikipedia bio, enhanced SA");
})();
