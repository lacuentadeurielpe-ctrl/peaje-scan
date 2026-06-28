import { redirect } from 'next/navigation'
import { getPerfil } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Sidebar, { type NavItem } from '@/components/Sidebar'

const NAV: NavItem[] = [
  { href: '/portal', label: 'Mis Adelantos', icon: 'adelantos' },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'chofer') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={NAV} userEmail={user?.email ?? ''} badge="Chofer" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
