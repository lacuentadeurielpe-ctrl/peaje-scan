import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, Wallet, Receipt, Flag, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [{ count: choferes }, { data: adelantos }, { data: boletas }, { count: conError }] = await Promise.all([
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'chofer'),
    supabase.from('adelantos').select('monto_asignado, estado'),
    supabase.from('boletas_peaje').select('monto_pagado, estado'),
    supabase.from('boletas_peaje').select('*', { count: 'exact', head: true }).eq('marcado_error', true),
  ])

  const totalAsignado = (adelantos ?? []).reduce((s, a) => s + Number(a.monto_asignado || 0), 0)
  const totalGastado = (boletas ?? []).filter(b => b.estado !== 'rechazado').reduce((s, b) => s + Number(b.monto_pagado || 0), 0)
  const abiertos = (adelantos ?? []).filter(a => a.estado === 'abierto').length

  const stats = [
    { label: 'Choferes', value: choferes ?? 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Adelantos abiertos', value: abiertos, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total asignado', value: `S/ ${totalAsignado.toFixed(2)}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total gastado', value: `S/ ${totalGastado.toFixed(2)}`, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel General</h1>
          <p className="text-sm text-gray-500 mt-1">Rendición de cuentas de peajes</p>
        </div>
        <Link href="/dashboard/adelantos" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Nuevo Adelanto
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}><Icon className={color} size={20} /></div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {(conError ?? 0) > 0 && (
        <Link href="/dashboard/boletas?error=1" className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors">
          <Flag className="text-orange-600" size={20} />
          <span className="text-sm text-orange-800 font-medium">
            {conError} boleta(s) marcada(s) con error por choferes — revísalas
          </span>
        </Link>
      )}
    </div>
  )
}
