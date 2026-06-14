import { useState } from "react";

const C = {
  darkGreen: "#0D2818", midGreen: "#1A3A2A", accent: "#2D5A3D",
  gold: "#C9A84C", cream: "#F5F0E8", creamDark: "#EDE6D8",
  text: "#1A2E1E", textMuted: "#5A7A64", white: "#FFFFFF",
  orange: "#E67E22", ok: "#27AE60",
};

// ─── EXACT Excel formulas from Υπολογισμός Θρέψης sheet ─────────────────────
// Irrigation = ha * 4000 (internal, not shown to user)
// P:  >21→0 | <11→(y*10)/37.5 | 11-21→((y*10)/37.5 - Pw*irr/1000)*ha
// K:  >300→0 | <200→(y*74)/37.5 | 200-300→((y*74)/37.5 - Kw*irr/1000)*ha
// Ca: >6000→0 | <3500→(40*11)/37.5=11.733 | 3500-6000→((y*11)/37.5 - Caw*irr/1000)*ha
// Mg: >300→0 | <200→(y*5)/37.5 | 200-300→((y*5)/37.5 - Mgw*irr/1000)*ha
// N:  age<4→((25*120)/37.5 - Nw*irr/1000)*ha | else→MAX(((y*120)/37.5 - Nw*irr/1000)*ha, 0)

function calcNutrition({ ha, yieldTon: y, treeAge, pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater }) {
  const irr = ha * 4000;

  // P
  let P;
  if (pOlsen > 21)      P = 0;
  else if (pOlsen < 11) P = Math.max((y * 10) / 37.5, 0);
  else                  P = Math.max(((y * 10) / 37.5 - (pWater * irr) / 1000) * ha, 0);

  // K
  let K;
  if (kSoil > 300)      K = 0;
  else if (kSoil < 200) K = Math.max((y * 74) / 37.5, 0);
  else                  K = Math.max(((y * 74) / 37.5 - (kWater * irr) / 1000) * ha, 0);

  // Ca
  let Ca;
  if (caSoil > 6000)      Ca = 0;
  else if (caSoil < 3500) Ca = (40 * 11) / 37.5;  // fixed 11.733
  else                    Ca = Math.max(((y * 11) / 37.5 - (caWater * irr) / 1000) * ha, 0);

  // Mg
  let Mg;
  if (mgSoil > 300)      Mg = 0;
  else if (mgSoil < 200) Mg = Math.max((y * 5) / 37.5, 0);
  else                   Mg = Math.max(((y * 5) / 37.5 - (mgWater * irr) / 1000) * ha, 0);

  // N
  let N;
  if (treeAge < 4) N = ((25 * 120) / 37.5 - (nWater * irr) / 1000) * ha;
  else             N = Math.max(((y * 120) / 37.5 - (nWater * irr) / 1000) * ha, 0);

  return { N, K, P, Ca, Mg };
}

