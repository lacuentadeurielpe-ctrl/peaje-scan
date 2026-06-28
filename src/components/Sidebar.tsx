'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Route, LayoutDashboard, Wallet, FileText, Users, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  adelantos: Wallet,
  boletas: FileText,
  usuarios: Users,
}

export interface NavItem { href: string; label: string; icon: keyof typeof ICONS }

export default function Sidebar({ items, userEmail, badge }: { items: NavItem[]; userEmail: string; badge?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Route className="text-blue-600" size={22} />
          <span className="font-bold text-gray-900 text-lg">PeajeScan</span>
        </div>
        {badge && <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{badge}</span>}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon]
          const active = pathname === href || (href !== '/dashboard' && href !== '/portal' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 px-3 mb-2 truncate">{userEmail}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
