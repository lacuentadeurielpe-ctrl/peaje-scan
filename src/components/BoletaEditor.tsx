'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CAMPOS_BOLETA } from '@/lib/campos'
import { ArrowLeft, Save, RotateCcw, Flag, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

type Datos = Record<string, string>
interface Boleta {
  id: string
  estado: string
  marcado_error: boolean
  nota_chofer: string | null
  imagen_url: string | null
  precision_ia: number | null
  datos_ia: Record<string, unknown> | null
  datos_finales: Record<string, unknown> | null
  campos_editados: string[]
  adelanto_id: string | null
  perfiles: { nombre: string } | null
}

export default function BoletaEditor({ boleta, rol }: { boleta: Boleta; rol: 'superadmin' | 'chofer' }) {
  const router = useRouter()
  const base = rol === 'superadmin' ? '/dashboard' : '/portal'

  const initFinal: Datos = {}
  for (const c of CAMPOS_BOLETA) initFinal[c.key] = String(boleta.datos_finales?.[c.key] ?? '')
  const [datosFinal, setDatosFinal] = useState<Datos>(initFinal)
  const [camposEditados, setCamposEditados] = useState<Set<string>>(new Set(boleta.campos_editados))
  const [marcadoError, setMarcadoError] = useState(boleta.marcado_error)
  const [notaChofer, setNotaChofer] = useState(boleta.nota_chofer ?? '')
  const [estado, setEstado] = useState(boleta.estado)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function handleCampoChange(key: string, value: string) {
    setDatosFinal(prev => ({ ...prev, [key]: value }))
    const orig = String(boleta.datos_ia?.[key] ?? '')
    if (value !== orig) setCamposEditados(prev => new Set([...prev, key]))
    else setCamposEditados(prev => { const s = new Set(prev); s.delete(key); return s })
  }

  async function patch(body: Record<string, unknown>, msgOk: string) {
    setSaving(true)
    const res = await fetch(`/api/boletas/${boleta.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) { setMsg(msgOk); router.refresh() }
    return res.ok
  }

  async function guardar() {
    await patch({
      datos_finales: datosFinal,
      campos_editados: [...camposEditados],
      marcado_error: marcadoError,
      nota_chofer: notaChofer,
    }, 'Cambios guardados')
  }

  async function eliminar() {
    if (!confirm('¿Eliminar esta boleta?')) return
    const res = await fetch(`/api/boletas/${boleta.id}`, { method: 'DELETE' })
    if (res.ok) router.push(boleta.adelanto_id ? `${base}/adelantos/${boleta.adelanto_id}` : base)
  }

  return (
    <div className="space-y-4">
      <Link href={boleta.adelanto_id ? `${base}/adelantos/${boleta.adelanto_id}` : base} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Volver
      </Link>

      {msg && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imagen + acciones */}
        <div className="space-y-4">
          {boleta.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={boleta.imagen_url} alt="boleta" className="w-full object-contain max-h-96 rounded-xl border border-gray-200 bg-white" />
          ) : (
            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
          )}

          {/* Chofer: marcar error */}
          {rol === 'chofer' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <button onClick={() => setMarcadoError(v => !v)}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  marcadoError ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'border border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}>
                <Flag size={15} /> {marcadoError ? 'Marcada con error (avisará al admin)' : 'Marcar con error'}
              </button>
              <textarea value={notaChofer} onChange={e => setNotaChofer(e.target.value)} rows={2}
                placeholder="Explica el error o agrega una nota..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          )}

          {/* Superadmin: verificar / rechazar / eliminar */}
          {rol === 'superadmin' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              {boleta.marcado_error && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                  <strong>El chofer marcó esta boleta con error.</strong>
                  {boleta.nota_chofer && <p className="mt-1">{boleta.nota_chofer}</p>}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => patch({ estado: 'verificado' }, 'Boleta verificada').then(() => setEstado('verificado'))} disabled={estado === 'verificado'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40">
                  <CheckCircle size={14} /> Verificar
                </button>
                <button onClick={() => patch({ estado: 'rechazado' }, 'Boleta rechazada').then(() => setEstado('rechazado'))} disabled={estado === 'rechazado'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40">
                  <XCircle size={14} /> Rechazar
                </button>
              </div>
              <button onClick={eliminar} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={14} /> Eliminar boleta
              </button>
            </div>
          )}
        </div>

        {/* Tabla editable */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Datos de la boleta</h3>
              {boleta.precision_ia !== null && <span className="text-xs text-gray-500">Precisión IA: <strong>{boleta.precision_ia}%</strong></span>}
            </div>
            <div className="divide-y divide-gray-100 max-h-[30rem] overflow-y-auto">
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
                      className={`flex-1 border rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 ${editado ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-400'}`} />
                    {editado && (
                      <button onClick={() => handleCampoChange(key, String(boleta.datos_ia?.[key] ?? ''))} title="Revertir a IA" className="p-1 text-gray-400 hover:text-amber-600">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={guardar} disabled={saving}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
