import apiClient from './apiClient';
import { allocationsApi } from './staff/allocationsApi';
import { inventoryApi } from './staff/inventoryApi';
import { maintenanceApi } from './staff/maintenanceApi';
import { returnsApi } from './staff/returnsApi';

export { allocationsApi, inventoryApi, maintenanceApi, returnsApi };

export const staffApi = {
  // Allocations
  ...allocationsApi,

  // Inventory
  ...inventoryApi,

  // Maintenance
  ...maintenanceApi,

  // Returns
  ...returnsApi,

  // Dashboard Overview Metrics
  getDashboardStats: async (department) => {
    const [approvedReqs, resources, procTasks, maintHistory, returnHistory] = await Promise.all([
      apiClient.get('/requests', { status: 'Approved', department }),
      apiClient.get('/resources', { department }),
      apiClient.get('/procurements', { status: 'Approved', department }),
      apiClient.get('/maintenance/history').catch(() => []),
      apiClient.get('/returns/history').catch(() => []),
    ]);

    const maintQueue = (resources || []).filter(
      (r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance'
    );
    const returnQueue = (resources || []).filter((r) => r.status === 'Returned');

    return {
      pendingAllocationsCount: (approvedReqs || []).length,
      totalResourcesCount: (resources || []).length,
      maintenanceCount: maintQueue.length,
      procurementTasksCount: (procTasks || []).length,
      returnsPendingCount: returnQueue.length,
      recentAllocations: (approvedReqs || []).slice(0, 5),
      recentMaintenance: maintQueue.slice(0, 5),
      maintenanceHistoryCount: (maintHistory || []).length,
      returnHistoryCount: (returnHistory || []).length,
    };
  },

  // Procurement Tasks
  getProcurementTasks: async (department) => {
    return apiClient.get('/procurements', { status: 'Approved', department });
  },

  logPurchase: async (id, vendor, invoice, invoiceFile) => {
    let body;
    if (invoiceFile && invoiceFile.rawFile) {
      const formData = new FormData();
      formData.append('vendor', vendor);
      formData.append('invoice', invoice);
      formData.append('invoiceFile', invoiceFile.rawFile);
      body = formData;
    } else {
      body = { vendor, invoice };
      if (invoiceFile) {
        body.invoiceFileName = invoiceFile.name;
        body.invoiceFileType = invoiceFile.type;
        body.invoiceFileDataUrl = invoiceFile.dataUrl;
      }
    }
    return apiClient.post(`/procurements/${id}/log-purchase`, body);
  },

  // Resource Registration
  getFulfilledProcurements: async (department) => {
    const procurements = await apiClient.get('/procurements', { department });
    return (procurements || []).filter((p) => p.status === 'Fulfilled');
  },

  registerProcurement: async (id, resources) => {
    return apiClient.post(`/procurements/${id}/register`, { resources });
  },

  createRequest: async (payload) => {
    return apiClient.post('/requests', payload);
  },

  // Notifications
  getNotifications: async () => {
    return apiClient.get('/notifications');
  },
};

export default staffApi;
