'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useTenants,
  useProvisionTenant,
  useSuspendTenant,
  useActivateTenant,
  useDeleteTenant,
  useCustomerCountTemplates,
  useSpeedPackageTemplates,
} from '@/lib/api/hooks';
import { toast } from 'sonner';
import {
  Plus,
  Building2,
  Trash2,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'trial';
  maxSubscribers: number;
  maxDevices: number;
  createdAt: string;
}

interface CustomerCountTemplate {
  id: string;
  name: string;
  maxSubscribers: number;
  maxDevices: number;
  description?: string;
}

interface SpeedPackageTemplate {
  id: string;
  name: string;
  description?: string;
  packageCount?: number;
}

interface WizardForm {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  maxSubscribers: number;
  maxDevices: number;
  customerCountTemplateId: string;
  speedPackageTemplateId: string;
  speedPackageTemplateName: string;
  customerCountTemplateName: string;
}

const emptyWizardForm: WizardForm = {
  name: '',
  slug: '',
  adminEmail: '',
  adminPassword: '',
  adminName: '',
  maxSubscribers: 0,
  maxDevices: 0,
  customerCountTemplateId: '',
  speedPackageTemplateId: '',
  speedPackageTemplateName: '',
  customerCountTemplateName: '',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '');
}

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  trial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  trial: 'Trial',
};

