import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Medicines from './pages/Medicines';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import SystemUsers from './pages/SystemUsers';
import Profile from './pages/Profile';
import CurrentStock from './pages/reports/CurrentStock';
import SalesReport from './pages/reports/SalesReport';
import ExpiryReport from './pages/reports/ExpiryReport';
import PurchaseHistory from './pages/reports/PurchaseHistory';
import MainLayout from './components/shared/MainLayout';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { authService } from './services/authService';

const ProtectedRoute = () => {
  const token = authService.getCurrentUser();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/system-users" element={<SystemUsers />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports/current-stock" element={<CurrentStock />} />
            <Route path="/reports/sales" element={<SalesReport />} />
            <Route path="/reports/expiry" element={<ExpiryReport />} />
            <Route path="/reports/purchase-history" element={<PurchaseHistory />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
