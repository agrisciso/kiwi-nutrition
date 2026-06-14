import { useState } from 'react';
import { signIn } from './agrisci-auth';

const C = {
  darkGreen:'#0D2818', midGreen:'#1A3A2A', accent:'#2D5A3D',
  gold:'#C9A84C', cream:'#F5F0E8', creamDark:'#EDE6D8',
  text:'#1A2E1E', textMuted:'#5A7A64', white:'#FFFFFF', red:'#C0392B',
};

const LABELS = {
  el: { email:'Email', password:'Κωδικός', enter:'Είσοδος',
        subtitle:'Εισάγετε τα στοιχεία πρόσβασης',
        forgotPw:'Ξεχάσατε τον κωδικό;', loading:'Σύνδεση...',
        errInvalid:'Λάθος email ή κωδικός.',
        errInactive:'Η συνδρομή σας έχει λήξει. Επικοινωνήστε μαζί μας.',
        errGeneric:'Σφάλμα σύνδεσης. Δοκιμάστε ξανά.',
        footerCTA:'Για αγορά άδειας χρήσης:', },
  en: { email:'Email', password:'Password', enter:'Sign In',
        subtitle:'Enter your credentials',
        forgotPw:'Forgot password?', loading:'Signing in...',
        errInvalid:'Invalid email or password.',
        errInactive:'Your subscription has expired. Contact us.',
        errGeneric:'Login error. Please try again.',
        footerCTA:'To purchase a licence:', },
  it: { email:'Email', password:'Password', enter:'Accedi',
        subtitle:'Inserire le credenziali',
        forgotPw:'Password dimenticata?', loading:'Accesso...',
        errInvalid:'Email o password errati.',
        errInactive:'Il tuo abbonamento è scaduto. Contattaci.',
        errGeneric:'Errore di accesso. Riprovare.',
        footerCTA:'Per acquistare una licenza:', },
  es: { email:'Email', password:'Contraseña', enter:'Iniciar sesión',
        subtitle:'Introduzca sus credenciales',
        forgotPw:'¿Olvidó la contraseña?', loading:'Iniciando...',
        errInvalid:'Email o contraseña incorrectos.',
        errInactive:'Su suscripción ha expirado. Contáctenos.',
        errGeneric:'Error de acceso. Inténtelo de nuevo.',
        footerCTA:'Para adquirir una licencia:', },
};

export default function LoginGate({ onLogin, appIcon, appTitle, lang='el', setLang }) {
  const L = LABELS[lang] || LABELS.el;
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true); setError('');
    try {
      const data = await signIn(email, password);
      onLogin(data.session);
    } catch (err) {
      const msg = err?.message || '';
      setError(msg.includes('Invalid') || msg.includes('invalid') ? L.errInvalid : L.errGeneric);
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.darkGreen,
      fontFamily:"'Inter',-apple-system,sans-serif",
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>

      {setLang && (
        <div style={{ display:'flex', gap:6, marginBottom:32 }}>
          {['el','en','it','es'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding:'4px 10px', borderRadius:20,
              border:`1.5px solid ${lang===l ? C.gold : C.gold+'44'}`,
              background:lang===l ? C.gold : 'transparent',
              color:lang===l ? C.darkGreen : C.gold,
              fontSize:11, fontWeight:700, cursor:'pointer',
            }}>
              {l==='el'?'🇬🇷 ΕΛ':l==='en'?'🇬🇧 EN':l==='it'?'🇮🇹 IT':'🇪🇸 ES'}
            </button>
          ))}
        </div>
      )}

      <div style={{ background:C.cream, borderRadius:20, padding:'36px 28px',
        maxWidth:360, width:'100%', textAlign:'center',
        animation: shake ? 'agrisci-shake 0.4s ease' : 'none' }}>

        {appIcon && (
          <div style={{ width:80, height:80, borderRadius:20, background:C.darkGreen,
            margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {appIcon}
          </div>
        )}

        <div style={{ fontSize:11, color:C.gold, fontWeight:700, letterSpacing:'0.15em',
          textTransform:'uppercase', marginBottom:6 }}>AgriSci Solutions</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>{appTitle}</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:28 }}>{L.subtitle}</div>

        <input type="email" value={email} placeholder={L.email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          onKeyDown={e => e.key==='Enter' && handleLogin()}
          style={{ width:'100%', padding:'12px 16px', borderRadius:10,
            border:`1.5px solid ${error ? C.red : C.creamDark}`,
            background:C.white, fontSize:14, color:C.text, outline:'none',
            boxSizing:'border-box', marginBottom:10 }}
          onFocus={e=>(e.target.style.borderColor=C.gold)}
          onBlur={e=>(e.target.style.borderColor=error?C.red:C.creamDark)}
        />

        <input type="password" value={password} placeholder={L.password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => e.key==='Enter' && handleLogin()}
          style={{ width:'100%', padding:'12px 16px', borderRadius:10,
            border:`1.5px solid ${error ? C.red : C.creamDark}`,
            background:C.white, fontSize:14, color:C.text, outline:'none',
            boxSizing:'border-box', marginBottom:8, letterSpacing:'0.08em' }}
          onFocus={e=>(e.target.style.borderColor=C.gold)}
          onBlur={e=>(e.target.style.borderColor=error?C.red:C.creamDark)}
        />

        {error && <div style={{ color:C.red, fontSize:12, marginBottom:8, fontWeight:600 }}>{error}</div>}

        <button onClick={handleLogin} disabled={loading || !email || !password}
          style={{ width:'100%', padding:'13px', borderRadius:10, background:C.darkGreen,
            color:C.gold, border:'none', fontSize:15, fontWeight:800,
            cursor:loading?'wait':'pointer', letterSpacing:'0.05em', marginTop:4,
            opacity:(!email||!password)?0.6:1 }}>
          {loading ? L.loading : L.enter}
        </button>

        <div style={{ marginTop:14 }}>
          <a href="mailto:agrisciso@gmail.com?subject=Reset password"
            style={{ fontSize:12, color:C.textMuted, textDecoration:'underline' }}>
            {L.forgotPw}
          </a>
        </div>

        <div style={{ marginTop:24, fontSize:11, color:C.textMuted, lineHeight:1.8,
          borderTop:`1px solid ${C.creamDark}`, paddingTop:16 }}>
          {L.footerCTA}{' '}
          <a href="https://agrisci-solutions.com/#tools" style={{ color:C.accent, fontWeight:600 }}>
            agrisci-solutions.com
          </a>
        </div>
      </div>

      <style>{`
        @keyframes agrisci-shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}
