'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Router } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  secret: string;
  type: 'mikrotik' | 'cisco' | 'juniper' | 'generic';
  nasPort: number;
  coaPort: number;
  description?: string;
  status?: string;
}

interface DeviceForm {
  name: string;
  ipAddress: string;
  secret: string;
  type: 'mikrotik' | 'cisco' | 'juniper' | 'generic';
  nasPort: number;
  coaPort: number;
  description: string;
}

const DEVICE_TYPES = ['mikrotik', 'cisco', 'juniper', 'generic'] as const;

const emptyForm: DeviceForm = {
  name: '',
  ipAddress: '',
  secret: '',
  type: 'mikrotik',
  nasPort: 1812,
  coaPort: 3799,
  description: '',
};

export default function DevicesPage() {
  const t = useTranslations('devices');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useDevices(page, limit);
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const devices: Device[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function openCreateForm() {
    setEditingDevice(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(device: Device) {
    setEditingDevice(device);
    setForm({
      name: device.name,
      ipAddress: device.ipAddress,
      secret: device.secret,
      type: device.type,
      nasPort: device.nasPort ?? 1812,
      coaPort: device.coaPort ?? 3799,
      description: device.description ?? '',
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

    try {
      if (editingDevice) {
        await updateDevice.mutateAsync({
          id: editingDevice.id,
          ...form,
        });
        toast.success(t('name') + ' ' + tc('save').toLowerCase());
      } else {
        await createDevice.mutateAsync(form);
        toast.success(t('addDevice') + ' - ' + tc('save').toLowerCase());
      }
      closeForm();
    } catch {
      toast.error(tc('save') + ' - error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDevice.mutateAsync(id);
      toast.success(tc('delete') + ' - OK');
      setDeletingId(null);
    } catch {
      toast.error(tc('delete') + ' - error');
    }
  }

  const isSaving = createDevice.isPending || updateDevice.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
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
            <Router className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{tc('noData')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">{t('name')}</th>
                    <th className="pb-3 font-medium">{t('ipAddress')}</th>
                    <th className="pb-3 font-medium">{t('type')}</th>
                    <th className="pb-3 font-medium">{t('port')}</th>
                    <th className="pb-3 font-medium">{tc('status')}</th>
                    <th className="pb-3 font-medium text-right">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{device.name}</td>
                      <td className="py-3 text-muted-foreground">{device.ipAddress}</td>
                      <td className="py-3">
                        <span className="inline-block bg-muted px-2 py-0.5 rounded text-xs font-medium">
                          {t(device.type)}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{device.nasPort ?? 1812}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            device.status === 'active'
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              device.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/40'
                            }`}
                          />
                          {device.status === 'active' ? tc('active') : tc('inactive')}
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
                    &larr; Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next &rarr;
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
                {editingDevice ? tc('edit') : t('addDevice')}
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
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* IP Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('ipAddress')}</label>
                <input
                  type="text"
                  required
                  value={form.ipAddress}
                  onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                  placeholder="192.168.1.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Secret */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('secret')}</label>
                <input
                  type="text"
                  required
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Type + Ports row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('type')}</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as DeviceForm['type'] })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {DEVICE_TYPES.map((dtype) => (
                      <option key={dtype} value={dtype}>
                        {t(dtype)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">NAS {t('port')}</label>
                  <input
                    type="number"
                    value={form.nasPort}
                    onChange={(e) => setForm({ ...form, nasPort: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CoA {t('port')}</label>
                  <input
                    type="number"
                    value={form.coaPort}
                    onChange={(e) => setForm({ ...form, coaPort: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('description')}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
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
              {tc('delete')}?
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
