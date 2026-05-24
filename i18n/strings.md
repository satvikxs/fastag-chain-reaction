# FASTag Chain Reaction — Translation Strings (v1)

**Languages covered:** English (EN) · Hindi Devanagari (HI) · Marathi Devanagari (MR) · Hindi Roman transliteration (HI-Latn) · Marathi Roman transliteration (MR-Latn)

**Total strings:** 40

**Style principles (read first):**
- Drivers read these at 80+ km/h. Every alert must scan in under 2 seconds.
- "FASTag" is ALWAYS Romanized (`FASTag`), never `फास्टैग` / `फास्टॅग`. It is a brand and drivers recognize the Roman wordmark on the windshield sticker.
- "UPI", "KYC", "GPS", "₹" are also kept Romanized/symbolic.
- Numerals: **use Latin digits (0–9), not Devanagari (०–९)** — financial clarity beats linguistic purity. Confirmed by NPCI/BHIM convention.
- Tone: direct imperative for alerts ("recharge karo / karein"), warmer for success states. Avoid the formal `कीजिए` / `कीजियेगा` register — sounds like a govt SMS.
- Hinglish is OK and often preferred (Recharge karein > रिचार्ज करें). Calling a "lane" a `मार्ग` is wrong — drivers say "lane".
- `[REVIEW]` = needs a native speaker pass before shipping.

---

## 1. Push notifications (highest stakes)

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 1 | Low FASTag Balance — recharge before Khalapur Toll (4.8 km) | FASTag बैलेंस कम है — खालापुर टोल से पहले रिचार्ज करें (4.8 km) | FASTag बॅलन्स कमी आहे — खालापूर टोलच्या आधी रिचार्ज करा (4.8 km) | FASTag balance kam hai — Khalapur Toll se pehle recharge karein (4.8 km) | FASTag balance kami aahe — Khalapur Toll chya aadhi recharge kara (4.8 km) |
| 2 | FASTag blacklisted — fix before toll | FASTag ब्लैकलिस्ट है — टोल से पहले ठीक करें | FASTag ब्लॅकलिस्ट आहे — टोलच्या आधी दुरुस्त करा | FASTag blacklist hai — toll se pehle theek karein | FASTag blacklist aahe — toll chya aadhi durust kara |
| 3 | KYC expired — update now | KYC एक्सपायर हो गई — अभी अपडेट करें | KYC एक्सपायर झाली — आता अपडेट करा | KYC expire ho gayi — abhi update karein | KYC expire jhali — aata update kara |
| 4 | Vehicle class mismatch detected | गाड़ी की क्लास मेल नहीं खा रही | गाडीचा क्लास जुळत नाही | Gaadi ki class mel nahi kha rahi | Gaadicha class julat nahi |
| 5 | FASTag cleared. Safe travels. | FASTag क्लियर। सेफ ड्राइव। | FASTag क्लिअर. सुरक्षित प्रवास. | FASTag clear. Safe drive. | FASTag clear. Surakshit pravas. |
| 6 | Toll ahead in 2 km — slow down | 2 km में टोल है — स्पीड कम करें | 2 km वर टोल आहे — वेग कमी करा | 2 km mein toll hai — speed kam karein | 2 km var toll aahe — veg kami kara |
| 7 | Recharge before next toll to avoid ₹200 penalty | अगले टोल से पहले रिचार्ज करें, ₹200 पेनल्टी से बचें | पुढच्या टोलच्या आधी रिचार्ज करा, ₹200 दंडापासून वाचा | Agle toll se pehle recharge karein, ₹200 penalty se bachein | Pudhchya toll chya aadhi recharge kara, ₹200 dandapasun vacha |

---

