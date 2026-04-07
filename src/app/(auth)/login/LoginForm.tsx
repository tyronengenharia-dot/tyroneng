'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleLogin() {
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErro('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    const next = searchParams.get('next') ?? '/'
    router.push(next)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-[#111] p-8 rounded-2xl w-full max-w-sm space-y-4">

        <h1 className="text-xl font-semibold">Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 bg-[#222] rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full p-2 bg-[#222] rounded"
        />

        {erro && <p className="text-red-400 text-sm">{erro}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-yellow-500 text-black p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

      </div>
    </div>
  )
}
