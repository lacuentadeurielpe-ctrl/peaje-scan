import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('boletas_peaje')
    .select('*, perfiles(nombre, placa_vehiculo), adelantos(n_adelanto, ruta, bus)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  if (perfil.rol === 'chofer' && data.chofer_id !== perfil.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  // Verificar propiedad si es chofer
  const { data: actual } = await supabase.from('boletas_peaje').select('chofer_id').eq('id', id).single()
  if (!actual) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (perfil.rol === 'chofer' && actual.chofer_id !== perfil.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}

  // El chofer solo puede: editar datos, marcar error, agregar nota
  if (perfil.rol === 'chofer') {
    if ('datos_finales' in body) {
      updates.datos_finales = body.datos_finales
      updates.monto_pagado = Number(body.datos_finales?.monto_pagado) || null
      updates.fecha_documento = parseFecha(body.datos_finales?.fecha_documento)
    }
    if ('campos_editados' in body) updates.campos_editados = body.campos_editados
    if ('marcado_error' in body) updates.marcado_error = body.marcado_error
    if ('nota_chofer' in body) updates.nota_chofer = body.nota_chofer
  } else {
    // superadmin puede todo
    Object.assign(updates, body)
    if ('datos_finales' in body) {
      updates.monto_pagado = Number(body.datos_finales?.monto_pagado) || null
      updates.fecha_documento = parseFecha(body.datos_finales?.fecha_documento)
    }
  }

  const { data, error } = await supabase.from('boletas_peaje').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: solo superadmin (el chofer marca con error, no borra)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await getPerfil()
  if (!perfil || perfil.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo el superadmin puede eliminar boletas' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('boletas_peaje').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function parseFecha(f: unknown): string | null {
  if (!f || typeof f !== 'string') return null
  const m = f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f
  return null
}
