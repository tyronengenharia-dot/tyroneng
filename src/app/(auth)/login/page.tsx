'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleLogin() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const next = searchParams.get('next') ?? '/'
    router.push(next)
  }


  useEffect(() => {
  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push('/login')
    }
  }

  checkUser()
}, [])

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
          className="w-full p-2 bg-[#222] rounded"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-yellow-500 text-black p-2 rounded"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

      </div>
    </div>
  )
}