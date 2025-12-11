import { getAllTenants } from '@/lib/tenants';
import Link from 'next/link';

export default function Home() {
  const tenants = getAllTenants();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <main className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          Sistema Multi-Tenant
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Selecciona un centro de terapia para acceder
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/${tenant.id}`}
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {tenant.name}
              </h2>
              <p className="text-sm text-gray-500">ID: {tenant.id}</p>
              <span className="inline-block mt-2 text-blue-600 font-medium">
                Acceder →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Demo:</strong> Accede a{' '}
            <Link
              href="/empresa-demo"
              className="underline font-semibold"
            >
              /empresa-demo
            </Link>{' '}
            para ver la demo completa
          </p>
        </div>
      </main>
    </div>
  );
}
