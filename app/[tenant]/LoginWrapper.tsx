'use client';

import { usePathname } from 'next/navigation';

interface LoginWrapperProps {
  children: React.ReactNode;
  header: React.ReactNode;
  navigation: React.ReactNode;
}

export default function LoginWrapper({ children, header, navigation }: LoginWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  // Si es página de login, renderizar solo el contenido sin header ni navegación
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si no es login, mostrar header, navegación y contenido
  return (
    <>
      {header}
      {navigation}
      {children}
    </>
  );
}
