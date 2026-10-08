import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import StaffLayout from './pages/staff/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import Allocations from './pages/staff/Allocations';
import Inventory from './pages/staff/Inventory';
import Maintenance from './pages/staff/Maintenance';
import Returns from './pages/staff/Returns';
import ProcurementTasks from './pages/staff/ProcurementTasks';
import ResourceRegistration from './pages/staff/ResourceRegistration';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect to staff */}
          <Route path="/" element={<Navigate to="/staff" replace />} />

          {/* Staff Operations Portal Routes */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="returns" element={<Returns />} />
            <Route path="procurement" element={<ProcurementTasks />} />
            <Route path="registration" element={<ResourceRegistration />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
