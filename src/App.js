import React, { useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContextWithAPI';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import CipmeFooter from './components/Layout/CipmeFooter';
import LandingPage from './components/Landing/LandingPage';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
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
  const { notifications, removeNotification } = useApp();

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

// Composant pour afficher le statut de connexion
function ConnectionStatus() {
  const { apiConnected, usingDemoData } = useApp();
  
  if (usingDemoData) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span>Mode démo - Base de données non connectée</span>
        </div>
      </div>
    );
  }
  
  if (apiConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Connecté à la base de données</span>
        </div>
      </div>
    );
  }
  
  return null;
}

// Composant pour les pages nécessitant une authentification
function AuthenticatedLayout() {
  const { currentView, sidebarOpen, theme } = useApp();

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
        return <ProfilePlaceholder />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <div className="p-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>
      <CipmeFooter />
      <NotificationToast />
      <ConnectionStatus />
    </div>
  );
}

// Composants placeholder pour les pages non encore implémentées
function EventsPlaceholder() {
  return (
    <div className="text-center py-12">
      <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📅</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Page Événements
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Cette section est en cours de développement et sera bientôt disponible.
      </p>
    </div>
  );
}



function ProfilePlaceholder() {
  return (
    <div className="text-center py-12">
      <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">👤</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Mon Profil
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Gérez les informations de votre profil professionnel.
      </p>
    </div>
  );
}

// Composant principal de l'application
function AppContent() {
  const { isAuthenticated, currentView, loading, setView } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'register') {
      return <RegisterForm />;
    }
    if (currentView === 'login') {
      return <LoginForm />;
    }
    // Show landing page by default for non-authenticated users  
    return <LandingPage onGetStarted={() => setView('login')} />;
  }

  return <AuthenticatedLayout />;
}

// Application principale avec le contexte
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;