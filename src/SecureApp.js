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
import { LoadingSpinner } from './components/UI/LoadingSpinner';

// Composant NotificationToast pour afficher les notifications
function NotificationToast() {
  const { notifications, removeNotification } = useSecureApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      notifications.forEach(notification => {
        if (Date.now() - new Date(notification.timestamp).getTime() > 5000) {
          removeNotification(notification.id);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
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