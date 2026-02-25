'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useWalledGardenDevices,
  useCreateWalledGardenDevice,
  useUpdateWalledGardenDevice,
  useDeleteWalledGardenDevice,
} from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, ShieldCheck } from 'lucide-react';

interface WGDevice {
  id: string;
  name: string;
  macAddress: string | null;
  ipAddress: string | null;
  type: 'mac' | 'ip' | 'both';
  description: string | null;
  isActive: boolean;
}

interface WGForm {
  name: string;
  macAddress: string;
  ipAddress: string;
  type: 'mac' | 'ip' | 'both';
  description: string;
  isActive: boolean;
}

const BYPASS_TYPES = ['mac', 'ip', 'both'] as const;

const emptyForm: WGForm = {
  name: '',
  macAddress: '',
  ipAddress: '',
  type: 'mac',
  description: '',
  isActive: true,
};

export default function WalledGardenPage() {
  const t = useTranslations('walledGarden');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useWalledGardenDevices(page, limit);
  const createDevice = useCreateWalledGardenDevice();
  const updateDevice = useUpdateWalledGardenDevice();
  const deleteDevice = useDeleteWalledGardenDevice();

  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<WGDevice | null>(null);
  const [form, setForm] = useState<WGForm>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const devices: WGDevice[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function openCreateForm() {
    setEditingDevice(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(device: WGDevice) {
    setEditingDevice(device);
    setForm({
      name: device.name,
      macAddress: device.macAddress ?? '',
      ipAddress: device.ipAddress ?? '',
      type: device.type,
      description: device.description ?? '',
      isActive: device.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingDevice(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      macAddress: form.macAddress || undefined,
      ipAddress: form.ipAddress || undefined,
      description: form.description || undefined,
    };

    try {
      if (editingDevice) {
        await updateDevice.mutateAsync({ id: editingDevice.id, ...payload });
        toast.success(t('updateSuccess'));
      } else {
        await createDevice.mutateAsync(payload);
        toast.success(t('createSuccess'));
      }
      closeForm();
    } catch {
      toast.error(tc('error'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDevice.mutateAsync(id);
      toast.success(t('deleteSuccess'));
      setDeletingId(null);
    } catch {
      toast.error(tc('error'));
    }
  }

  const isSaving = createDevice.isPending || updateDevice.isPending;
  const needsMac = form.type === 'mac' || form.type === 'both';
  const needsIp = form.type === 'ip' || form.type === 'both';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addDevice')}
        </button>
      </div>

      {/* Device table */}
      <div className="bg-card border rounded-xl p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted-foreground">{tc('loading')}</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{tc('noData')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">{t('name')}</th>
                    <th className="pb-3 font-medium">{t('macAddress')}</th>
                    <th className="pb-3 font-medium">{t('ipAddress')}</th>
                    <th className="pb-3 font-medium">{t('type')}</th>
                    <th className="pb-3 font-medium">{tc('status')}</th>
                    <th className="pb-3 font-medium text-right">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{device.name}</td>
                      <td className="py-3 text-muted-foreground font-mono text-xs">
                        {device.macAddress ?? '-'}
                      </td>
                      <td className="py-3 text-muted-foreground font-mono text-xs">
                        {device.ipAddress ?? '-'}
                      </td>
                      <td className="py-3">
                        <span className="inline-block bg-muted px-2 py-0.5 rounded text-xs font-medium">
                          {t(`type${device.type.charAt(0).toUpperCase() + device.type.slice(1)}` as any)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            device.isActive ? 'text-green-600' : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              device.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'
                            }`}
                          />
                          {device.isActive ? tc('active') : tc('inactive')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(device)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={tc('edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(device.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {page} / {totalPages} ({total})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &larr;
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">
                {editingDevice ? t('editDevice') : t('addDevice')}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('namePlaceholder')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Bypass Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('type')}</label>
                <select
                  required
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as WGForm['type'] })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {BYPASS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {t(`type${bt.charAt(0).toUpperCase() + bt.slice(1)}` as any)}
                    </option>
                  ))}
                </select>
              </div>

              {/* MAC Address */}
              {needsMac && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('macAddress')}</label>
                  <input
                    type="text"
                    required={needsMac}
                    value={form.macAddress}
                    onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
                    placeholder={t('macPlaceholder')}
                    pattern="^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              {/* IP Address */}
              {needsIp && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('ipAddress')}</label>
                  <input
                    type="text"
                    required={needsIp}
                    value={form.ipAddress}
                    onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                    placeholder={t('ipPlaceholder')}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('description_field')}</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted-foreground/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm">{tc('active')}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? '...' : tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-sm p-5">
            <h2 className="font-semibold mb-2">{tc('confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {t('deleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteDevice.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {deleteDevice.isPending ? '...' : tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
