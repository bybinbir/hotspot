'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { usePortalTheme, useUpdatePortalTheme } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Palette, Type, Lock, Settings2, Save } from 'lucide-react';

interface PortalTheme {
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  welcomeTitle: { tr: string; en: string };
  welcomeMessage: { tr: string; en: string };
  termsAndConditions: { tr: string; en: string };
  footerText: { tr: string; en: string };
  loginMethods: string[];
  showPackageSelection: boolean;
  customCss: string | null;
  redirectUrl: string | null;
}

const defaultTheme: PortalTheme = {
  logoUrl: null,
  backgroundImageUrl: null,
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  welcomeTitle: { tr: '', en: '' },
  welcomeMessage: { tr: '', en: '' },
  termsAndConditions: { tr: '', en: '' },
  footerText: { tr: '', en: '' },
  loginMethods: ['username_password'],
  showPackageSelection: true,
  customCss: null,
  redirectUrl: null,
};

export default function PortalSettingsPage() {
  const t = useTranslations('portal');
  const tc = useTranslations('common');

  const { data: themeData, isLoading } = usePortalTheme();
  const updateTheme = useUpdatePortalTheme();

  const [form, setForm] = useState<PortalTheme>(defaultTheme);
  const [textLang, setTextLang] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    if (themeData) {
      const d = themeData.data ?? themeData;
      setForm({
        logoUrl: d.logoUrl ?? null,
        backgroundImageUrl: d.backgroundImageUrl ?? null,
        primaryColor: d.primaryColor ?? '#3b82f6',
        secondaryColor: d.secondaryColor ?? '#6366f1',
        textColor: d.textColor ?? '#1f2937',
        backgroundColor: d.backgroundColor ?? '#ffffff',
        welcomeTitle: d.welcomeTitle ?? { tr: '', en: '' },
        welcomeMessage: d.welcomeMessage ?? { tr: '', en: '' },
        termsAndConditions: d.termsAndConditions ?? { tr: '', en: '' },
        footerText: d.footerText ?? { tr: '', en: '' },
        loginMethods: d.loginMethods ?? ['username_password'],
        showPackageSelection: d.showPackageSelection ?? true,
        customCss: d.customCss ?? null,
        redirectUrl: d.redirectUrl ?? null,
      });
    }
  }, [themeData]);

  const handleSave = async () => {
    try {
      await updateTheme.mutateAsync(form);
      toast.success(t('saveSuccess'));
    } catch {
      toast.error(tc('error'));
    }
  };

  const updateColor = (field: keyof PortalTheme, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateMultiLang = (
    field: 'welcomeTitle' | 'welcomeMessage' | 'termsAndConditions' | 'footerText',
    lang: 'tr' | 'en',
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  };

  const toggleLoginMethod = (method: string) => {
    setForm((prev) => {
      const methods = prev.loginMethods.includes(method)
        ? prev.loginMethods.filter((m) => m !== method)
        : [...prev.loginMethods, method];
      return { ...prev, loginMethods: methods };
    });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          onClick={handleSave}
          disabled={updateTheme.isPending}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {updateTheme.isPending ? '...' : tc('save')}
        </button>
      </div>

      <div className="space-y-6">
        {/* ==================== Colors Section ==================== */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">{t('colors')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Primary Color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('primaryColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => updateColor('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => updateColor('primaryColor', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('secondaryColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => updateColor('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={(e) => updateColor('secondaryColor', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('textColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => updateColor('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.textColor}
                  onChange={(e) => updateColor('textColor', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('backgroundColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.backgroundColor}
                  onChange={(e) => updateColor('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={form.backgroundColor}
                  onChange={(e) => updateColor('backgroundColor', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-5 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">{t('preview')}</p>
            <div
              className="rounded-xl p-6 border"
              style={{ backgroundColor: form.backgroundColor }}
            >
              <div className="max-w-xs mx-auto text-center space-y-3">
                <h3
                  className="text-lg font-bold"
                  style={{ color: form.textColor }}
                >
                  {form.welcomeTitle[textLang] || 'Welcome'}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: form.textColor, opacity: 0.7 }}
                >
                  {form.welcomeMessage[textLang] || 'Please connect to continue'}
                </p>
                <button
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  Connect
                </button>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: form.secondaryColor }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: form.textColor, opacity: 0.5 }}
                  >
                    {form.footerText[textLang] || 'Footer text'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== Texts Section ==================== */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">{t('texts')}</h2>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-1 mb-4">
            <button
              onClick={() => setTextLang('tr')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                textLang === 'tr'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              TR
            </button>
            <button
              onClick={() => setTextLang('en')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                textLang === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
          </div>

          <div className="space-y-4">
            {/* Welcome Title */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('welcomeTitle')}</label>
              <input
                type="text"
                value={form.welcomeTitle[textLang]}
                onChange={(e) => updateMultiLang('welcomeTitle', textLang, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>

            {/* Welcome Message */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('welcomeMessage')}</label>
              <textarea
                rows={3}
                value={form.welcomeMessage[textLang]}
                onChange={(e) => updateMultiLang('welcomeMessage', textLang, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('termsAndConditions')}</label>
              <textarea
                rows={4}
                value={form.termsAndConditions[textLang]}
                onChange={(e) => updateMultiLang('termsAndConditions', textLang, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('footerText')}</label>
              <input
                type="text"
                value={form.footerText[textLang]}
                onChange={(e) => updateMultiLang('footerText', textLang, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
        </div>

        {/* ==================== Login Methods Section ==================== */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">{t('loginMethods')}</h2>
          </div>

          <div className="space-y-3">
            {/* Username & Password */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.loginMethods.includes('username_password')}
                onChange={() => toggleLoginMethod('username_password')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">{t('usernamePassword')}</span>
            </label>

            {/* Voucher */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.loginMethods.includes('voucher')}
                onChange={() => toggleLoginMethod('voucher')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">{t('voucher')}</span>
            </label>

            {/* SMS */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.loginMethods.includes('sms')}
                onChange={() => toggleLoginMethod('sms')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">{t('sms')}</span>
            </label>
          </div>
        </div>

        {/* ==================== Advanced Section ==================== */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">{t('theme')}</h2>
          </div>

          <div className="space-y-4">
            {/* Show Package Selection */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showPackageSelection}
                onChange={(e) => setForm((prev) => ({ ...prev, showPackageSelection: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">{t('showPackageSelection')}</span>
            </label>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('logoUrl')}</label>
              <input
                type="text"
                value={form.logoUrl ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Background Image URL */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('backgroundImageUrl')}</label>
              <input
                type="text"
                value={form.backgroundImageUrl ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, backgroundImageUrl: e.target.value || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="https://example.com/bg.jpg"
              />
            </div>

            {/* Custom CSS */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('customCss')}</label>
              <textarea
                rows={5}
                value={form.customCss ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, customCss: e.target.value || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none font-mono"
                placeholder=".portal-container { ... }"
              />
            </div>

            {/* Redirect URL */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t('redirectUrl')}</label>
              <input
                type="text"
                value={form.redirectUrl ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, redirectUrl: e.target.value || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* ==================== Bottom Save Button ==================== */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateTheme.isPending}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateTheme.isPending ? '...' : tc('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
