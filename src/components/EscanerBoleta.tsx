'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CAMPOS_BOLETA } from '@/lib/campos'
import { Upload, Loader2, CheckCircle, AlertTriangle, Save, RotateCcw, X } from 'lucide-react'

type Datos = Record<string, string>

export default function EscanerBoleta({ adelantoId, onClose }: { adelantoId: string; onClose?: () => void }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [fileName, setFileName] = useState('')
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [datosIA, setDatosIA] = useState<Datos | null>(null)
  const [datosFinal, setDatosFinal] = useState<Datos | null>(null)
  const [camposEditados, setCamposEditados] = useState<Set<string>>(new Set())
  const [notaChofer, setNotaChofer] = useState('')
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
      setBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }, [])

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
      // Normaliza: todos los campos como string, aplica defaults
      const ia: Datos = {}
      const fin: Datos = {}
      for (const c of CAMPOS_BOLETA) {
        const v = json.datos?.[c.key]
        ia[c.key] = v !== undefined && v !== null ? String(v) : ''
        fin[c.key] = ia[c.key] || c.default || ''
      }
      setDatosIA(ia)
      setDatosFinal(fin)
      setImagenUrl(json.imagenUrl)
      // marca como editado lo que se rellenó con default (difiere de la IA)
      const edit = new Set<string>()
      for (const c of CAMPOS_BOLETA) if (fin[c.key] !== ia[c.key]) edit.add(c.key)
      setCamposEditados(edit)
      setStep('edit')
    } catch (e) {
      setError(String(e))
      setStep('upload')
    }
  }

  function handleCampoChange(key: string, value: string) {
    setDatosFinal(prev => prev ? { ...prev, [key]: value } : prev)
    if (value !== (datosIA?.[key] ?? '')) setCamposEditados(prev => new Set([...prev, key]))
    else setCamposEditados(prev => { const s = new Set(prev); s.delete(key); return s })
  }

  async function handleSave() {
    if (!datosFinal) return
    setSaving(true)
    try {
      const res = await fetch('/api/boletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adelanto_id: adelantoId,
          imagen_url: imagenUrl,
          datos_ia: datosIA,
          datos_finales: datosFinal,
          campos_editados: [...camposEditados],
          nota_chofer: notaChofer,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStep('saved')
      setTimeout(() => { router.refresh(); onClose?.() }, 1200)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const precision = datosIA
    ? Math.round(((CAMPOS_BOLETA.length - camposEditados.size) / CAMPOS_BOLETA.length) * 100)
    : 100

  if (step === 'saved') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle className="text-green-500" size={48} />
        <p className="text-lg font-semibold text-gray-800">Boleta guardada</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Imagen */}
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
            preview ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
          onClick={() => step !== 'loading' && fileRef.current?.click()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          onDragOver={e => e.preventDefault()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="boleta" className="max-h-72 object-contain rounded-lg" />
          ) : (
            <>
              <Upload className="text-gray-400 mb-3" size={36} />
              <p className="text-sm font-medium text-gray-700">Arrastra la foto de la boleta</p>
              <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="flex gap-3">
            {onClose && (
              <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
            )}
            <button onClick={handleExtract} disabled={!base64}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
              Extraer datos con IA
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-4 text-blue-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Analizando boleta con Gemini...</span>
          </div>
        )}

        {step === 'edit' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nota (opcional)</label>
            <textarea value={notaChofer} onChange={e => setNotaChofer(e.target.value)} rows={2}
              placeholder="Observaciones..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        )}
      </div>

      {/* Tabla editable */}
      {step === 'edit' && datosFinal && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Precisión de la IA</p>
              <p className="text-xs text-gray-400">{camposEditados.size} campo(s) corregido(s)</p>
            </div>
            <span className={`text-2xl font-bold ${precision >= 80 ? 'text-green-600' : precision >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{precision}%</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Revisa y corrige los datos</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
              {CAMPOS_BOLETA.map(({ key, label, tipo }) => {
                const editado = camposEditados.has(key)
                return (
                  <div key={key} className={`flex items-center px-4 py-2 gap-3 ${editado ? 'bg-amber-50' : ''}`}>
                    <div className="w-36 shrink-0">
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                      {editado && <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-800">Editado</span>}
                    </div>
                    <input type={tipo === 'date' ? 'text' : tipo} value={datosFinal[key] ?? ''}
                      onChange={e => handleCampoChange(key, e.target.value)}
                      className={`flex-1 border rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 ${
                        editado ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-400'
                      }`} />
                    {editado && (datosIA?.[key] ?? '') !== (datosFinal[key] ?? '') && (
                      <button onClick={() => handleCampoChange(key, datosIA?.[key] ?? '')} title="Revertir a IA" className="p-1 text-gray-400 hover:text-amber-600">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar boleta'}
          </button>
        </div>
      )}
    </div>
  )
}
