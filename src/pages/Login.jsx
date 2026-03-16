import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-6xl">🚕</span>
          <h1 className="font-black text-3xl text-gray-800 mt-2">TaxiLog</h1>
          <p className="text-gray-400 mt-1">Tu gestor de facturación</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-yellow-400 text-gray-800"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-yellow-400 text-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-900 font-bold py-3 rounded-xl transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}