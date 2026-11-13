import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import MainLayout from './MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from '../screens/loginPage';
import SignupPage from '../screens/signupPage';

import DashboardPage from '../screens/dashboardPage';
import KassaPage from '../screens/kassaPage';
import ReportsPage from '../screens/reportsPage';
import MenuPage from '../screens/menuPage';
import OrdersPage from '../screens/ordersPage';
import OrderDetailPage from '../screens/ordersPage/OrderDetailPage';
import TablesPage from '../screens/tablesPage';

const page = (el: React.ReactNode) => (
  <ProtectedRoute>
    <MainLayout>{el}</MainLayout>
  </ProtectedRoute>
);

/** Eski "Stol batafsil" havolasi → Kassada o'sha stol ochiladi */
const OldTableLink = () => {
  const { tableNumber } = useParams();
  return <Navigate to={`/kassa?table=${encodeURIComponent(tableNumber ?? "")}`} replace />;
};

const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />

    <Route path="/" element={page(<DashboardPage />)} />
    <Route path="/kassa" element={page(<KassaPage />)} />
    <Route path="/orders" element={page(<OrdersPage />)} />
    <Route path="/orders/:orderId" element={page(<OrderDetailPage />)} />
    <Route path="/products" element={page(<MenuPage />)} />
    <Route path="/tables" element={page(<TablesPage />)} />
    <Route path="/reports" element={page(<ReportsPage />)} />

    {/* Eski manzillar (xatcho'p/bildirishnomalar buzilmasin) */}
    <Route path="/order-status" element={<Navigate to="/kassa" replace />} />
    <Route path="/orders-panel/all" element={<Navigate to="/kassa" replace />} />
    <Route path="/orders-panel/table/:tableNumber" element={<OldTableLink />} />
    <Route path="/sales-stats" element={<Navigate to="/reports?tab=sales" replace />} />
    <Route path="/completed-orders-stats" element={<Navigate to="/reports?tab=completed" replace />} />
    <Route path="/product-sales" element={<Navigate to="/reports?tab=dishes" replace />} />
    <Route path="/user/all" element={<Navigate to="/" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
