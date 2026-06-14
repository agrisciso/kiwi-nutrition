import { useState, useEffect } from "react";
import { supabase, signOut } from "./agrisci-auth";
import LoginGate from "./LoginGate";

const C = {
  darkGreen: "#0D2818", midGreen: "#1A3A2A", accent: "#2D5A3D",
  gold: "#C9A84C", goldLight: "#E8C96A", cream: "#F5F0E8", creamDark: "#EDE6D8",
  text: "#1A2E1E", textMuted: "#5A7A64", white: "#FFFFFF",
  orange: "#E67E22", ok: "#27AE60", red: "#C0392B",
};

// ─── Auth via Supabase ───────────────────────────────────────────────────────

// ─── Soil texture thresholds (Xiloyannis et al.) ─────────────────────────────
const SOIL_TEXTURES = {
  sandy:  { P_low:7,  P_high:11, K_low:70,  K_high:120, Ca_low:800,  Ca_high:1500, Mg_low:70,  Mg_high:120 },
  medium: { P_low:9,  P_high:17, K_low:100, K_high:200, Ca_low:1500, Ca_high:3500, Mg_low:100, Mg_high:150 },
  clay:   { P_low:11, P_high:21, K_low:150, K_high:300, Ca_low:3000, Ca_high:6000, Mg_low:150, Mg_high:300 },
};

// ─── EXACT Excel formulas ────────────────────────────────────────────────────
function calcNutrition({ ha, yieldTon: y, treeAge, soilTexture = "medium", pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater }) {
  const irr = ha * 4000;
  const thr = SOIL_TEXTURES[soilTexture] || SOIL_TEXTURES.medium;

  // P — threshold depends on soil texture
  let P;
  if (pOlsen > thr.P_high)      P = 0;
  else if (pOlsen < thr.P_low)  P = Math.max((y * 10) / 37.5, 0);
  else                           P = Math.max(((y * 10) / 37.5 - (pWater * irr) / 1000) * ha, 0);

  // K
  let K;
  if (kSoil > thr.K_high)      K = 0;
  else if (kSoil < thr.K_low)  K = Math.max((y * 74) / 37.5, 0);
  else                          K = Math.max(((y * 74) / 37.5 - (kWater * irr) / 1000) * ha, 0);

  // Ca
  let Ca;
  if (caSoil > thr.Ca_high)      Ca = 0;
  else if (caSoil < thr.Ca_low)  Ca = (40 * 11) / 37.5;
  else                            Ca = Math.max(((y * 11) / 37.5 - (caWater * irr) / 1000) * ha, 0);

  // Mg
  let Mg;
  if (mgSoil > thr.Mg_high)      Mg = 0;
  else if (mgSoil < thr.Mg_low)  Mg = Math.max((y * 5) / 37.5, 0);
  else                            Mg = Math.max(((y * 5) / 37.5 - (mgWater * irr) / 1000) * ha, 0);

  // N
  let N;
  if (treeAge < 4) N = ((25 * 120) / 37.5 - (nWater * irr) / 1000) * ha;
  else             N = Math.max(((y * 120) / 37.5 - (nWater * irr) / 1000) * ha, 0);

  return { N, K, P, Ca, Mg };
}