## 2. App onboarding

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 8 | Welcome to FASTag Chain Reaction | FASTag Chain Reaction में आपका स्वागत है | FASTag Chain Reaction मध्ये आपले स्वागत आहे | FASTag Chain Reaction mein aapka swagat hai | FASTag Chain Reaction madhye aaple swagat aahe |
| 9 | Add your vehicle | अपनी गाड़ी जोड़ें | तुमची गाडी जोडा | Apni gaadi jodein | Tumchi gaadi joda |
| 10 | We need GPS to warn you before tolls | टोल से पहले अलर्ट देने के लिए GPS चाहिए | टोलच्या आधी अलर्ट देण्यासाठी GPS हवे | Toll se pehle alert dene ke liye GPS chahiye | Toll chya aadhi alert denyasathi GPS have |
| 11 | We never sell your location data | हम आपका लोकेशन डेटा कभी नहीं बेचते | आम्ही तुमचा लोकेशन डेटा कधीच विकत नाही | Hum aapka location data kabhi nahi bechte | Aamhi tumcha location data kadhich vikat nahi |
| 12 | Enter vehicle number (e.g. MH 12 AB 1234) | गाड़ी नंबर डालें (जैसे MH 12 AB 1234) | गाडी नंबर टाका (उदा. MH 12 AB 1234) | Gaadi number daalein (jaise MH 12 AB 1234) | Gaadi number taaka (udaa. MH 12 AB 1234) |
| 13 | Allow notifications to get toll alerts | टोल अलर्ट पाने के लिए नोटिफिकेशन अलाउ करें | टोल अलर्ट मिळवण्यासाठी नोटिफिकेशन परवानगी द्या | Toll alert paane ke liye notification allow karein | Toll alert milvanyasathi notification parvangi dya |
| 14 | Skip for now | अभी छोड़ें | आत्ता वगळा | Abhi chhodein | Aatta vagla |
| 15 | Get started | शुरू करें | सुरू करा | Shuru karein | Suru kara |

---

## 3. Main UI

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 16 | Distance to next toll | अगले टोल की दूरी | पुढच्या टोलचे अंतर | Agle toll ki doori | Pudhchya toll che antar |
| 17 | Current FASTag balance | अभी का FASTag बैलेंस | सध्याचा FASTag बॅलन्स | Abhi ka FASTag balance | Sadhyacha FASTag balance |
| 18 | Recharge | रिचार्ज | रिचार्ज | Recharge | Recharge |
| 19 | Top-up suggested: ₹500 | सुझाव: ₹500 का टॉप-अप | सुचवलेले: ₹500 चे टॉप-अप | Sujhav: ₹500 ka top-up | Suchavalele: ₹500 che top-up |
| 20 | Pay with UPI | UPI से पे करें | UPI ने पे करा | UPI se pay karein | UPI ne pay kara |
| 21 | Lane suggestion: Lane 4 (fastest) | लेन सुझाव: Lane 4 (सबसे फास्ट) | लेन सूचना: Lane 4 (सर्वात फास्ट) | Lane sujhav: Lane 4 (sabse fast) | Lane suchana: Lane 4 (sarvat fast) |
| 22 | View toll history | टोल हिस्ट्री देखें | टोल हिस्ट्री पहा | Toll history dekhein | Toll history paha |
| 23 | My vehicles | मेरी गाड़ियां | माझ्या गाड्या | Meri gaadiyan | Majhya gaadya |
| 24 | Settings | सेटिंग्स | सेटिंग्ज | Settings | Settings |

---

