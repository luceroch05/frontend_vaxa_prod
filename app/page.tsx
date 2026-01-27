import { getAllTenants } from '@/lib/tenants';
import Link from 'next/link';

export default function Home() {
  const tenants = getAllTenants();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <main className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          Sistema Vaxa
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Accede al sistema de gestión
        </p>

        <div className="flex justify-center">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/${tenant.id}`}
              className="block p-8 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-indigo-50"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {tenant.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">ID: {tenant.id}</p>
              <span className="inline-block mt-2 text-purple-600 font-medium text-lg">
                Acceder al Dashboard →
              </span>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
