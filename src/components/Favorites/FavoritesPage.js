import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import UserCard from '../Search/UserCard';
import { 
  Heart, 
  Users, 
  Briefcase, 
  Filter, 
  Search,
  Trash2,
  Star,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

function FavoritesPage() {
  const { 
    user, 
    users, 
    opportunities,
    favoriteProfiles, 
    opportunityFavorites,
    toggleFavorite, 
    addNotification, 
    setSelectedProfile, 
    setView,
    removeOpportunityFromFavorites 
  } = useSecureApp();
  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [favoriteOpportunities, setFavoriteOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Update favorite users when favoriteProfiles or users change
  useEffect(() => {
    console.log('🔍 FavoritesPage - favoriteProfiles:', favoriteProfiles);
    console.log('👥 FavoritesPage - users:', users.length, 'users');
    console.log('👤 FavoritesPage - current user:', user?.id);
    
    if (favoriteProfiles.length > 0 && users.length > 0) {
      const favUsers = users.filter(u => favoriteProfiles.includes(u.id));
      console.log('💖 FavoritesPage - filtered favorite users:', favUsers);
      setFavoriteUsers(favUsers);
    } else {
      console.log('❌ FavoritesPage - No favorites or users');
      setFavoriteUsers([]);
    }
    setLoading(false);
  }, [favoriteProfiles, users]);

  // Update favorite opportunities when opportunityFavorites or opportunities change
  useEffect(() => {
    console.log('🎯 FavoritesPage - opportunityFavorites:', opportunityFavorites);
    console.log('📋 FavoritesPage - opportunities:', opportunities.length, 'opportunities');
    
    if (opportunityFavorites.length > 0 && opportunities.length > 0) {
      const favOpportunities = opportunities.filter(opp => opportunityFavorites.includes(opp.uuid || opp.id));
      console.log('💼 FavoritesPage - filtered favorite opportunities:', favOpportunities);
      setFavoriteOpportunities(favOpportunities);
    } else {
      console.log('❌ FavoritesPage - No opportunity favorites or opportunities');
      setFavoriteOpportunities([]);
    }
  }, [opportunityFavorites, opportunities]);

  const removeFavorite = async (profileId) => {
    console.log('🗑️ FavoritesPage - removeFavorite called with profileId:', profileId);
    console.log('👤 FavoritesPage - Current user:', user?.id);
    
    if (!user?.id) {
      console.log('❌ FavoritesPage - No user ID, returning');
      return;
    }
    
    try {
      console.log('🔄 FavoritesPage - Calling toggleFavorite...');
      await toggleFavorite(profileId);
      console.log('✅ FavoritesPage - toggleFavorite completed');
      // The context will handle updating favoriteProfiles, which will trigger useEffect above
    } catch (err) {
      console.error('❌ FavoritesPage - Error removing favorite:', err);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la suppression du favori',
        timestamp: new Date().toISOString()
      });
    }
  };

  const filteredFavorites = favoriteUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && user.type === filterType;
  });

  const getUserTypes = () => {
    const types = [...new Set(favoriteUsers.map(user => user.type))];
    return types.sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Chargement de vos favoris...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Heart className="mr-3 text-red-500" size={32} />
              Mes Favoris
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Retrouvez tous vos profils et opportunités favoris en un seul endroit
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {favoriteUsers.length}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              Total favoris
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profiles'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users className="mr-2" size={16} />
            Profils ({favoriteUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'opportunities'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Briefcase className="mr-2" size={16} />
            Opportunités ({favoriteOpportunities.length})
          </button>
        </nav>
      </div>

      {activeTab === 'profiles' && (
        <>
          {favoriteUsers.length > 0 && (
            <>
              {/* Search and Filter */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher dans vos favoris..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter size={20} className="text-gray-500 dark:text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Tous les types</option>
                      {getUserTypes().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Favorites Grid */}
              {filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFavorites.map((favUser) => (
                    <div key={favUser.uuid} className="relative">
                      <UserCard 
                        user={favUser} 
                        currentUser={user}
                        onToggleFavorite={() => removeFavorite(favUser.id)}
                        isFavorited={true}
                      />
                      {/* Remove from favorites button */}
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={() => removeFavorite(favUser.id)}
                          className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                          title="Retirer des favoris"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                    Aucun résultat
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Aucun favori ne correspond à vos critères de recherche.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                    }}
                    className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Effacer les filtres
                  </button>
                </div>
              )}
            </>
          )}

          {favoriteUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucun profil favori
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vous n'avez pas encore ajouté de profils à vos favoris.
                <br />
                Explorez la plateforme et marquez les profils qui vous intéressent !
              </p>
              <button
                onClick={() => window.location.href = '#/search'}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <Search className="mr-2" size={20} />
                Découvrir des profils
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'opportunities' && (
        <>
          {favoriteOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {favoriteOpportunities.map((opportunity) => (
                <div key={opportunity.uuid || opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {opportunity.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium mr-2">
                          {opportunity.type}
                        </span>
                        <span>
                          {opportunity.budget && `${opportunity.budget} • `}
                          {opportunity.duration}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeOpportunityFromFavorites(opportunity.uuid || opportunity.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Retirer des favoris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {opportunity.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      {opportunity.applicants || 0} candidature(s)
                    </div>
                    <button 
                      onClick={() => {
                        setView('opportunities');
                        // Could add logic to show specific opportunity
                      }}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucune opportunité favorite
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vous n'avez pas encore ajouté d'opportunités à vos favoris.
              </p>
              <button
                onClick={() => setView('opportunities')}
                className="btn-primary"
              >
                <Briefcase className="mr-2" size={16} />
                Découvrir les opportunités
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FavoritesPage;