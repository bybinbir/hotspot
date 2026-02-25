'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Package, ArrowDown, ArrowUp } from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  dataLimit: number | null;
  timeLimit: number | null;
  durationDays: number;
  simultaneousSessions: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormData {
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  dataLimit: string;
  timeLimit: string;
  durationDays: number;
  simultaneousSessions: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: FormData = {
  name: '',
  downloadSpeed: 1024,
  uploadSpeed: 1024,
  dataLimit: '',
  timeLimit: '',
  durationDays: 30,
  simultaneousSessions: 1,
  price: 0,
  currency: 'TRY',
  isActive: true,
  sortOrder: 0,
};

function formatSpeed(kbps: number): string {
  return (kbps / 1024).toFixed(kbps % 1024 === 0 ? 0 : 1);
}

function formatDataLimit(bytes: number | null, unlimitedLabel: string): string {
  if (bytes === null || bytes === 0) return unlimitedLabel;
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(gb % 1 === 0 ? 0 : 1)} GB`;
}

function formatTimeLimit(minutes: number | null, unlimitedLabel: string): string {
  if (minutes === null || minutes === 0) return unlimitedLabel;
  const hours = minutes / 60;
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} saat`;
}

export default function PackagesPage() {
  const t = useTranslations('packages');
  const tc = useTranslations('common');

  const { data: packages, isLoading } = usePackages();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (pkg: PackageData) => {
    setForm({
      name: pkg.name,
      downloadSpeed: pkg.downloadSpeed,
      uploadSpeed: pkg.uploadSpeed,
      dataLimit: pkg.dataLimit ? String(pkg.dataLimit) : '',
      timeLimit: pkg.timeLimit ? String(pkg.timeLimit) : '',
      durationDays: pkg.durationDays,
      simultaneousSessions: pkg.simultaneousSessions,
      price: pkg.price,
      currency: pkg.currency,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    });
    setEditingId(pkg.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      downloadSpeed: Number(form.downloadSpeed),
      uploadSpeed: Number(form.uploadSpeed),
      dataLimit: form.dataLimit ? Number(form.dataLimit) : null,
      timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
      durationDays: Number(form.durationDays),
      simultaneousSessions: Number(form.simultaneousSessions),
      price: Number(form.price),
      currency: form.currency,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };

    try {
      if (editingId) {
        await updatePackage.mutateAsync({ id: editingId, ...payload });
        toast.success(t('name') + ' güncellendi');
      } else {
        await createPackage.mutateAsync(payload);
        toast.success(t('name') + ' oluşturuldu');
      }
      closeModal();
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackage.mutateAsync(id);
      toast.success('Paket silindi');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-muted-foreground">{tc('loading')}</span>
        </div>
      </div>
    );
  }

  const packageList: PackageData[] = packages?.data ?? packages ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addPackage')}
        </button>
      </div>

      {/* Package Cards Grid */}
      {packageList.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{tc('noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packageList.map((pkg: PackageData) => (
            <div key={pkg.id} className="bg-card border rounded-xl p-5 flex flex-col">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {pkg.isActive ? tc('active') : tc('inactive')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(pkg)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={tc('edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(pkg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors dark:hover:bg-red-900/20"
                    title={tc('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Speed Info */}
              <div className="bg-muted/50 rounded-lg px-3 py-2.5 mb-3">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-medium">{formatSpeed(pkg.downloadSpeed)}</span>
                    <span className="text-muted-foreground">{t('mbps')}</span>
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">{formatSpeed(pkg.uploadSpeed)}</span>
                    <span className="text-muted-foreground">{t('mbps')}</span>
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dataLimit')}</span>
                  <span className="font-medium">{formatDataLimit(pkg.dataLimit, t('unlimited'))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('timeLimit')}</span>
                  <span className="font-medium">{formatTimeLimit(pkg.timeLimit, t('unlimited'))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('duration')}</span>
                  <span className="font-medium">
                    {pkg.durationDays} {t('days')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('simultaneousSessions')}</span>
                  <span className="font-medium">{pkg.simultaneousSessions}</span>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground text-sm">{t('price')}</span>
                  <span className="text-lg font-bold">
                    {pkg.price.toLocaleString('tr-TR')} {pkg.currency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-2">Paketi Sil</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Bu paketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletePackage.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {deletePackage.isPending ? '...' : tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card rounded-t-xl">
              <h2 className="font-semibold text-lg">
                {editingId ? tc('edit') : t('addPackage')}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  placeholder="Standart Paket"
                />
              </div>

              {/* Download / Upload Speed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('downloadSpeed')} (Kbps)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.downloadSpeed}
                    onChange={(e) => updateField('downloadSpeed', Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('uploadSpeed')} (Kbps)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.uploadSpeed}
                    onChange={(e) => updateField('uploadSpeed', Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              {/* Data Limit / Time Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('dataLimit')} (bytes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.dataLimit}
                    onChange={(e) => updateField('dataLimit', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    placeholder={t('unlimited')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('timeLimit')} (dk)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.timeLimit}
                    onChange={(e) => updateField('timeLimit', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    placeholder={t('unlimited')}
                  />
                </div>
              </div>

              {/* Duration / Sessions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('duration')} ({t('days')})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => updateField('durationDays', Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('simultaneousSessions')}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.simultaneousSessions}
                    onChange={(e) => updateField('simultaneousSessions', Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              {/* Price / Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('price')}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('currency')}</label>
                  <input
                    type="text"
                    required
                    value={form.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Sıralama</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => updateField('sortOrder', Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  {tc('active')}
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createPackage.isPending || updatePackage.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {createPackage.isPending || updatePackage.isPending ? '...' : tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
