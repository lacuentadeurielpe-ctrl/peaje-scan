import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil } from '@/lib/auth'

// POST: guardar boleta (chofer o superadmin)
export async function POST(req: NextRequest) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { adelanto_id, imagen_url, datos_ia, datos_finales, campos_editados, nota_chofer } = await req.json()

  const totalCampos = Object.keys(datos_ia ?? {}).length || 1
  const editados = (campos_editados ?? []).length
  const precision = Math.round(((totalCampos - editados) / totalCampos) * 100)

  // chofer_id: si es chofer, el suyo. Si es superadmin, el del adelanto.
  let choferId = perfil.id
  const supabase = createAdminClient()
  if (perfil.rol === 'superadmin' && adelanto_id) {
    const { data: ad } = await supabase.from('adelantos').select('chofer_id').eq('id', adelanto_id).single()
    if (ad) choferId = ad.chofer_id
  }

  const monto = Number(datos_finales?.monto_pagado) || null
  const fecha = parseFecha(datos_finales?.fecha_documento)

  const { data, error } = await supabase
    .from('boletas_peaje')
    .insert({
      chofer_id: choferId,
      adelanto_id: adelanto_id || null,
      imagen_url,
      monto_pagado: monto,
      fecha_documento: fecha,
      datos_ia,
      datos_finales,
      campos_editados: campos_editados ?? [],
      precision_ia: precision,
      nota_chofer: nota_chofer || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// GET: superadmin ve todas; chofer ve solo las suyas
export async function GET(req: NextRequest) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const adelanto_id = searchParams.get('adelanto_id')
  const marcado_error = searchParams.get('marcado_error')

  const supabase = createAdminClient()
  let query = supabase
    .from('boletas_peaje')
    .select('*, perfiles(nombre, placa_vehiculo), adelantos(n_adelanto, ruta, bus)')
    .order('created_at', { ascending: false })

  if (perfil.rol === 'chofer') query = query.eq('chofer_id', perfil.id)
  if (estado) query = query.eq('estado', estado)
  if (adelanto_id) query = query.eq('adelanto_id', adelanto_id)
  if (marcado_error === 'true') query = query.eq('marcado_error', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Convierte DD/MM/YYYY a YYYY-MM-DD; null si no es válida
function parseFecha(f: unknown): string | null {
  if (!f || typeof f !== 'string') return null
  const m = f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f
  return null
}
