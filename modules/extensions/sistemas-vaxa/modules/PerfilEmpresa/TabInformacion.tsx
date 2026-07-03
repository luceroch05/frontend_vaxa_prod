'use client';

import { useState } from 'react';
import { Building2, FileText, Globe, CreditCard, Edit, Loader2, Upload, AlertCircle, User } from '@/components/ui/icon';

import { creditosAdminApi, type EmpresaCreditos } from '../../shared/api/creditos.admin.api';
import CopyLinkCard from '../../shared/components/CopyLinkCard';
import { DOC_RULES, sanitizeDoc, esEmpresa, tipoClienteLabel, docLabel, nombreLabel } from '../../shared/docs';

interface TabInformacionProps {
  empresa: EmpresaCreditos;
  onChange?: () => void;
}

export default function TabInformacion({ empresa, onChange }: TabInformacionProps) {
  const [editing, setEditing] = useState(false);
  const [razon, setRazon] = useState(empresa.razon_social);
  const [slug, setSlug] = useState(empresa.tenant_slug);
  const [dominio, setDominio] = useState(empresa.dominio ?? '');
  const [ruc, setRuc] = useState(empresa.ruc ?? '');
  const [tipoDoc, setTipoDoc] = useState(empresa.tipo_doc ?? '6');
  const [activo, setActivo] = useState(empresa.activo === 1);
  const [logo, setLogo] = useState<string | null>(empresa.logo_url);  // base64/data URL
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ¿Se puede guardar? Requeridos completos y que algo haya cambiado vs. el original.
  const huboCambios =
    razon !== empresa.razon_social || slug !== empresa.tenant_slug ||
    dominio !== (empresa.dominio ?? '') || ruc !== (empresa.ruc ?? '') ||
    tipoDoc !== (empresa.tipo_doc ?? '6') ||
    activo !== (empresa.activo === 1) || (logo ?? '') !== (empresa.logo_url ?? '');
  const puedeGuardar = razon.trim() !== '' && slug.trim() !== '' && huboCambios;

  const reset = () => {
    setRazon(empresa.razon_social); setSlug(empresa.tenant_slug);
    setDominio(empresa.dominio ?? ''); setRuc(empresa.ruc ?? ''); setTipoDoc(empresa.tipo_doc ?? '6');
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
        tipo_doc: tipoDoc,
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

        {/* Tipo de cliente: Empresa (RUC) vs Persona natural (DNI/CE/pasaporte) */}
        <Field label="Tipo de cliente">
          <div className="flex gap-2">
            {[{ v: '6', l: 'Empresa (RUC)' }, { v: '1', l: 'Persona (DNI)' }].map((o) => (
              <button key={o.v} type="button"
                onClick={() => { setTipoDoc(o.v); setRuc((r) => sanitizeDoc(r, o.v)); }}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors"
                style={(o.v === '6' ? esEmpresa(tipoDoc) : !esEmpresa(tipoDoc))
                  ? { background: '#ECFDF5', border: '1.5px solid #059669', color: '#047857' }
                  : { background: '#fff', border: '1.5px solid #EEECE6', color: '#64748B' }}>
                {o.l}
              </button>
            ))}
          </div>
        </Field>

        <Field label={nombreLabel(tipoDoc)}><input value={razon} onChange={(e) => setRazon(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Identificador / slug (URL)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
            <p className="text-xs text-amber-600 mt-1">⚠ Cambiarlo cambia la URL y afecta los logins existentes</p>
          </Field>
          <Field label="Dominio"><input value={dominio} onChange={(e) => setDominio(e.target.value)} placeholder="techpro.edu.pe" className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={docLabel(tipoDoc)}>
            <div className="flex gap-2">
              <select value={tipoDoc}
                onChange={(e) => { const t = e.target.value; setTipoDoc(t); setRuc((r) => sanitizeDoc(r, t)); }}
                className={inputCls} style={{ width: 110 }}>
                <option value="6">RUC</option>
                <option value="1">DNI</option>
                <option value="4">CE</option>
                <option value="7">Pasaporte</option>
              </select>
              <input value={ruc} onChange={(e) => setRuc(sanitizeDoc(e.target.value, tipoDoc))}
                inputMode={DOC_RULES[tipoDoc]?.numeric ? 'numeric' : 'text'}
                maxLength={DOC_RULES[tipoDoc]?.max || 15}
                className={`${inputCls} flex-1`} />
            </div>
          </Field>
          <Field label="Estado">
            <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{activo ? 'Activa' : 'Inactiva'}</span>
            </label>
          </Field>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={reset} className="sv-btn sv-btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={saving || !puedeGuardar} className="sv-btn sv-btn-primary">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar cambios
          </button>
        </div>
      </div>
    );
  }

  /* ── Modo vista ───────────────────────────────────────────── */
  const empresaCliente = esEmpresa(empresa.tipo_doc);
  const items = [
    { icon: empresaCliente ? Building2 : User, label: 'Tipo de cliente', value: tipoClienteLabel(empresa.tipo_doc) },
    { icon: Building2,  label: nombreLabel(empresa.tipo_doc), value: empresa.razon_social },
    { icon: FileText,   label: docLabel(empresa.tipo_doc), value: empresa.ruc || '—' },
    { icon: Globe,      label: 'Identificador (slug)', value: empresa.tenant_slug },
    { icon: Globe,      label: 'Dominio', value: empresa.dominio || '—' },
    { icon: CreditCard, label: 'Créditos disponibles', value: String(empresa.creditos_disponibles) },
  ];

  const baseUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://vaxasys.com';

  const links = {
    inscripcion: `${baseUrl}/${empresa.tenant_slug}/certificados`,
    validacion: `${baseUrl}/${empresa.tenant_slug}/certificados/validar`,
    login: `${baseUrl}/${empresa.tenant_slug}/certificados/login`,
  };

 

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Información de la empresa</h3>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full"
            style={empresaCliente
              ? { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }
              : { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
            {empresaCliente ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {tipoClienteLabel(empresa.tipo_doc)}
          </span>
        </div>
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

      <div
        className="rounded-xl p-4 space-y-4"
        style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}
      >
        <div>
          <h4 className="text-sm font-semibold" style={{ color: '#0D0E12' }}>Enlaces del cliente</h4>
          <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
            Cópialos y envíaselos directamente al cliente.
          </p>
        </div>

        <CopyLinkCard label="Inscripción" value={links.inscripcion} />
        <CopyLinkCard label="Validación de certificados" value={links.validacion} />
        <CopyLinkCard label="Login interno" value={links.login} />
      </div>
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