## 4. Status messages

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 25 | Cleared for [toll name] | [toll name] के लिए क्लियर | [toll name] साठी क्लिअर | [toll name] ke liye clear | [toll name] saathi clear |
| 26 | You helped prevent a jam for ~180 cars. | आपने ~180 गाड़ियों का जाम रोकने में मदद की। | तुम्ही ~180 गाड्यांचा जाम रोखण्यात मदत केली. | Aapne ~180 gaadiyon ka jaam rokne mein madad ki. | Tumhi ~180 gaadyancha jaam rokhanyat madat keli. |
| 27 | Recharge successful | रिचार्ज सफल | रिचार्ज यशस्वी | Recharge successful | Recharge yashasvi |
| 28 | Recharge failed — please try again | रिचार्ज फेल — फिर से कोशिश करें | रिचार्ज फेल — पुन्हा प्रयत्न करा | Recharge fail — phir se koshish karein | Recharge fail — punha prayatna kara |
| 29 | No internet — using cached data | इंटरनेट नहीं — सेव्ड डेटा दिखा रहे हैं | इंटरनेट नाही — सेव्ह केलेला डेटा दाखवत आहोत | Internet nahi — saved data dikha rahe hain | Internet nahi — save kelela data dakhavat aahot |
| 30 | Checking FASTag status… | FASTag स्टेटस चेक हो रहा है… | FASTag स्टेटस तपासत आहोत… | FASTag status check ho raha hai… | FASTag status tapasat aahot… |
| 31 | Payment in progress… | पेमेंट हो रहा है… | पेमेंट होत आहे… | Payment ho raha hai… | Payment hot aahe… |
| 32 | Saved ₹{amount} in fines this month | इस महीने ₹{amount} फाइन बचाई | या महिन्यात ₹{amount} दंड वाचवला | Is mahine ₹{amount} fine bachayi | Ya mahinyat ₹{amount} dand vachavla |

---

## 5. Errors

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 33 | Could not check FASTag balance. Please retry. | FASTag बैलेंस चेक नहीं हो पाया। फिर से कोशिश करें। | FASTag बॅलन्स तपासता आला नाही. पुन्हा प्रयत्न करा. | FASTag balance check nahi ho paya. Phir se koshish karein. | FASTag balance tapasata aala nahi. Punha prayatna kara. |
| 34 | Your vehicle registration is not recognized. | आपकी गाड़ी का नंबर पहचान में नहीं आया। | तुमच्या गाडीचा नंबर ओळखता आला नाही. | Aapki gaadi ka number pehchaan mein nahi aaya. | Tumchya gaadicha number olakhata aala nahi. |
| 35 | Payment app not installed. | पेमेंट ऐप इंस्टॉल नहीं है। | पेमेंट अॅप इन्स्टॉल नाही. | Payment app install nahi hai. | Payment app install nahi. |
| 36 | Location permission denied — alerts won't work | लोकेशन परमिशन नहीं मिली — अलर्ट काम नहीं करेंगे | लोकेशन परवानगी नाकारली — अलर्ट काम करणार नाहीत | Location permission nahi mili — alert kaam nahi karenge | Location parvangi nakarali — alert kaam karnar nahit |
| 37 | Server is slow. Hang on… | सर्वर स्लो है। थोड़ा रुकें… | सर्व्हर स्लो आहे. थोडं थांबा… | Server slow hai. Thoda rukein… | Server slow aahe. Thoda thamba… |

---

## 6. CTAs / buttons (short)

| # | EN | HI (Devanagari) | MR (Devanagari) | HI (Roman) | MR (Roman) |
|---|----|------------------|------------------|------------|------------|
| 38 | Retry | फिर से कोशिश करें | पुन्हा प्रयत्न करा | Phir se try karein | Punha try kara |
| 39 | Cancel | रद्द करें | रद्द करा | Cancel | Cancel |
| 40 | Done | हो गया | झाले | Ho gaya | Jhale |

---

## Translation notes

### Hindi (HI / HI-Latn)
Indian drivers — especially the 25–55 male demographic on national highways — read **Hinglish faster than pure Hindi**. The Sanskritic register (`रिचार्ज कीजिए`, `भुगतान`, `सूचना`) feels like an LIC form or a sarkari SMS. We've deliberately used `रिचार्ज करें` (imperative, present tense, mid-formality) instead of `कीजिए` (over-polite) or `कर` (rude). For the Roman transliteration column, prefer the phonetic spelling the user would type on WhatsApp: `karein` not `kareN`, `nahi` not `nahin`, `gaadi` not `gāḍī`. Brand/tech terms stay in Roman: FASTag, UPI, KYC, GPS, lane, recharge, balance, top-up, blacklist, expire. Avoid hard Sanskrit replacements (e.g., don't translate "balance" to `शेष राशि` — drivers don't parse it). City names: prefer the colloquial form drivers use (Mumbai not Bambai, Pune not Poona). For toll names, always keep the official English/Marathi name on signs (`Khalapur`, not `खालापुर` only) — match what the driver sees on the highway gantry.

