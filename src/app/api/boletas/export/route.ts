import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const formato = searchParams.get('formato') ?? 'csv'
  const estado = searchParams.get('estado')
  const chofer_id = searchParams.get('chofer_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('boletas_peaje')
    .select('*, choferes(nombre, placa_vehiculo)')
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (chofer_id) query = query.eq('chofer_id', chofer_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(b => {
    const d = b.datos_finales ?? b.datos_ia ?? {}
    return {
      'Fecha Registro': new Date(b.created_at).toLocaleDateString('es-PE'),
      'Chofer': b.choferes?.nombre ?? '',
      'Número Boleta': d.numero_boleta ?? '',
      'Serie': d.serie ?? '',
      'Fecha': d.fecha ?? '',
      'Hora': d.hora ?? '',
      'Estación': d.estacion ?? '',
      'Ruta': d.ruta ?? '',
      'Placa': d.placa ?? '',
      'Tipo Vehículo': d.tipo_vehiculo ?? '',
      'Categoría': d.categoria ?? '',
      'Monto (S/)': d.monto ?? '',
      'N° Transacción': d.numero_transaccion ?? '',
      'Empresa Peaje': d.empresa_peaje ?? '',
      'Estado': b.estado,
      'Precisión IA (%)': b.precision_ia ?? '',
      'Campos Editados': (b.campos_editados ?? []).join(', '),
      'Notas': b.notas ?? '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Boletas')

  if (formato === 'xlsx') {
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="boletas.xlsx"',
      },
    })
  }

  const csv = XLSX.utils.sheet_to_csv(ws)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="boletas.csv"',
    },
  })
}