// ─── Translations ─────────────────────────────────────────────────────────────
const LANGS = {
  el: {
    code:"el", flag:"🇬🇷", label:"ΕΛ",
    appTitle:"Μοντέλο Θρέψης Ακτινιδίου", brand:"AgriSci Solutions",
    fieldSection:"🌿 Στοιχεία Χωραφιού", soilSection:"🪨 Ανάλυση Εδάφους (0-30 cm)",
    waterSection:"💧 Ανάλυση Νερού", resultsSection:"📋 Πρόγραμμα Θρέψης",
    hectares:"Εκτάρια", yieldLabel:"Εκτίμηση Παραγωγής", ageLabel:"Ηλικία Δένδρων",
    unitHa:"ha", unitTon:"tn/ha", unitYears:"έτη",
    totalProd:"Σύνολο παραγωγής", tons:"τόνοι", youngTree:"⚠ Νεαρό δένδρο (<4 ετών)",
    low:"⬇ χαμηλό", sufficient:"✓ επαρκές", high:"⬆ υψηλό",
    perField:"kg / χωράφι", adequate:"Επαρκές — δεν απαιτείται",
    calcBtn:"Υπολογισμός", enterYield:"Εισάγετε εκτίμηση παραγωγής για υπολογισμό",
    periodN:"40% βραδείας κατά την έκπτυξη · εβδομαδιαία ανθοφορία → τέλη Ιουνίου",
    periodK:"2-3 εβδομαδιαίες εφαρμογές: αρχές Ιουλίου →",
    periodCa:"7-8 εβδομαδιαίες: τελευταία εβδ. ανθοφορίας → +50 ημέρες",
    periodMg:"2-3 εφαρμογές: 15 Ιουνίου → 1 Ιουλίου",
    periodP:"1-2 εφαρμογές: έκπτυξη → ανθοφορία",
    footerCTA:"Για προσωπική αξιολόγηση:", footerLink:"Επικοινωνήστε μαζί μας",
    // password gate
    textureLabel: "Τύπος Εδάφους",
    textureSandy: "Αμμώδες",
    textureMedium: "Μέσης Σύστασης",
    textureClay: "Αργιλώδες",
    pwTitle:"Πρόσβαση στον Υπολογιστή Θρέψης",
    pwSubtitle:"Εισάγετε τον κωδικό πρόσβασης",
    pwPlaceholder:"Κωδικός πρόσβασης",
    pwBtn:"Είσοδος", pwError:"Λάθος κωδικός. Δοκιμάστε ξανά.",
    pwFooter:"Για αγορά άδειας χρήσης:",
  },
  en: {
    code:"en", flag:"🇬🇧", label:"EN",
    appTitle:"Kiwifruit Nutrition Model", brand:"AgriSci Solutions",
    fieldSection:"🌿 Field Data", soilSection:"🪨 Soil Analysis (0-30 cm)",
    waterSection:"💧 Water Analysis", resultsSection:"📋 Nutrition Programme",
    hectares:"Hectares", yieldLabel:"Estimated Yield", ageLabel:"Tree Age",
    unitHa:"ha", unitTon:"tn/ha", unitYears:"years",
    totalProd:"Total production", tons:"tons", youngTree:"⚠ Young tree (<4 years)",
    low:"⬇ low", sufficient:"✓ sufficient", high:"⬆ high",
    perField:"kg / field", adequate:"Adequate — not required",
    calcBtn:"Calculate", enterYield:"Enter estimated yield to calculate",
    periodN:"40% slow-release at budbreak · weekly flowering → end June",
    periodK:"2-3 weekly applications: early July onwards",
    periodCa:"7-8 weekly: last week of flowering → +50 days",
    periodMg:"2-3 applications: 15 June → 1 July",
    periodP:"1-2 applications: budbreak → flowering",
    footerCTA:"For personalised assessment:", footerLink:"Contact us",
    textureLabel:"Soil Texture",
    textureSandy:"Sandy",
    textureMedium:"Medium",
    textureClay:"Clay",
    pwTitle:"Nutrition Calculator Access",
    pwSubtitle:"Enter your access password",
    pwPlaceholder:"Password",
    pwBtn:"Enter", pwError:"Incorrect password. Please try again.",
    pwFooter:"To purchase a licence:",
  },
  it: {
    code:"it", flag:"🇮🇹", label:"IT",
    appTitle:"Modello Nutrizione Actinidia", brand:"AgriSci Solutions",
    fieldSection:"🌿 Dati Campo", soilSection:"🪨 Analisi Suolo (0-30 cm)",
    waterSection:"💧 Analisi Acqua", resultsSection:"📋 Piano Nutrizionale",
    hectares:"Ettari", yieldLabel:"Produzione Stimata", ageLabel:"Età Piante",
    unitHa:"ha", unitTon:"t/ha", unitYears:"anni",
    totalProd:"Produzione totale", tons:"tonnellate", youngTree:"⚠ Pianta giovane (<4 anni)",
    low:"⬇ basso", sufficient:"✓ sufficiente", high:"⬆ alto",
    perField:"kg / campo", adequate:"Sufficiente — non necessario",
    calcBtn:"Calcola", enterYield:"Inserire produzione stimata per calcolare",
    periodN:"40% lenta cessione alla ripresa · settimanale fioritura → fine giugno",
    periodK:"2-3 applicazioni settimanali: inizio luglio in poi",
    periodCa:"7-8 settimane: ultima sett. fioritura → +50 giorni",
    periodMg:"2-3 applicazioni: 15 giugno → 1 luglio",
    periodP:"1-2 applicazioni: ripresa vegetativa → fioritura",
    footerCTA:"Per una valutazione personalizzata:", footerLink:"Contattaci",
    textureLabel:"Tessitura del Suolo",
    textureSandy:"Sabbioso",
    textureMedium:"Medio",
    textureClay:"Argilloso",
    pwTitle:"Accesso al Calcolatore",
    pwSubtitle:"Inserire la password di accesso",
    pwPlaceholder:"Password",
    pwBtn:"Accedi", pwError:"Password errata. Riprovare.",
    pwFooter:"Per acquistare una licenza:",
  },
  es: {
    code:"es", flag:"🇪🇸", label:"ES",
    appTitle:"Modelo de Nutrición Kiwi", brand:"AgriSci Solutions",
    fieldSection:"🌿 Datos del Campo", soilSection:"🪨 Análisis de Suelo (0-30 cm)",
    waterSection:"💧 Análisis de Agua", resultsSection:"📋 Programa de Nutrición",
    hectares:"Hectáreas", yieldLabel:"Producción Estimada", ageLabel:"Edad Árboles",
    unitHa:"ha", unitTon:"t/ha", unitYears:"años",
    totalProd:"Producción total", tons:"toneladas", youngTree:"⚠ Árbol joven (<4 años)",
    low:"⬇ bajo", sufficient:"✓ suficiente", high:"⬆ alto",
    perField:"kg / campo", adequate:"Suficiente — no requerido",
    calcBtn:"Calcular", enterYield:"Introduzca producción estimada para calcular",
    periodN:"40% liberación lenta en brotación · semanal floración → finales junio",
    periodK:"2-3 aplicaciones semanales: principios julio en adelante",
    periodCa:"7-8 semanas: última sem. floración → +50 días",
    periodMg:"2-3 aplicaciones: 15 junio → 1 julio",
    periodP:"1-2 aplicaciones: brotación → floración",
    footerCTA:"Para evaluación personalizada:", footerLink:"Contáctenos",
    textureLabel:"Textura del Suelo",
    textureSandy:"Arenoso",
    textureMedium:"Medio",
    textureClay:"Arcilloso",
    pwTitle:"Acceso a la Calculadora",
    pwSubtitle:"Introduzca su contraseña de acceso",
    pwPlaceholder:"Contraseña",
    pwBtn:"Entrar", pwError:"Contraseña incorrecta. Inténtelo de nuevo.",
    pwFooter:"Para adquirir una licencia:",
  },
};

