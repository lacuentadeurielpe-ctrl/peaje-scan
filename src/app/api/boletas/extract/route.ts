import { NextRequest, NextResponse } from 'next/server'
import { extraerDatosPeaje } from '@/lib/ai/peaje-ai'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, fileName } = await req.json()
    if (!base64) return NextResponse.json({ error: 'Se requiere imagen en base64' }, { status: 400 })

    // Subir imagen a Supabase Storage
    const supabase = createAdminClient()
    const ext = fileName?.split('.').pop() ?? 'jpg'
    const path = `boletas/${Date.now()}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('boletas')
      .upload(path, buffer, { contentType: mimeType ?? 'image/jpeg', upsert: true })

    let imagenUrl: string | null = null
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('boletas').getPublicUrl(path)
      imagenUrl = urlData.publicUrl
    }

    // Extraer datos con Gemini
    const { datos, error } = await extraerDatosPeaje(base64, mimeType ?? 'image/jpeg')
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ datos, imagenUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
