import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// ==================== Devices ====================

export function useDevices(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['devices', page, limit],
    queryFn: () => apiClient.get('/v1/devices', { params: { page, limit } }).then(r => r.data),
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/devices', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/v1/devices/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/devices/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

// ==================== Packages ====================

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: () => apiClient.get('/v1/packages').then(r => r.data),
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/packages', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/v1/packages/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/packages/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

// ==================== Subscribers ====================

export function useSubscribers(page = 1, limit = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ['subscribers', page, limit, search, status],
    queryFn: () => apiClient.get('/v1/subscribers', { params: { page, limit, search, status } }).then(r => r.data),
  });
}

export function useCreateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/subscribers', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  });
}

export function useUpdateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/v1/subscribers/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  });
}

export function useToggleSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/v1/subscribers/${id}/toggle`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  });
}

export function useDeleteSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/subscribers/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  });
}

// ==================== Vouchers ====================

export function useVouchers(page = 1, limit = 20, status?: string, packageId?: string) {
  return useQuery({
    queryKey: ['vouchers', page, limit, status, packageId],
    queryFn: () => apiClient.get('/v1/vouchers', { params: { page, limit, status, packageId } }).then(r => r.data),
  });
}

export function useGenerateVouchers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/vouchers/generate', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/vouchers/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  });
}

// ==================== RADIUS / Sessions ====================

export function useActiveSessions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['sessions', 'active', page, limit],
    queryFn: () => apiClient.get('/v1/radius/sessions/active', { params: { page, limit } }).then(r => r.data),
  });
}

export function useSessionHistory(page = 1, limit = 20, username?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sessions', 'history', page, limit, username, startDate, endDate],
    queryFn: () => apiClient.get('/v1/radius/sessions/history', { params: { page, limit, username, startDate, endDate } }).then(r => r.data),
  });
}

export function useUsageStats() {
  return useQuery({
    queryKey: ['radius', 'stats'],
    queryFn: () => apiClient.get('/v1/radius/stats').then(r => r.data),
  });
}

export function useAuthLogs(page = 1, limit = 20, username?: string) {
  return useQuery({
    queryKey: ['radius', 'auth-logs', page, limit, username],
    queryFn: () => apiClient.get('/v1/radius/auth-logs', { params: { page, limit, username } }).then(r => r.data),
  });
}

export function useDisconnectUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => apiClient.post(`/v1/radius/disconnect/${username}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useDisconnectSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.post(`/v1/radius/disconnect-session/${sessionId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

// ==================== Super Admin - Tenants ====================

export function useTenants(page = 1, limit = 20, search?: string, status?: string) {
  return useQuery({
    queryKey: ['tenants', page, limit, search, status],
    queryFn: () => apiClient.get('/admin/v1/tenants', { params: { page, limit, search, status } }).then(r => r.data),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: () => apiClient.get(`/admin/v1/tenants/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useTenantStats(id: string) {
  return useQuery({
    queryKey: ['tenants', id, 'stats'],
    queryFn: () => apiClient.get(`/admin/v1/tenants/${id}/stats`).then(r => r.data),
    enabled: !!id,
  });
}

export function useProvisionTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/v1/tenants', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/admin/v1/tenants/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/v1/tenants/${id}/suspend`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/v1/tenants/${id}/activate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/v1/tenants/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

// ==================== Super Admin - Templates ====================

export function useCustomerCountTemplates() {
  return useQuery({
    queryKey: ['templates', 'customer-count'],
    queryFn: () => apiClient.get('/admin/v1/templates/customer-count').then(r => r.data),
  });
}

export function useCreateCustomerCountTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/v1/templates/customer-count', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'customer-count'] }),
  });
}

export function useUpdateCustomerCountTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/admin/v1/templates/customer-count/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'customer-count'] }),
  });
}

export function useDeleteCustomerCountTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/v1/templates/customer-count/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'customer-count'] }),
  });
}

export function useSpeedPackageTemplates() {
  return useQuery({
    queryKey: ['templates', 'speed-packages'],
    queryFn: () => apiClient.get('/admin/v1/templates/speed-packages').then(r => r.data),
  });
}

export function useCreateSpeedPackageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/v1/templates/speed-packages', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'speed-packages'] }),
  });
}

export function useUpdateSpeedPackageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/admin/v1/templates/speed-packages/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'speed-packages'] }),
  });
}

export function useDeleteSpeedPackageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/v1/templates/speed-packages/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates', 'speed-packages'] }),
  });
}

// ==================== Walled Garden ====================

export function useWalledGardenDevices(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['walled-garden', page, limit],
    queryFn: () => apiClient.get('/v1/walled-garden', { params: { page, limit } }).then(r => r.data),
  });
}

export function useCreateWalledGardenDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/walled-garden', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['walled-garden'] }),
  });
}

export function useUpdateWalledGardenDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/v1/walled-garden/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['walled-garden'] }),
  });
}

export function useDeleteWalledGardenDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/walled-garden/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['walled-garden'] }),
  });
}

// ==================== Portal Theme ====================

export function usePortalTheme() {
  return useQuery({
    queryKey: ['portal-theme'],
    queryFn: () => apiClient.get('/v1/portal-theme').then(r => r.data),
  });
}

export function useUpdatePortalTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.put('/v1/portal-theme', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-theme'] }),
  });
}
