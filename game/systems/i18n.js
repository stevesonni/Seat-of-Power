/* Languages: Pidgin, Yoruba, Hausa and Igbo, with English as the fallback.
   One table, keyed by the English text. T(en, lang) gives the translation or
   the English. The game also swaps exact matches on screen (buttons, tabs, the
   four numbers), so anything not in the table simply stays in English.
   Translations were written by hand; players are asked to report wrong
   wording through "Tell us what to improve". */
export const LANG_KEY = "sop_lang";
export const LANGS = [
  { id: "en", nm: "English" },
  { id: "pcm", nm: "Pidgin" },
  { id: "yo", nm: "Yorùbá" },
  { id: "ha", nm: "Hausa" },
  { id: "ig", nm: "Igbo" },
];
export const LANG_IDS = LANGS.map(l => l.id);
//                      Pidgin, Yoruba, Hausa, Igbo
const R = (pcm, yo, ha, ig) => ({ pcm, yo, ha, ig });
export const STRINGS = {
  // The tabs, their hints and the four numbers
  "Desk": R("Desk", "Tábìlì", "Teburi", "Tebụl"),
  "State": R("State", "Ìpínlẹ̀", "Jiha", "Steeti"),
  "People": R("Pipul", "Àwọn ènìyàn", "Jama'a", "Ndị mmadụ"),
  "Nation": R("Naija", "Orílẹ̀-èdè", "Ƙasa", "Mba"),
  "Letters and decisions": R("Leta and decision dem", "Lẹ́tà àti ìpinnu", "Wasiƙu da shawarwari", "Akwụkwọ ozi na mkpebi"),
  "Money and projects": R("Moni and projek dem", "Owó àti iṣẹ́ àkànṣe", "Kuɗi da ayyuka", "Ego na ọrụ"),
  "Cabinet and the public": R("Cabinet and di pipul", "Ìgbìmọ̀ àti àwọn ará ìlú", "Majalisar zartarwa da jama'a", "Ndị kansụl na ọha"),
  "Approval": R("Approval", "Ìtẹ́wọ́gbà", "Karɓuwa", "Nkwado"),
  "In the bank": R("Inside bank", "Ní báńkì", "A banki", "N'ụlọ akụ"),
  "Party": R("Party", "Ẹgbẹ́", "Jam'iyya", "Otu"),
  "Corruption": R("Corruption", "Ìwà ìbàjẹ́", "Cin hanci", "Nrụrụ aka"),
  // Buttons
  "Continue": R("Continue", "Tẹ̀síwájú", "Ci gaba", "Gaa n'ihu"),
  "Okay": R("Ok", "Ó dáa", "To", "Ọ dị mma"),
  "Got it": R("I don hear", "Mo ti gbọ́", "Na gane", "Aghọtala m"),
  "Not now": R("No be now", "Kì í ṣe báyìí", "Ba yanzu ba", "Ọ bụghị ugbu a"),
  "Hint": R("Wetin I go do?", "Ìtọ́sọ́nà", "Shawara", "Ndụmọdụ"),
  "Skip": R("Skip am", "Fò ó", "Tsallake", "Wụfee"),
  "Next →": R("Next →", "Èyí tó kàn →", "Na gaba →", "Ọzọ →"),
  "Begin your campaign": R("Start your campaign", "Bẹ̀rẹ̀ ìpolongo rẹ", "Fara yaƙin neman zaɓenka", "Malite mkpọsa gị"),
  "Share on WhatsApp": R("Share am for WhatsApp", "Pín in lórí WhatsApp", "Raba a WhatsApp", "Kesaa na WhatsApp"),
  "Language": R("Language", "Èdè", "Harshe", "Asụsụ"),
  "Wrong wording? Tell us in ☰ → Tell us what to improve.": R("You see wrong word? Tell us for ☰ → Tell us what to improve.", "Ṣé o rí ọ̀rọ̀ tí kò tọ́? Sọ fún wa ní ☰ → Tell us what to improve.", "Ka ga kalma mara kyau? Faɗa mana a ☰ → Tell us what to improve.", "Ị hụrụ okwu na-ezighi ezi? Gwa anyị na ☰ → Tell us what to improve."),
  // The cold open
  "Day 1": R("Day 1", "Ọjọ́ 1", "Rana ta 1", "Ụbọchị 1"),
  "Your phone buzzes": R("Your phone dey vibrate", "Fóònù rẹ ń dún", "Wayarka na ƙara", "Ekwentị gị na-ada ụda"),
  "Credit alert: ₦18.4B FAAC allocation received.": R("Alert don land: ₦18.4B FAAC money don enter.", "Ìkéde owó: ₦18.4B owó FAAC ti wọlé.", "Sanarwar kuɗi: ₦18.4B na kason FAAC ya shigo.", "Ozi ego: ₦18.4B ego FAAC abatala."),
  "The state's monthly share of federal money has landed. Teachers are owed two months, a contractor wants paying for the Ward 7 road, and the Commissioner for Finance is at your door.": R(
    "Di state share of federal moni for dis month don land. Dem owe teachers two months, contractor wan collect im moni for Ward 7 road, and Commissioner for Finance dey your door.",
    "Ìpín oṣù yìí ti ìpínlẹ̀ nínú owó ìjọba àpapọ̀ ti dé. A jẹ àwọn olùkọ́ ní owó oṣù méjì, agbaṣẹ́ṣe ọ̀nà Ward 7 ń béèrè owó rẹ̀, Kọmíṣọ́nà fún Ètò Ìṣúná sì wà lẹ́nu ọ̀nà rẹ.",
    "Kason jiha na wannan wata daga kuɗin gwamnatin tarayya ya iso. Ana bin malamai albashin wata biyu, ɗan kwangilar hanyar Ward 7 yana neman kuɗinsa, kuma Kwamishinan Kuɗi yana bakin ƙofarka.",
    "Oke steeti nke ego gọọmentị etiti n'ọnwa a abatala. A ji ndị nkụzi ụgwọ ọnwa abụọ, onye ọrụ okporo ụzọ Ward 7 chọrọ ka a kwụọ ya, Kọmishọna Ego nọkwa n'ọnụ ụzọ gị."),
  "Pay the teachers first": R("Pay di teachers first", "Kọ́kọ́ san owó àwọn olùkọ́", "Ka fara biyan malamai", "Buru ụzọ kwụọ ndị nkụzi"),
  "Teachers are paid by noon. The road contractor slows down until next month.": R("Teachers don collect before afternoon. Di road contractor slow down till next month.", "Àwọn olùkọ́ gba owó wọn kí ọ̀sán tó pọ́n. Agbaṣẹ́ṣe ọ̀nà dín iṣẹ́ kù títí oṣù tó ń bọ̀.", "An biya malamai kafin rana ta yi. Ɗan kwangilar hanya ya rage gudu har wata mai zuwa.", "A kwụọla ndị nkụzi tupu ehihie. Onye ọrụ okporo ụzọ ebelata ọrụ ruo ọnwa ọzọ."),
  "Next: the contractor waits a month. Workers you pay on time do not strike.": R("Wetin go happen: contractor go wait one month. Workers wey you pay on time no dey strike.", "Ohun tó kàn: agbaṣẹ́ṣe yóò dúró fún oṣù kan. Òṣìṣẹ́ tí o bá sanwó fún lásìkò kì í dasẹ̀ iṣẹ́ dúró.", "Abin da zai biyo: ɗan kwangila zai jira wata ɗaya. Ma'aikatan da ka biya a kan lokaci ba sa yajin aiki.", "Ihe na-esote: onye ọrụ ga-echere otu ọnwa. Ndị ọrụ ị kwụrụ n'oge anaghị akwụsị ọrụ."),
  "Pay the road contractor": R("Pay di road contractor", "San owó agbaṣẹ́ṣe ọ̀nà", "Biya ɗan kwangilar hanya", "Kwụọ onye ọrụ okporo ụzọ"),
  "The bulldozers roll again. Teachers' unions call a press conference.": R("Bulldozer dem don start work again. Teachers union call press conference.", "Àwọn ẹ̀rọ bulldozer tún bẹ̀rẹ̀ iṣẹ́. Ẹgbẹ́ olùkọ́ pe ìpàdé àwọn akọ̀ròyìn.", "Manyan injuna sun koma aiki. Ƙungiyar malamai ta kira taron manema labarai.", "Igwe bulldozer amalitela ọrụ ọzọ. Otu ndị nkụzi akpọọ ndị nta akụkọ."),
  "Next: the unions start counting the months. At three months owed, they threaten a strike.": R("Wetin go happen: union go start to count di months. When e reach three months, dem go threaten strike.", "Ohun tó kàn: ẹgbẹ́ òṣìṣẹ́ yóò bẹ̀rẹ̀ sí í ka oṣù. Tí ó bá pé oṣù mẹ́ta, wọn yóò halẹ̀ ìyanṣẹ́lódì.", "Abin da zai biyo: ƙungiyoyi za su fara ƙirga watanni. Idan ya kai wata uku, za su yi barazanar yajin aiki.", "Ihe na-esote: otu ndị ọrụ ga-amalite ịgụ ọnwa. Mgbe o ruru ọnwa atọ, ha ga-eyi egwu ịkwụsị ọrụ."),
  "Split it: half each": R("Share am: half half", "Pín in sí méjì: ìdajì fún ọ̀kọ̀ọ̀kan", "Raba shi: rabi-rabi", "Kewaa ya: ọkara ọkara"),
  "Nobody is happy, and nobody walks out.": R("Nobody happy, but nobody waka comot.", "Kò sí ẹni tí inú rẹ̀ dùn, kò sì sí ẹni tó jáde.", "Babu wanda ya ji daɗi, kuma babu wanda ya fita.", "Ọ dịghị onye obi dị ụtọ, ọ dịghịkwa onye pụrụ."),
  "Next: both sides come back next month for the rest.": R("Wetin go happen: both side go come back next month for di remain.", "Ohun tó kàn: àwọn méjèèjì yóò padà wá ní oṣù tó ń bọ̀ fún ìyókù.", "Abin da zai biyo: ɓangarorin biyu za su dawo wata mai zuwa don sauran.", "Ihe na-esote: ha abụọ ga-alọta n'ọnwa ọzọ maka nke fọdụrụ."),
  "Ward 7 has no water": R("Ward 7 no get water", "Kò sí omi ní Ward 7", "Babu ruwa a Ward 7", "Mmiri adịghị na Ward 7"),
  "The only borehole in Ward 7 broke down last week. Women walk two hours to the stream. The ward councillor is outside with a delegation.": R(
    "Di only borehole for Ward 7 spoil last week. Women dey trek two hours go stream. Di ward councillor dey outside with im people.",
    "Kànga ẹ̀rọ kan ṣoṣo tó wà ní Ward 7 bàjẹ́ ní ọ̀sẹ̀ tó kọjá. Àwọn obìnrin ń rìn wákàtí méjì lọ sí odò. Káńsílọ̀ ward náà wà níta pẹ̀lú àwọn aṣojú.",
    "Rijiyar burtsatse ɗaya tilo a Ward 7 ta lalace makon jiya. Mata suna tafiya awa biyu zuwa rafi. Kansilan mazaɓar yana waje tare da tawaga.",
    "Naanị olulu mmiri dị na Ward 7 mebiri izu gara aga. Ụmụ nwanyị na-eje ije awa abụọ gaa n'iyi. Kansụlọ ward ahụ nọ n'èzí ya na ndị nnọchiteanya."),
  "Repair it this week (₦40M)": R("Repair am dis week (₦40M)", "Tún un ṣe lọ́sẹ̀ yìí (₦40M)", "Gyara ta a wannan makon (₦40M)", "Rụzie ya n'izu a (₦40M)"),
  "The engineers fix the pump in four days. The councillor tells everyone it was his idea.": R("Engineers fix di pump for four days. Councillor dey tell everybody say na im idea.", "Àwọn onímọ̀ ẹ̀rọ tún ẹ̀rọ náà ṣe láàárín ọjọ́ mẹ́rin. Káńsílọ̀ ń sọ fún gbogbo ènìyàn pé èrò òun ni.", "Injiniyoyi sun gyara famfon cikin kwana huɗu. Kansila yana gaya wa kowa cewa shawararsa ce.", "Ndị injinia rụziri igwe mmiri n'ime ụbọchị anọ. Kansụlọ na-agwa onye ọ bụla na ọ bụ echiche ya."),
  "Next: small, quick jobs like this are how people learn you deliver.": R("Wetin go happen: small quick work like dis na how pipul go know say you dey deliver.", "Ohun tó kàn: irú iṣẹ́ kékeré, kíákíá báyìí ni àwọn ènìyàn fi ń mọ̀ pé o ń ṣe iṣẹ́.", "Abin da zai biyo: ƙananan ayyuka masu sauri kamar wannan ne ke sa jama'a su san kana aiki.", "Ihe na-esote: obere ọrụ ngwa ngwa dị otu a bụ ka ndị mmadụ si mara na ị na-arụ ọrụ."),
  "Drill two new boreholes (₦150M)": R("Dig two new borehole (₦150M)", "Gbẹ́ kànga ẹ̀rọ tuntun méjì (₦150M)", "Haƙa sabbin burtsatse biyu (₦150M)", "Gwuo olulu mmiri ọhụrụ abụọ (₦150M)"),
  "Two rigs arrive next month. Until then, water tankers.": R("Two drilling machine go land next month. Till then, na water tanker.", "Ẹ̀rọ ìgbẹ́lẹ̀ méjì yóò dé ní oṣù tó ń bọ̀. Títí di ìgbà náà, ọkọ̀ omi ni.", "Injunan haƙa biyu za su iso wata mai zuwa. Kafin nan, tankokin ruwa.", "Igwe igwu ala abụọ ga-abịa n'ọnwa ọzọ. Ruo mgbe ahụ, ụgbọ mmiri tanka."),
  "Next: the rigs take a month. Bigger jobs take longer, and people wait.": R("Wetin go happen: di machine go take one month. Big work dey take time, and pipul go wait.", "Ohun tó kàn: ẹ̀rọ yóò gba oṣù kan. Iṣẹ́ ńlá máa ń pẹ́, àwọn ènìyàn á sì dúró.", "Abin da zai biyo: injunan za su ɗauki wata ɗaya. Manyan ayyuka sun fi ɗaukar lokaci, kuma jama'a za su jira.", "Ihe na-esote: igwe ahụ ga-ewe otu ọnwa. Nnukwu ọrụ na-ewe ogologo oge, ndị mmadụ ga-echekwa."),
  "Put it in next year's budget": R("Put am for next year budget", "Fi sínú ìsúná ọdún tó ń bọ̀", "Saka shi a kasafin kuɗin baɗi", "Tinye ya na mmefu ego afọ ọzọ"),
  "The delegation leaves angry. A video of the stream goes round WhatsApp.": R("Di delegation vex comot. Video of di stream dey go round for WhatsApp.", "Àwọn aṣojú lọ pẹ̀lú ìbínú. Fídíò odò náà ń kálẹ̀ lórí WhatsApp.", "Tawagar ta tafi cikin fushi. Bidiyon rafin yana yawo a WhatsApp.", "Ndị nnọchiteanya ji iwe pụọ. Vidiyo iyi ahụ na-agbasa na WhatsApp."),
  "Next: what you put off comes back, usually louder.": R("Wetin go happen: wetin you shift go come back, and e go loud pass.", "Ohun tó kàn: ohun tí o sún síwájú máa ń padà wá, ó sì máa ń le jù.", "Abin da zai biyo: abin da ka ɗage zai dawo, yawanci da ƙarfi.", "Ihe na-esote: ihe ị chụpụrụ ga-alọta, na-abụkarị n'olu dị elu."),
  "Something does not add up": R("Something no correct", "Nǹkan kan kò bá a mu", "Wani abu bai yi daidai ba", "Ihe adịghị mma ebe a"),
  "An auditor slips you a note: 1,200 names on the state payroll have the same three bank accounts. Ghost workers. Someone in the civil service is collecting their pay.": R(
    "One auditor slip you note: 1,200 names for state payroll get di same three bank account. Ghost workers. Somebody for civil service dey collect dia salary.",
    "Olùṣàyẹ̀wò owó kan fún ọ ní ìwé kékeré: orúkọ 1,200 lórí ìwé owó oṣù ìpínlẹ̀ ní àkọọ́lẹ̀ báńkì mẹ́ta kan náà. Òṣìṣẹ́ iwin ni wọ́n. Ẹnìkan nínú iṣẹ́ ọba ló ń gba owó wọn.",
    "Wani mai binciken kuɗi ya miƙa maka takarda: sunaye 1,200 a jerin albashin jiha suna da asusun banki uku iri ɗaya. Ma'aikatan bogi ne. Wani a aikin gwamnati yana karɓar albashinsu.",
    "Onye nyocha ego nyere gị akwụkwọ: aha 1,200 na ndepụta ụgwọ ọnwa steeti nwere otu akaụntụ ụlọ akụ atọ. Ndị ọrụ mmụọ. Onye nọ n'ọrụ gọọmentị na-anara ụgwọ ha."),
  "Order a payroll audit": R("Order make dem check payroll", "Pàṣẹ àyẹ̀wò ìwé owó oṣù", "Ba da umarnin binciken albashi", "Nye iwu ka e nyochaa ndepụta ụgwọ ọnwa"),
  "The ghosts are struck off. ₦600M a year stops leaking.": R("Dem don comot di ghost names. ₦600M every year no go leak again.", "A ti yọ àwọn iwin kúrò. ₦600M lọ́dọọdún kò ní jò mọ́.", "An goge sunayen bogi. ₦600M a shekara ya daina zubewa.", "E hichapụla aha mmụọ ahụ. ₦600M kwa afọ akwụsịla ịgbapụ."),
  "Next: money that stops leaking is money you can spend. Leaks come back if nobody watches.": R("Wetin go happen: moni wey no leak na moni wey you fit spend. Leak go come back if nobody dey watch.", "Ohun tó kàn: owó tí kò jò mọ́ ni owó tí o lè ná. Ìjò máa ń padà tí kò bá sí ẹni tó ń ṣọ́.", "Abin da zai biyo: kuɗin da ya daina zubewa kuɗi ne da za ka iya kashewa. Zubewa na dawowa idan babu mai sa ido.", "Ihe na-esote: ego kwụsịrị ịgbapụ bụ ego ị nwere ike imefu. Ọgbapụ na-alọta ma ọ bụrụ na ọ dịghị onye na-elele."),
  "Deal with it quietly": R("Settle am quietly", "Yanjú u ní ìkọ̀kọ̀", "Shawo kansa a ɓoye", "Dozie ya na nzuzo"),
  "The names go. So do two senior officials, quietly, to other posts.": R("Di names comot. Two big oga for office sef comot, quietly, go another post.", "Àwọn orúkọ náà lọ. Àwọn olórí òṣìṣẹ́ méjì náà lọ, ní ìkọ̀kọ̀, sí ipò mìíràn.", "Sunayen sun tafi. Haka ma manyan jami'ai biyu, a ɓoye, zuwa wasu mukamai.", "Aha ndị ahụ apụọ. Ndị isi ọrụ abụọ pụkwara, na nzuzo, gaa ọkwa ndị ọzọ."),
  "Next: quiet fixes save face, and the people who did it stay in government.": R("Wetin go happen: quiet settlement dey save face, but di people wey do am still dey government.", "Ohun tó kàn: àtúnṣe ìkọ̀kọ̀ máa ń bo ìtìjú, àwọn tó ṣe é sì ń bá iṣẹ́ ìjọba lọ.", "Abin da zai biyo: gyara a ɓoye yana kare mutunci, kuma waɗanda suka yi hakan suna nan a gwamnati.", "Ihe na-esote: nzuzo na-echekwa ihu, ndị mere ya ka nọ na gọọmentị."),
  "Leave it: not on day one": R("Leave am: no be first day", "Fi sílẹ̀: kì í ṣe ní ọjọ́ kìíní", "Bar shi: ba a ranar farko ba", "Hapụ ya: ọ bụghị n'ụbọchị mbụ"),
  "The ghosts keep getting paid. The auditor stops sending notes.": R("Di ghosts still dey collect salary. Di auditor stop to send note.", "Àwọn iwin ń gba owó síbẹ̀. Olùṣàyẹ̀wò dákẹ́ ìfiránṣẹ́ ìwé.", "Ma'aikatan bogi na ci gaba da karɓar albashi. Mai binciken ya daina aika takardu.", "A ka na-akwụ ndị mmụọ ụgwọ. Onye nyocha akwụsịla iziga akwụkwọ."),
  "Next: leaks you leave alone grow.": R("Wetin go happen: leak wey you leave go grow.", "Ohun tó kàn: ìjò tí o fi sílẹ̀ máa ń pọ̀ sí i.", "Abin da zai biyo: zubewar da ka bari tana ƙaruwa.", "Ihe na-esote: ọgbapụ ị hapụrụ na-eto."),
  "Cut the ribbon": R("Cut di ribbon", "Gé ọ̀já náà", "Yanke zaren buɗewa", "Bee rịbọn ahụ"),
  "Ward 7's borehole is running again. The crowd is waiting, the cameras are on, and the councillor is standing a little too close.": R(
    "Ward 7 borehole don dey run again. Crowd dey wait, camera don on, and councillor stand too close.",
    "Kànga ẹ̀rọ Ward 7 tún ń ṣiṣẹ́. Èrò ń dúró, kámẹ́rà ti tàn, káńsílọ̀ sì dúró súnmọ́ ọ jù.",
    "Burtsatsen Ward 7 ya sake aiki. Jama'a suna jira, kyamarori a kunne, kuma kansila ya tsaya kusa da kai sosai.",
    "Olulu mmiri Ward 7 na-arụ ọrụ ọzọ. Igwe mmadụ na-eche, igwefoto agbanyela, kansụlọ guzokwa nso gị nke ukwuu."),
  "Water runs. The crowd cheers. A photo of you with a jerrycan is everywhere by evening.": R("Water dey run. Crowd dey hail. Your photo with jerrycan don full everywhere by evening.", "Omi ń ṣàn. Èrò ń hó yèè. Fọ́tò rẹ pẹ̀lú jerikéènì ti tàn kálẹ̀ kí alẹ́ tó lẹ́.", "Ruwa na gudana. Jama'a na shewa. Hotonka da jarka ya bazu ko'ina kafin yamma.", "Mmiri na-asọ. Igwe mmadụ na-eti mkpu ọṅụ. Foto gị na jerikan agbasaala ebe niile tupu anyasị."),
  "Six months earlier…": R("Six months before…", "Oṣù mẹ́fà ṣáájú…", "Watanni shida kafin haka…", "Ọnwa isii tupu mgbe ahụ…"),
  "Before the credit alerts and the ribbons, you had to win. Every governor starts as a candidate with a party, a godfather and a long road to Government House.": R(
    "Before alert and ribbon, you suppose win first. Every governor start as candidate wey get party, godfather and long road to Government House.",
    "Ṣáájú ìkéde owó àti gígé ọ̀já, o ní láti borí. Gbogbo gómìnà ló bẹ̀rẹ̀ gẹ́gẹ́ bí olùdíje tó ní ẹgbẹ́, bàbá ìsàlẹ̀ àti ọ̀nà jíjìn sí Ilé Ìjọba.",
    "Kafin sanarwar kuɗi da yanke zare, sai ka ci zaɓe. Kowane gwamna yana farawa a matsayin ɗan takara mai jam'iyya, uban gida da doguwar hanya zuwa Gidan Gwamnati.",
    "Tupu ozi ego na ịbe rịbọn, ị ga-emerịrị. Gọvanọ ọ bụla na-amalite dị ka onye na-azọ ọkwa nwere otu, nna ochie na ogologo ụzọ ruo Ụlọ Gọọmentị."),
  // The adviser's hints
  "Open the People tab and appoint your commissioners. Ministries do nothing until someone runs them.": R("Open People tab and appoint your commissioners. Ministry no go do anything if nobody dey run am.", "Ṣí ojú-ìwé Àwọn ènìyàn kí o yan àwọn kọmíṣọ́nà rẹ. Iléeṣẹ́ ìjọba kò ní ṣe nǹkan kan títí ẹnìkan yóò fi darí wọn.", "Buɗe shafin Jama'a ka naɗa kwamishinoninka. Ma'aikatu ba sa komai sai an sa mai jagoranci.", "Mepee taabụ Ndị mmadụ ma họpụta ndị kọmishọna gị. Ụlọ ọrụ gọọmentị anaghị eme ihe ọ bụla ruo mgbe mmadụ na-elekọta ha."),
  "Share the money between ministries on the Desk. Salaries come first, or workers go unpaid.": R("Share di moni between ministries for Desk. Salary first, or workers no go collect.", "Pín owó láàárín àwọn iléeṣẹ́ lórí Tábìlì. Owó oṣù ló kọ́kọ́, bí bẹ́ẹ̀ kọ́ àwọn òṣìṣẹ́ kò ní gba owó.", "Raba kuɗi tsakanin ma'aikatu a kan Teburi. Albashi ne farko, in ba haka ba ma'aikata ba za a biya su ba.", "Kee ego n'etiti ụlọ ọrụ na Tebụl. Ụgwọ ọnwa bụ nke mbụ, ma ọ bụghị ya, a gaghị akwụ ndị ọrụ."),
  "Send the budget to the House of Assembly. If members are unhappy, they may ask for something first.": R("Send di budget go House of Assembly. If members no happy, dem fit ask for something first.", "Fi ìsúná ránṣẹ́ sí Ilé Ìgbìmọ̀ Aṣòfin. Bí inú àwọn ọmọ ilé kò bá dùn, wọ́n lè béèrè nǹkan kan ná.", "Aika kasafin kuɗi zuwa Majalisar Dokoki. Idan 'yan majalisa ba su ji daɗi ba, za su iya neman wani abu tukuna.", "Ziga mmefu ego ahụ n'Ụlọ Omebe Iwu. Ọ bụrụ na obi adịghị ndị otu ahụ mma, ha nwere ike ịrịọ ihe ụzọ."),
  "Pick one or two programmes you can pay for. Each one says what it does and what it costs a year.": R("Pick one or two programme wey you fit pay for. Each one go tell you wetin e dey do and how much e cost every year.", "Yan ètò kan tàbí méjì tí o lè sanwó fún. Ọ̀kọ̀ọ̀kan ló sọ ohun tó ń ṣe àti iye tó ń ná lọ́dún.", "Zaɓi shiri ɗaya ko biyu da za ka iya biya. Kowanne yana faɗin abin da yake yi da kuɗinsa a shekara.", "Họrọ otu mmemme ma ọ bụ abụọ ị ga-akwụ ụgwọ ya. Nke ọ bụla na-ekwu ihe ọ na-eme na ego ọ na-efu kwa afọ."),
  "Read what happened, then start the next year. The decisions you made come back.": R("Read wetin happen, then start next year. Di decision wey you make go come back.", "Ka ohun tó ṣẹlẹ̀, lẹ́yìn náà bẹ̀rẹ̀ ọdún tó kàn. Àwọn ìpinnu tí o ṣe yóò padà wá.", "Karanta abin da ya faru, sannan ka fara shekara ta gaba. Shawarwarin da ka yanke za su dawo.", "Gụọ ihe mere, wee malite afọ ọzọ. Mkpebi ị mere ga-alọta."),
  "Open your letters on the Desk. Each one needs a decision, or your staff decide for you.": R("Open your letter dem for Desk. Each one need decision, or your staff go decide for you.", "Ṣí àwọn lẹ́tà rẹ lórí Tábìlì. Ọ̀kọ̀ọ̀kan nílò ìpinnu, bí bẹ́ẹ̀ kọ́ àwọn òṣìṣẹ́ rẹ yóò pinnu fún ọ.", "Buɗe wasiƙunka a kan Teburi. Kowacce na bukatar shawara, in ba haka ba ma'aikatanka za su yanke maka.", "Mepee akwụkwọ ozi gị na Tebụl. Nke ọ bụla chọrọ mkpebi, ma ọ bụghị ya ndị ọrụ gị ga-ekpebiri gị."),
  // The end-of-term cards
  "Your term in six cards": R("Your term inside six cards", "Sáà rẹ nínú káàdì mẹ́fà", "Wa'adinka a katuna shida", "Oge ọchịchị gị na kaadị isii"),
  "Biography": R("My story", "Ìtàn ìgbésí ayé", "Tarihin rayuwa", "Akụkọ ndụ"),
  "Report card": R("Report card", "Káàdì àbájáde", "Katin sakamako", "Kaadị akụkọ"),
  "Front page": R("Front page", "Ojú-ìwé iwájú", "Shafin farko", "Ihu akwụkwọ akụkọ"),
  "My cabinet": R("My cabinet", "Ìgbìmọ̀ mi", "Majalisata", "Kansụl m"),
  "Election result": R("Election result", "Èsì ìdìbò", "Sakamakon zaɓe", "Nsonaazụ ntuli aka"),
  "Beat my score": R("Beat my score if you fit", "Borí àmì mi", "Doke makina", "Merie akara m"),
};
export const T = (en, lang) => { if (!lang || lang === "en") return en; const e = STRINGS[en]; return (e && e[lang]) || en; };
/* Exact matches only, so a sentence that is half-translated never appears. */
export const translateExact = (text, lang) => { if (!lang || lang === "en" || !text) return null; const t = String(text), k = t.trim(); const e = STRINGS[k]; if (!e || !e[lang]) return null; return t.replace(k, e[lang]); };
export const langOf = (v) => LANG_IDS.includes(v) ? v : "en";