export default function TenantsPage() {
  const t = useTranslations('superadmin');
  const tc = useTranslations('common');

  // List state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState<WizardForm>(emptyWizardForm);

  const limit = 20;
  const { data: tenantsData, isLoading } = useTenants(
    page,
    limit,
    search || undefined,
    statusFilter || undefined,
  );
  const provisionMutation = useProvisionTenant();
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();
  const deleteMutation = useDeleteTenant();

  const { data: customerCountTemplatesData } = useCustomerCountTemplates();
  const { data: speedPackageTemplatesData } = useSpeedPackageTemplates();

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const totalPages: number = tenantsData?.totalPages ?? 1;

  const customerCountTemplates: CustomerCountTemplate[] =
    (customerCountTemplatesData as CustomerCountTemplate[]) ?? [];
  const speedPackageTemplates: SpeedPackageTemplate[] =
    (speedPackageTemplatesData as SpeedPackageTemplate[]) ?? [];

  // --- Tenant actions ---
  const handleSuspend = async (id: string) => {
    try {
      await suspendMutation.mutateAsync(id);
      toast.success(tc('success'));
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
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

  // --- Wizard helpers ---
  const openWizard = () => {
    setWizardForm(emptyWizardForm);
    setWizardStep(1);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setWizardForm(emptyWizardForm);
  };

  const handleNameChange = (value: string) => {
    setWizardForm((prev) => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const canProceed = (): boolean => {
    switch (wizardStep) {
      case 1:
        return !!(
          wizardForm.name.trim() &&
          wizardForm.slug.trim() &&
          wizardForm.adminEmail.trim() &&
          wizardForm.adminPassword.trim() &&
          wizardForm.adminName.trim()
        );
      case 2:
        return !!(wizardForm.customerCountTemplateId && wizardForm.maxSubscribers > 0);
      case 3:
        return true; // Speed package template is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleProvision = async () => {
    try {
      await provisionMutation.mutateAsync({
        name: wizardForm.name,
        slug: wizardForm.slug,
        adminEmail: wizardForm.adminEmail,
        adminPassword: wizardForm.adminPassword,
        adminName: wizardForm.adminName,
        maxSubscribers: wizardForm.maxSubscribers,
        maxDevices: wizardForm.maxDevices,
        templateId: wizardForm.speedPackageTemplateId || undefined,
      });
      toast.success(tc('success'));
      closeWizard();
    } catch {
      toast.error(tc('error'));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR');
    } catch {
      return dateStr;
    }
  };

  // --- Step indicator ---
  const stepLabels = [
    t('wizard.step1'),
    t('wizard.step2'),
    t('wizard.step3'),
    t('wizard.step4'),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('tenants')}</h1>
        <button
          onClick={openWizard}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addTenant')}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tc('search')}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
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
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
        </select>
      </div>

      {/* Tenant Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {tc('loading')}
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Building2 className="w-8 h-8" />
            {tc('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">{t('wizard.businessName')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('wizard.subdomain')}</th>
                  <th className="text-left px-4 py-3 font-medium">{tc('status')}</th>
                  <th className="text-left px-4 py-3 font-medium">Max Subscribers</th>
                  <th className="text-left px-4 py-3 font-medium">Max Devices</th>
                  <th className="text-left px-4 py-3 font-medium">Created At</th>
                  <th className="text-left px-4 py-3 font-medium">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{tenant.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tenant.slug}.onspot.com.tr
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGES[tenant.status] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {STATUS_LABELS[tenant.status] ?? tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{tenant.maxSubscribers}</td>
                    <td className="px-4 py-3">{tenant.maxDevices}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(tenant.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {tenant.status === 'active' || tenant.status === 'trial' ? (
                          <button
                            onClick={() => handleSuspend(tenant.id)}
                            className="p-1.5 rounded-lg hover:bg-muted"
                            title="Suspend"
                          >
                            <PauseCircle className="w-4 h-4 text-yellow-600" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(tenant.id)}
                            className="p-1.5 rounded-lg hover:bg-muted"
                            title="Activate"
                          >
                            <PlayCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(tenant.id)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">{tc('confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{tc('delete')}?</p>
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

      {/* Tenant Provisioning Wizard */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{t('wizard.title')}</h2>
              <button
                onClick={closeWizard}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-5 pt-5">
              <div className="flex items-center justify-between">
                {stepLabels.map((label, idx) => {
                  const stepNum = idx + 1;
                  const isActive = wizardStep === stepNum;
                  const isCompleted = wizardStep > stepNum;

                  return (
                    <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                        </div>
                        <span
                          className={`text-xs mt-1.5 text-center whitespace-nowrap ${
                            isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {idx < stepLabels.length - 1 && (
                        <div
                          className={`flex-1 h-px mx-3 mt-[-1rem] ${
                            isCompleted ? 'bg-green-500' : 'bg-muted'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-5">
              {/* Step 1: Temel Bilgiler */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('wizard.businessName')}</label>
                    <input
                      type="text"
                      required
                      value={wizardForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('wizard.subdomain')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={wizardForm.slug}
                        onChange={(e) =>
                          setWizardForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                        }
                        className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        .onspot.com.tr
                      </span>
                    </div>
                    {wizardForm.slug && (
                      <p className="text-xs text-muted-foreground">
                        {wizardForm.slug}.onspot.com.tr
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('wizard.adminEmail')}</label>
                    <input
                      type="email"
                      required
                      value={wizardForm.adminEmail}
                      onChange={(e) =>
                        setWizardForm((prev) => ({ ...prev, adminEmail: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('wizard.adminPassword')}</label>
                    <input
                      type="text"
                      required
                      value={wizardForm.adminPassword}
                      onChange={(e) =>
                        setWizardForm((prev) => ({ ...prev, adminPassword: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Admin Adi</label>
                    <input
                      type="text"
                      required
                      value={wizardForm.adminName}
                      onChange={(e) =>
                        setWizardForm((prev) => ({ ...prev, adminName: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Musteri Paketi */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t('wizard.selectTemplate')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customerCountTemplates.map((tmpl) => {
                      const isSelected = wizardForm.customerCountTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() =>
                            setWizardForm((prev) => ({
                              ...prev,
                              customerCountTemplateId: tmpl.id,
                              customerCountTemplateName: tmpl.name,
                              maxSubscribers: tmpl.maxSubscribers,
                              maxDevices: tmpl.maxDevices,
                            }))
                          }
                          className={`border-2 rounded-xl p-4 cursor-pointer text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="font-medium text-sm mb-1">{tmpl.name}</div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Max Subscribers: {tmpl.maxSubscribers}</div>
                            <div>Max Devices: {tmpl.maxDevices}</div>
                            {tmpl.description && <div className="mt-1">{tmpl.description}</div>}
                          </div>
                          {isSelected && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                              <Check className="w-3 h-3" />
                              Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {customerCountTemplates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {tc('noData')}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Hiz Paketleri Sablonu */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t('wizard.selectTemplate')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Empty option */}
                    <button
                      type="button"
                      onClick={() =>
                        setWizardForm((prev) => ({
                          ...prev,
                          speedPackageTemplateId: '',
                          speedPackageTemplateName: '',
                        }))
                      }
                      className={`border-2 rounded-xl p-4 cursor-pointer text-left transition-colors ${
                        wizardForm.speedPackageTemplateId === ''
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">Bos (admin kendisi ekler)</div>
                      <div className="text-xs text-muted-foreground">
                        Hiz paketlerini admin kendisi olusturur
                      </div>
                      {wizardForm.speedPackageTemplateId === '' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                          <Check className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </button>

                    {speedPackageTemplates.map((tmpl) => {
                      const isSelected = wizardForm.speedPackageTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() =>
                            setWizardForm((prev) => ({
                              ...prev,
                              speedPackageTemplateId: tmpl.id,
                              speedPackageTemplateName: tmpl.name,
                            }))
                          }
                          className={`border-2 rounded-xl p-4 cursor-pointer text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="font-medium text-sm mb-1">{tmpl.name}</div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {tmpl.description && <div>{tmpl.description}</div>}
                            {tmpl.packageCount !== undefined && (
                              <div>{tmpl.packageCount} paket</div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                              <Check className="w-3 h-3" />
                              Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Ozet ve Onay */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium mb-3">{t('wizard.review')}</p>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('wizard.businessName')}</span>
                      <span className="font-medium">{wizardForm.name}</span>
                    </div>
                    <div className="border-t" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('wizard.subdomain')}</span>
                      <span className="font-medium">{wizardForm.slug}.onspot.com.tr</span>
                    </div>
                    <div className="border-t" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('wizard.adminEmail')}</span>
                      <span className="font-medium">{wizardForm.adminEmail}</span>
                    </div>
                    <div className="border-t" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Subscribers / Max Devices</span>
                      <span className="font-medium">
                        {wizardForm.maxSubscribers} / {wizardForm.maxDevices}
                      </span>
                    </div>
                    <div className="border-t" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hiz Paketi Sablonu</span>
                      <span className="font-medium">
                        {wizardForm.speedPackageTemplateName || 'Manuel'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between p-5 border-t">
              <button
                onClick={() => {
                  if (wizardStep === 1) {
                    closeWizard();
                  } else {
                    setWizardStep((s) => s - 1);
                  }
                }}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-muted inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {wizardStep === 1 ? tc('cancel') : 'Geri'}
              </button>

              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  Ileri
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleProvision}
                  disabled={provisionMutation.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {provisionMutation.isPending ? '...' : t('wizard.createTenant')}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
