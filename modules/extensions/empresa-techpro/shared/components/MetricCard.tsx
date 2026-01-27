// Componente reutilizable de tarjeta de métrica para empresa-techpro

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: 'purple' | 'indigo' | 'pink' | 'teal';
  onClick?: () => void;
}

const gradientClasses = {
  purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
  pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
  teal: 'bg-gradient-to-br from-teal-500 to-teal-700',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  gradient = 'purple',
  onClick,
}: MetricCardProps) {
  return (
    <div
      className={`${gradientClasses[gradient]} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold opacity-90">{title}</h3>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <p className="text-4xl font-bold">{value}</p>
      {subtitle && <p className="text-sm opacity-75 mt-2">{subtitle}</p>}
    </div>
  );
}
