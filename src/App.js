import { useState } from "react";

// ─── AgriSci brand tokens ───────────────────────────────────────────────────
const C = {
  darkGreen: "#0D2818",
  midGreen:  "#1A3A2A",
  accent:    "#2D5A3D",
  gold:      "#C9A84C",
  cream:     "#F5F0E8",
  creamDark: "#EDE6D8",
  text:      "#1A2E1E",
  textMuted: "#5A7A64",
  white:     "#FFFFFF",
  orange:    "#E67E22",
  ok:        "#27AE60",
};

// ─── Agronomic constants ────────────────────────────────────────────────────
const N_COEFF        = 2.738;
const K_COEFF        = 2.0;
const CA_COEFF       = 0.2155;
const P_COEFF        = 0.2036;
const P_THRESHOLD    = 30;
const K_THRESHOLD    = 200;
const K_CORR_FACTOR  = 0.08;
const MG_SOIL_THRESH = 100;
const IRRIGATION     = 6600; // fixed internal constant, not shown to user

// ─── Translations ────────────────────────────────────────────────────────────
const LANGS = {
  el: {
    code: "el", flag: "🇬🇷", label: "ΕΛ",
    appTitle: "Υπολογιστής Θρέψης Ακτινιδίου",
    brand: "AgriSci Solutions",
    fieldSection: "🌿 Στοιχεία Χωραφιού",
    soilSection:  "🪨 Ανάλυση Εδάφους (0-30 cm)",
    waterSection: "💧 Ανάλυση Νερού",
    resultsSection: "📋 Πρόγραμμα Θρέψης",
    hectares: "Εκτάρια", yieldLabel: "Εκτ. Παραγωγή", ageLabel: "Ηλικία Δένδρων",
    unitHa: "ha", unitTon: "tn/ha", unitYears: "έτη",
    totalProd: "Σύνολο παραγωγής", tons: "τόνοι",
    youngTree: "⚠ Νεαρό δένδρο (<4 ετών)",
    low: "⬇ χαμηλό", sufficient: "✓ επαρκές", high: "⬆ υψηλό",
    waterSupply: "Νερό", perFieldYear: "/ χωράφι/έτος",
    perField: "kg / χωράφι", adequate: "Επαρκές από έδαφος/νερό",
    periodN:  "40% βραδείας κατά την έκπτυξη · εβδομαδιαία ανθοφορία → τέλη Ιουνίου",
    periodK:  "2-3 εβδομαδιαίες εφαρμογές: αρχές Ιουλίου →",
    periodCa: "7-8 εβδομαδιαίες: τελευταία εβδ. ανθοφορίας → +50 ημέρες",
    periodMg: "2-3 εφαρμογές: 15 Ιουνίου → 1 Ιουλίου",
    periodP:  "1-2 εφαρμογές: έκπτυξη → ανθοφορία",
    footerCTA: "Για προσωπική αξιολόγηση χωραφιού:", footerLink: "Επικοινωνήστε μαζί μας",
    enterYield: "Εισάγετε την εκτιμώμενη παραγωγή (tn/ha) για να δείτε το πρόγραμμα θρέψης",
  },
  en: {
    code: "en", flag: "🇬🇧", label: "EN",
    appTitle: "Kiwifruit Nutrition Calculator",
    brand: "AgriSci Solutions",
    fieldSection: "🌿 Field Data", soilSection: "🪨 Soil Analysis (0-30 cm)",
    waterSection: "💧 Water Analysis", resultsSection: "📋 Nutrition Programme",
    hectares: "Hectares", yieldLabel: "Est. Yield", ageLabel: "Tree Age",
    unitHa: "ha", unitTon: "tn/ha", unitYears: "years",
    totalProd: "Total production", tons: "tons",
    youngTree: "⚠ Young tree (<4 years)",
    low: "⬇ low", sufficient: "✓ sufficient", high: "⬆ high",
    waterSupply: "Water supply", perFieldYear: "/ field/year",
    perField: "kg / field", adequate: "Adequate from soil/water",
    periodN:  "40% slow-release at budbreak · weekly from flowering → end June",
    periodK:  "2-3 weekly applications: early July onwards",
    periodCa: "7-8 weekly: last week of flowering → +50 days",
    periodMg: "2-3 applications: 15 June → 1 July",
    periodP:  "1-2 applications: budbreak → flowering",
    footerCTA: "For personalised orchard assessment:", footerLink: "Contact us",
    enterYield: "Enter estimated yield (tn/ha) to calculate the nutrition programme",
  },
  it: {
    code: "it", flag: "🇮🇹", label: "IT",
    appTitle: "Calcolatore Nutrizione Actinidia",
    brand: "AgriSci Solutions",
    fieldSection: "🌿 Dati Campo", soilSection: "🪨 Analisi Suolo (0-30 cm)",
    waterSection: "💧 Analisi Acqua", resultsSection: "📋 Piano Nutrizionale",
    hectares: "Ettari", yieldLabel: "Produzione Prev.", ageLabel: "Età Piante",
    unitHa: "ha", unitTon: "t/ha", unitYears: "anni",
    totalProd: "Produzione totale", tons: "tonnellate",
    youngTree: "⚠ Pianta giovane (<4 anni)",
    low: "⬇ basso", sufficient: "✓ sufficiente", high: "⬆ alto",
    waterSupply: "Apporto acqua", perFieldYear: "/ campo/anno",
    perField: "kg / campo", adequate: "Sufficiente da suolo/acqua",
    periodN:  "40% lenta cessione alla ripresa vegetativa · settimanale fioritura → fine giugno",
    periodK:  "2-3 applicazioni settimanali: inizio luglio in poi",
    periodCa: "7-8 settimane: ultima sett. fioritura → +50 giorni",
    periodMg: "2-3 applicazioni: 15 giugno → 1 luglio",
    periodP:  "1-2 applicazioni: ripresa vegetativa → fioritura",
    footerCTA: "Per una valutazione personalizzata:", footerLink: "Contattaci",
    enterYield: "Inserire la produzione stimata (t/ha) per calcolare il piano nutrizionale",
  },
  es: {
    code: "es", flag: "🇪🇸", label: "ES",
    appTitle: "Calculadora de Nutrición Kiwi",
    brand: "AgriSci Solutions",
    fieldSection: "🌿 Datos del Campo", soilSection: "🪨 Análisis de Suelo (0-30 cm)",
    waterSection: "💧 Análisis de Agua", resultsSection: "📋 Programa de Nutrición",
    hectares: "Hectáreas", yieldLabel: "Prod. Estimada", ageLabel: "Edad Árboles",
    unitHa: "ha", unitTon: "t/ha", unitYears: "años",
    totalProd: "Producción total", tons: "toneladas",
    youngTree: "⚠ Árbol joven (<4 años)",
    low: "⬇ bajo", sufficient: "✓ suficiente", high: "⬆ alto",
    waterSupply: "Aporte agua", perFieldYear: "/ campo/año",
    perField: "kg / campo", adequate: "Suficiente de suelo/agua",
    periodN:  "40% liberación lenta en brotación · semanal floración → finales junio",
    periodK:  "2-3 aplicaciones semanales: principios julio en adelante",
    periodCa: "7-8 semanas: última sem. floración → +50 días",
    periodMg: "2-3 aplicaciones: 15 junio → 1 julio",
    periodP:  "1-2 aplicaciones: brotación → floración",
    footerCTA: "Para evaluación personalizada del huerto:", footerLink: "Contáctenos",
    enterYield: "Introduzca la producción estimada (t/ha) para calcular el programa nutricional",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
function fmt(v) { return (v === null || v === undefined || v < 0.01) ? "0" : v.toFixed(1); }

function Input({ label, unit, value, onChange, min, max, step = 1, hint, placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        color: C.textMuted, marginBottom: 4, letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}>
        {label}
        {required && <span style={{ color: C.gold, marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6, opacity: 0.75 }}>{hint}</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" value={value} step={step} min={min} max={max}
          placeholder={placeholder || ""}
          onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8,
            border: `1.5px solid ${required && (value === "" || value === 0) ? C.gold + "88" : C.creamDark}`,
            background: C.white, color: C.text,
            fontSize: 15, fontWeight: 500, outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = C.gold)}
          onBlur={e  => (e.target.style.borderColor = (required && (value === "" || value === 0)) ? C.gold + "88" : C.creamDark)}
        />
        {unit && <span style={{ fontSize: 12, color: C.textMuted, minWidth: 44, fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: C.cream, borderRadius: 14,
      padding: "18px 20px", marginBottom: 16,
      border: `1px solid ${C.creamDark}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        color: C.gold, textTransform: "uppercase", marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ element, amount, period, t }) {
  const isEmpty = amount === null || amount === undefined;
  const isZero  = !isEmpty && amount <= 0.005;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px",
      background: C.white,
      borderRadius: 10, marginBottom: 8,
      border: `1.5px solid ${C.creamDark}`,
      opacity: isEmpty ? 0.45 : 1,
    }}>
      <div style={{
        minWidth: 40, height: 40, borderRadius: 8,
        background: (isZero || isEmpty) ? C.creamDark : C.darkGreen,
        color: (isZero || isEmpty) ? C.textMuted : C.gold,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 13, letterSpacing: "0.05em",
        flexShrink: 0,
      }}>
        {element}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: (isZero || isEmpty) ? 18 : 22, fontWeight: 800, color: (isZero || isEmpty) ? C.textMuted : C.text }}>
            {isEmpty ? "—" : isZero ? "—" : fmt(amount)}
          </span>
          {!isEmpty && !isZero && <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{t.perField}</span>}
          {!isEmpty && isZero && <span style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>{t.adequate}</span>}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{period}</div>
      </div>
    </div>
  );
}

function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="28" rx="22" ry="18" fill={C.gold} opacity="0.9"/>
      <rect x="37" y="44" width="6" height="18" rx="3" fill={C.gold}/>
      <path d="M40 62 Q30 68 22 72" stroke={C.gold} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M40 62 Q50 68 58 72" stroke={C.gold} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M40 65 Q35 70 32 76" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M40 65 Q45 70 48 76" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <circle cx="33" cy="26" r="5" fill={C.darkGreen}/>
      <circle cx="47" cy="22" r="5" fill={C.darkGreen}/>
      <circle cx="40" cy="34" r="5" fill={C.darkGreen}/>
      <circle cx="29" cy="34" r="4" fill={C.darkGreen} opacity="0.8"/>
      <circle cx="51" cy="32" r="4" fill={C.darkGreen} opacity="0.8"/>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function NutritionCalculator() {
  const [lang, setLang] = useState("el");
  const t = LANGS[lang];

  const [ha,       setHa]      = useState(1.65);
  const [yieldTon, setYield]   = useState("");
  const [treeAge,  setTreeAge] = useState(10);

  const [pOlsen, setPOlsen] = useState(15);
  const [kSoil,  setKSoil]  = useState(250);
  const [mgSoil, setMgSoil] = useState(250);
  const [caSoil, setCaSoil] = useState(3000);

  const [pWater,  setPWater]  = useState(0.8);
  const [kWater,  setKWater]  = useState(1.2);
  const [mgWater, setMgWater] = useState(1.2);
  const [caWater, setCaWater] = useState(53);
  const [nWater,  setNWater]  = useState(5.9);

  // ─── Calculations ─────────────────────────────────────────────────────────
  const hasYield = yieldTon !== "" && Number(yieldTon) > 0;

  const results = (() => {
    if (!hasYield) return { N_out: null, K_out: null, P_out: null, Ca_out: null, Mg_out: null, youngTree: treeAge < 4 };

    const totalFruit = Number(yieldTon) * ha;
    const youngTree  = treeAge < 4;

    const N_fromWater = IRRIGATION * nWater / 1000;
    const N_out = youngTree
      ? clamp(totalFruit * N_COEFF * 0.62 - N_fromWater, 0, 9999)
      : clamp(totalFruit * N_COEFF - N_fromWater, 0, 9999);

    const K_soilCorr = Math.max(0, (kSoil - K_THRESHOLD) * K_CORR_FACTOR * ha);
    const K_out = clamp(totalFruit * K_COEFF - IRRIGATION * kWater / 1000 - K_soilCorr, 0, 9999);

    const P_out = pOlsen < P_THRESHOLD
      ? clamp(totalFruit * P_COEFF - IRRIGATION * pWater / 1000, 0, 9999)
      : 0;

    const Ca_out = totalFruit * CA_COEFF;

    const Mg_demand    = totalFruit * 0.5;
    const Mg_fromWater = IRRIGATION * mgWater / 1000;
    const Mg_out = mgSoil >= MG_SOIL_THRESH
      ? clamp(Mg_demand - Mg_fromWater - mgSoil * 0.04 * ha, 0, 9999)
      : clamp(Mg_demand - Mg_fromWater, 0, 9999);

    return { N_out, K_out, P_out, Ca_out, Mg_out, youngTree };
  })();

  return (
    <div style={{
      minHeight: "100vh",
      background: C.darkGreen,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.darkGreen} 0%, ${C.midGreen} 100%)`,
        padding: "24px 20px 20px",
        borderBottom: `2px solid ${C.gold}22`,
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}>
            {Object.values(LANGS).map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: "4px 10px", borderRadius: 20,
                border: `1.5px solid ${lang === l.code ? C.gold : C.gold + "44"}`,
                background: lang === l.code ? C.gold : "transparent",
                color: lang === l.code ? C.darkGreen : C.gold,
                fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em",
              }}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size={42} />
            <div>
              <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {t.brand}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.cream, lineHeight: 1.2 }}>
                {t.appTitle}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        background: C.cream,
        minHeight: "calc(100vh - 130px)",
        borderRadius: "20px 20px 0 0",
        padding: "20px 16px 40px",
        maxWidth: 480, margin: "0 auto",
      }}>

        {/* Field */}
        <Section title={t.fieldSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label={t.hectares}   unit={t.unitHa}    value={ha}       onChange={setHa}      min={0.1} max={50}  step={0.05} />
            <Input label={t.yieldLabel} unit={t.unitTon}   value={yieldTon} onChange={setYield}   min={5}   max={60}  step={1} placeholder="—" required />
            <Input label={t.ageLabel}   unit={t.unitYears} value={treeAge}  onChange={setTreeAge} min={1}   max={50}  step={1} />
          </div>
          <div style={{
            fontSize: 12, color: C.textMuted, padding: "8px 12px",
            background: `${C.gold}15`, borderRadius: 8, marginTop: 4,
          }}>
            📊 {t.totalProd}: <strong style={{ color: C.darkGreen }}>{hasYield ? (Number(yieldTon) * ha).toFixed(1) : "—"} {hasYield ? t.tons : ""}</strong>
            {results.youngTree && <span style={{ color: C.orange, marginLeft: 8 }}>{t.youngTree}</span>}
          </div>
        </Section>

        {/* Soil */}
        <Section title={t.soilSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="P Olsen" unit="ppm" value={pOlsen} onChange={setPOlsen} min={0} max={200}   step={0.5}
              hint={pOlsen < P_THRESHOLD ? t.low : t.sufficient} />
            <Input label="K"       unit="ppm" value={kSoil}  onChange={setKSoil}  min={0} max={2000}  step={5}
              hint={kSoil < 100 ? t.low : kSoil > 300 ? t.high : ""} />
            <Input label="Mg"      unit="ppm" value={mgSoil} onChange={setMgSoil} min={0} max={2000}  step={5} />
            <Input label="Ca"      unit="ppm" value={caSoil} onChange={setCaSoil} min={0} max={10000} step={50} />
          </div>
        </Section>

        {/* Water */}
        <Section title={t.waterSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="N-NO₃" unit="mg/L" value={nWater}  onChange={setNWater}  min={0} max={50}  step={0.1} />
            <Input label="K"     unit="mg/L" value={kWater}  onChange={setKWater}  min={0} max={20}  step={0.1} />
            <Input label="P"     unit="mg/L" value={pWater}  onChange={setPWater}  min={0} max={10}  step={0.1} />
            <Input label="Mg"    unit="mg/L" value={mgWater} onChange={setMgWater} min={0} max={50}  step={0.1} />
            <Input label="Ca"    unit="mg/L" value={caWater} onChange={setCaWater} min={0} max={300} step={1} />
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            {t.waterSupply}: N = <strong>{(IRRIGATION * nWater / 1000).toFixed(1)}</strong> kg ·
            K = <strong>{(IRRIGATION * kWater / 1000).toFixed(1)}</strong> kg ·
            Ca = <strong>{(IRRIGATION * caWater / 1000).toFixed(0)}</strong> kg {t.perFieldYear}
          </div>
        </Section>

        {/* Results */}
        <div style={{ background: C.darkGreen, borderRadius: 16, padding: "18px 16px", marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color: C.gold, textTransform: "uppercase", marginBottom: 14,
          }}>
            {t.resultsSection}
          </div>

          {!hasYield && (
            <div style={{
              textAlign: "center", padding: "20px 16px",
              color: `${C.cream}88`, fontSize: 13, lineHeight: 1.6,
            }}>
              ↑ {t.enterYield}
            </div>
          )}
          <ResultRow element="N"  amount={results.N_out}  period={t.periodN}  t={t} />
          <ResultRow element="K"  amount={results.K_out}  period={t.periodK}  t={t} />
          <ResultRow element="Ca" amount={results.Ca_out} period={t.periodCa} t={t} />
          <ResultRow element="Mg" amount={results.Mg_out} period={t.periodMg} t={t} />
          <ResultRow element="P"  amount={results.P_out}  period={t.periodP}  t={t} />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, paddingTop: 4, lineHeight: 1.8 }}>
          <span style={{ color: C.gold, fontWeight: 700 }}>AgriSci Solutions</span> · agrisci-solutions.com<br />
          {t.footerCTA}{" "}
          <a href="https://agrisci-solutions.com" style={{ color: C.accent, fontWeight: 600 }}>{t.footerLink}</a>
        </div>
      </div>
    </div>
  );
}
