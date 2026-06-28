import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil } from '@/lib/auth'
import { COLUMNAS_EXPORT } from '@/lib/campos'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const formato = searchParams.get('formato') ?? 'csv'
  const adelanto_id = searchParams.get('adelanto_id')
  const estado = searchParams.get('estado')

  const supabase = createAdminClient()
  let query = supabase
    .from('boletas_peaje')
    .select('*, adelantos(*)')
    .order('created_at', { ascending: false })

  if (perfil.rol === 'chofer') query = query.eq('chofer_id', perfil.id)
  if (adelanto_id) query = query.eq('adelanto_id', adelanto_id)
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(b => {
    const fin = (b.datos_finales ?? {}) as Record<string, unknown>
    const adel = (b.adelantos ?? {}) as Record<string, unknown>
    const row: Record<string, unknown> = {}
    for (const col of COLUMNAS_EXPORT) {
      const fuente = col.origen === 'adelanto' ? adel : fin
      row[col.header] = fuente[col.key] ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNAS_EXPORT.map(c => c.header) })
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
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="boletas.csv"',
    },
  })
}
