import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { requireChofer } from '@/lib/auth'
import Link from 'next/link'
import { Wallet, ChevronRight } from 'lucide-react'

function dinero(n: number) { return `S/ ${n.toFixed(2)}` }

export default async function PortalHome() {
  const perfil = await requireChofer()
  if (!perfil) redirect('/login')

  const supabase = createAdminClient()
  const { data: adelantos } = await supabase
    .from('adelantos').select('*').eq('chofer_id', perfil.id).order('created_at', { ascending: false })
  const { data: boletas } = await supabase
    .from('boletas_peaje').select('adelanto_id, monto_pagado, estado').eq('chofer_id', perfil.id)

  const gastadoPor: Record<string, number> = {}
  for (const b of boletas ?? []) {
    if (b.adelanto_id && b.estado !== 'rechazado') {
      gastadoPor[b.adelanto_id] = (gastadoPor[b.adelanto_id] ?? 0) + Number(b.monto_pagado || 0)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hola, {perfil.nombre}</h1>
        <p className="text-sm text-gray-500 mt-1">Estos son tus adelantos. Entra a uno para subir tus boletas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(adelantos ?? []).map(a => {
          const gastado = gastadoPor[a.id] ?? 0
          const saldo = Number(a.monto_asignado) - gastado
          return (
            <Link key={a.id} href={`/portal/adelantos/${a.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex p-2 rounded-lg bg-blue-50"><Wallet className="text-blue-600" size={18} /></div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={18} />
              </div>
              <div className="font-semibold text-gray-900">Adelanto {a.n_adelanto ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.bus ? `Bus ${a.bus}` : ''}{a.ruta ? ` · ${a.ruta}` : ''}</div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
                <div><div className="text-[10px] text-gray-400 uppercase">Recibí</div><div className="text-sm font-semibold text-gray-700">{dinero(Number(a.monto_asignado))}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase">Gasté</div><div className="text-sm font-semibold text-gray-700">{dinero(gastado)}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase">Debo</div><div className={`text-sm font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{dinero(Math.abs(saldo))}</div></div>
              </div>
            </Link>
          )
        })}
        {(adelantos ?? []).length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
            Aún no tienes adelantos asignados. El administrador te asignará uno.
          </div>
        )}
      </div>
    </div>
  )
}
