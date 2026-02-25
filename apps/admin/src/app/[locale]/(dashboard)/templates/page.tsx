'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useCustomerCountTemplates,
  useCreateCustomerCountTemplate,
  useUpdateCustomerCountTemplate,
  useDeleteCustomerCountTemplate,
  useSpeedPackageTemplates,
  useCreateSpeedPackageTemplate,
  useUpdateSpeedPackageTemplate,
  useDeleteSpeedPackageTemplate,
} from '@/lib/api/hooks';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Gauge,
  X,
} from 'lucide-react';

// ── Types ──

interface CustomerCountTemplate {
  id: string;
  name: string;
  maxSubscribers: number;
  maxDevices: number;
  description?: string;
  isActive: boolean;
}

interface SpeedPackageItem {
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  dataLimit: number | null;
  timeLimit: number | null;
  durationDays: number;
  simultaneousSessions: number;
  price: number;
  currency: string;
}

interface SpeedPackageTemplate {
  id: string;
  name: string;
  packages: SpeedPackageItem[];
  description?: string;
  isActive: boolean;
}

type Tab = 'customer-count' | 'speed-packages';

const emptySpeedPkg: SpeedPackageItem = {
  name: '',
  downloadSpeed: 10,
  uploadSpeed: 5,
  dataLimit: null,
  timeLimit: null,
  durationDays: 30,
  simultaneousSessions: 1,
  price: 0,
  currency: 'TRY',
};

// ── Component ──