### Marathi (MR / MR-Latn)
Maharashtra drivers on the Mumbai–Pune Expressway are bilingual Marathi+Hindi, but Marathi is the trust signal — it tells the user "this app understands me." Use **conversational Marathi**, not the news-anchor register. `करा` (informal imperative) is the right tone for alerts; `करावे` / `करावा` is too formal. Watch for `च` vs `च्या` (genitive) — `टोलच्या आधी` (before the toll) is correct, `टोल आधी` is wrong. The Roman transliteration follows WhatsApp Marathi conventions: `kara` not `karā`, `aahe` not `āhe`, `jhale` not `zhāle`. Half-letters: write `च्या` as `chya`, `त्या` as `tya`. Marathi speakers will accept `Recharge karein` (Hindi) in an emergency, so if a Marathi string is missing at runtime, falling back to Hindi is acceptable — falling back to English is NOT.

### Brand/tech terms — keep Romanized always
`FASTag`, `UPI`, `KYC`, `GPS`, `₹`, `km`, toll names, vehicle numbers (MH 12 AB 1234 format). Never transliterate these to Devanagari — they're visually recognized as logos/symbols.

### Tone matrix
- **Push alerts (1–7):** direct imperative, ≤8 words ideally, no pleasantries.
- **Onboarding (8–15):** warm but brief, second-person ("aap" / "tumhi").
- **Success states (5, 26, 27):** acknowledge driver's action — small dopamine hit (`Safe travels`, `aapne madad ki`).
- **Errors (33–37):** non-blaming, action-oriented. Never say "you did something wrong" — say "we couldn't do X, try Y."

---

## Common pitfalls

1. **Over-formal "govt form" Hindi.** `कृपया अपना वाहन पंजीकरण संख्या दर्ज करें` is technically correct but reads like an RTO form. Use `गाड़ी नंबर डालें`. Same in Marathi: avoid `कृपया`, `दर्शवा`, `नोंदवा` — say `टाका`, `दाखवा`, `भरा`.

2. **Gender agreement (Hindi & Marathi).** Verbs and adjectives change based on noun gender. `गाड़ी` (f.) takes `मेरी` not `मेरा`. `बैलेंस` is treated masculine in Hinglish (`बैलेंस कम है`). Marathi is stricter: `गाडी कमी आहे` (f.) vs `बॅलन्स कमी आहे` (m./n.). When the subject is the user (mixed gender), default to masculine forms in Hindi (`आपने ... की` for `आप ने मदद की` works for both because `मदद` is f.) but be aware Marathi `तुम्ही ... केली` (f. object) works fine here.

3. **Units.** Use `₹` symbol, not `रु.` or `Rs.` or `रुपये`. Use `km` not `कि.मी.` Use Latin digits `4.8`, `₹500` — Devanagari numerals (`४.८`, `₹५००`) reduce scan speed and trigger errors in financial mental parsing. NPCI/UPI apps universally use Latin digits.

4. **"Lane" translation trap.** Marathi `मार्ग` means highway/path, not lane. Hindi `गली` means alley. **Keep `Lane` in Roman.** Drivers know "Lane 4" from highway signage.

5. **"Toll" vs "टोल नाका".** `टोल` alone is universally understood. `टोल नाका` (toll plaza) is more formal — use only when explicitly meaning the physical plaza, not the charge.

