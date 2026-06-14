'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="text-center p-8 bg-[#131B2E] border border-[#1E293B] rounded-xl">
          <h2 className="text-xl font-bold mb-2 text-[#F4F6FB]">¡Listo! 🎉</h2>
          <p className="text-[#8C97B5]">Revisa tu correo para confirmar tu cuenta.</p>
          <a href="/login" className="text-[#00E5C7] hover:underline mt-4 block">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
      <div className="w-full max-w-md space-y-8 p-8 bg-[#131B2E] border border-[#1E293B] rounded-xl">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-md bg-[#00E5C7] flex items-center justify-center text-[#04342C] font-semibold text-lg mb-3">L</div>
          <h2 className="text-2xl font-bold text-center text-[#F4F6FB]">Crear cuenta</h2>
          <p className="text-sm text-[#8C97B5] mt-1">LifeOS — tu copiloto de vida</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8C97B5] mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-md text-[#F4F6FB]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8C97B5] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-md text-[#F4F6FB]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8C97B5] mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-md text-[#F4F6FB]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E5C7] text-[#04342C] font-medium py-2 rounded-md hover:bg-[#00E5C7]/80 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8C97B5]">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-[#00E5C7] hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  )
}