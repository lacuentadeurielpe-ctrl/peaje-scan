import UsuariosManager from '@/components/UsuariosManager'

export default function UsuariosPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">Crea y gestiona las credenciales de acceso al sistema</p>
      </div>
      <UsuariosManager />
    </div>
  )
}
