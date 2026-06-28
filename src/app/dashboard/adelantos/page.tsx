import { createAdminClient } from '@/lib/supabase/admin'
import AdelantosManager from '@/components/AdelantosManager'

export default async function AdelantosPage() {
  const supabase = createAdminClient()
  const [{ data: adelantos }, { data: choferes }, { data: boletas }] = await Promise.all([
    supabase.from('adelantos').select('*, perfiles(nombre, placa_vehiculo)').order('created_at', { ascending: false }),
    supabase.from('perfiles').select('id, nombre, placa_vehiculo').eq('rol', 'chofer').eq('activo', true).order('nombre'),
    supabase.from('boletas_peaje').select('adelanto_id, monto_pagado, estado'),
  ])

  // Calcular gastado por adelanto
  const gastadoPorAdelanto: Record<string, number> = {}
  for (const b of boletas ?? []) {
    if (b.adelanto_id && b.estado !== 'rechazado') {
      gastadoPorAdelanto[b.adelanto_id] = (gastadoPorAdelanto[b.adelanto_id] ?? 0) + Number(b.monto_pagado || 0)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Adelantos</h1>
        <p className="text-sm text-gray-500 mt-1">Asigna dinero a cada chofer por viaje y controla el saldo</p>
      </div>
      <AdelantosManager
        initialAdelantos={adelantos ?? []}
        choferes={choferes ?? []}
        gastadoPorAdelanto={gastadoPorAdelanto}
      />
    </div>
  )
}
