import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/guards/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';

import CustomerList from '@/pages/customers/CustomerList';
import AddCustomer from '@/pages/customers/AddCustomer';
import EditCustomer from '@/pages/customers/EditCustomer';
import CustomerDetails from '@/pages/customers/CustomerDetails';

import LoanApplicationList from '@/pages/loans/LoanApplicationList';
import CreateLoanApplication from '@/pages/loans/CreateLoanApplication';
import EditLoanApplication from '@/pages/loans/EditLoanApplication';
import LoanApplicationDetails from '@/pages/loans/LoanApplicationDetails';
import LoanDetailsForm from '@/pages/loans/LoanDetailsForm';

import DocumentList from '@/pages/documents/DocumentList';
import UploadDocument from '@/pages/documents/UploadDocument';
import DocumentDetails from '@/pages/documents/DocumentDetails';

/** Redirects an already-authenticated user away from /login and /register. */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public / guest-only routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<AddCustomer />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/customers/:id/edit" element={<EditCustomer />} />

          <Route path="/loans" element={<LoanApplicationList />} />
          <Route path="/loans/new" element={<CreateLoanApplication />} />
          <Route path="/loans/:id" element={<LoanApplicationDetails />} />
          <Route path="/loans/:id/edit" element={<EditLoanApplication />} />
          <Route path="/loans/:id/loan-details" element={<LoanDetailsForm />} />
          <Route path="/loans/:id/documents/upload" element={<UploadDocument />} />

          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/upload" element={<UploadDocument />} />
          <Route path="/documents/:id" element={<DocumentDetails />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
