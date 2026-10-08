import apiClient from '../apiClient';

/**
 * Service for Inventory / Manage Resources operations
 */
export const inventoryApi = {
  /**
   * Fetch all department resources
   */
  getResources: async (params = {}) => {
    return apiClient.get('/resources', params);
  },

  /**
   * Fetch configured resource catalog for department
   */
  getCatalog: async (department) => {
    try {
      return await apiClient.get('/resources/catalog', { department });
    } catch (err) {
      console.warn('Failed to fetch catalog:', err);
      return [];
    }
  },

  /**
   * Add a new inventory resource
   */
  createResource: async (payload) => {
    return apiClient.post('/resources', payload);
  },

  /**
   * Update existing resource details
   */
  updateResource: async (id, payload) => {
    return apiClient.patch(`/resources/${id}`, payload);
  },

  /**
   * Scrap a resource
   */
  scrapResource: async (id) => {
    return apiClient.post(`/resources/${id}/scrap`);
  },

  /**
   * Fetch procurements (for invoice file previews)
   */
  getProcurements: async (params = {}) => {
    return apiClient.get('/procurements', params);
  },
};

export default inventoryApi;