function fmt(v) { return v < 0.01 ? "0" : v.toFixed(1); }


// ─── Nutrition Icon (leaf + N/K/P) ────────────────────────────────────────────
function NutritionIcon({ size = 42 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="36" rx="22" ry="27" fill="#2D5A3D" transform="rotate(-10 40 36)"/>
      <line x1="40" y1="12" x2="40" y2="62" stroke={C.gold} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="40" y1="28" x2="26" y2="38" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="40" y1="38" x2="25" y2="48" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="40" y1="28" x2="54" y2="38" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="40" y1="38" x2="55" y2="48" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <circle cx="40" cy="16" r="9" fill={C.gold}/>
      <text x="40" y="20" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="10" fill="#0D2818">N</text>
      <circle cx="24" cy="54" r="8" fill={C.gold} opacity="0.9"/>
      <text x="24" y="58" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="9" fill="#0D2818">K</text>
      <circle cx="56" cy="54" r="8" fill={C.gold} opacity="0.9"/>
      <text x="56" y="58" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="9" fill="#0D2818">P</text>
      <path d="M40 63 Q42 70 40 76" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function Input({ label, unit, value, onChange, min, max, step=1, hint, placeholder, required }) {
  const isEmpty = value === "" || value === 0;
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textMuted, marginBottom:4, letterSpacing:"0.04em", textTransform:"uppercase" }}>
        {label}{required && <span style={{ color:C.gold, marginLeft:3 }}>*</span>}
        {hint && <span style={{ fontWeight:400, textTransform:"none", marginLeft:6, opacity:0.75 }}>{hint}</span>}
      </label>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <input type="number" value={value} step={step} min={min} max={max} placeholder={placeholder||""}
          onChange={e => onChange(e.target.value===""?"":Number(e.target.value))}
          style={{ flex:1, padding:"9px 12px", borderRadius:8, border:`1.5px solid ${required&&isEmpty?C.gold+"88":C.creamDark}`, background:C.white, color:C.text, fontSize:15, fontWeight:500, outline:"none" }}
          onFocus={e=>(e.target.style.borderColor=C.gold)}
          onBlur={e=>(e.target.style.borderColor=(required&&isEmpty)?C.gold+"88":C.creamDark)}
        />
        {unit && <span style={{ fontSize:12, color:C.textMuted, minWidth:44, fontWeight:500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background:C.cream, borderRadius:14, padding:"18px 20px", marginBottom:16, border:`1px solid ${C.creamDark}` }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:C.gold, textTransform:"uppercase", marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
}

function ResultRow({ element, amount, period, t }) {
  const isZero = amount <= 0.005;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", background:C.white, borderRadius:10, marginBottom:8, border:`1.5px solid ${C.creamDark}` }}>
      <div style={{ minWidth:40, height:40, borderRadius:8, background:isZero?C.creamDark:C.darkGreen, color:isZero?C.textMuted:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>
        {element}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
          <span style={{ fontSize:isZero?18:22, fontWeight:800, color:isZero?C.textMuted:C.text }}>{isZero?"—":fmt(amount)}</span>
          {!isZero && <span style={{ fontSize:12, color:C.textMuted, fontWeight:500 }}>{t.perField}</span>}
          {isZero && <span style={{ fontSize:12, color:C.ok, fontWeight:600 }}>{t.adequate}</span>}
        </div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:2, lineHeight:1.4 }}>{period}</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("el");
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  const t = LANGS[lang];

  if (loadingAuth) {
    return (
      <div style={{ minHeight:"100vh", background:"#0D2818", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#C9A84C", fontSize:14, fontWeight:600 }}>...</div>
      </div>
    );
  }
  if (!session) {
    return (
      <LoginGate
        onLogin={setSession}
        appTitle={t.appTitle}
        appIcon={<NutritionIcon size={56}/>}
        lang={lang}
        setLang={setLang}
      />
    );
  }
  return <NutritionCalculator t={t} lang={lang} setLang={setLang} />;
}


// ─── Persist inputs to localStorage ─────────────────────────────────────────
const NUTRI_STORAGE_KEY = 'agrisci_nutrition_inputs';

function loadNutriSaved(key, defaultVal) {
  try {
    const s = localStorage.getItem(NUTRI_STORAGE_KEY);
    if (!s) return defaultVal;
    const d = JSON.parse(s);
    return key in d ? d[key] : defaultVal;
  } catch { return defaultVal; }
}

function saveNutriInputs(data) {
  try { localStorage.setItem(NUTRI_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function NutritionCalculator({ t, lang, setLang }) {
  const [soilTexture, setSoilTexture] = useState(() => loadNutriSaved("soilTexture", "medium"));
  const [ha,       setHa]      = useState(() => parseFloat(loadNutriSaved("ha", 1.65)) || 1.65);
  const [yieldTon, setYield]   = useState("");
  const [treeAge,  setTreeAge] = useState(() => (parseInt(loadNutriSaved("treeAge", 10)) || 10));
  const [pOlsen,   setPOlsen]  = useState(() => (parseInt(loadNutriSaved("pOlsen", 15)) || 15));
  const [kSoil,    setKSoil]   = useState(() => (parseInt(loadNutriSaved("kSoil", 250)) || 250));
  const [mgSoil,   setMgSoil]  = useState(() => (parseInt(loadNutriSaved("mgSoil", 250)) || 250));
  const [caSoil,   setCaSoil]  = useState(() => (parseInt(loadNutriSaved("caSoil", 3000)) || 3000));
  const [pWater,   setPWater]  = useState(() => parseFloat(loadNutriSaved("pWater", 0.8)) || 0.8);
  const [kWater,   setKWater]  = useState(() => parseFloat(loadNutriSaved("kWater", 1.2)) || 1.2);
  const [mgWater,  setMgWater] = useState(() => parseFloat(loadNutriSaved("mgWater", 1.2)) || 1.2);
  const [caWater,  setCaWater] = useState(() => (parseInt(loadNutriSaved("caWater", 53)) || 53));
  const [nWater,   setNWater]  = useState(() => parseFloat(loadNutriSaved("nWater", 5.9)) || 5.9);
  const [results,  setResults] = useState(null);
  const [calculated, setCalc]  = useState(false);

  // Save inputs whenever they change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hasYield = yieldTon !== "" && Number(yieldTon) > 0;

  useEffect(() => {
    saveNutriInputs({ ha, yieldTon, treeAge, soilTexture, pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater });
  }, [ha, yieldTon, treeAge, soilTexture, pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = (fn) => (v) => { fn(v); setCalc(false); };
  function setTexture(v) { setSoilTexture(v); setCalc(false); }

  function calculate() {
    if (!hasYield) return;
    setResults(calcNutrition({ ha, yieldTon:Number(yieldTon), treeAge, soilTexture, pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater }));
    setCalc(true);
  }

  const thr    = SOIL_TEXTURES[soilTexture] || SOIL_TEXTURES.medium;
  const kHint  = kSoil>thr.K_high  ? `⬆ >${thr.K_high} → K=0`  : kSoil<thr.K_low  ? t.low : t.sufficient;
  const mgHint = mgSoil>thr.Mg_high? `⬆ >${thr.Mg_high} → Mg=0` : mgSoil<thr.Mg_low? t.low : t.sufficient;
  const pHint  = pOlsen>thr.P_high ? `⬆ >${thr.P_high} → P=0`   : pOlsen<thr.P_low ? t.low : t.sufficient;
  const caHint = caSoil>thr.Ca_high? `⬆ → Ca=0`                  : caSoil<thr.Ca_low? t.low : t.sufficient;

  return (
    <div style={{ minHeight:"100vh", background:C.darkGreen, fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.darkGreen} 0%,${C.midGreen} 100%)`, padding:"24px 20px 20px", borderBottom:`2px solid ${C.gold}22` }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:6, marginBottom:14 }}>
            {Object.values(LANGS).map(l=>(
              <button key={l.code} onClick={()=>setLang(l.code)} style={{ padding:"4px 10px", borderRadius:20, border:`1.5px solid ${lang===l.code?C.gold:C.gold+"44"}`, background:lang===l.code?C.gold:"transparent", color:lang===l.code?C.darkGreen:C.gold, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ background:C.midGreen, borderRadius:14, padding:6 }}><NutritionIcon size={38}/></div>
            <div>
              <div style={{ fontSize:11, color:C.gold, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase" }}>{t.brand}</div>
              <div style={{ fontSize:18, fontWeight:800, color:C.cream, lineHeight:1.2 }}>{t.appTitle}</div>
            </div>
          </div>
          <button onClick={async () => { await signOut(); window.location.reload(); }} style={{
            padding:"5px 12px", borderRadius:20,
            border:`1px solid ${C.gold}55`, background:"transparent",
            color:C.gold, fontSize:11, fontWeight:600, cursor:"pointer",
          }}>
            {lang==="el"?"Έξοδος":lang==="en"?"Sign out":lang==="it"?"Esci":"Salir"}
          </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background:C.cream, minHeight:"calc(100vh - 130px)", borderRadius:"20px 20px 0 0", padding:"20px 16px 40px", maxWidth:480, margin:"0 auto" }}>

        <Section title={t.fieldSection}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Input label={t.hectares}   unit={t.unitHa}    value={ha}       onChange={dirty(setHa)}      min={0.1} max={50}  step={0.05}/>
            <Input label={t.yieldLabel} unit={t.unitTon}   value={yieldTon} onChange={dirty(setYield)}   min={1}   max={100} step={1} placeholder="—" required/>
            <Input label={t.ageLabel}   unit={t.unitYears} value={treeAge}  onChange={dirty(setTreeAge)} min={1}   max={50}  step={1}/>
          </div>
          {hasYield && (
            <div style={{ fontSize:12, color:C.textMuted, padding:"8px 12px", background:`${C.gold}15`, borderRadius:8, marginTop:4 }}>
              📊 {t.totalProd}: <strong style={{ color:C.darkGreen }}>{(Number(yieldTon)*ha).toFixed(1)} {t.tons}</strong>
              {treeAge<4 && <span style={{ color:C.orange, marginLeft:8 }}>{t.youngTree}</span>}
            </div>
          )}
        </Section>

        <Section title={t.soilSection}>
          {/* Soil texture dropdown */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.textMuted, marginBottom:6, letterSpacing:"0.04em", textTransform:"uppercase" }}>
              {t.textureLabel}
            </label>
            <div style={{ display:"flex", gap:6 }}>
              {["sandy","medium","clay"].map(tx => (
                <button key={tx} onClick={() => setTexture(tx)} style={{
                  flex:1, padding:"8px 4px", borderRadius:8, fontSize:11, fontWeight:700,
                  border:`2px solid ${soilTexture===tx ? C.gold : C.creamDark}`,
                  background: soilTexture===tx ? C.darkGreen : C.white,
                  color: soilTexture===tx ? C.gold : C.textMuted,
                  cursor:"pointer", transition:"all 0.15s",
                }}>
                  {tx==="sandy" ? t.textureSandy : tx==="medium" ? t.textureMedium : t.textureClay}
                </button>
              ))}
            </div>

          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Input label="P Olsen" unit="ppm" value={pOlsen} onChange={dirty(setPOlsen)} min={0} max={200}   step={0.5} hint={pHint}/>
            <Input label="K"       unit="ppm" value={kSoil}  onChange={dirty(setKSoil)}  min={0} max={2000}  step={5}   hint={kHint}/>
            <Input label="Mg"      unit="ppm" value={mgSoil} onChange={dirty(setMgSoil)} min={0} max={2000}  step={5}   hint={mgHint}/>
            <Input label="Ca"      unit="ppm" value={caSoil} onChange={dirty(setCaSoil)} min={0} max={10000} step={50}  hint={caHint}/>
          </div>
        </Section>

        <Section title={t.waterSection}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <Input label="N-NO₃" unit="mg/L" value={nWater}  onChange={dirty(setNWater)}  min={0} max={50}  step={0.1}/>
            <Input label="K"     unit="mg/L" value={kWater}  onChange={dirty(setKWater)}  min={0} max={20}  step={0.1}/>
            <Input label="P"     unit="mg/L" value={pWater}  onChange={dirty(setPWater)}  min={0} max={10}  step={0.1}/>
            <Input label="Mg"    unit="mg/L" value={mgWater} onChange={dirty(setMgWater)} min={0} max={50}  step={0.1}/>
            <Input label="Ca"    unit="mg/L" value={caWater} onChange={dirty(setCaWater)} min={0} max={300} step={1}/>
          </div>
        </Section>

        <button onClick={calculate} disabled={!hasYield} style={{ width:"100%", padding:"15px", borderRadius:12, background:!hasYield?C.creamDark:calculated?C.accent:C.gold, color:!hasYield?C.textMuted:calculated?C.cream:C.darkGreen, border:"none", fontSize:16, fontWeight:800, cursor:hasYield?"pointer":"not-allowed", marginBottom:16, boxShadow:hasYield&&!calculated?`0 4px 16px ${C.gold}44`:"none" }}>
          {!hasYield ? `↑ ${t.enterYield}` : `⚗️ ${t.calcBtn}`}
        </button>

        <div style={{ background:C.darkGreen, borderRadius:16, padding:"18px 16px", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:C.gold, textTransform:"uppercase", marginBottom:14 }}>{t.resultsSection}</div>
          {!results
            ? <div style={{ textAlign:"center", padding:"20px 16px", color:`${C.cream}55`, fontSize:13 }}>{t.enterYield}</div>
            : <>
                <ResultRow element="N"  amount={results.N}  period={t.periodN}  t={t}/>
                <ResultRow element="K"  amount={results.K}  period={t.periodK}  t={t}/>
                <ResultRow element="Ca" amount={results.Ca} period={t.periodCa} t={t}/>
                <ResultRow element="Mg" amount={results.Mg} period={t.periodMg} t={t}/>
                <ResultRow element="P"  amount={results.P}  period={t.periodP}  t={t}/>
              </>
          }
        </div>

        <div style={{ textAlign:"center", fontSize:11, color:C.textMuted, lineHeight:1.8 }}>
          <span style={{ color:C.gold, fontWeight:700 }}>AgriSci Solutions</span> · agrisci-solutions.com<br/>
          {t.footerCTA} <a href="https://agrisci-solutions.com" style={{ color:C.accent, fontWeight:600 }}>{t.footerLink}</a>
        </div>
      </div>
    </div>
  );
}
