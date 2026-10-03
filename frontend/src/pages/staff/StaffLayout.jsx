import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import ToastContainer from '../../components/common/Toast';
import FilePreviewModal from '../../components/common/FilePreviewModal';

export const StaffLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <FilePreviewModal />
    </div>
  );
};

export default StaffLayout;
