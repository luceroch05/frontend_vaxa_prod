/** Etiqueta de color según la calidad de participación (Ponente, Organizador,
 *  Colaborador, Participante…). Usada en Inscripciones y en Ponentes/Staff. */
export default function CalidadBadge({ calidad, size = 'sm' }: { calidad?: string; size?: 'sm' | 'md' }) {
  const c = (calidad ?? 'Participante').trim() || 'Participante';
  const key = c.toLowerCase();
  const estilo =
    key === 'ponente'     ? { bg: '#F3F0FF', color: '#7C3AED' } :
    key === 'organizador' ? { bg: '#FEF3C7', color: '#B45309' } :
    key === 'colaborador' ? { bg: '#EFF6FF', color: '#2563EB' } :
                            { bg: '#F1F5F9', color: '#64748B' };  // Participante / otros
  const pad = size === 'md' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10.5px]';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${pad}`}
      style={{ background: estilo.bg, color: estilo.color }}>
      {c}
    </span>
  );
}