export default function TemplatesPage() {
  const t = useTranslations('superadmin');
  const tc = useTranslations('common');
  const tp = useTranslations('packages');

  const [activeTab, setActiveTab] = useState<Tab>('customer-count');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('templates')}</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('customer-count')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'customer-count'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Müşteri Sayısı Şablonları
        </button>
        <button
          onClick={() => setActiveTab('speed-packages')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'speed-packages'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Hız Paketi Şablonları
        </button>
      </div>

      {activeTab === 'customer-count' ? (
        <CustomerCountTab tc={tc} tp={tp} />
      ) : (
        <SpeedPackageTab tc={tc} tp={tp} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Customer Count Templates Tab
// ════════════════════════════════════════════════════════════════════

function CustomerCountTab({ tc, tp }: { tc: any; tp: any }) {
  const { data, isLoading } = useCustomerCountTemplates();
  const createMutation = useCreateCustomerCountTemplate();
  const updateMutation = useUpdateCustomerCountTemplate();
  const deleteMutation = useDeleteCustomerCountTemplate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerCountTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    maxSubscribers: 100,
    maxDevices: 5,
    description: '',
  });

  const templates: CustomerCountTemplate[] = (data as CustomerCountTemplate[]) ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', maxSubscribers: 100, maxDevices: 5, description: '' });
    setModalOpen(true);
  };

  const openEdit = (tmpl: CustomerCountTemplate) => {
    setEditing(tmpl);
    setForm({
      name: tmpl.name,
      maxSubscribers: tmpl.maxSubscribers,
      maxDevices: tmpl.maxDevices,
      description: tmpl.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      toast.success(tc('success'));
      setModalOpen(false);
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(tc('success'));
      setDeleteConfirm(null);
    } catch {
      toast.error(tc('error'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Wizard'da müşteri paketi seçimi için kullanılan şablonlar
        </p>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {tc('create')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{tc('loading')}</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Users className="w-8 h-8" />
            {tc('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Ad</th>
                  <th className="text-left px-4 py-3 font-medium">Max Kullanıcı</th>
                  <th className="text-left px-4 py-3 font-medium">Max Cihaz</th>
                  <th className="text-left px-4 py-3 font-medium">Açıklama</th>
                  <th className="text-left px-4 py-3 font-medium">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tmpl) => (
                  <tr key={tmpl.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{tmpl.name}</td>
                    <td className="px-4 py-3">{tmpl.maxSubscribers.toLocaleString()}</td>
                    <td className="px-4 py-3">{tmpl.maxDevices}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tmpl.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(tmpl)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                          title={tc('edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(tmpl.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-red-500"
                          title={tc('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? tc('edit') : tc('create')}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ad</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Küçük İşletme"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Max Kullanıcı</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxSubscribers}
                    onChange={(e) => setForm((f) => ({ ...f, maxSubscribers: Number(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Max Cihaz</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxDevices}
                    onChange={(e) => setForm((f) => ({ ...f, maxDevices: Number(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Açıklama</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Opsiyonel açıklama"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t">
              <button
                onClick={() => setModalOpen(false)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !form.name.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? '...' : tc('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">{tc('confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">Bu şablonu silmek istediğinize emin misiniz?</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// Speed Package Templates Tab
// ════════════════════════════════════════════════════════════════════

function SpeedPackageTab({ tc, tp }: { tc: any; tp: any }) {
  const { data, isLoading } = useSpeedPackageTemplates();
  const createMutation = useCreateSpeedPackageTemplate();
  const updateMutation = useUpdateSpeedPackageTemplate();
  const deleteMutation = useDeleteSpeedPackageTemplate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SpeedPackageTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    packages: [{ ...emptySpeedPkg }] as SpeedPackageItem[],
  });

  const templates: SpeedPackageTemplate[] = (data as SpeedPackageTemplate[]) ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', packages: [{ ...emptySpeedPkg }] });
    setModalOpen(true);
  };

  const openEdit = (tmpl: SpeedPackageTemplate) => {
    setEditing(tmpl);
    setForm({
      name: tmpl.name,
      description: tmpl.description || '',
      packages: tmpl.packages.length > 0 ? [...tmpl.packages] : [{ ...emptySpeedPkg }],
    });
    setModalOpen(true);
  };

  const updatePkg = (index: number, field: string, value: any) => {
    setForm((f) => {
      const pkgs = [...f.packages];
      pkgs[index] = { ...pkgs[index], [field]: value };
      return { ...f, packages: pkgs };
    });
  };

  const addPkg = () => {
    setForm((f) => ({ ...f, packages: [...f.packages, { ...emptySpeedPkg }] }));
  };

  const removePkg = (index: number) => {
    setForm((f) => ({
      ...f,
      packages: f.packages.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        packages: form.packages.filter((p) => p.name.trim()),
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success(tc('success'));
      setModalOpen(false);
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(tc('success'));
      setDeleteConfirm(null);
    } catch {
      toast.error(tc('error'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Wizard'da hız paketi seçimi için kullanılan şablonlar
        </p>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {tc('create')}
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-sm">
            {tc('loading')}
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Gauge className="w-8 h-8" />
            {tc('noData')}
          </div>
        ) : (
          templates.map((tmpl) => (
            <div key={tmpl.id} className="bg-card border rounded-xl overflow-hidden">
              {/* Template header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h3 className="font-semibold text-sm">{tmpl.name}</h3>
                  {tmpl.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-2">
                    {tmpl.packages.length} paket
                  </span>
                  <button
                    onClick={() => openEdit(tmpl)}
                    className="p-1.5 rounded-lg hover:bg-muted"
                    title={tc('edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(tmpl.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-red-500"
                    title={tc('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Packages preview table */}
              {tmpl.packages.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-4 py-2 font-medium">{tp('name')}</th>
                        <th className="text-left px-4 py-2 font-medium">{tp('downloadSpeed')}</th>
                        <th className="text-left px-4 py-2 font-medium">{tp('uploadSpeed')}</th>
                        <th className="text-left px-4 py-2 font-medium">{tp('duration')}</th>
                        <th className="text-left px-4 py-2 font-medium">{tp('price')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tmpl.packages.map((pkg, idx) => (
                        <tr key={idx} className="border-t border-muted/50">
                          <td className="px-4 py-2">{pkg.name}</td>
                          <td className="px-4 py-2">{pkg.downloadSpeed} Mbps</td>
                          <td className="px-4 py-2">{pkg.uploadSpeed} Mbps</td>
                          <td className="px-4 py-2">{pkg.durationDays} {tp('days')}</td>
                          <td className="px-4 py-2">
                            {Number(pkg.price) === 0 ? 'Ücretsiz' : `${pkg.price} ${pkg.currency}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? tc('edit') : tc('create')}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Template info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Şablon Adı</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Otel Paketleri"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Açıklama</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Opsiyonel"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              {/* Package list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Paketler</label>
                  <button
                    onClick={addPkg}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Paket Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {form.packages.map((pkg, idx) => (
                    <div key={idx} className="border rounded-xl p-4 relative">
                      {form.packages.length > 1 && (
                        <button
                          onClick={() => removePkg(idx)}
                          className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('name')}</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => updatePkg(idx, 'name', e.target.value)}
                            placeholder="10 Mbps Günlük"
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('downloadSpeed')} (Mbps)</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.downloadSpeed}
                            onChange={(e) => updatePkg(idx, 'downloadSpeed', Number(e.target.value))}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('uploadSpeed')} (Mbps)</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.uploadSpeed}
                            onChange={(e) => updatePkg(idx, 'uploadSpeed', Number(e.target.value))}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('duration')} ({tp('days')})</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.durationDays}
                            onChange={(e) => updatePkg(idx, 'durationDays', Number(e.target.value))}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('price')}</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={pkg.price}
                            onChange={(e) => updatePkg(idx, 'price', Number(e.target.value))}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{tp('simultaneousSessions')}</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.simultaneousSessions}
                            onChange={(e) => updatePkg(idx, 'simultaneousSessions', Number(e.target.value))}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t">
              <button
                onClick={() => setModalOpen(false)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !form.name.trim() || form.packages.every((p) => !p.name.trim())}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? '...' : tc('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">{tc('confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">Bu şablonu silmek istediğinize emin misiniz?</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
