import apiClient from '../apiClient';

/**
 * Service for Returns Management operations
 */
export const returnsApi = {
  /**
   * Fetch pending returns (resources with status 'Returned')
   */
  getPendingReturns: async (department) => {
    const resources = await apiClient.get('/resources', { department, status: 'Returned' });
    return resources || [];
  },

  /**
   * Fetch return history log
   */
  getReturnHistory: async () => {
    return apiClient.get('/returns/history');
  },

  /**
   * Process a return by condition inspection ('Good' | 'Average' -> Available, 'Bad' -> Scrapped)
   */
  processReturn: async (resourceId, condition) => {
    return apiClient.post(`/returns/${resourceId}/process`, { condition });
  },
};

export default returnsApi;
