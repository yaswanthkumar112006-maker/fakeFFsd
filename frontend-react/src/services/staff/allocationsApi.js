import apiClient from '../apiClient';

/**
 * Service for Allocation Requests operations
 */
export const allocationsApi = {
  /**
   * Fetch pending approved requests for department
   */
  getApprovedRequests: async (department) => {
    return apiClient.get('/requests', { status: 'Approved', department });
  },

  /**
   * Fetch available resources for allocation matching department and resource type
   */
  getAvailableResources: async (department, type) => {
    return apiClient.get('/resources', {
      department,
      status: 'Available',
      type,
    });
  },

  /**
   * Allocate specific resource IDs to an approved request
   */
  allocateRequest: async (requestId, resourceIds) => {
    return apiClient.post(`/requests/${requestId}/allocate`, { resourceIds });
  },
};

export default allocationsApi;