// ─── Translations ────────────────────────────────────────────────────────────
const LANGS = {
  el: {
    code: "el", flag: "🇬🇷", label: "ΕΛ",
    appTitle: "Υπολογιστής Θρέψης Ακτινιδίου", brand: "AgriSci Solutions",
    fieldSection: "🌿 Στοιχεία Χωραφιού", soilSection: "🪨 Ανάλυση Εδάφους (0-30 cm)",
    waterSection: "💧 Ανάλυση Νερού", resultsSection: "📋 Πρόγραμμα Θρέψης",
    hectares: "Εκτάρια", yieldLabel: "Εκτίμηση Παραγωγής", ageLabel: "Ηλικία Δένδρων",
    unitHa: "ha", unitTon: "tn/ha", unitYears: "έτη",
    totalProd: "Σύνολο παραγωγής", tons: "τόνοι",
    youngTree: "⚠ Νεαρό δένδρο (<4 ετών)",
    low: "⬇ χαμηλό", sufficient: "✓ επαρκές", high: "⬆ υψηλό",
    perField: "kg / χωράφι", adequate: "Επαρκές — δεν απαιτείται",
    calcBtn: "Υπολογισμός",
    enterYield: "Εισάγετε την εκτιμώμενη παραγωγή για να ενεργοποιηθεί ο υπολογισμός",
    periodN:  "40% βραδείας κατά την έκπτυξη · εβδομαδιαία ανθοφορία → τέλη Ιουνίου",
    periodK:  "2-3 εβδομαδιαίες εφαρμογές: αρχές Ιουλίου →",
    periodCa: "7-8 εβδομαδιαίες: τελευταία εβδ. ανθοφορίας → +50 ημέρες",
    periodMg: "2-3 εφαρμογές: 15 Ιουνίου → 1 Ιουλίου",
    periodP:  "1-2 εφαρμογές: έκπτυξη → ανθοφορία",
    footerCTA: "Για προσωπική αξιολόγηση χωραφιού:", footerLink: "Επικοινωνήστε μαζί μας",
  },
  en: {
    code: "en", flag: "🇬🇧", label: "EN",
    appTitle: "Kiwifruit Nutrition Calculator", brand: "AgriSci Solutions",
    fieldSection: "🌿 Field Data", soilSection: "🪨 Soil Analysis (0-30 cm)",
    waterSection: "💧 Water Analysis", resultsSection: "📋 Nutrition Programme",
    hectares: "Hectares", yieldLabel: "Estimated Yield", ageLabel: "Tree Age",
    unitHa: "ha", unitTon: "tn/ha", unitYears: "years",
    totalProd: "Total production", tons: "tons",
    youngTree: "⚠ Young tree (<4 years)",
    low: "⬇ low", sufficient: "✓ sufficient", high: "⬆ high",
    perField: "kg / field", adequate: "Adequate — not required",
    calcBtn: "Calculate",
    enterYield: "Enter estimated yield to enable the calculation",
    periodN:  "40% slow-release at budbreak · weekly flowering → end June",
    periodK:  "2-3 weekly applications: early July onwards",
    periodCa: "7-8 weekly: last week of flowering → +50 days",
    periodMg: "2-3 applications: 15 June → 1 July",
    periodP:  "1-2 applications: budbreak → flowering",
    footerCTA: "For personalised orchard assessment:", footerLink: "Contact us",
  },
  it: {
    code: "it", flag: "🇮🇹", label: "IT",
    appTitle: "Calcolatore Nutrizione Actinidia", brand: "AgriSci Solutions",
    fieldSection: "🌿 Dati Campo", soilSection: "🪨 Analisi Suolo (0-30 cm)",
    waterSection: "💧 Analisi Acqua", resultsSection: "📋 Piano Nutrizionale",
    hectares: "Ettari", yieldLabel: "Produzione Stimata", ageLabel: "Età Piante",
    unitHa: "ha", unitTon: "t/ha", unitYears: "anni",
    totalProd: "Produzione totale", tons: "tonnellate",
    youngTree: "⚠ Pianta giovane (<4 anni)",
    low: "⬇ basso", sufficient: "✓ sufficiente", high: "⬆ alto",
    perField: "kg / campo", adequate: "Sufficiente — non necessario",
    calcBtn: "Calcola",
    enterYield: "Inserire la produzione stimata per abilitare il calcolo",
    periodN:  "40% lenta cessione alla ripresa · settimanale fioritura → fine giugno",
    periodK:  "2-3 applicazioni settimanali: inizio luglio in poi",
    periodCa: "7-8 settimane: ultima sett. fioritura → +50 giorni",
    periodMg: "2-3 applicazioni: 15 giugno → 1 luglio",
    periodP:  "1-2 applicazioni: ripresa vegetativa → fioritura",
    footerCTA: "Per una valutazione personalizzata:", footerLink: "Contattaci",
  },
  es: {
    code: "es", flag: "🇪🇸", label: "ES",
    appTitle: "Calculadora de Nutrición Kiwi", brand: "AgriSci Solutions",
    fieldSection: "🌿 Datos del Campo", soilSection: "🪨 Análisis de Suelo (0-30 cm)",
    waterSection: "💧 Análisis de Agua", resultsSection: "📋 Programa de Nutrición",
    hectares: "Hectáreas", yieldLabel: "Producción Estimada", ageLabel: "Edad Árboles",
    unitHa: "ha", unitTon: "t/ha", unitYears: "años",
    totalProd: "Producción total", tons: "toneladas",
    youngTree: "⚠ Árbol joven (<4 años)",
    low: "⬇ bajo", sufficient: "✓ suficiente", high: "⬆ alto",
    perField: "kg / campo", adequate: "Suficiente — no requerido",
    calcBtn: "Calcular",
    enterYield: "Introduzca la producción estimada para habilitar el cálculo",
    periodN:  "40% liberación lenta en brotación · semanal floración → finales junio",
    periodK:  "2-3 aplicaciones semanales: principios julio en adelante",
    periodCa: "7-8 semanas: última sem. floración → +50 días",
    periodMg: "2-3 aplicaciones: 15 junio → 1 julio",
    periodP:  "1-2 aplicaciones: brotación → floración",
    footerCTA: "Para evaluación personalizada del huerto:", footerLink: "Contáctenos",
  },
};

