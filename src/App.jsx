import { useState, useEffect } from "react"
import { supabase } from "./supabase.js"
import DiloAuth from "./DiloAuth.jsx"
import DiloApp from "./DiloApp.jsx"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProfile = async (session) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        // Profile missing — use defaults from session metadata
        const meta = session.user.user_metadata || {}
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: meta.rol || 'admin',
          nombre: `${meta.nombre || ''} ${meta.apellido || ''}`.trim() || session.user.email,
        })
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: profile.rol || 'admin',
          nombre: profile.nombre || '',
          apellido: profile.apellido || '',
          teams_email: profile.teams_email || '',
          plan: profile.plan || '',
        })
      }
    } catch(e) {
      console.error('Profile load error:', e)
      // Fallback — still let them in
      setUser({
        id: session.user.id,
        email: session.user.email,
        role: 'admin',
        nombre: session.user.email,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setUser(null); setLoading(false); }
      if (event === 'SIGNED_IN' && session) loadProfile(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0d0b08", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(240,236,224,0.3)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )

  if (!user) return <DiloAuth onLogin={setUser} />
  return <DiloApp user={user} onLogout={() => { supabase.auth.signOut(); setUser(null); }} />
}
