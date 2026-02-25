'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useVouchers, useGenerateVouchers, useDeleteVoucher, usePackages } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Plus, Trash2, X, Ticket, Copy, Download } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

const STATUS_OPTIONS = ['all', 'unused', 'active', 'expired', 'depleted'] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  unused: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  depleted: 'bg-yellow-100 text-yellow-700',
};

interface GenerateForm {
  packageId: string;
  quantity: number;
  prefix: string;
  codeLength: number;
  expiresAt: string;
}

const INITIAL_FORM: GenerateForm = {
  packageId: '',
  quantity: 10,
  prefix: '',
  codeLength: 8,
  expiresAt: '',
};

export default function VouchersPage() {
  const t = useTranslations('vouchers');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [form, setForm] = useState<GenerateForm>(INITIAL_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const limit = 20;
  const effectiveStatus = statusFilter === 'all' ? undefined : statusFilter;
  const effectivePackageId = packageFilter || undefined;

  const { data: vouchersData, isLoading } = useVouchers(page, limit, effectiveStatus, effectivePackageId);
  const { data: packages } = usePackages();
  const generateMutation = useGenerateVouchers();
  const deleteMutation = useDeleteVoucher();

  const vouchers = vouchersData?.data ?? [];
  const totalPages = vouchersData?.totalPages ?? 1;
  const packageList: any[] = packages ?? [];

  const getPackageName = (packageId: string) => {
    const pkg = packageList.find((p: any) => p.id === packageId || p._id === packageId);
    return pkg?.name ?? packageId;
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(code + ' kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.packageId || !form.expiresAt) return;

    try {
      await generateMutation.mutateAsync({
        packageId: form.packageId,
        quantity: form.quantity,
        prefix: form.prefix || undefined,
        codeLength: form.codeLength,
        expiresAt: form.expiresAt,
      });
      toast.success(`${form.quantity} voucher oluşturuldu`);
      setShowGenerateModal(false);
      setForm(INITIAL_FORM);
    } catch {
      toast.error('Voucher oluşturulamadı');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Voucher silindi');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Voucher silinemedi');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.post('/v1/vouchers/export', null, {
        params: { batchId: undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vouchers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV indirildi');
    } catch {
      toast.error('Export başarısız');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('generate')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{tc('status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All' : s === 'unused' ? t('unused') : s === 'active' ? tc('active') : s === 'expired' ? t('expired') : 'Depleted'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Package</label>
            <select
              value={packageFilter}
              onChange={(e) => { setPackageFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">All Packages</option>
              {packageList.map((pkg: any) => (
                <option key={pkg.id ?? pkg._id} value={pkg.id ?? pkg._id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{tc('loading')}</div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Ticket className="w-8 h-8 text-muted-foreground/50" />
            {tc('noData')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t('code')}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Package</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{tc('status')}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Created At</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Expires At</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Used At</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher: any) => (
                    <tr key={voucher.id ?? voucher._id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{voucher.code}</code>
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {getPackageName(voucher.packageId)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[voucher.status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {voucher.status === 'unused' ? t('unused') : voucher.status === 'active' ? tc('active') : voucher.status === 'expired' ? t('expired') : 'Depleted'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3">
                        {deleteConfirmId === (voucher.id ?? voucher._id) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(voucher.id ?? voucher._id)}
                              disabled={deleteMutation.isPending}
                              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 disabled:opacity-50"
                            >
                              {tc('confirm')}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="border px-3 py-1.5 rounded-lg text-xs hover:bg-muted"
                            >
                              {tc('cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(voucher.id ?? voucher._id)}
                            className="text-muted-foreground hover:text-red-500"
                            title={tc('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {vouchersData?.total ?? 0} total &middot; Page {page} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tc('back')}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tc('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Vouchers Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('generate')}</h2>
              <button
                onClick={() => { setShowGenerateModal(false); setForm(INITIAL_FORM); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Package Select */}
              <div>
                <label className="block text-sm font-medium mb-1">Package *</label>
                <select
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select a package</option>
                  {packageList.map((pkg: any) => (
                    <option key={pkg.id ?? pkg._id} value={pkg.id ?? pkg._id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('quantity')} *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('prefix')}</label>
                <input
                  type="text"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                  placeholder="e.g. HOTEL"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Code Length */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('codeLength')}</label>
                <input
                  type="number"
                  min={6}
                  max={12}
                  value={form.codeLength}
                  onChange={(e) => setForm({ ...form, codeLength: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium mb-1">Expires At *</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex-1"
                >
                  {generateMutation.isPending ? tc('loading') : t('generate')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowGenerateModal(false); setForm(INITIAL_FORM); }}
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-muted flex-1"
                >
                  {tc('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
