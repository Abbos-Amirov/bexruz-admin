import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from '../screens/loginPage';
import SignupPage from '../screens/signupPage';

import DashboardPage from '../screens/dashboardPage';
import OrderStatusPage from '../screens/orderStatusPage';
import SalesStatsPage from '../screens/salesStatsPage';
import CompletedOrdersStatsPage from '../screens/completedOrdersStatsPage';
import TableOrdersDetailPage from '../screens/dashboardPage/TableOrdersDetailPage';
import AllTablesOrdersDetailPage from '../screens/dashboardPage/AllTablesOrdersDetailPage';
import MenuPage from '../screens/menuPage';
import OrdersPage from '../screens/ordersPage';
import OrderDetailPage from '../screens/ordersPage/OrderDetailPage';
import UsersPage from '../screens/usersPage';
import TablesPage from '../screens/tablesPage';
import ProductSalesPage from '../screens/productSalesPage';

const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route 
      path="/completed-orders-stats"
      element={
        <ProtectedRoute>
          <MainLayout><CompletedOrdersStatsPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route
      path="/product-sales"
      element={
        <ProtectedRoute>
          <MainLayout><ProductSalesPage /></MainLayout>
        </ProtectedRoute>
      }
    />
    <Route 
      path="/sales-stats"
      element={
        <ProtectedRoute>
          <MainLayout><SalesStatsPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/order-status" 
      element={
        <ProtectedRoute>
          <MainLayout><OrderStatusPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/orders-panel/all"
      element={
        <ProtectedRoute>
          <MainLayout><AllTablesOrdersDetailPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/orders-panel/table/:tableNumber" 
      element={
        <ProtectedRoute>
          <MainLayout><TableOrdersDetailPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/products" 
      element={
        <ProtectedRoute>
          <MainLayout><MenuPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/orders" 
      element={
        <ProtectedRoute>
          <MainLayout><OrdersPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/orders/:orderId"
      element={
        <ProtectedRoute>
          <MainLayout><OrderDetailPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/user/all" 
      element={
        <ProtectedRoute>
          <MainLayout><UsersPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/tables" 
      element={
        <ProtectedRoute>
          <MainLayout><TablesPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/" 
      element={
        <ProtectedRoute>
          <MainLayout><DashboardPage /></MainLayout>
        </ProtectedRoute>
      } 
    />
  </Routes>
);

export default AppRouter;
