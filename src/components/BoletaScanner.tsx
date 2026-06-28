'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle, AlertTriangle, Save, RotateCcw } from 'lucide-react'

interface Chofer { id: string; nombre: string; placa_vehiculo: string | null }
interface DatosPeaje {
  numero_boleta: string; serie: string; fecha: string; hora: string
  estacion: string; ruta: string; placa: string; tipo_vehiculo: string
  categoria: string; monto: number | string; numero_transaccion: string; empresa_peaje: string
}

const CAMPOS: { key: keyof DatosPeaje; label: string; tipo?: string }[] = [
  { key: 'numero_boleta', label: 'N° Boleta' },
  { key: 'serie', label: 'Serie' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'estacion', label: 'Estación de Peaje' },
  { key: 'ruta', label: 'Ruta / Tramo' },
  { key: 'placa', label: 'Placa Vehículo' },
  { key: 'tipo_vehiculo', label: 'Tipo de Vehículo' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'monto', label: 'Monto (S/)', tipo: 'number' },
  { key: 'numero_transaccion', label: 'N° Transacción' },
  { key: 'empresa_peaje', label: 'Empresa Peaje' },
]

export default function BolетaScanner({ choferes }: { choferes: Chofer[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [fileName, setFileName] = useState('')
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [datosIA, setDatosIA] = useState<DatosPeaje | null>(null)
  const [datosFinal, setDatosFinal] = useState<DatosPeaje | null>(null)
  const [camposEditados, setCamposEditados] = useState<Set<string>>(new Set())
  const [choferId, setChoferId] = useState('')
  const [notas, setNotas] = useState('')
  const [step, setStep] = useState<'upload' | 'loading' | 'edit' | 'saved'>('upload')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFile = useCallback((file: File) => {
    setMimeType(file.type)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      setPreview(result)
      const b64 = result.split(',')[1]
      setBase64(b64)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  async function handleExtract() {
    if (!base64) return
    setStep('loading')
    setError('')
    try {
      const res = await fetch('/api/boletas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType, fileName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDatosIA(json.datos)
      setDatosFinal({ ...json.datos })
      setImagenUrl(json.imagenUrl)
      setCamposEditados(new Set())
      setStep('edit')
    } catch (e) {
      setError(String(e))
      setStep('upload')
    }
  }

  function handleCampoChange(key: keyof DatosPeaje, value: string) {
    setDatosFinal(prev => prev ? { ...prev, [key]: value } : prev)
    const valorOriginal = String(datosIA?.[key] ?? '')
    if (value !== valorOriginal) {
      setCamposEditados(prev => new Set([...prev, key]))
    } else {
      setCamposEditados(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  async function handleSave() {
    if (!datosFinal) return
    setSaving(true)
    try {
      const res = await fetch('/api/boletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chofer_id: choferId || null,
          imagen_url: imagenUrl,
          datos_ia: datosIA,
          datos_finales: datosFinal,
          campos_editados: [...camposEditados],
          notas,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStep('saved')
      setTimeout(() => router.push('/dashboard/boletas'), 1500)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  function resetAll() {
    setPreview(null); setBase64(null); setDatosIA(null); setDatosFinal(null)
    setCamposEditados(new Set()); setStep('upload'); setError('')
    setImagenUrl(null); setNotas('')
  }

  const precision = datosIA
    ? Math.round(((CAMPOS.length - camposEditados.size) / CAMPOS.length) * 100)
    : 100

  if (step === 'saved') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle className="text-green-500" size={56} />
        <p className="text-xl font-semibold text-gray-800">Boleta guardada correctamente</p>
        <p className="text-sm text-gray-500">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo — imagen */}
      <div className="space-y-4">
        {step === 'upload' || step === 'loading' ? (
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer transition-colors ${
              preview ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="boleta" className="max-h-80 object-contain rounded-lg" />
            ) : (
              <>
                <Upload className="text-gray-400 mb-3" size={40} />
                <p className="text-sm font-medium text-gray-700">Arrastra la imagen aquí</p>
                <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          preview && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="boleta" className="w-full object-contain max-h-96" />
            </div>
          )
        )}

        {/* Selector de chofer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Chofer (opcional)</label>
          <select
            value={choferId}
            onChange={e => setChoferId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin asignar</option>
            {choferes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}{c.placa_vehiculo ? ` — ${c.placa_vehiculo}` : ''}</option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700">Notas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
            placeholder="Observaciones adicionales..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {step === 'upload' && (
          <button
            onClick={handleExtract}
            disabled={!base64}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Extraer datos con IA
          </button>
        )}

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-4 text-blue-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Analizando boleta con Gemini...</span>
          </div>
        )}
      </div>

      {/* Panel derecho — tabla editable */}
      {step === 'edit' && datosFinal && (
        <div className="space-y-4">
          {/* Badge de precisión */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Precisión de la IA</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {camposEditados.size === 0
                  ? 'Sin correcciones — IA perfecta'
                  : `${camposEditados.size} campo(s) corregido(s)`}
              </p>
            </div>
            <div className={`text-2xl font-bold ${precision >= 80 ? 'text-green-600' : precision >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {precision}%
            </div>
          </div>

          {/* Tabla de campos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Datos extraídos — edita si hay errores</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {CAMPOS.map(({ key, label, tipo }) => {
                const editado = camposEditados.has(key)
                return (
                  <div key={key} className={`flex items-center px-4 py-2.5 gap-3 ${editado ? 'bg-amber-50' : ''}`}>
                    <div className="w-36 shrink-0">
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                      {editado && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-200 text-amber-800">
                          Corregido
                        </span>
                      )}
                    </div>
                    <input
                      type={tipo ?? 'text'}
                      value={String(datosFinal[key] ?? '')}
                      onChange={e => handleCampoChange(key, e.target.value)}
                      className={`flex-1 border rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 ${
                        editado
                          ? 'border-amber-400 focus:ring-amber-400 bg-amber-50'
                          : 'border-gray-200 focus:ring-blue-400 bg-white'
                      }`}
                    />
                    {editado && (
                      <button
                        onClick={() => handleCampoChange(key, String(datosIA?.[key] ?? ''))}
                        title="Revertir al valor de la IA"
                        className="p-1 text-gray-400 hover:text-amber-600"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar Boleta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
