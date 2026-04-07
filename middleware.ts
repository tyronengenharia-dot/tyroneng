import { supabase } from '@/lib/supabaseClient'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas — qualquer outra rota exige login
const PUBLIC_ROUTES = ['/login', '/cadastro', '/esqueci-senha', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar rotas públicas e arquivos estáticos
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const ROLE_ROUTES: Record<string, string[]> = {
  '/acervotecnico':      ['admin', 'gestor', 'funcionario'],
  '/agenda':      ['admin'],
  '/api':      ['admin'],
  '/compras':      ['admin', 'funcionario'],
  '/contratos':      ['admin'],
  '/estoque':      ['admin', 'funcionario'],
  '/financeiro':      ['admin'],
  '/folha':      ['admin'],
  '/gestao-de-pessoas': ['admin'],
  '/licitacao':      ['admin', 'gestor'],
  '/notas-fiscais':      ['admin', 'funcionario'],
  '/obras':    ['admin', 'funcionario'],
  '/propostas':      ['admin'],
  '/':      ['admin'],
}

  // Cria resposta mutável para que o Supabase possa atualizar os cookies de sessão
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verifica sessão (também renova o token se necessário)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Sem sessão → redireciona para login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname) // preserva destino original
    return NextResponse.redirect(loginUrl)
  }

  // depois de confirmar que o user existe...
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role: string } | null)?.role ?? 'viewer'

  const rotaRestrita = Object.entries(ROLE_ROUTES).find(([rota]) =>
    pathname.startsWith(rota)
  )

  if (rotaRestrita && !rotaRestrita[1].includes(role)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Aplica o middleware em todas as rotas exceto assets do Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}