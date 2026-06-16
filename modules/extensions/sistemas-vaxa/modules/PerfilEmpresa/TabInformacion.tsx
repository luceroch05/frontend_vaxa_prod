'use client';

import { useState } from 'react';
import { Building2, FileText, Globe, CreditCard, Edit, Loader2, Upload, AlertCircle } from '@/components/ui/icon';
import { creditosAdminApi, type EmpresaCreditos } from '../../shared/api/creditos.admin.api';

interface TabInformacionProps { empresa: EmpresaCreditos; onChange?: () => void; }

export default function TabInformacion({ empresa, onChange }: TabInformacionProps) {
  const [editing, setEditing] = useState(false);
  const [razon, setRazon] = useState(empresa.razon_social);
  const [slug, setSlug] = useState(empresa.tenant_slug);
  const [dominio, setDominio] = useState(empresa.dominio ?? '');
  const [ruc, setRuc] = useState(empresa.ruc ?? '');
  const [activo, setActivo] = useState(empresa.activo === 1);
  const [logo, setLogo] = useState<string | null>(empresa.logo_url);  // base64/data URL
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRazon(empresa.razon_social); setSlug(empresa.tenant_slug);
    setDominio(empresa.dominio ?? ''); setRuc(empresa.ruc ?? '');
    setActivo(empresa.activo === 1); setLogo(empresa.logo_url);
    setError(null); setEditing(false);
  };

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    setSaving(true); setError(null);
    try {
      await creditosAdminApi.editarEmpresa(empresa.id, {
        razon_social: razon,
        tenant_slug: slug,
        dominio,
        ruc,
        activo,
        logo: logo ?? '',          // '' borra el logo
      });
      onChange?.();
      setEditing(false);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  /* ── Modo edición ─────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="space-y-5 max-w-2xl">
        <h3 className="text-lg font-bold text-gray-900">Editar empresa</h3>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center gap-5">
          {logo ? (
            <img src={logo} alt="logo" className="w-20 h-20 rounded-xl object-contain border-2 border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <Building2 className="w-9 h-9 text-gray-400" />
            </div>
          )}
          <div className="flex gap-2">
            <label className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Subir logo
              <input type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
            </label>
            {logo && <button onClick={() => setLogo(null)} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-semibold">Quitar</button>}
          </div>
        </div>

        <Field label="Razón social"><input value={razon} onChange={(e) => setRazon(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Identificador / slug (URL)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
            <p className="text-xs text-amber-600 mt-1">⚠ Cambiarlo cambia la URL y afecta los logins existentes</p>
          </Field>
          <Field label="Dominio"><input value={dominio} onChange={(e) => setDominio(e.target.value)} placeholder="techpro.edu.pe" className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="RUC"><input value={ruc} onChange={(e) => setRuc(e.target.value)} className={inputCls} /></Field>
          <Field label="Estado">
            <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{activo ? 'Activa' : 'Inactiva'}</span>
            </label>
          </Field>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={reset} className="sv-btn sv-btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="sv-btn sv-btn-primary">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar cambios
          </button>
        </div>
      </div>
    );
  }

  /* ── Modo vista ───────────────────────────────────────────── */
  const items = [
    { icon: Building2,  label: 'Razón social', value: empresa.razon_social },
    { icon: Globe,      label: 'Identificador (slug)', value: empresa.tenant_slug },
    { icon: Globe,      label: 'Dominio', value: empresa.dominio || '—' },
    { icon: FileText,   label: 'RUC', value: empresa.ruc || '—' },
    { icon: CreditCard, label: 'Créditos disponibles', value: String(empresa.creditos_disponibles) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Información de la empresa</h3>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-lg transition-colors hover:bg-emerald-50" style={{ color: '#059669' }}>
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <Icon className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>{it.label}</p>
                <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{it.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px]" style={{ color: '#B0A898' }}>
        Portal público: <code style={{ color: '#64748B' }}>/{empresa.tenant_slug}/certificados</code>
      </p>
    </div>
  );
}

const inputCls = 'sv-input';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}
