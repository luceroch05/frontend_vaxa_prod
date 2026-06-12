import { useState, useRef, useEffect, type ComponentType } from 'react';
import {
  getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumber,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import flags from 'react-phone-number-input/flags';
import { ChevronDown, Search } from '@/components/ui/icon';

type CountryCode = ReturnType<typeof getCountries>[number];

/** Bandera en SVG (se ve en Windows, a diferencia de los emoji 🇵🇪). */
function FlagIcon({ iso, name }: { iso: string; name?: string }) {
  const F = (flags as Record<string, ComponentType<{ title?: string }>>)[iso];
  return <span className="vx-flag">{F ? <F title={name ?? iso} /> : null}</span>;
}

// Lista de países (bandera + nombre + prefijo), calculada una sola vez.
const REGION = (() => { try { return new Intl.DisplayNames(['es'], { type: 'region' }); } catch { return null; } })();
const COUNTRIES = getCountries()
  .map(iso => ({ iso, code: getCountryCallingCode(iso), name: REGION?.of(iso) ?? iso }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

// Cantidad de dígitos del CELULAR por país (PE=9, MX=10, AR=11…), del número de ejemplo.
const LEN_CACHE: Record<string, number> = {};
function mobileLen(iso: string): number {
  if (LEN_CACHE[iso] != null) return LEN_CACHE[iso];
  let n = 15;
  try { const ex = getExampleNumber(iso as CountryCode, examples as never); if (ex) n = ex.nationalNumber.length; } catch { /* noop */ }
  LEN_CACHE[iso] = n;
  return n;
}

interface Props {
  value: string;                       // E.164, ej. "+51987654321" (o '')
  onChange: (v: string) => void;
  defaultCountry?: CountryCode;
}

/**
 * Campo de teléfono con bandera + prefijo por país. Tope DURO de dígitos según
 * el largo del celular de cada país (Perú 9, México 10, Argentina 11, …). Los
 * dígitos viven en estado propio: al cambiar de país se recalculan desde cero,
 * sin arrastrar nada del país anterior.
 */
export default function PhoneField({ value, onChange, defaultCountry = 'PE' as CountryCode }: Props) {
  const [country, setCountry] = useState<CountryCode>(() => {
    if (value) { try { return (parsePhoneNumber(value)?.country as CountryCode) ?? defaultCountry; } catch { /* noop */ } }
    return defaultCountry;
  });
  const [digits, setDigits] = useState<string>(() => {
    if (value) { try { return parsePhoneNumber(value)?.nationalNumber ?? ''; } catch { /* noop */ } }
    return '';
  });

  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const code   = getCountryCallingCode(country);
  const maxLen = mobileLen(country);

  const handleDigits = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, maxLen);
    setDigits(d);
    onChange(d ? `+${code}${d}` : '');
  };

  const selectCountry = (iso: CountryCode) => {
    const newCode = getCountryCallingCode(iso);
    const d = digits.replace(/\D/g, '').slice(0, mobileLen(iso));   // recorta al largo del NUEVO país
    setCountry(iso);
    setDigits(d);
    onChange(d ? `+${newCode}${d}` : '');
    setOpen(false); setSearch('');
  };

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase().trim()) || c.code.includes(search.replace('+', '').trim())
  );

  return (
    <div className="relative" ref={ref}>
      <div className="vx-phone">
        {/* Selector de país */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 flex-shrink-0"
          style={{ color: '#0D0E12' }}
        >
          <FlagIcon iso={country} />
          <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>+{code}</span>
          <ChevronDown size={14} style={{ color: '#B0A898', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
        </button>

        <span style={{ width: 1, height: 20, background: '#E9E6DF', flexShrink: 0 }} />

        {/* Número nacional — maxLength corta en el navegador */}
        <input
          type="tel"
          inputMode="numeric"
          maxLength={maxLen}
          value={digits}
          onChange={e => handleDigits(e.target.value)}
          placeholder="999 999 999"
          className="PhoneInputInput"
        />
      </div>

      {/* Dropdown de países */}
      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full rounded-xl overflow-hidden page-enter"
          style={{ background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 12px 32px rgba(13,14,18,0.12)' }}
        >
          <div className="p-2" style={{ borderBottom: '1px solid #F0EEE9' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país…"
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg focus:outline-none"
                style={{ background: '#F7F6F2', border: '1px solid #EEECE6', color: '#0D0E12' }}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-5 text-center text-[13px]" style={{ color: '#B0A898' }}>Sin resultados</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => selectCountry(c.iso)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors hover:bg-[#FAF8F2]"
                  style={{ background: c.iso === country ? '#FBF7EC' : undefined }}
                >
                  <FlagIcon iso={c.iso} name={c.name} />
                  <span className="text-[13px] flex-1 truncate" style={{ color: '#0D0E12' }}>{c.name}</span>
                  <span className="text-[12px]" style={{ color: '#9CA3AF' }}>+{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
