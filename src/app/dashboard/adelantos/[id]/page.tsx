import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AdelantoDetalle from '@/components/AdelantoDetalle'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: adelanto } = await supabase
    .from('adelantos').select('*, perfiles(nombre, placa_vehiculo)').eq('id', id).single()
  if (!adelanto) notFound()

  const { data: boletas } = await supabase
    .from('boletas_peaje').select('*').eq('adelanto_id', id).order('created_at', { ascending: false })

  const gastado = (boletas ?? []).filter(b => b.estado !== 'rechazado').reduce((s, b) => s + Number(b.monto_pagado || 0), 0)
  const saldo = Number(adelanto.monto_asignado) - gastado

  return (
    <div className="p-8">
      <AdelantoDetalle adelanto={adelanto} boletas={boletas ?? []} gastado={gastado} saldo={saldo} rol="superadmin" />
    </div>
  )
}
