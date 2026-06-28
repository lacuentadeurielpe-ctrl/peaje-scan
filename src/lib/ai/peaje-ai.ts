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
  [key: string]: string | number
}

const SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    fecha_documento: { type: SchemaType.STRING, description: 'Fecha de emisión de la boleta en formato DD/MM/YYYY' },
    numero_documento: { type: SchemaType.STRING, description: 'Número del comprobante, ej: A3T-326012163 (serie-correlativo)' },
    ruc: { type: SchemaType.STRING, description: 'RUC del operador de peaje (11 dígitos)' },
    tipo_comprobante: { type: SchemaType.STRING, description: 'Tipo de comprobante (Boleta, Factura, Ticket)' },
    descripcion_gasto: { type: SchemaType.STRING, description: 'Descripción o concepto del gasto / estación de peaje' },
    correlativo_lgv: { type: SchemaType.STRING, description: 'Correlativo LGV si aparece, ej: 001-39211' },
    monto_pagado: { type: SchemaType.NUMBER, description: 'Monto total pagado en soles' },
    monto_afecto: { type: SchemaType.NUMBER, description: 'Monto afecto a IGV (puede ser 0)' },
    monto_no_afecto: { type: SchemaType.NUMBER, description: 'Monto inafecto / no gravado' },
    monto_impuestos: { type: SchemaType.NUMBER, description: 'Total de impuestos (puede ser 0)' },
    igv: { type: SchemaType.NUMBER, description: 'IGV desglosado si aparece' },
  },
  required: ['fecha_documento', 'monto_pagado'],
}

async function intentarConGemini(base64: string, mimeType: string): Promise<DatosPeaje> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  })

  const prompt = `Eres un experto en lectura de boletas y comprobantes de peaje peruanos.
Extrae TODOS los datos visibles de esta boleta de peaje.
El número de documento suele tener formato letra-número (ej: A3T-326012163).
Si un campo no está visible, devuelve string vacío para texto o 0 para números.
Devuelve exactamente el JSON con los campos solicitados.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } },
  ])

  return JSON.parse(result.response.text()) as DatosPeaje
}

export async function extraerDatosPeaje(
  base64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ datos: DatosPeaje; error: string | null }> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const datos = await intentarConGemini(base64, mimeType)
      return { datos, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const es503 = msg.includes('503') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('high demand')
      if (es503 && intento < 3) {
        await new Promise(r => setTimeout(r, intento * 2000))
        continue
      }
      return { datos: {} as DatosPeaje, error: msg }
    }
  }
  return { datos: {} as DatosPeaje, error: 'Error al procesar con Gemini' }
}
