import React, { useEffect } from 'react';
import { SecureAppProvider, useSecureApp } from './contexts/SecureAppContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SecureLoginForm from './components/Auth/SecureLoginForm';
import SecureRegisterForm from './components/Auth/SecureRegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import SearchPage from './components/Search/SearchPage';
import ProfileDetail from './components/Profile/ProfileDetail';
import MessagesPage from './components/Messages/MessagesPage';
import OpportunitiesPage from './components/Opportunities/OpportunitiesPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import EventsPage from './components/Events/EventsPage';
import AdminDashboard from './components/Admin/AdminDashboard';
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
        return <FavoritesPlaceholder />;
      case 'settings':
        return <SettingsPlaceholder />;
      case 'profile':
        return <ProfilePlaceholder />;
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

// Composants placeholder pour les pages non encore implémentées
function FavoritesPlaceholder() {
  return (
    <div className="text-center py-12">
      <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">❤️</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Mes Favoris
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Retrouvez ici tous vos profils et opportunités favoris.
      </p>
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        🔧 Cette fonctionnalité sera bientôt disponible avec l'API sécurisée
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚙️</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Paramètres
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Configuration et préférences de votre compte.
      </p>
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        🔧 Interface de paramètres en cours de développement
      </div>
    </div>
  );
}

function ProfilePlaceholder() {
  const { user, updateProfile, loadingStates } = useSecureApp();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profileData = {
      name: formData.get('name'),
      description: formData.get('description'),
      industry: formData.get('industry'),
      location: formData.get('location')
    };

    const success = await updateProfile(profileData);
    if (success) {
      console.log('Profile updated successfully');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Mon Profil
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les informations de votre profil professionnel
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de l'entreprise / Nom complet
            </label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={user?.description || ''}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Décrivez votre entreprise ou votre expertise..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secteur d'activité
              </label>
              <input
                type="text"
                name="industry"
                defaultValue={user?.industry || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ex: Technologie, Finance..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                name="location"
                defaultValue={user?.location || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ex: Paris, France"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loadingStates.profile}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loadingStates.profile && <LoadingSpinner size="sm" />}
              <span>{loadingStates.profile ? 'Mise à jour...' : 'Mettre à jour'}</span>
            </button>
          </div>
        </form>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Votre profil est maintenant géré de manière sécurisée avec authentification JWT
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant principal de l'application
function SecureAppContent() {
  const { isAuthenticated, currentView, loading } = useSecureApp();

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
    return <SecureLoginForm />;
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