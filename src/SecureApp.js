import React, { useEffect } from 'react';
import { SecureAppProvider, useSecureApp } from './contexts/SecureAppContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SecureLoginForm from './components/Auth/SecureLoginForm';
import SecureRegisterForm from './components/Auth/SecureRegisterForm';
import LandingPage from './components/Landing/LandingPage';
import ProfilePage from './components/Profile/ProfilePage';
import Dashboard from './components/Dashboard/Dashboard';
import SearchPage from './components/Search/SearchPage';
import ProfileDetail from './components/Profile/ProfileDetail';
import MessagesPage from './components/Messages/MessagesPage';
import OpportunitiesPage from './components/Opportunities/OpportunitiesPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import EventsPage from './components/Events/EventsPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import FavoritesPage from './components/Favorites/FavoritesPage';
import SettingsPage from './components/Settings/SettingsPage';
// PME-specific components
import FinancementPage from './components/PME/FinancementPage';
import MonPitchPage from './components/PME/MonPitchPage';
import MetriquesPage from './components/PME/MetriquesPage';
// Investor-specific components
import PipelinePage from './components/Investor/PipelinePage';
import PortefeuillePage from './components/Investor/PortefeuillePage';
import DueDiligencePage from './components/Investor/DueDiligencePage';
// Expert-specific components
import ExpertPortfolioPage from './components/Expert/PortfolioPage';
import PlanningPage from './components/Expert/PlanningPage';
import FacturationPage from './components/Expert/FacturationPage';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

// Composant NotificationToast pour afficher les notifications
function NotificationToast() {
  const { notifications, removeNotification } = useSecureApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      notifications.forEach(notification => {
        const timestamp = notification.timestamp || new Date().toISOString();
        if (Date.now() - new Date(timestamp).getTime() > 5000) {
          removeNotification(notification.id);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.slice(0, 3).map((notification, index) => (
        <div
          key={notification.id || `notification-${index}`}
            className={`max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 transform ${
              notification.type === 'success' 
                ? 'bg-success-50 border-success-200 text-success-800' :
              notification.type === 'error' 
                ? 'bg-danger-50 border-danger-200 text-danger-800' :
              notification.type === 'warning' 
                ? 'bg-warning-50 border-warning-200 text-warning-800' :
                'bg-primary-50 border-primary-200 text-primary-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Fermer</span>
                ×
              </button>
            </div>
        </div>
      ))}
    </div>
  );
}

// Composant pour afficher le statut de connexion sécurisée
function SecureConnectionStatus() {
  const { apiConnected, usingSecureMode, authError } = useSecureApp();
  
  if (authError) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-sm shadow-lg max-w-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="font-medium">Erreur d'authentification</span>
        </div>
        <p className="text-xs mt-1">{authError}</p>
      </div>
    );
  }

  if (!usingSecureMode) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span>Mode démo - API sécurisée indisponible</span>
        </div>
      </div>
    );
  }
  
  if (apiConnected && usingSecureMode) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>🔒 Mode sécurisé - JWT authentification</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-gray-100 border border-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm shadow-lg">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        <span>Connexion en cours...</span>
      </div>
    </div>
  );
}

// Composant pour les pages nécessitant une authentification
function AuthenticatedLayout() {
  const { currentView, sidebarOpen, theme } = useSecureApp();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <SearchPage />;
      case 'profile-detail':
        return <ProfileDetail />;
      case 'messages':
        return <MessagesPage />;
      case 'opportunities':
        return <OpportunitiesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'events':
        return <EventsPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminDashboard />;
      // PME-specific routes
      case 'funding':
        return <FinancementPage />;
      case 'pitch':
        return <MonPitchPage />;
      case 'metrics':
        return <MetriquesPage />;
      // Investor-specific routes
      case 'pipeline':
        return <PipelinePage />;
      case 'portfolio':
        return <PortefeuillePage />;
      case 'due-diligence':
        return <DueDiligencePage />;
      // Expert-specific routes
      case 'expert-portfolio':
        return <ExpertPortfolioPage />;
      case 'planning':
        return <PlanningPage />;
      case 'facturation':
        return <FacturationPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <div className="p-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>
      <NotificationToast />
      <SecureConnectionStatus />
    </div>
  );
}



// Composant principal de l'application
function SecureAppContent() {
  const { isAuthenticated, currentView, loading, setView } = useSecureApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement sécurisé...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'register') {
      return <SecureRegisterForm />;
    }
    if (currentView === 'login') {
      return <SecureLoginForm />;
    }
    // Show landing page by default for non-authenticated users
    return <LandingPage onGetStarted={() => setView('login')} />;
  }

  return <AuthenticatedLayout />;
}

// Application principale avec le contexte sécurisé
function SecureApp() {
  return (
    <SecureAppProvider>
      <SecureAppContent />
    </SecureAppProvider>
  );
}

export default SecureApp;