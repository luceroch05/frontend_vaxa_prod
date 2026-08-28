/* Pie de página con la atribución a Vaxa. Se usa en las páginas públicas del
 * módulo de certificados (login, inscripción y validación) para dejar claro
 * que el sistema fue desarrollado por Vaxa. */
export default function VaxaFooter() {
  return (
    <p className="text-center text-[12.5px] mt-4 tracking-wide" style={{ color: '#6B6459' }}>
      Desarrollado por{' '}
      <a
        href="https://vaxasys.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold hover:underline"
        style={{ color: '#C9962C' }}
      >
        VAXA
      </a>
    </p>
  );
}
