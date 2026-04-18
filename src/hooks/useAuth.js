import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function cargarConfiguracionUsuario(user_id) {
  const { data } = await supabase
    .from('configuracion')
    .select('porcentaje, objetivo_diario')
    .eq('user_id', user_id)
    .maybeSingle()

  if (data) {
    localStorage.setItem('porcentaje', String(data.porcentaje ?? 45))
    localStorage.setItem('objetivoDiario', String(data.objetivo_diario ?? ''))
  } else {
    localStorage.setItem('porcentaje', '45')
    localStorage.setItem('objetivoDiario', '')
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) cargarConfiguracionUsuario(u.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function logout() {
    localStorage.removeItem('porcentaje')
    localStorage.removeItem('objetivoDiario')
    await supabase.auth.signOut()
  }

  return { user, loading, logout }
}