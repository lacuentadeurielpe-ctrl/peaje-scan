import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

export interface DatosPeaje {
  numero_boleta: string
  serie: string
  fecha: string
  hora: string
  estacion: string
  ruta: string
  placa: string
  tipo_vehiculo: string
  categoria: string
  monto: number
  numero_transaccion: string
  empresa_peaje: string
}

const SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    numero_boleta: { type: SchemaType.STRING, description: 'Número de boleta o comprobante' },
    serie: { type: SchemaType.STRING, description: 'Serie del documento' },
    fecha: { type: SchemaType.STRING, description: 'Fecha en formato DD/MM/YYYY' },
    hora: { type: SchemaType.STRING, description: 'Hora en formato HH:MM' },
    estacion: { type: SchemaType.STRING, description: 'Nombre de la estación de peaje' },
    ruta: { type: SchemaType.STRING, description: 'Ruta o tramo (ej: LIMA-TRUJILLO)' },
    placa: { type: SchemaType.STRING, description: 'Placa del vehículo' },
    tipo_vehiculo: { type: SchemaType.STRING, description: 'Tipo de vehículo (ej: Bus, Camión, Auto)' },
    categoria: { type: SchemaType.STRING, description: 'Categoría vehicular (ej: C2, C3, B2)' },
    monto: { type: SchemaType.NUMBER, description: 'Monto pagado en soles' },
    numero_transaccion: { type: SchemaType.STRING, description: 'Número de transacción o referencia' },
    empresa_peaje: { type: SchemaType.STRING, description: 'Empresa operadora del peaje' },
  },
  required: ['fecha', 'monto'],
}

async function intentarConGemini(base64: string, mimeType: string): Promise<DatosPeaje> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  })

  const prompt = `Eres un experto en lectura de boletas de peaje peruanas.
Extrae TODOS los datos visibles de esta boleta de peaje.
Si un campo no está visible, devuelve string vacío o 0 para números.
Devuelve exactamente el JSON con los campos solicitados.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } },
  ])

  const text = result.response.text()
  return JSON.parse(text) as DatosPeaje
}

export async function extraerDatosPeaje(
  base64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ datos: DatosPeaje; error: string | null }> {
  // Reintentos con backoff ante errores 503
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

export function calcularPrecisionIA(datosIA: DatosPeaje, camposEditados: string[]): number {
  const totalCampos = Object.keys(datosIA).length
  if (totalCampos === 0) return 0
  const editados = camposEditados.length
  return Math.round(((totalCampos - editados) / totalCampos) * 100)
}
