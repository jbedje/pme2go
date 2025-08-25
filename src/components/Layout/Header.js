import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Globe,
  ChevronDown,
  MessageSquare,
  Heart
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import ConnectionStatus from '../UI/ConnectionStatus';
import NotificationBell from '../UI/NotificationBell';

export default function Header() {
  const { 
    user, 
    theme, 
    language, 
    notifications, 
    toggleTheme, 
    toggleSidebar, 
    logout, 
    setView,
    removeNotification,
    getUnreadMessagesCount 
  } = useSecureApp();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadMessages = user ? getUnreadMessagesCount() : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setView('search');
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P2G</span>
            </div>
            <span className="font-bold text-xl text-gradient hidden md:block">PME2GO</span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des profils, opportunités..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <ConnectionStatus />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          >
            {theme === 'light' ? (
              <Moon size={18} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun size={18} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Language Toggle */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Changer de langue"
          >
            <Globe size={18} className="text-gray-600 dark:text-gray-300" />
          </button>

          {/* Messages */}
          <button
            onClick={() => setView('messages')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            title="Messages"
          >
            <MessageSquare size={18} className="text-gray-600 dark:text-gray-300" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.type || 'Non défini'}
                </p>
              </div>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-2">
                  <button
                    onClick={() => { setView('profile'); setShowUserMenu(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Mon Profil</span>
                  </button>
                  
                  <button
                    onClick={() => { setView('favorites'); setShowUserMenu(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Heart size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Favoris</span>
                  </button>
                  
                  <button
                    onClick={() => { setView('settings'); setShowUserMenu(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Paramètres</span>
                  </button>
                  
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-danger-600 dark:text-danger-400"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}