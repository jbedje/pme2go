import React, { useState } from 'react';
import { Database, WifiOff, Server, Users, Calendar, Briefcase } from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function ConnectionStatus() {
  const { 
    apiConnected, 
    usingDemoData, 
    users, 
    opportunities, 
    events,
    loadingStates 
  } = useSecureApp();
  
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (apiConnected) return 'text-green-600 dark:text-green-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getStatusBg = () => {
    if (apiConnected) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
  };

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${getStatusBg()}`}
        title={apiConnected ? 
          'Connecté à la base de données - Cliquez pour plus de détails' : 
          'Mode démo - Base de données indisponible'
        }
      >
        {apiConnected ? (
          <Database size={14} className={getStatusColor()} />
        ) : (
          <WifiOff size={14} className={getStatusColor()} />
        )}
        
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {apiConnected ? 'Connecté' : 'Mode Démo'}
        </span>
        
        <div className={`w-1.5 h-1.5 rounded-full ${
          apiConnected ? 'bg-green-500' : 'bg-orange-500'
        } ${isAnyLoading ? 'animate-pulse' : ''}`} />
      </button>

      {/* Details Dropdown */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Server size={16} className={getStatusColor()} />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                État de la connexion
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Base de données</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiConnected ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <span className={`text-xs font-medium ${getStatusColor()}`}>
                    {apiConnected ? 'Connectée' : 'Indisponible'}
                  </span>
                </div>
              </div>

              {/* Data Stats */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users size={12} className="text-gray-500" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {users.length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Utilisateurs</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Briefcase size={12} className="text-gray-500" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {opportunities.length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Opportunités</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Calendar size={12} className="text-gray-500" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {events.length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Événements</span>
                  </div>
                </div>
              </div>

              {/* Loading States */}
              {isAnyLoading && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Chargement en cours
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(loadingStates)
                      .filter(([operation, loading]) => loading)
                      .map(([operation, loading]) => (
                        <div key={operation} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {operation === 'sendMessage' ? 'Envoi message' :
                             operation === 'users' ? 'Utilisateurs' :
                             operation === 'opportunities' ? 'Opportunités' :
                             operation === 'events' ? 'Événements' :
                             operation === 'login' ? 'Connexion' :
                             operation === 'register' ? 'Inscription' :
                             operation}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Mode Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {apiConnected ? (
                    'Données en temps réel depuis la base de données PostgreSQL'
                  ) : (
                    'Fonctionnement en mode démo avec des données statiques'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}