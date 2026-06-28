import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

// Datos que la IA extrae de la imagen de la boleta de peaje.
export interface DatosPeaje {
  fecha_documento: string
  numero_documento: string
  ruc: string
  tipo_comprobante: string
  descripcion_gasto: string
  correlativo_lgv: string
  monto_pagado: number
  monto_afecto: number
  monto_no_afecto: number
  monto_impuestos: number
  igv: number
  monto_detraccion: number
  constancia: string
  [key: string]: string | number
}

const SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    fecha_documento: { type: SchemaType.STRING, description: 'Fecha de emisión de la boleta en formato DD/MM/YYYY' },
    numero_documento: { type: SchemaType.STRING, description: 'Número del comprobante, ej: A3T-326012163 (serie-correlativo)' },
    ruc: { type: SchemaType.STRING, description: 'RUC del OPERADOR/EMISOR del peaje (la empresa que emite la boleta, ej. NORVIAL, COVISOL; suele estar arriba junto al nombre del peaje). NO el RUC del cliente/empresa de transporte que figure como comprador.' },
    tipo_comprobante: { type: SchemaType.STRING, description: 'Tipo de comprobante (Boleta, Factura, Ticket)' },
    descripcion_gasto: { type: SchemaType.STRING, description: 'Estación/unidad de peaje o concepto del gasto' },
    correlativo_lgv: { type: SchemaType.STRING, description: 'Correlativo interno LGV solo si aparece explícito (formato 001-39211); si no aparece, dejar vacío. NO usar aquí el número del comprobante.' },
    monto_pagado: { type: SchemaType.NUMBER, description: 'Total a pagar (monto final cobrado, incluye detracción si la hubiera)' },
    monto_afecto: { type: SchemaType.NUMBER, description: 'Subtotal afecto a IGV / base gravada (0 si el peaje es inafecto)' },
    monto_no_afecto: { type: SchemaType.NUMBER, description: 'Importe inafecto / no gravado (0 si es afecto)' },
    monto_impuestos: { type: SchemaType.NUMBER, description: 'Total de impuestos (normalmente igual al IGV; 0 si no hay)' },
    igv: { type: SchemaType.NUMBER, description: 'Monto del IGV desglosado (0 si el peaje es inafecto)' },
    monto_detraccion: { type: SchemaType.NUMBER, description: 'Monto de la detracción, ej. de la línea "Total por Detraccion" (0 si no hay)' },
    constancia: { type: SchemaType.STRING, description: 'Código/constancia de detracción de la línea "Detraccion:", ej. A13320000738479 (vacío si no aparece)' },
  },
  required: ['fecha_documento', 'monto_pagado'],
}

const PROMPT = `Eres un experto en lectura de boletas y facturas de peaje peruanas.
Extrae los datos visibles de esta boleta de peaje.

REGLAS IMPORTANTES:
- RUC: usa el del OPERADOR DEL PEAJE (quien EMITE la boleta, ej. NORVIAL, COVISOL, normalmente arriba junto al nombre del peaje). Una boleta puede mostrar también el RUC del cliente/empresa de transporte como comprador: ESE NO se usa.
- numero_documento: el número del comprobante en formato serie-correlativo (ej: F332-2229361, A3T-326012163).
- Montos: monto_afecto = subtotal gravado; igv = IGV desglosado; monto_no_afecto = importe inafecto; monto_pagado = total a pagar final.
- Detracción: monto_detraccion = el monto de "Total por Detraccion"; constancia = el código de la línea "Detraccion:" (ej. A13320000738479). Si la boleta no tiene detracción, deja 0 y vacío.
- Si un campo no está visible, devuelve string vacío para texto o 0 para números.

Devuelve exactamente el JSON con los campos solicitados.`

async function intentarConGemini(base64: string, mimeType: string): Promise<DatosPeaje> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  })

  const result = await model.generateContent([
    PROMPT,
    { inlineData: { data: base64, mimeType } },
  ])

  return JSON.parse(result.response.text()) as DatosPeaje
}

// Fallback: GPT-4o Vision de OpenAI. Solo se usa si hay OPENAI_API_KEY.
async function intentarConOpenAI(base64: string, mimeType: string): Promise<DatosPeaje> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada')

  const camposLista = 'fecha_documento, numero_documento, ruc, tipo_comprobante, descripcion_gasto, correlativo_lgv, monto_pagado, monto_afecto, monto_no_afecto, monto_impuestos, igv, monto_detraccion, constancia'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PROMPT + `\nResponde un objeto JSON con exactamente estas claves: ${camposLista}. Los montos como número, el resto como texto.` },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extrae los datos de esta boleta de peaje.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`)
  }
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI: respuesta vacía')
  return JSON.parse(content) as DatosPeaje
}

export async function extraerDatosPeaje(
  base64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ datos: DatosPeaje; error: string | null }> {
  let ultimoError = 'Error al procesar con Gemini'

  // 1) Intento principal: Gemini, con reintentos ante 503 (alta demanda)
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const datos = await intentarConGemini(base64, mimeType)
      return { datos, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      ultimoError = msg
      const es503 = msg.includes('503') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('high demand')
      if (es503 && intento < 3) {
        await new Promise(r => setTimeout(r, intento * 2000))
        continue
      }
      break
    }
  }

  // 2) Fallback automático a OpenAI GPT-4o Vision (si hay OPENAI_API_KEY)
  if (process.env.OPENAI_API_KEY) {
    try {
      const datos = await intentarConOpenAI(base64, mimeType)
      return { datos, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { datos: {} as DatosPeaje, error: `Gemini falló (${ultimoError}). Fallback OpenAI también falló (${msg})` }
    }
  }

  return { datos: {} as DatosPeaje, error: ultimoError }
}
