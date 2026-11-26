/* Names that belong to the place (owner, 26 Nov 2026: "use state-specific and LGA-specific names, names that are
   original to the states: if I hear the name I know it's from that state or LGA. Be guided by research").

   Each people has its own given names (m, f) and family names (ln). A state lists its peoples; a mixed state maps its
   local governments to them (Kogi: Igala in the east, Ebira in the centre, Okun in the west). With no local government
   given, a mixed state draws from its peoples in proportion to the local governments they hold.

   Sources: the common naming patterns of each group (Yoruba sub-group surnames such as the Egba and Ijebu "So-/Ona-"
   names, Ondo's "Omotehinse", Ekiti's "Ojo/Falegan"; Igbo sub-regions: Nsukka's Ugwu/Asogwa, Imo's Opara/Duru, Ebonyi's
   Nwali/Nweke, Ohafia's Kalu/Uduma; Kanuri Modu/Kyari/Goni and female Falmata/Yagana; Bura Mshelia/Bwala; Berom
   Pam/Dung/Chuwang/Gyang and female Kaneng/Chundung (Berom naming studies); Ngas, Mwaghavul and Goemai "Nan-/Long-"
   names; Southern Kaduna Bobai/Kantiok/Yashim; Tiv, Idoma, Igala and Ebira names; Urhobo "Oghene-" and Itsekiri
   "Oritse-" names; Ijaw "Ebi-/Pere-" names; Kalabari Briggs/Dagogo/Tamuno; Ogoni "Bari-" names; Efik, Ibibio, Annang,
   Yakurr and Bekwarra names; Bini "Osa-/Igbino-", Esan "Ehi-/Oko-" and Afemai names; Hausa town-names as surnames in
   Kano, Katsina, Sokoto, Zamfara, Kebbi and Jigawa).
   Every person in the game is invented: surnames of serving or famous politicians are left out (tests/names.test.mjs). */

