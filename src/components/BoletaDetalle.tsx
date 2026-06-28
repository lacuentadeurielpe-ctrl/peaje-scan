'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle, XCircle, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Chofer { id: string; nombre: string; placa_vehiculo: string | null }
interface Boleta {
  id: string
  chofer_id: string | null
  imagen_url: string | null
  estado: string
  datos_ia: Record<string, unknown> | null
  datos_finales: Record<string, unknown> | null
  campos_editados: string[]
  precision_ia: number | null
  notas: string | null
  created_at: string
  choferes: { nombre: string; placa_vehiculo: string | null } | null
}

const CAMPOS: { key: string; label: string; tipo?: string }[] = [
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

export default function BolетaDetalle({ boleta, choferes }: { boleta: Boleta; choferes: Chofer[] }) {
  const router = useRouter()
  const [datosFinal, setDatosFinal] = useState<Record<string, unknown>>(boleta.datos_finales ?? boleta.datos_ia ?? {})
  const [camposEditados, setCamposEditados] = useState<Set<string>>(new Set(boleta.campos_editados))
  const [choferId, setChoferId] = useState(boleta.chofer_id ?? '')
  const [notas, setNotas] = useState(boleta.notas ?? '')
  const [saving, setSaving] = useState(false)
  const [estado, setEstado] = useState(boleta.estado)

  function handleCampoChange(key: string, value: string) {
    setDatosFinal(prev => ({ ...prev, [key]: value }))
    const valorOriginal = String(boleta.datos_ia?.[key] ?? '')
    if (value !== valorOriginal) {
      setCamposEditados(prev => new Set([...prev, key]))
    } else {
      setCamposEditados(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    const res = await fetch(`/api/boletas/${boleta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    return res.ok
  }

  async function handleSave() {
    const ok = await patch({
      datos_finales: datosFinal,
      datos_ia: boleta.datos_ia,
      campos_editados: [...camposEditados],
      chofer_id: choferId || null,
      notas,
    })
    if (ok) router.push('/dashboard/boletas')
  }

  async function handleCambiarEstado(nuevoEstado: string) {
    const ok = await patch({ estado: nuevoEstado })
    if (ok) setEstado(nuevoEstado)
  }

  const precision = boleta.datos_ia
    ? Math.round(((CAMPOS.length - camposEditados.size) / CAMPOS.length) * 100)
    : 100

  return (
    <div className="space-y-4">
      <Link href="/dashboard/boletas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Volver a boletas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imagen */}
        <div className="space-y-4">
          {boleta.imagen_url ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boleta.imagen_url} alt="boleta" className="w-full object-contain max-h-96" />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCambiarEstado('verificado')}
                  disabled={estado === 'verificado'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle size={14} /> Verificar
                </button>
                <button
                  onClick={() => handleCambiarEstado('rechazado')}
                  disabled={estado === 'rechazado'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle size={14} /> Rechazar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chofer</label>
              <select
                value={choferId}
                onChange={e => setChoferId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.placa_vehiculo ? ` — ${c.placa_vehiculo}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Tabla editable */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Precisión de la IA</p>
              <p className="text-xs text-gray-400">{camposEditados.size} campo(s) corregido(s)</p>
            </div>
            <span className={`text-2xl font-bold ${precision >= 80 ? 'text-green-600' : precision >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {precision}%
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Datos de la boleta</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {CAMPOS.map(({ key, label, tipo }) => {
                const editado = camposEditados.has(key)
                return (
                  <div key={key} className={`flex items-center px-4 py-2.5 gap-3 ${editado ? 'bg-amber-50' : ''}`}>
                    <div className="w-36 shrink-0">
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                      {editado && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-200 text-amber-800">Corregido</span>}
                    </div>
                    <input
                      type={tipo ?? 'text'}
                      value={String(datosFinal[key] ?? '')}
                      onChange={e => handleCampoChange(key, e.target.value)}
                      className={`flex-1 border rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 ${
                        editado ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-400'
                      }`}
                    />
                    {editado && (
                      <button onClick={() => handleCampoChange(key, String(boleta.datos_ia?.[key] ?? ''))} title="Revertir" className="p-1 text-gray-400 hover:text-amber-600">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
