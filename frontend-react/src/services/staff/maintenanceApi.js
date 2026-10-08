import apiClient from '../apiClient';

/**
 * Service for Maintenance Management operations
 */
export const maintenanceApi = {
  /**
   * Fetch resources under maintenance or requested for maintenance
   */
  getMaintenanceQueue: async (department) => {
    const resources = await apiClient.get('/resources', { department });
    return (resources || []).filter(
      (r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance'
    );
  },

  /**
   * Fetch maintenance history log
   */
  getMaintenanceHistory: async () => {
    return apiClient.get('/maintenance/history');
  },

  /**
   * Accept maintenance request (transition to 'Maintenance' / Under Maintenance)
   */
  acceptMaintenance: async (resourceId) => {
    return apiClient.post(`/maintenance/${resourceId}/accept`);
  },

  /**
   * Mark resource as repaired
   */
  repairMaintenance: async (resourceId) => {
    return apiClient.post(`/maintenance/${resourceId}/repair`);
  },

  /**
   * Reject maintenance / mark as scrap
   */
  scrapMaintenance: async (resourceId) => {
    return apiClient.post(`/maintenance/${resourceId}/scrap`);
  },
};

export default maintenanceApi;
