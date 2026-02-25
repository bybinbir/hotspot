'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useSubscribers,
  useCreateSubscriber,
  useUpdateSubscriber,
  useToggleSubscriber,
  useDeleteSubscriber,
  usePackages,
} from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Users, Search, ToggleLeft, ToggleRight } from 'lucide-react';

interface Subscriber {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  packageId?: string;
  package?: { id: string; name: string };
  macAddress?: string;
  expiresAt?: string;
  isActive: boolean;
}

interface Package {
  id: string;
  name: string;
}

interface FormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  packageId: string;
  macAddress: string;
  expiresAt: string;
}

const emptyForm: FormData = {
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  packageId: '',
  macAddress: '',
  expiresAt: '',
};

function generatePassword(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function SubscribersPage() {
  const t = useTranslations('subscribers');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  const limit = 20;
  const { data: subscribersData, isLoading } = useSubscribers(
    page,
    limit,
    debouncedSearch || undefined,
    statusFilter || undefined,
  );
  const { data: packages } = usePackages();

  const createMutation = useCreateSubscriber();
  const updateMutation = useUpdateSubscriber();
  const toggleMutation = useToggleSubscriber();
  const deleteMutation = useDeleteSubscriber();

  const subscribers: Subscriber[] = subscribersData?.data ?? [];
  const totalPages: number = subscribersData?.totalPages ?? 1;
  const packageList: Package[] = (packages as Package[]) ?? [];

  const getPackageName = useCallback(
    (subscriber: Subscriber): string => {
      if (subscriber.package?.name) return subscriber.package.name;
      if (subscriber.packageId) {
        const pkg = packageList.find((p) => p.id === subscriber.packageId);
        return pkg?.name ?? '-';
      }
      return '-';
    },
    [packageList],
  );

  const openCreateModal = () => {
    setEditingSubscriber(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setForm({
      username: subscriber.username,
      password: '',
      firstName: subscriber.firstName ?? '',
      lastName: subscriber.lastName ?? '',
      email: subscriber.email ?? '',
      phone: subscriber.phone ?? '',
      packageId: subscriber.packageId ?? subscriber.package?.id ?? '',
      macAddress: subscriber.macAddress ?? '',
      expiresAt: subscriber.expiresAt ? subscriber.expiresAt.slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSubscriber(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSubscriber) {
        await updateMutation.mutateAsync({
          id: editingSubscriber.id,
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          packageId: form.packageId || undefined,
          macAddress: form.macAddress || undefined,
          expiresAt: form.expiresAt || undefined,
        });
        toast.success(tc('success'));
      } else {
        await createMutation.mutateAsync({
          username: form.username,
          password: form.password,
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          packageId: form.packageId,
          macAddress: form.macAddress || undefined,
          expiresAt: form.expiresAt || undefined,
        });
        toast.success(tc('success'));
      }
      closeModal();
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
      toast.success(tc('success'));
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          onClick={openCreateModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addSubscriber')}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tc('search')}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-background"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="">{tc('status')}</option>
          <option value="active">{tc('active')}</option>
          <option value="inactive">{tc('inactive')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {tc('loading')}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Users className="w-8 h-8" />
            {tc('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">{t('username')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('firstName')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('email')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('phone')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('package')}</th>
                  <th className="text-left px-4 py-3 font-medium">{tc('status')}</th>
                  <th className="text-left px-4 py-3 font-medium">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{subscriber.username}</td>
                    <td className="px-4 py-3">
                      {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="px-4 py-3">{subscriber.email || '-'}</td>
                    <td className="px-4 py-3">{subscriber.phone || '-'}</td>
                    <td className="px-4 py-3">{getPackageName(subscriber)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          subscriber.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {subscriber.isActive ? tc('active') : tc('inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(subscriber.id)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                          title={subscriber.isActive ? tc('inactive') : tc('active')}
                        >
                          {subscriber.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(subscriber)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                          title={tc('edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(subscriber.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
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
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingSubscriber ? tc('edit') : t('addSubscriber')}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username - only on create */}
              {!editingSubscriber && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('username')}</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              )}

              {/* Password - only on create */}
              {!editingSubscriber && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('password')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, password: generatePassword() })}
                      className="border px-4 py-2 rounded-lg text-sm hover:bg-muted whitespace-nowrap"
                    >
                      {t('generatePassword')}
                    </button>
                  </div>
                </div>
              )}

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('firstName')}</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('lastName')}</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Package */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('package')}</label>
                <select
                  required
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">{t('package')}</option>
                  {packageList.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* MAC Address */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('macAddress')}</label>
                <input
                  type="text"
                  value={form.macAddress}
                  onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('expiresAt')}</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-muted"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">{tc('confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {tc('delete')}?
            </p>
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
    </div>
  );
}
