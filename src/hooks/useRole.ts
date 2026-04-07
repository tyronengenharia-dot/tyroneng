import { supabase } from "@/lib/supabaseClient"
import { useState, useEffect } from "react"

// hooks/useRole.ts
export function useRole() {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => setRole(p?.role ?? null))
    })
  }, [])

  return {
    role,
    isAdmin:  role === 'admin',
    isGestor: role === 'admin' || role === 'gestor',
  }
}