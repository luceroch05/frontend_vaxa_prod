/* Pie de página con la atribución a Vaxa. Se usa en las páginas públicas del
 * módulo de certificados (login, inscripción y validación) para dejar claro
 * que el sistema fue desarrollado por Vaxa. */
export default function VaxaFooter() {
  return (
    <p className="text-center text-[12.5px] mt-4 tracking-wide" style={{ color: '#6B6459' }}>
      Desarrollado por{' '}
      <span className="font-bold" style={{ color: '#C9962C' }}>VAXA</span>
    </p>
  );
}
