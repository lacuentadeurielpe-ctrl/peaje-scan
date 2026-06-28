import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcularPrecisionIA } from '@/lib/ai/peaje-ai'

export async function POST(req: NextRequest) {
  try {
    const { chofer_id, imagen_url, datos_ia, datos_finales, campos_editados, notas } = await req.json()

    const precision = calcularPrecisionIA(datos_ia, campos_editados ?? [])

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('boletas_peaje')
      .insert({ chofer_id, imagen_url, datos_ia, datos_finales, campos_editados: campos_editados ?? [], precision_ia: precision, notas })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
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
  return NextResponse.json(data)
}
