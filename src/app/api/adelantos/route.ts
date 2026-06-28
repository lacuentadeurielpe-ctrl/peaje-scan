import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil, requireSuperadmin } from '@/lib/auth'

// GET: superadmin ve todos; chofer ve solo los suyos
export async function GET(req: NextRequest) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const chofer_id = searchParams.get('chofer_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('adelantos')
    .select('*, perfiles(nombre, placa_vehiculo)')
    .order('created_at', { ascending: false })

  if (perfil.rol === 'chofer') {
    query = query.eq('chofer_id', perfil.id)
  } else if (chofer_id) {
    query = query.eq('chofer_id', chofer_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: solo superadmin crea adelantos
export async function POST(req: NextRequest) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  if (!body.chofer_id) return NextResponse.json({ error: 'Chofer requerido' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('adelantos')
    .insert({
      chofer_id: body.chofer_id,
      n_adelanto: body.n_adelanto || null,
      codigo_spring: body.codigo_spring || null,
      persona: body.persona || null,
      bus: body.bus || null,
      ruta: body.ruta || null,
      almacen_entrega: body.almacen_entrega || 'ALMACEN MATRIZ',
      centro_costo: body.centro_costo || null,
      fecha_liquidacion: body.fecha_liquidacion || null,
      monto_asignado: Number(body.monto_asignado) || 0,
      notas: body.notas || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
