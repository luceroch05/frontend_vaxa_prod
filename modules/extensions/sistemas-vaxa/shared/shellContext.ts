import { createContext, useContext } from 'react';

/**
 * Marca si un módulo se está renderizando DENTRO del shell de administración
 * (sidebar fijo). Cuando es `true`, los módulos ocultan su cabecera propia
 * (`HeaderSistemasVaxa`) y el `BotonVolver`, porque la navegación la provee el shell.
 */
export const InsideShellContext = createContext(false);

export const useInsideShell = () => useContext(InsideShellContext);