const G = {
  // ── Yoruba ──
  egba: { m: ["Olumide", "Babatunde", "Gbolahan", "Adekunle", "Oluseun", "Dapo", "Kolawole", "Olaniyi", "Akinwale", "Adebola"], f: ["Bolanle", "Morenike", "Olubunmi", "Abosede", "Titilayo", "Omotola", "Adenike", "Folasade"],
    ln: ["Sowunmi", "Sodeke", "Sonubi", "Soetan", "Shodipo", "Odunsi", "Ogunbanjo", "Okubanjo", "Somorin", "Shobowale", "Kuforiji", "Majekodunmi", "Sorinola", "Akinsanya"] },
  ijebu: { m: ["Olusola", "Adewunmi", "Jimoh", "Kasali", "Ademola", "Oluwole", "Bankole", "Lateef", "Adeniyi", "Odunayo"], f: ["Adebisi", "Omobolanle", "Adetoun", "Olayinka", "Sekinat", "Kafayat", "Oluwakemi", "Adeola"],
    ln: ["Onanuga", "Osinowo", "Odubanjo", "Ogunsanya", "Kuye", "Sotubo", "Onafowokan", "Osunsanmi", "Ojikutu", "Onabajo", "Shonubi", "Ososanya", "Kasumu", "Odutola"] },
  remo: { m: ["Olalekan", "Akintunde", "Oladipupo", "Adesina", "Olugbenga", "Tokunbo", "Wasiu", "Adeyinka"], f: ["Funmilola", "Oluwatoyin", "Adesola", "Moji", "Olabisi", "Rasheedat"],
    ln: ["Sonuga", "Onasanya", "Odunlami", "Adesanya", "Ogunnaike", "Shonibare", "Talabi", "Onabanjo", "Odumosu", "Sorungbe", "Ogunsola"] },
  yewa: { m: ["Adegboyega", "Olatunji", "Ajibola", "Oladokun", "Akintayo", "Oyedele", "Adisa", "Olayiwola"], f: ["Adebimpe", "Olaide", "Oyenike", "Morayo", "Abike", "Olajumoke"],
    ln: ["Akintayo", "Oladokun", "Ogundiran", "Adegboyega", "Ojuolape", "Oyelaran", "Olaniyan", "Agboola", "Ilori", "Oyedeji", "Adeyanju"] },
  lagos: { m: ["Mutiu", "Rasheed", "Tajudeen", "Sikiru", "Ganiyu", "Mudashiru", "Morufu", "Olatunde", "Babajide", "Akinlolu"], f: ["Kudirat", "Rukayat", "Basirat", "Moriamo", "Adunni", "Abeke", "Olasunbo", "Mojisola"],
    ln: ["Eletu", "Oshodi", "Ojora", "Dosunmu", "Ajose", "Agoro", "Olowu", "Kasunmu", "Ogundimu", "Bammeke", "Akinsemoyin", "Ibikunle", "Fashina", "Ogunbiyi"] },
  oyo: { m: ["Ajani", "Akanbi", "Alamu", "Ayinla", "Adisa", "Akande", "Adigun", "Lekan", "Ayinde", "Akanni", "Oyewole", "Ladipo"], f: ["Asabi", "Ajoke", "Ayoka", "Alake", "Amope", "Abebi", "Ayinke", "Atinuke"],
    ln: ["Ajadi", "Akinyele", "Adeyemo", "Oyewole", "Olaniyan", "Oladipo", "Ayorinde", "Ogunmola", "Adegoke", "Okunola", "Alao", "Ajibade", "Oyelade", "Ladigbolu", "Ajala", "Oyedokun"] },
  osun: { m: ["Fatai", "Adesoji", "Olaitan", "Fasasi", "Ayodeji", "Oyewale", "Femi", "Olatunbosun", "Adebayo"], f: ["Morenike", "Abike", "Fadekemi", "Oyeyemi", "Iyabo", "Omowunmi", "Fehintola"],
    ln: ["Fadahunsi", "Fasanmi", "Fakorede", "Fadeyi", "Fagbemi", "Adeosun", "Fasuyi", "Fakunle", "Fabunmi", "Oyewale", "Olaniyi", "Lawani", "Ogunleye"] },
  ekiti: { m: ["Ayodele", "Olusola", "Bamidele", "Olorunfemi", "Ibitoye", "Owoeye", "Femi", "Babafemi", "Ayeni"], f: ["Omolade", "Fehintola", "Ibukun", "Omowumi", "Folashade", "Titilope", "Bosede"],
    ln: ["Ojo", "Ayeni", "Falegan", "Fasuba", "Babatola", "Omotoso", "Olowookere", "Akinwumi", "Afolabi", "Olorunfemi", "Ibitoye", "Adeleye", "Owoeye", "Ogundipe"] },
  ondo: { m: ["Akintomide", "Olumide", "Olabode", "Ibidapo", "Bolaji", "Kayode", "Femi", "Olusegun"], f: ["Omolola", "Bolatito", "Mosunmola", "Ronke", "Toyin", "Yejide"],
    ln: ["Omotehinse", "Akintomide", "Ikuesan", "Fagbemi", "Olowolafe", "Odunowo", "Ajimisinmi", "Adebiyi", "Olabode", "Ibidapo", "Adegbite", "Ogungbemi"] },
  ilaje: { m: ["Olabode", "Ebiseni", "Omowole", "Akinbola", "Oluwasegun"], f: ["Olabisi", "Omolara", "Oluwakemi", "Yetunde"],
    ln: ["Mafimisebi", "Ebiseni", "Aiyesimoju", "Ojaomo", "Ikuesan", "Omotehinse", "Ogungbemi", "Akinbola"] },
  ilorin: { m: ["Saadu", "Jimoh", "Mashood", "Alimi", "Yahaya", "Abdulkadir", "Ishola", "Ganiyu", "Sulu"], f: ["Rukayat", "Sefiat", "Aminat", "Bilikis", "Kafilat", "Halimat", "Mulikat"],
    ln: ["Alanamu", "Gobir", "Agbaji", "Saliu", "Olododo", "Kuranga", "Alaya", "Zubair", "Abdulkadir", "Afolabi", "Oniyangi"] },
  igbomina: { m: ["Ayanshola", "Olawoyin", "Ajibola", "Fasasi", "Oyinlola", "Ayodele", "Olatunji"], f: ["Ayanbisi", "Olawunmi", "Ajoke", "Mojirola", "Oyeronke"],
    ln: ["Olawoyin", "Ajibola", "Fasasi", "Ayanshola", "Oyinloye", "Aremu", "Olatunji", "Popoola", "Babaita"] },
  okun: { m: ["Olorunleke", "Moses", "Bamidele", "Dare", "Olumorin", "Babatunde", "Olusola"], f: ["Funmilayo", "Moyosore", "Bose", "Olufunke", "Oluwaseyi"],
    ln: ["Olumorin", "Olorunleke", "Akanmode", "Ogundele", "Ajayi", "Bamidele", "Fagbemi", "Bolaji", "Dare", "Ojo"] },

  // ── Igbo ──
  anambra: { m: ["Chukwuemeka", "Ikechukwu", "Nnamdi", "Obiora", "Chinedu", "Ebuka", "Somtochukwu", "Kosisochukwu", "Chukwudubem", "Ifeanyi"], f: ["Chiamaka", "Nkiruka", "Ozioma", "Adaobi", "Ifeoma", "Uju", "Ngozi", "Chinwe", "Obiageli"],
    ln: ["Okoye", "Okeke", "Okonkwo", "Ezeani", "Obiora", "Nwankwo", "Ezeokoli", "Udeh", "Uzoka", "Ezenwa", "Mbanefo", "Nwokolo", "Chukwuma", "Anyaegbunam", "Ezeudu"] },
  imo: { m: ["Uchenna", "Kelechi", "Chukwudi", "Ugochukwu", "Obinna", "Ihechukwu", "Nnaemeka", "Chinonso"], f: ["Ugochi", "Chioma", "Adanna", "Nneka", "Chidinma", "Ogechi", "Nkechinyere"],
    ln: ["Opara", "Iwuchukwu", "Anyanwu", "Nwachukwu", "Duru", "Emenike", "Onyeagoro", "Uzoma", "Njoku", "Ihejirika", "Onyeneke", "Iwu", "Nwoga", "Amadi-Obi", "Ekeh"] },
  abia: { m: ["Nnanna", "Kalu", "Chukwudi", "Uche", "Okezie", "Ogbonnaya", "Onyekachi", "Ikenna"], f: ["Ijeoma", "Chidinma", "Ugonma", "Nkechi", "Ezinne", "Akunna"],
    ln: ["Kalu", "Uduma", "Ukaegbu", "Ogbonnaya", "Agwu", "Nwogu", "Ubani", "Onyekwere", "Nwaigwe", "Onuoha", "Ogbonna", "Igwe", "Ama", "Okoro"] },
  nsukka: { m: ["Chibueze", "Onyebuchi", "Ikechukwu", "Ugochukwu", "Obinna", "Ejike", "Chijioke", "Okwudili"], f: ["Ogochukwu", "Chinwe", "Ifeyinwa", "Nkechi", "Ebere", "Onyinye"],
    ln: ["Ugwu", "Asogwa", "Eze", "Ezeugwu", "Omeje", "Ugwuoke", "Odo", "Onyishi", "Ukwueze", "Agbo", "Abonyi", "Ozioko", "Odo-Ugwu"] },
  enugu: { m: ["Chibueze", "Ikenna", "Chukwuka", "Nnaemeka", "Okechukwu", "Emeka"], f: ["Chinwe", "Nkechi", "Ifeoma", "Uloma", "Adaugo"],
    ln: ["Nnaji", "Ani", "Ogbu", "Chukwu", "Nwankwo", "Okeke", "Agu", "Eze-Odo", "Udeogu", "Okolo"] },
  ebonyi: { m: ["Nwite", "Ogbonnaya", "Chukwuma", "Nnachi", "Onyekachi", "Elom", "Odii", "Nwali"], f: ["Ngozi", "Nnenna", "Uzoamaka", "Ogechi", "Nkechi", "Oluchi"],
    ln: ["Nwali", "Nweke", "Igwe", "Nworie", "Nwuzor", "Odii", "Elom", "Nwaze", "Okorie", "Nnachi", "Oko", "Aleke", "Nwite", "Ibe"] },
  anioma: { m: ["Chiedu", "Nwabueze", "Nkem", "Emeka", "Azuka", "Ifeanyi", "Chukwuka", "Nnamdi"], f: ["Nkechi", "Ifeoma", "Uloma", "Nwakaego", "Ebele", "Adaeze"],
    ln: ["Nwajei", "Mordi", "Nwanze", "Ojei", "Chiedu", "Egwuenu", "Okolie", "Ofili", "Isichei", "Ogbechie", "Nwaobi", "Obiakor", "Ewere", "Ijeh"] },
  ikwerre: { m: ["Chinedu", "Nnamdi", "Ibeawuchi", "Chidi", "Eze", "Nyeche", "Worlu", "Chukwuemeka"], f: ["Ngozi", "Chioma", "Ihuoma", "Ogechi", "Nkechi", "Chinyere"],
    ln: ["Amadi", "Wobo", "Worlu", "Chinda", "Ihunwo", "Wodu", "Wokocha", "Nwuke", "Wosu", "Eke", "Wodi", "Nwoke", "Orlu"] },

  // ── Hausa, Fulani, Kanuri ──
  kano: { m: ["Ado", "Dahiru", "Auwalu", "Kabiru", "Habibu", "Muhammadu", "Nura", "Jamilu", "Ashiru", "Isyaku", "Sule", "Bashir"], f: ["Hadiza", "Rabi", "Hauwa", "Asma'u", "Jamila", "Ummi", "Maryam", "Zainab", "Sadiya", "Rahama"],
    ln: ["Gwarzo", "Bichi", "Dambatta", "Tofa", "Rano", "Garko", "Inuwa", "Dahiru", "Isyaku", "Kabiru", "Gaya", "Kura", "Minjibir", "Dala"] },
  katsina: { m: ["Abdullahi", "Lawal", "Mamman", "Yahaya", "Sada", "Danjuma", "Tukur", "Kabir", "Mannir", "Nasiru"], f: ["Amina", "Lami", "Saratu", "Hajara", "Indo", "Zulai", "Bilkisu"],
    ln: ["Mashi", "Kankia", "Zango", "Faskari", "Malumfashi", "Dutsinma", "Jibia", "Ingawa", "Funtua", "Kankara", "Bakori", "Danmusa"] },
  sokoto: { m: ["Shehu", "Attahiru", "Muhammadu", "Aliyu", "Abubakar", "Sa'idu", "Garba", "Bello", "Umaru"], f: ["Nana", "Asma'u", "Hafsat", "Mariya", "Hauwa'u", "Maimuna", "Khadija"],
    ln: ["Wurno", "Dange", "Bodinga", "Gwadabawa", "Tureta", "Kebbe", "Shuni", "Gidado", "Attahiru", "Sifawa", "Isa", "Yabo"] },
  zamfara: { m: ["Mu'azu", "Lawali", "Sani", "Bello", "Hassan", "Abdulaziz", "Mansur"], f: ["Bilkisu", "Hauwa", "Lubabatu", "Rakiya", "Mairo"],
    ln: ["Gusau", "Anka", "Maru", "Tsafe", "Bungudu", "Mafara", "Bakura", "Mada", "Kaura", "Gummi"] },
  kebbi: { m: ["Muhammadu", "Abubakar", "Sule", "Haliru", "Umar", "Kabiru", "Bala"], f: ["Hauwa", "Fatima", "Aisha", "Asabe", "Hadiza"],
    ln: ["Argungu", "Jega", "Yauri", "Augie", "Aleiro", "Bunza", "Koko", "Kalgo", "Danko", "Suru", "Ngaski"] },
  jigawa: { m: ["Usman", "Ahmed", "Sabo", "Garba", "Bala", "Hamisu", "Ismaila"], f: ["Hadiza", "Rakiya", "Sa'adatu", "Halima", "Ladidi"],
    ln: ["Hadejia", "Gumel", "Kazaure", "Ringim", "Dutse", "Babura", "Gwaram", "Kafin-Hausa", "Auyo", "Miga"] },
  zazzau: { m: ["Shehu", "Ahmed", "Aminu", "Bashir", "Yusuf", "Musa", "Idris"], f: ["Hauwa", "Fatima", "Halima", "Aisha", "Zainab"],
    ln: ["Ikara", "Giwa", "Soba", "Kubau", "Kudan", "Zaria", "Igabi", "Lere", "Bello", "Sani"] },
  bauchi: { m: ["Babayo", "Adamu", "Yakubu", "Bala", "Isa", "Gambo", "Ahmed", "Ibrahim"], f: ["Hajara", "Hauwa", "Jummai", "Talatu", "Hadiza"],
    ln: ["Misau", "Katagum", "Gidado", "Darazo", "Ningi", "Giade", "Jama'are", "Toro", "Azare", "Dass", "Gamawa"] },
  gombe: { m: ["Babayo", "Yakubu", "Abubakar", "Danladi", "Jibrin", "Saidu"], f: ["Jummai", "Hauwa", "Ladi", "Amina", "Talatu"],
    ln: ["Dukku", "Kwami", "Nafada", "Bajoga", "Funakaye", "Akko", "Pindiga", "Deba", "Kumo"] },
  fulani: { m: ["Hamman", "Bobboi", "Jalo", "Adamu", "Modibbo", "Ardo", "Yerima", "Bello", "Mahmud"], f: ["Aisatu", "Adda", "Asta", "Inna", "Jummai", "Dije", "Hawwa"],
    ln: ["Hamman", "Jalo", "Bobboi", "Modibbo", "Ardo", "Yerima", "Adamu", "Girei", "Mayo-Belwa", "Song"] },
  kanuri: { m: ["Babagana", "Modu", "Goni", "Bukar", "Kolo", "Mustapha", "Zanna", "Lawan", "Kachalla"], f: ["Falmata", "Yagana", "Fanna", "Bintu", "Kaltume", "Zara", "Amina"],
    ln: ["Kyari", "Monguno", "Modu", "Goni", "Bukar", "Lawan", "Kachalla", "Maina", "Grema", "Mustapha", "Zanna", "Bulama", "Alkali", "Abba", "Kolo"] },
  bura: { m: ["Ayuba", "Yohanna", "Musa", "Dauda", "Ibrahim", "Joel"], f: ["Hauwa", "Rhoda", "Mary", "Kwanta"],
    ln: ["Mshelia", "Bwala", "Dibal", "Pindar", "Mamza", "Kwaga", "Ndahi", "Thlama"] },

  // ── Middle Belt ──
  tiv: { m: ["Terhemen", "Aondowase", "Iorwuese", "Msughter", "Tersoo", "Aondona", "Sesugh", "Terver"], f: ["Doosuur", "Mngusoor", "Nguavese", "Mwuese", "Hembadoon", "Doofan"],
    ln: ["Iorpuu", "Ahule", "Iorliam", "Tyokase", "Akaa", "Ayua", "Ugbah", "Orshi", "Ikyaa", "Agber", "Tyonongo", "Iorhemba"] },
  idoma: { m: ["Ochigbo", "Adakole", "Ogbole", "Onche", "Ochai", "Ochoche", "Ogwuche", "Oche", "Odeh"], f: ["Ene", "Agbenu", "Ugbede", "Onyeche", "Ojoma"],
    ln: ["Ogbu", "Odeh", "Agbo", "Ochai", "Okpe", "Ochoche", "Ogwuche", "Adakole", "Onche", "Egbe", "Owoicho", "Ojobo", "Edoh"] },
  igala: { m: ["Ojonugwa", "Ojochide", "Abu", "Idakwo", "Ocholi", "Ekele", "Atabo", "Ojodale"], f: ["Ojochenemi", "Ojonoka", "Ene", "Ufedo", "Onyeche", "Ojone"],
    ln: ["Onoja", "Ocholi", "Idakwo", "Itodo", "Ameh", "Achimugu", "Abah", "Atabo", "Egbunu", "Agada", "Odoh", "Ojonugwa"] },
  ebira: { m: ["Ozovehe", "Onimisi", "Abdulmalik", "Ohiare", "Itopa", "Suberu", "Ozigi"], f: ["Oyiza", "Ozavize", "Ometere", "Ozohu", "Asizi"],
    ln: ["Ohiare", "Ozigi", "Onimisi", "Ozovehe", "Itopa", "Omuya", "Suberu", "Aliyu", "Anaje", "Ohida", "Adeiza"] },
  berom: { m: ["Pam", "Dung", "Chuwang", "Gyang", "Badung", "Davou", "Choji", "Dachung"], f: ["Kaneng", "Lyop", "Chundung", "Nvou", "Kangyang", "Rifkatu"],
    ln: ["Gyang", "Pam", "Dalyop", "Chuwang", "Davou", "Dung", "Rwang", "Bot", "Jang", "Badung", "Mwadkwon", "Choji"] },
  plateauC: { m: ["Nanven", "Nankling", "Longji", "Dashe", "Dakas", "Nanle", "Gotom", "Mangut"], f: ["Naanman", "Nanmwa", "Kangkum", "Larai", "Ladi"],
    ln: ["Longji", "Dashe", "Dakas", "Gotom", "Mangut", "Nden", "Dakum", "Nanven", "Longkat", "Dajang", "Goyit"] },
  skaduna: { m: ["Bitrus", "Yohanna", "Ishaku", "Zakka", "Kure", "Maigari", "Luka", "Danjuma", "Yakubu"], f: ["Ladi", "Asabe", "Laraba", "Kande", "Rifkatu", "Saratu", "Tabitha"],
    ln: ["Bobai", "Kure", "Kazah", "Tagwai", "Zamani", "Yashim", "Kantiok", "Ninyio", "Akut", "Bako", "Gimba", "Kwasau"] },
  nupe: { m: ["Umaru", "Ndako", "Tsado", "Kolo", "Liman", "Ndagi", "Nma", "Shaba"], f: ["Hauwa", "Fatima", "Nnadzwa", "Hadiza", "Amina"],
    ln: ["Ndako", "Tsado", "Kolo", "Kuta", "Jiya", "Gana", "Mamudu", "Ndagi", "Shaba", "Gbate", "Lafiagi"] },
  gbagyi: { m: ["Danladi", "Shekwolo", "Gado", "Yakubu", "Musa", "Ishaku"], f: ["Laraba", "Ladi", "Kande", "Asabe"],
    ln: ["Kwaga", "Gado", "Shekwolo", "Gwamna", "Dogo", "Jatau", "Yakubu"] },
  nasarawa: { m: ["Abdullahi", "Tanko", "Ishaya", "Yakubu", "Danladi", "Ari"], f: ["Hannatu", "Laraba", "Aisha", "Asabe"],
    ln: ["Ari", "Tanko", "Kigbu", "Akolo", "Mairiga", "Agbo", "Ogiri", "Audu", "Bako", "Ombugu", "Alanana"] },
  taraba: { m: ["Danladi", "Agbu", "Ishaya", "Tanko", "Ashu", "Jauro", "Gambo"], f: ["Hannatu", "Laraba", "Martha", "Ladi"],
    ln: ["Agbu", "Adi", "Akwe", "Danbaba", "Kente", "Ashu", "Bature", "Kolo", "Zhiya", "Gangum", "Jauro"] },
  bariba: { m: ["Sabi", "Woru", "Sero", "Gani", "Kora", "Yerima"], f: ["Bake", "Gnon", "Tani", "Hauwa"],
    ln: ["Sabi", "Woru", "Sero", "Gnon", "Gani", "Kora", "Yerima"] },

  // ── South-South ──
  ibibio: { m: ["Edidiong", "Mfon", "Aniefiok", "Nsikan", "Idongesit", "Ubong", "Iniobong", "Utibe", "Akaninyene"], f: ["Itoro", "Eno", "Emem", "Imaobong", "Ekaette", "Uduak", "Arit"],
    ln: ["Akpan", "Etim", "Inyang", "Udoh", "Essien", "Umoh", "Udofia", "Ekanem", "Etuk", "Usoro", "Ukpong", "Udo-Inyang", "Ekpenyong"] },
  oro: { m: ["Asuquo", "Okon", "Edem", "Ekong", "Effiong"], f: ["Affiong", "Ekaette", "Mma", "Eme"],
    ln: ["Asuquo", "Ekong", "Edem", "Otu", "Effiong", "Okon", "Ita", "Eyo"] },
  efik: { m: ["Bassey", "Effiong", "Okon", "Asuquo", "Ekpenyong", "Etim", "Ita"], f: ["Affiong", "Arit", "Iquo", "Mma", "Eme", "Nkoyo", "Ekaete"],
    ln: ["Bassey", "Henshaw", "Archibong", "Inyang", "Effiong", "Ekpo", "Asuquo", "Eyo", "Cobham", "Ekpenyong", "Ita", "Etim"] },
  yakurr: { m: ["Ubi", "Obeten", "Ofem", "Ikpi", "Eteng", "Agbor"], f: ["Ina", "Lekam", "Ubana", "Obla"],
    ln: ["Ubi", "Obeten", "Eteng", "Ofem", "Ikpi", "Agbor", "Ayuk", "Ojong", "Enun"] },
  ogoja: { m: ["Ogar", "Ushie", "Odey", "Ewa", "Agba", "Akwaji"], f: ["Comfort", "Patience", "Ugbe", "Grace"],
    ln: ["Ushie", "Ogbeche", "Odey", "Adie", "Ogar", "Agba", "Akwaji", "Ewa", "Ogban", "Igri"] },
  ijaw: { m: ["Diepreye", "Doubra", "Ebipade", "Timi", "Pere", "Tonbra", "Ebimobowei", "Ayibatonye", "Seiyefa"], f: ["Ebiere", "Tari", "Preye", "Ebiakpo", "Ebiye", "Owei"],
    ln: ["Fawei", "Ayakeme", "Opuene", "Ogoniba", "Ekiyor", "Igbiri", "Bodiseowei", "Tuoyo", "Pereotubo", "Ebiowei", "Alagoa", "Seiyefa"] },
  kalabari: { m: ["Tonye", "Boma", "Soala", "Data", "Tamunotonye", "Dagogo", "Opuiyo", "Ibiapuye"], f: ["Ibinabo", "Ibiba", "Ibim", "Tamunoibi", "Sotonye"],
    ln: ["Briggs", "Dagogo", "Tamuno", "Amakiri", "George", "Horsfall", "Jack", "Manuel", "Douglas", "Hart", "Kio", "Brown", "West"] },
  ogoni: { m: ["Barine", "Baridam", "Barisi", "Ledum", "Dumbari", "Nubari", "Kabari", "Lekia"], f: ["Barida", "Kpobari", "Dumle", "Neeka", "Ledisi"],
    ln: ["Kpea", "Nwiido", "Nwika", "Deebom", "Kpone", "Gbarato", "Deekor", "Nwibani", "Zorbari"] },
  urhobo: { m: ["Ovie", "Oghenekaro", "Avwerosuo", "Efe", "Onoriode", "Oghenero", "Akpo", "Tega"], f: ["Ese", "Ejiro", "Onome", "Rukevwe", "Mamuyovwi", "Efemena", "Oghenekevwe", "Oghenefejiro"],
    ln: ["Okumagba", "Okpako", "Ejoh", "Edewor", "Akpobome", "Onojakpor", "Emuobo", "Erhire", "Orhorho", "Omonigho", "Akpomedaye", "Ukueku"] },
  itsekiri: { m: ["Toritseju", "Omatsola", "Gbubemi", "Oritseweyinmi", "Ayirimi", "Tsola"], f: ["Temisan", "Oritsetimeyin", "Toritsemogha", "Uwamiye"],
    ln: ["Omatseye", "Ayomike", "Eyesan", "Ojogor", "Arenyeka", "Edema", "Omagbemi", "Ikomi", "Mene"] },
  bini: { m: ["Osahon", "Osaze", "Efosa", "Uyi", "Osagie", "Nosa", "Eghosa", "Edosa"], f: ["Esosa", "Iyobosa", "Imuetinyan", "Ivie", "Isoken", "Osasere", "Omoze"],
    ln: ["Omoruyi", "Aigbogun", "Iyamu", "Osagie", "Igbinosa", "Osayande", "Ekhator", "Imasuen", "Ogiemwonyi", "Aghahowa", "Obasuyi", "Ogbebor"] },
  esan: { m: ["Ehis", "Ehimen", "Eromosele", "Itua", "Akhere", "Okosun"], f: ["Ofure", "Itohan", "Ehiremen", "Esohe"],
    ln: ["Okojie", "Okoduwa", "Ojeifo", "Ebhohimen", "Akhimien", "Okosun", "Ehikhamenor", "Oseghale", "Ehimare", "Aigbokhaevbo"] },
  afemai: { m: ["Momoh", "Aliu", "Ikhide", "Yesufu", "Ozigbo", "Abu"], f: ["Hadiza", "Rakiya", "Ebun", "Fatima"],
    ln: ["Momoh", "Aliu", "Ikhide", "Abu", "Yesufu", "Oyarekhua", "Okhaifoh", "Ehiagwina", "Imonikhe"] },
};
export const NAME_GROUPS = G;

