import UsuariosManager from '@/components/UsuariosManager'

export default function UsuariosPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Choferes</h1>
        <p className="text-sm text-gray-500 mt-1">Crea las cuentas de tus choferes y gestiona sus accesos</p>
      </div>
      <UsuariosManager />
    </div>
  )
}