6. **Push notification length.** Android/iOS truncate at ~40 chars on lock screen. String #1 ("Low FASTag Balance — recharge before Khalapur Toll (4.8 km)") may need a shorter variant for lock screen: `FASTag कम — Khalapur Toll 4.8 km`. Consider adding a `short` variant column in v2.

7. **City/toll name matching.** The app must display the exact name shown on the gantry sign. Khalapur is `खालापुर` in Hindi but `खालापूर` in Marathi (different long vowel). Always pull from a curated NHAI toll-name table per language, don't auto-transliterate.

8. **Mixing scripts in same string.** `FASTag बैलेंस कम है` mixes Latin + Devanagari. This is FINE and preferred — it matches how users actually read tech-related Hinglish. Don't "fix" by transliterating FASTag to `फास्टैग`.

---

## Strings flagged `[REVIEW]` (need native speaker pass)

None in v1 are blocked — all strings are conversationally correct — but the **three strings most likely to need professional translator review before national launch** are:

1. **String #26** — `"You helped prevent a jam for ~180 cars."` — The emotional framing ("you helped") doesn't have a clean idiomatic equivalent in Hindi/Marathi. Current Marathi `तुम्ही ~180 गाड्यांचा जाम रोखण्यात मदत केली` is grammatical but feels report-like. A copywriter might prefer something like `तुमच्यामुळे ~180 गाड्यांचा जाम टळला` ("because of you, the jam was avoided") — more emotional. Worth A/B testing.

2. **String #4** — `"Vehicle class mismatch detected"` — `गाड़ी की क्लास मेल नहीं खा रही` is technically right but ambiguous (mismatch with what?). A native speaker should expand it to something like `FASTag दूसरी गाड़ी के लिए है` ("FASTag is for a different vehicle") which is clearer for the driver's actual problem.

3. **String #2** — `"FASTag blacklisted — fix before toll"` — The word `ब्लैकलिस्ट` / `ब्लॅकलिस्ट` is understood but feels punitive. Need to test whether drivers panic or ignore it. Alternatives: `FASTag बंद है` ("FASTag is blocked"), `FASTag काम नहीं कर रहा` ("FASTag isn't working"). High-stakes string — wrong tone here causes either ignored alerts or panicked stops on highway.

---

## Future languages — v2 priority order

Based on highway traffic share, toll revenue, and FASTag adoption density:

1. **Tamil (TA)** — Chennai–Bengaluru, Chennai–Trichy corridors. Tamil drivers strongly prefer Tamil script over Roman; Tamil Hinglish does not work the way Hindi Hinglish does. Need full Tamil-script localization plus Roman transliteration for typing/search. Highest revenue toll corridors in South India.

2. **Telugu (TE)** — Hyderabad–Vijayawada–Visakhapatnam (NH-16) is one of India's busiest freight corridors. Telugu and Tamil are roughly tied for priority; ship together if possible.

3. **Kannada (KN)** — Bengaluru–Mysuru Expressway (new, high FASTag adoption), Bengaluru–Hubballi. Smaller volume than TA/TE but politically important — Karnataka regulators take Kannada UI very seriously.

4. **Bengali (BN)** — Kolkata ring roads, NH-19 (Kolkata–Delhi via Durgapur). Lower expressway volume than southern corridors but huge population base; covers Bangladesh-border freight too.

5. **Gujarati (GU)** — Ahmedabad–Vadodara–Mumbai Expressway (under expansion), Surat–Mumbai. Gujarati drivers are highly bilingual with Hindi, so Gujarati can be a v2.5 add — Hindi covers them adequately at launch.

**Defer:** Punjabi, Odia, Malayalam — Malayalam drivers in Kerala use English fluently, Punjabi/Odia volumes are smaller. Add in v3.

**Translation pipeline recommendation:** Don't use Google Translate for any of these. Use professional translators (TranslateMedia, Lionbridge India, or local NGO partners like Swayam Shikshan Prayog for Marathi/Hindi rural copy review). Budget ~₹15–25 per word for highway-critical strings.