// Every woman's given name in the groups (so a portrait of a woman gets a woman's name).
export const FEMALE_GIVEN = [...new Set(Object.values(G).flatMap(g => g.f))];

/* Each state: its peoples, and the local governments of a mixed state. by: { group: [LGAs] }; the rest of the state is
   `main`. */
const S = {
  Lagos: { main: "lagos", by: { ijebu: ["Epe", "Ibeju-Lekki", "Ikorodu"] } },
  Ogun: { main: "egba", by: { ijebu: ["Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Odogbolu", "Ogun Waterside"], remo: ["Sagamu", "Ikenne", "Remo North"], yewa: ["Yewa North", "Yewa South", "Ipokia", "Imeko Afon"], lagos: ["Ado-Odo/Ota"] } },
  Oyo: { main: "oyo" }, Osun: { main: "osun" }, Ekiti: { main: "ekiti" },
  Ondo: { main: "ondo", by: { ilaje: ["Ilaje", "Ese Odo"] } },
  Kwara: { main: "ilorin", by: { igbomina: ["Ifelodun", "Irepodun", "Isin", "Oke Ero", "Ekiti", "Oyun", "Offa"], nupe: ["Edu", "Pategi"], bariba: ["Baruten", "Kaiama"] } },
  Kogi: { main: "igala", by: { ebira: ["Okene", "Adavi", "Okehi", "Ajaokuta", "Ogori/Magongo"], okun: ["Ijumu", "Kabba/Bunu", "Yagba East", "Yagba West", "Mopa-Muro", "Lokoja"], nupe: ["Bassa"] } },
  Anambra: { main: "anambra" }, Imo: { main: "imo" }, Abia: { main: "abia" }, Ebonyi: { main: "ebonyi" },
  Enugu: { main: "enugu", by: { nsukka: ["Nsukka", "Igbo-Eze North", "Igbo-Eze South", "Igbo-Etiti", "Udenu", "Uzo-Uwani", "Isi-Uzo"] } },
  Kano: { main: "kano" }, Katsina: { main: "katsina" }, Sokoto: { main: "sokoto" }, Zamfara: { main: "zamfara" }, Kebbi: { main: "kebbi" }, Jigawa: { main: "jigawa" },
  Kaduna: { main: "zazzau", by: { skaduna: ["Zangon Kataf", "Kaura", "Jema'a", "Jaba", "Kachia", "Sanga", "Kauru", "Kagarko"], gbagyi: ["Chikun", "Kajuru"] } },
  Bauchi: { main: "bauchi" }, Gombe: { main: "gombe" },
  Borno: { main: "kanuri", by: { bura: ["Biu", "Hawul", "Kwaya Kusar", "Shani", "Bayo", "Askira/Uba"] } }, Yobe: { main: "kanuri" },
  Adamawa: { main: "fulani", by: { bura: ["Michika", "Madagali", "Hong", "Mubi South", "Song", "Gombi"], taraba: ["Numan", "Demsa", "Lamurde", "Guyuk", "Shelleng"] } },
  Taraba: { main: "taraba", by: { fulani: ["Sardauna", "Gashaka", "Lau", "Ardo Kola"], tiv: ["Donga"] } },
  Benue: { main: "tiv", by: { idoma: ["Ado", "Agatu", "Apa", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Otukpo"] } },
  Plateau: { main: "plateauC", by: { berom: ["Jos South", "Jos North", "Jos East", "Barkin Ladi", "Riyom", "Bassa"], fulani: ["Wase"] } },
  Nassarawa: { main: "nasarawa" },
  Niger: { main: "nupe", by: { gbagyi: ["Suleja", "Tafa", "Shiroro", "Paikoro", "Bosso", "Gurara", "Chanchaga"], kano: ["Kontagora", "Rijau", "Mariga", "Magama", "Mashegu", "Wushishi"] } },
  FCT: { main: "gbagyi", mix: ["gbagyi", "kano", "oyo", "anambra", "tiv", "ibibio"] },
  Akwa_Ibom: { main: "ibibio", by: { oro: ["Oron", "Mbo", "Udung Uko", "Urue-Offong/Oruko", "Okobo"] } },
  Cross_River: { main: "efik", by: { yakurr: ["Yakurr", "Abi", "Obubra", "Ikom", "Etung", "Boki", "Biase"], ogoja: ["Ogoja", "Bekwarra", "Obudu", "Obanliku", "Yala"] } },
  Bayelsa: { main: "ijaw" },
  Rivers: { main: "ikwerre", by: { ogoni: ["Khana", "Gokana", "Tai", "Eleme"], kalabari: ["Asari-Toru", "Akuku-Toru", "Degema", "Okrika", "Bonny", "Opobo/Nkoro", "Andoni", "Ogu/Bolo"] } },
  Delta: { main: "urhobo", by: { itsekiri: ["Warri North", "Warri South", "Warri South West"], ijaw: ["Bomadi", "Burutu", "Patani"], anioma: ["Aniocha North", "Aniocha South", "Oshimili North", "Oshimili South", "Ika North East", "Ika South", "Ndokwa East", "Ndokwa West", "Ukwuani"] } },
  Edo: { main: "bini", by: { esan: ["Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Igueben"], afemai: ["Etsako Central", "Etsako East", "Etsako West", "Owan East", "Owan West", "Akoko-Edo"] } },
};
export const STATE_NAMES = S;

const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z]/g, "");
// The people of a place: the local government's own if the state maps it, else the state's main people.
export const groupOf = (state, lga) => {
  const D = S[state]; if (!D) return null;
  if (lga) { const k = norm(lga); for (const [g, L] of Object.entries(D.by || {})) if (L.some(x => norm(x) === k)) return g; }
  return D.main;
};

/* A name from the place. r: a random function. lgas: the state's local governments (to weigh a mixed state's peoples
   by how many local governments each holds, when no local government is given). Returns "Given Family" or null. */
export const nameFor = (r, state, lga, lgas, female) => {
  const D = S[state]; if (!D) return null;
  let g = lga ? groupOf(state, lga) : null;
  if (!g) {
    if (D.mix) g = D.mix[Math.floor(r() * D.mix.length)];
    else if (D.by && lgas && lgas.length) g = groupOf(state, lgas[Math.floor(r() * lgas.length)]);
    else g = D.main;
  }
  const P = G[g] || G[D.main]; if (!P) return null;
  const sex = female == null ? (r() < .4 ? "f" : "m") : (female ? "f" : "m");
  const pick = (a) => a[Math.floor(r() * a.length)];
  let ln = pick(P.ln), fn = pick(P[sex]);
  if (fn === ln) ln = pick(P.ln);
  return fn + " " + ln;
};