function fmt(v) { return (v < 0.01) ? "0" : v.toFixed(1); }

function Input({ label, unit, value, onChange, min, max, step = 1, hint, placeholder, required }) {
  const isEmpty = value === "" || value === 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
        {required && <span style={{ color: C.gold, marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6, opacity: 0.75 }}>{hint}</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" value={value} step={step} min={min} max={max} placeholder={placeholder || ""}
          onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8,
            border: `1.5px solid ${required && isEmpty ? C.gold + "88" : C.creamDark}`,
            background: C.white, color: C.text, fontSize: 15, fontWeight: 500, outline: "none",
          }}
          onFocus={e => (e.target.style.borderColor = C.gold)}
          onBlur={e  => (e.target.style.borderColor = (required && isEmpty) ? C.gold + "88" : C.creamDark)}
        />
        {unit && <span style={{ fontSize: 12, color: C.textMuted, minWidth: 44, fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.cream, borderRadius: 14, padding: "18px 20px", marginBottom: 16, border: `1px solid ${C.creamDark}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ResultRow({ element, amount, period, t }) {
  const isZero = amount <= 0.005;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: C.white, borderRadius: 10, marginBottom: 8, border: `1.5px solid ${C.creamDark}` }}>
      <div style={{ minWidth: 40, height: 40, borderRadius: 8, background: isZero ? C.creamDark : C.darkGreen, color: isZero ? C.textMuted : C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
        {element}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: isZero ? 18 : 22, fontWeight: 800, color: isZero ? C.textMuted : C.text }}>
            {isZero ? "—" : fmt(amount)}
          </span>
          {!isZero && <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{t.perField}</span>}
          {isZero && <span style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>{t.adequate}</span>}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{period}</div>
      </div>
    </div>
  );
}

function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
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

export default function NutritionCalculator() {
  const [lang, setLang] = useState("el");
  const t = LANGS[lang];

  const [ha,       setHa]      = useState(1.65);
  const [yieldTon, setYield]   = useState("");
  const [treeAge,  setTreeAge] = useState(10);
  const [pOlsen,   setPOlsen]  = useState(15);
  const [kSoil,    setKSoil]   = useState(250);
  const [mgSoil,   setMgSoil]  = useState(250);
  const [caSoil,   setCaSoil]  = useState(3000);
  const [pWater,   setPWater]  = useState(0.8);
  const [kWater,   setKWater]  = useState(1.2);
  const [mgWater,  setMgWater] = useState(1.2);
  const [caWater,  setCaWater] = useState(53);
  const [nWater,   setNWater]  = useState(5.9);

  const [results,    setResults]    = useState(null);
  const [calculated, setCalculated] = useState(false);

  const hasYield = yieldTon !== "" && Number(yieldTon) > 0;

  const markDirty = (fn) => (v) => { fn(v); setCalculated(false); };

  function calculate() {
    if (!hasYield) return;
    const r = calcNutrition({ ha, yieldTon: Number(yieldTon), treeAge, pOlsen, kSoil, mgSoil, caSoil, pWater, kWater, mgWater, caWater, nWater });
    setResults(r);
    setCalculated(true);
  }

  // Soil hint helpers
  const kHint  = kSoil  > 300 ? `⬆ ${t.high} → K=0`  : kSoil  < 200 ? t.low  : t.sufficient;
  const mgHint = mgSoil > 300 ? `⬆ ${t.high} → Mg=0` : mgSoil < 200 ? t.low  : t.sufficient;
  const pHint  = pOlsen > 21  ? `⬆ → P=0`            : pOlsen < 11  ? t.low  : t.sufficient;
  const caHint = caSoil > 6000? `⬆ → Ca=0`           : caSoil < 3500? t.low  : t.sufficient;

  return (
    <div style={{ minHeight: "100vh", background: C.darkGreen, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.darkGreen} 0%, ${C.midGreen} 100%)`, padding: "24px 20px 20px", borderBottom: `2px solid ${C.gold}22` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}>
            {Object.values(LANGS).map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${lang === l.code ? C.gold : C.gold + "44"}`, background: lang === l.code ? C.gold : "transparent", color: lang === l.code ? C.darkGreen : C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size={42} />
            <div>
              <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.brand}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.cream, lineHeight: 1.2 }}>{t.appTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: C.cream, minHeight: "calc(100vh - 130px)", borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", maxWidth: 480, margin: "0 auto" }}>

        {/* Field */}
        <Section title={t.fieldSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label={t.hectares}   unit={t.unitHa}    value={ha}       onChange={markDirty(setHa)}      min={0.1} max={50}  step={0.05} />
            <Input label={t.yieldLabel} unit={t.unitTon}   value={yieldTon} onChange={markDirty(setYield)}   min={1}   max={100} step={1} placeholder="—" required />
            <Input label={t.ageLabel}   unit={t.unitYears} value={treeAge}  onChange={markDirty(setTreeAge)} min={1}   max={50}  step={1} />
          </div>
          {hasYield && (
            <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 12px", background: `${C.gold}15`, borderRadius: 8, marginTop: 4 }}>
              📊 {t.totalProd}: <strong style={{ color: C.darkGreen }}>{(Number(yieldTon) * ha).toFixed(1)} {t.tons}</strong>
              {treeAge < 4 && <span style={{ color: C.orange, marginLeft: 8 }}>{t.youngTree}</span>}
            </div>
          )}
        </Section>

        {/* Soil */}
        <Section title={t.soilSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="P Olsen" unit="ppm" value={pOlsen} onChange={markDirty(setPOlsen)} min={0} max={200}   step={0.5} hint={pHint} />
            <Input label="K"       unit="ppm" value={kSoil}  onChange={markDirty(setKSoil)}  min={0} max={2000}  step={5}   hint={kHint} />
            <Input label="Mg"      unit="ppm" value={mgSoil} onChange={markDirty(setMgSoil)} min={0} max={2000}  step={5}   hint={mgHint} />
            <Input label="Ca"      unit="ppm" value={caSoil} onChange={markDirty(setCaSoil)} min={0} max={10000} step={50}  hint={caHint} />
          </div>
        </Section>

        {/* Water */}
        <Section title={t.waterSection}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="N-NO₃" unit="mg/L" value={nWater}  onChange={markDirty(setNWater)}  min={0} max={50}  step={0.1} />
            <Input label="K"     unit="mg/L" value={kWater}  onChange={markDirty(setKWater)}  min={0} max={20}  step={0.1} />
            <Input label="P"     unit="mg/L" value={pWater}  onChange={markDirty(setPWater)}  min={0} max={10}  step={0.1} />
            <Input label="Mg"    unit="mg/L" value={mgWater} onChange={markDirty(setMgWater)} min={0} max={50}  step={0.1} />
            <Input label="Ca"    unit="mg/L" value={caWater} onChange={markDirty(setCaWater)} min={0} max={300} step={1} />
          </div>
        </Section>

        {/* Calculate button */}
        <button
          onClick={calculate}
          disabled={!hasYield}
          style={{
            width: "100%", padding: "15px", borderRadius: 12,
            background: !hasYield ? C.creamDark : calculated ? C.accent : C.gold,
            color: !hasYield ? C.textMuted : calculated ? C.cream : C.darkGreen,
            border: "none", fontSize: 16, fontWeight: 800,
            cursor: hasYield ? "pointer" : "not-allowed",
            marginBottom: 16, letterSpacing: "0.05em",
            boxShadow: hasYield && !calculated ? `0 4px 16px ${C.gold}44` : "none",
          }}
        >
          {!hasYield ? `↑ ${t.enterYield.split(" ").slice(0, 3).join(" ")}...` : `⚗️ ${t.calcBtn}`}
        </button>

        {/* Results */}
        <div style={{ background: C.darkGreen, borderRadius: 16, padding: "18px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, textTransform: "uppercase", marginBottom: 14 }}>
            {t.resultsSection}
          </div>
          {!results ? (
            <div style={{ textAlign: "center", padding: "20px 16px", color: `${C.cream}55`, fontSize: 13, lineHeight: 1.6 }}>
              {t.enterYield}
            </div>
          ) : (
            <>
              <ResultRow element="N"  amount={results.N}  period={t.periodN}  t={t} />
              <ResultRow element="K"  amount={results.K}  period={t.periodK}  t={t} />
              <ResultRow element="Ca" amount={results.Ca} period={t.periodCa} t={t} />
              <ResultRow element="Mg" amount={results.Mg} period={t.periodMg} t={t} />
              <ResultRow element="P"  amount={results.P}  period={t.periodP}  t={t} />
            </>
          )}
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
