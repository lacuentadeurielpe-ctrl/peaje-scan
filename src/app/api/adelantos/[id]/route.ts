import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil, requireSuperadmin } from '@/lib/auth'

// GET: detalle del adelanto + sus boletas + saldo calculado
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: adelanto, error } = await supabase
    .from('adelantos')
    .select('*, perfiles(nombre, placa_vehiculo)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Un chofer solo puede ver sus propios adelantos
  if (perfil.rol === 'chofer' && adelanto.chofer_id !== perfil.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: boletas } = await supabase
    .from('boletas_peaje')
    .select('*')
    .eq('adelanto_id', id)
    .order('created_at', { ascending: false })

  const gastado = (boletas ?? [])
    .filter(b => b.estado !== 'rechazado')
    .reduce((sum, b) => sum + (Number(b.monto_pagado) || 0), 0)
  const saldo = Number(adelanto.monto_asignado) - gastado

  return NextResponse.json({ adelanto, boletas: boletas ?? [], gastado, saldo })
}

// PATCH: solo superadmin edita el adelanto
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.from('adelantos').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: solo superadmin
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('adelantos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
