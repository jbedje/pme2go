import React from 'react';
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Calendar,
  BarChart3,
  Search,
  Heart,
  Settings,
  BookOpen,
  TrendingUp,
  Building2,
  Lightbulb,
  Target,
  DollarSign,
  Award,
  FileText,
  Shield
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import adminApi from '../../services/adminApi';

export default function Sidebar() {
  const { user, currentView, setCurrentView, sidebarOpen } = useSecureApp();
  
  const setView = (viewId) => {
    setCurrentView(viewId);
  };

  const USER_TYPES = {
    PME: 'PME/Startup',
    EXPERT: 'Expert/Consultant',
    INVESTOR: 'Investisseur',
    INCUBATOR: 'Incubateur'
  };

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Tableau de bord', icon: Home },
      { id: 'search', label: 'Recherche', icon: Search },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'opportunities', label: 'Opportunités', icon: Briefcase },
      { id: 'events', label: 'Événements', icon: Calendar },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ];

    const profileSpecificItems = [];

    if (user?.type === USER_TYPES.PME) {
      profileSpecificItems.push(
        { id: 'funding', label: 'Financement', icon: DollarSign },
        { id: 'pitch', label: 'Mon Pitch', icon: FileText },
        { id: 'metrics', label: 'Métriques', icon: TrendingUp }
      );
    }

    if (user?.type === USER_TYPES.EXPERT) {
      profileSpecificItems.push(
        { id: 'portfolio', label: 'Portfolio', icon: Award },
        { id: 'calendar', label: 'Planning', icon: Calendar },
        { id: 'billing', label: 'Facturation', icon: DollarSign }
      );
    }

    if (user?.type === USER_TYPES.INVESTOR) {
      profileSpecificItems.push(
        { id: 'pipeline', label: 'Pipeline', icon: Target },
        { id: 'portfolio', label: 'Portefeuille', icon: Building2 },
        { id: 'due-diligence', label: 'Due Diligence', icon: FileText }
      );
    }

    if (user?.type === USER_TYPES.INCUBATOR) {
      profileSpecificItems.push(
        { id: 'programs', label: 'Programmes', icon: BookOpen },
        { id: 'startups', label: 'Startups', icon: Lightbulb },
        { id: 'cohorts', label: 'Cohortes', icon: Users }
      );
    }

    const bottomItems = [
      { id: 'favorites', label: 'Favoris', icon: Heart },
      { id: 'resources', label: 'Ressources', icon: BookOpen },
      { id: 'settings', label: 'Paramètres', icon: Settings }
    ];

    // Add admin menu item for admin users
    if (user && adminApi.checkAdminAccess(user)) {
      bottomItems.unshift({ id: 'admin', label: 'Administration', icon: Shield });
    }

    return [...baseItems, ...profileSpecificItems, ...bottomItems];
  };

  const menuItems = getMenuItems();

  if (!sidebarOpen) {
    return (
      <aside className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex-1 py-4">
          {menuItems.slice(0, 6).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full p-3 flex justify-center transition-colors group relative ${
                currentView === item.id
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={item.label}
            >
              <item.icon size={20} />
              <span className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff'}
            alt={user?.name || 'User'}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user?.name || 'Utilisateur'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.type || 'Non défini'}
            </p>
          </div>
        </div>
        
        {user?.verified && (
          <div className="mt-3 flex items-center space-x-1">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span className="text-xs text-success-600 dark:text-success-400 font-medium">
              Profil vérifié
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <div className="px-3 space-y-1">
          {/* Main Navigation */}
          <div className="mb-6">
            <h4 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Principal
            </h4>
            {menuItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`nav-item w-full ${currentView === item.id ? 'active' : ''}`}
              >
                <item.icon size={18} className="mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Specific Items */}
          {menuItems.length > 9 && (
            <div className="mb-6">
              <h4 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {user?.type}
              </h4>
              {menuItems.slice(6, -3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`nav-item w-full ${currentView === item.id ? 'active' : ''}`}
                >
                  <item.icon size={18} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom Items */}
          <div>
            <h4 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Autres
            </h4>
            {menuItems.slice(-3).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`nav-item w-full ${currentView === item.id ? 'active' : ''}`}
              >
                <item.icon size={18} className="mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Stats Section */}
      {user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {user.stats?.connections || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Connexions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {user.stats?.rating || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Note</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}