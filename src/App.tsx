import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { HospitalInventoryProvider } from './context/HospitalInventoryContext';
import { HospitalRequestProvider } from './context/HospitalRequestContext';
import { Layout } from './components/layout/Layout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { NetworkPage } from './pages/NetworkPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SetupInventoryPage } from './pages/SetupInventoryPage';
import { SetupCompletePage } from './pages/SetupCompletePage';
import { DashboardPreviewPage } from './pages/DashboardPreviewPage';

// Hospital Dashboard & Inventory Pages (Phase 2 - Step 4 & 5)
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { HospitalInventoryPage } from './pages/HospitalInventoryPage';

// Hospital Blood Request Pages (Phase 2 - Step 6 & 7)
import { HospitalRequestsPage } from './pages/hospital/HospitalRequestsPage';
import { CreateBloodRequestPage } from './pages/hospital/CreateBloodRequestPage';
import { BloodRequestDetailsPage } from './pages/hospital/BloodRequestDetailsPage';

// Hospital Predictive Intelligence Pages (Phase 4 - Steps 12-15)
import { PredictiveIntelligencePage } from './pages/hospital/PredictiveIntelligencePage';

// Steps 8-20 Pages: Usage, Transactions, Reconciliation, Analytics, Matching, Admin
import { RecordBloodUsagePage } from './pages/hospital/RecordBloodUsagePage';
import { TransactionHistoryPage } from './pages/hospital/TransactionHistoryPage';
import { InventoryReconciliationPage } from './pages/hospital/InventoryReconciliationPage';
import { UsageAnalyticsPage } from './pages/hospital/UsageAnalyticsPage';
import { BloodBankMatchingPage } from './pages/hospital/BloodBankMatchingPage';
import { AdminRefillRequestsPage } from './pages/admin/AdminRefillRequestsPage';
import { HospitalRouteGuard } from './components/hospital/HospitalRouteGuard';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <RegistrationProvider>
          <HospitalInventoryProvider>
            <HospitalRequestProvider>
              <Routes>
                {/* Hospital Command Center Routes (Custom Portal Layout + Route Guard) */}
                <Route
                  path="/hospital/dashboard"
                  element={
                    <HospitalRouteGuard>
                      <HospitalDashboardPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/inventory"
                  element={
                    <HospitalRouteGuard>
                      <HospitalInventoryPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests"
                  element={
                    <HospitalRouteGuard>
                      <HospitalRequestsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/new"
                  element={
                    <HospitalRouteGuard>
                      <CreateBloodRequestPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/:requestId"
                  element={
                    <HospitalRouteGuard>
                      <BloodRequestDetailsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/predictions"
                  element={
                    <HospitalRouteGuard>
                      <PredictiveIntelligencePage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/usage/new"
                  element={
                    <HospitalRouteGuard>
                      <RecordBloodUsagePage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/transactions"
                  element={
                    <HospitalRouteGuard>
                      <TransactionHistoryPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/inventory/reconciliation"
                  element={
                    <HospitalRouteGuard>
                      <InventoryReconciliationPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/analytics/usage"
                  element={
                    <HospitalRouteGuard>
                      <UsageAnalyticsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/:requestId/matching"
                  element={
                    <HospitalRouteGuard>
                      <BloodBankMatchingPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/admin/refill-requests"
                  element={
                    <HospitalRouteGuard>
                      <AdminRefillRequestsPage />
                    </HospitalRouteGuard>
                  }
                />

              {/* Public Marketing & Onboarding Routes (Public Layout) */}
              <Route
                path="/"
                element={
                  <Layout>
                    <LandingPage />
                  </Layout>
                }
              />
              <Route
                path="/how-it-works"
                element={
                  <Layout>
                    <HowItWorksPage />
                  </Layout>
                }
              />
              <Route
                path="/network"
                element={
                  <Layout>
                    <NetworkPage />
                  </Layout>
                }
              />
              <Route
                path="/about"
                element={
                  <Layout>
                    <AboutPage />
                  </Layout>
                }
              />
              <Route
                path="/login"
                element={
                  <Layout>
                    <LoginPage />
                  </Layout>
                }
              />
              <Route
                path="/register"
                element={
                  <Layout>
                    <RegisterPage />
                  </Layout>
                }
              />
              <Route
                path="/setup-inventory"
                element={
                  <Layout>
                    <SetupInventoryPage />
                  </Layout>
                }
              />
              <Route
                path="/setup-complete"
                element={
                  <Layout>
                    <SetupCompletePage />
                  </Layout>
                }
              />
              <Route
                path="/dashboard-preview"
                element={
                  <Layout>
                    <DashboardPreviewPage />
                  </Layout>
                }
              />

              {/* Fallback unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HospitalRequestProvider>
        </HospitalInventoryProvider>
      </RegistrationProvider>
    </AuthProvider>
  </Router>
);
}

export default App;
