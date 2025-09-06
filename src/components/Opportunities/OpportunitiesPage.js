import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  MapPin,
  TrendingUp,
  Eye,
  Heart,
  Send,
  X,
  Star,
  Edit,
  Trash2
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { OpportunityCard } from '../UI/Card';
import { Modal } from '../UI/Modal';

export default function OpportunitiesPage() {
  const { 
    opportunities, 
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    getUserOpportunities,
    getOpportunityApplications,
    applyToOpportunity,
    appliedOpportunities,
    loadOpportunityFavorites,
    addOpportunityToFavorites,
    removeOpportunityFromFavorites,
    isOpportunityFavorite,
    toggleFavorite,
    addNotification,
    user,
    setView 
  } = useSecureApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mine'
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [myOpportunities, setMyOpportunities] = useState([]);
  const [opportunityApplications, setOpportunityApplications] = useState({});
  const [applicationMessage, setApplicationMessage] = useState('');
  
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    type: 'Consulting',
    description: '',
    budget: '',
    duration: '',
    location: '',
    requirements: '',
    tags: '',
    deadline: ''
  });

  const opportunityTypes = [
    'Consulting',
    'Financement',
    'Recrutement',
    'Partenariat',
    'Formation',
    'Autre'
  ];

  // Load user's opportunities when tab changes to 'mine'
  React.useEffect(() => {
    if (activeTab === 'mine' && user?.id) {
      loadMyOpportunities();
    }
  }, [activeTab, user?.id]);

  // Load opportunity favorites when user is available
  useEffect(() => {
    if (user?.id) {
      loadOpportunityFavorites(user.id);
    }
  }, [user?.id]);

  const loadMyOpportunities = async () => {
    try {
      const userOpps = await getUserOpportunities(user.id);
      setMyOpportunities(userOpps);
    } catch (error) {
      console.error('Error loading user opportunities:', error);
    }
  };

  const loadApplications = async (opportunityId) => {
    try {
      const applications = await getOpportunityApplications(opportunityId);
      setOpportunityApplications(prev => ({
        ...prev,
        [opportunityId]: applications
      }));
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const getCurrentOpportunities = () => {
    return activeTab === 'mine' ? myOpportunities : opportunities;
  };

  const currentOpportunities = getCurrentOpportunities();

  const filterOptions = [
    { key: 'all', label: 'Toutes', count: currentOpportunities.length },
    { key: 'Financement', label: 'Financement', count: currentOpportunities.filter(o => o.type === 'Financement').length },
    { key: 'Consulting', label: 'Consulting', count: currentOpportunities.filter(o => o.type === 'Consulting').length },
    { key: 'Recrutement', label: 'Recrutement', count: currentOpportunities.filter(o => o.type === 'Recrutement').length },
    { key: 'Partenariat', label: 'Partenariat', count: currentOpportunities.filter(o => o.type === 'Partenariat').length }
  ];

  const getFilteredOpportunities = () => {
    let filtered = currentOpportunities;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(opp => opp.type === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opp.company && opp.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredOpportunities = getFilteredOpportunities();

  const handleCreateOpportunity = (e) => {
    e.preventDefault();
    
    const opportunityData = {
      ...newOpportunity,
      requirements: newOpportunity.requirements.split(',').map(r => r.trim()).filter(Boolean),
      tags: newOpportunity.tags.split(',').map(t => t.trim()).filter(Boolean),
      company: user.name
    };

    createOpportunity(opportunityData);
    setShowCreateModal(false);
    setNewOpportunity({
      title: '',
      type: 'Consulting',
      description: '',
      budget: '',
      duration: '',
      location: '',
      requirements: '',
      tags: '',
      deadline: ''
    });
  };

  const handleEditOpportunity = (opportunity) => {
    setEditingOpportunity({ ...opportunity });
    setShowEditModal(true);
  };

  const handleUpdateOpportunity = async (e) => {
    e.preventDefault();
    
    const success = await updateOpportunity(editingOpportunity.id, editingOpportunity);
    if (success) {
      setShowEditModal(false);
      setEditingOpportunity(null);
      // Reload user's opportunities if on 'mine' tab
      if (activeTab === 'mine') {
        loadMyOpportunities();
      }
    }
  };

  const handleDeleteOpportunity = async (opportunityId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      const success = await deleteOpportunity(opportunityId);
      if (success) {
        // Reload user's opportunities if on 'mine' tab
        if (activeTab === 'mine') {
          loadMyOpportunities();
        }
        setSelectedOpportunity(null);
      }
    }
  };

  const handleApplyToOpportunity = async (opportunityId) => {
    console.log('🎯 handleApplyToOpportunity called with:', {
      opportunityId,
      applicationMessage,
      currentAppliedOpportunities: appliedOpportunities,
      userId: user?.id
    });
    
    try {
      const success = await applyToOpportunity(opportunityId, applicationMessage);
      console.log('📝 applyToOpportunity result:', success);
      
      if (success) {
        setSelectedOpportunity(null);
        setApplicationMessage('');
        console.log('✅ Application successful, modal closed');
      } else {
        console.log('❌ Application failed');
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Échec de l\'envoi de la candidature. Veuillez réessayer.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error in handleApplyToOpportunity:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de l\'envoi de la candidature',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleViewApplications = (opportunity) => {
    setSelectedOpportunity(opportunity);
    loadApplications(opportunity.id);
  };

  const handleSaveToFavorites = async (opportunityId) => {
    try {
      console.log('💾 Save to favorites requested for opportunity:', opportunityId);
      
      // Check if already favorited
      const isFavorite = isOpportunityFavorite(opportunityId);
      
      if (isFavorite) {
        // Remove from favorites
        const success = await removeOpportunityFromFavorites(opportunityId);
        if (success) {
          console.log('✅ Opportunity removed from favorites');
        }
      } else {
        // Add to favorites
        const success = await addOpportunityToFavorites(opportunityId);
        if (success) {
          console.log('✅ Opportunity added to favorites');
        }
      }
    } catch (error) {
      console.error('Error managing opportunity favorites:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la gestion des favoris',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketplace d'opportunités
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez et publiez des opportunités dans l'écosystème PME
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Publier une opportunité</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Briefcase className="mr-2" size={16} />
            Toutes les opportunités ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'mine'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Star className="mr-2" size={16} />
            Mes opportunités ({myOpportunities.length})
          </button>
        </nav>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des opportunités..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Briefcase className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {opportunities.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Opportunités actives
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                2.5M€
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Budget total
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                87%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taux de réussite
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="text-yellow-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                4.8
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Note moyenne
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des opportunités */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucune opportunité trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || activeFilter !== 'all' 
              ? 'Essayez d\'ajuster vos critères de recherche.'
              : 'Soyez le premier à publier une opportunité !'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Publier une opportunité
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="relative">
              <OpportunityCard
                opportunity={opportunity}
                onClick={(opp) => setSelectedOpportunity(opp)}
                showActions={true}
              />
              
              {/* Actions supplémentaires */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {activeTab === 'mine' && opportunity.authorId === user?.id && (
                  <>
                    <button
                      onClick={() => handleEditOpportunity(opportunity)}
                      className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full shadow-md hover:shadow-lg transition-shadow"
                      title="Modifier"
                    >
                      <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteOpportunity(opportunity.id)}
                      className="p-2 bg-red-100 dark:bg-red-900 rounded-full shadow-md hover:shadow-lg transition-shadow"
                      title="Supprimer"
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </button>
                    <button
                      onClick={() => handleViewApplications(opportunity)}
                      className="p-2 bg-green-100 dark:bg-green-900 rounded-full shadow-md hover:shadow-lg transition-shadow"
                      title="Voir les candidatures"
                    >
                      <Send size={16} className="text-green-600 dark:text-green-400" />
                    </button>
                  </>
                )}
                {activeTab === 'all' && (
                  <>
                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow">
                      <Heart size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button 
                      onClick={() => {
                        console.log('👁️ Opening opportunity details:', {
                          opportunityId: opportunity.id,
                          appliedOpportunities,
                          isAlreadyApplied: appliedOpportunities.includes(opportunity.id)
                        });
                        setSelectedOpportunity(opportunity);
                      }}
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création d'opportunité */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Publier une nouvelle opportunité"
        size="lg"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre de l'opportunité
              </label>
              <input
                type="text"
                value={newOpportunity.title}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Ex: Recherche développeur full-stack"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type d'opportunité
              </label>
              <select
                value={newOpportunity.type}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, type: e.target.value }))}
                className="input-field"
                required
              >
                {opportunityTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget
              </label>
              <input
                type="text"
                value={newOpportunity.budget}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, budget: e.target.value }))}
                className="input-field"
                placeholder="Ex: 50K-80K€, À négocier"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée
              </label>
              <input
                type="text"
                value={newOpportunity.duration}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, duration: e.target.value }))}
                className="input-field"
                placeholder="Ex: 6 mois, CDI, Mission ponctuelle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={newOpportunity.location}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, location: e.target.value }))}
                className="input-field"
                placeholder="Ex: Paris, Remote, France"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date limite de candidature
              </label>
              <input
                type="date"
                value={newOpportunity.deadline}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, deadline: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description détaillée
            </label>
            <textarea
              value={newOpportunity.description}
              onChange={(e) => setNewOpportunity(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="input-field resize-none"
              placeholder="Décrivez l'opportunité, le contexte, les objectifs..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exigences (séparées par des virgules)
            </label>
            <textarea
              value={newOpportunity.requirements}
              onChange={(e) => setNewOpportunity(prev => ({ ...prev, requirements: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="Ex: 5+ ans d'expérience, Maîtrise React, Anglais courant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={newOpportunity.tags}
              onChange={(e) => setNewOpportunity(prev => ({ ...prev, tags: e.target.value }))}
              className="input-field"
              placeholder="Ex: React, JavaScript, Startup, Remote"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Publier l'opportunité
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal d'édition d'opportunité */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'opportunité"
        size="lg"
      >
        {editingOpportunity && (
          <form onSubmit={handleUpdateOpportunity} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre de l'opportunité
                </label>
                <input
                  type="text"
                  value={editingOpportunity.title}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Recherche développeur full-stack"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d'opportunité
                </label>
                <select
                  value={editingOpportunity.type}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, type: e.target.value }))}
                  className="input-field"
                  required
                >
                  {opportunityTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  value={editingOpportunity.status || 'Ouvert'}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Fermé">Fermé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget
                </label>
                <input
                  type="text"
                  value={editingOpportunity.budget || ''}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, budget: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: 50K-80K€, À négocier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée
                </label>
                <input
                  type="text"
                  value={editingOpportunity.duration || ''}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, duration: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: 6 mois, CDI, Mission ponctuelle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={editingOpportunity.location || ''}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Paris, Remote, France"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date limite de candidature
                </label>
                <input
                  type="date"
                  value={editingOpportunity.deadline || ''}
                  onChange={(e) => setEditingOpportunity(prev => ({ ...prev, deadline: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description détaillée
              </label>
              <textarea
                value={editingOpportunity.description}
                onChange={(e) => setEditingOpportunity(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="input-field resize-none"
                placeholder="Décrivez l'opportunité, le contexte, les objectifs..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exigences (séparées par des virgules)
              </label>
              <textarea
                value={Array.isArray(editingOpportunity.requirements) ? 
                  editingOpportunity.requirements.join(', ') : 
                  (editingOpportunity.requirements || '')
                }
                onChange={(e) => setEditingOpportunity(prev => ({ ...prev, requirements: e.target.value }))}
                rows={3}
                className="input-field resize-none"
                placeholder="Ex: 5+ ans d'expérience, Maîtrise React, Anglais courant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={Array.isArray(editingOpportunity.tags) ? 
                  editingOpportunity.tags.join(', ') : 
                  (editingOpportunity.tags || '')
                }
                onChange={(e) => setEditingOpportunity(prev => ({ ...prev, tags: e.target.value }))}
                className="input-field"
                placeholder="Ex: React, JavaScript, Startup, Remote"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Mettre à jour
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de détail d'opportunité */}
      <Modal
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        title="Détail de l'opportunité"
        size="lg"
      >
        {selectedOpportunity && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className={`badge ${
                  selectedOpportunity.type === 'Financement' ? 'bg-green-100 text-green-800' :
                  selectedOpportunity.type === 'Consulting' ? 'bg-purple-100 text-purple-800' :
                  selectedOpportunity.type === 'Recrutement' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedOpportunity.type}
                </span>
                <span className="badge-success">
                  {selectedOpportunity.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedOpportunity.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedOpportunity.company}
              </p>
            </div>

            {/* Informations clés */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {selectedOpportunity.budget && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Budget</div>
                  <div className="font-medium">{selectedOpportunity.budget}</div>
                </div>
              )}
              {selectedOpportunity.duration && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Durée</div>
                  <div className="font-medium">{selectedOpportunity.duration}</div>
                </div>
              )}
              {selectedOpportunity.location && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Lieu</div>
                  <div className="font-medium">{selectedOpportunity.location}</div>
                </div>
              )}
              {selectedOpportunity.deadline && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Échéance</div>
                  <div className="font-medium">
                    {new Date(selectedOpportunity.deadline).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedOpportunity.description}
              </p>
            </div>

            {/* Exigences */}
            {selectedOpportunity.requirements && selectedOpportunity.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Exigences
                </h3>
                <ul className="space-y-2">
                  {selectedOpportunity.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {selectedOpportunity.tags && selectedOpportunity.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOpportunity.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message for application */}
            {!appliedOpportunities.includes(selectedOpportunity.id) && activeTab === 'all' && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message de candidature (optionnel)
                </label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Expliquez pourquoi vous êtes intéressé par cette opportunité..."
                />
              </div>
            )}

            {/* Applications (for opportunity owner) */}
            {activeTab === 'mine' && selectedOpportunity.authorId === user?.id && opportunityApplications[selectedOpportunity.id] && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Candidatures ({opportunityApplications[selectedOpportunity.id]?.length || 0})
                </h3>
                {opportunityApplications[selectedOpportunity.id]?.length > 0 ? (
                  <div className="space-y-4">
                    {opportunityApplications[selectedOpportunity.id].map((application, index) => (
                      <div key={application.id || index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {application.applicant_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {application.applicant_name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {application.applicant_type}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.status === 'En attente' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : application.status === 'Accepté'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                        {application.message && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            "{application.message}"
                          </p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Candidaté le {new Date(application.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    Aucune candidature pour le moment
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedOpportunity.applicants || 0} candidature(s) • 
                Publié le {new Date(selectedOpportunity.createdAt).toLocaleDateString('fr-FR')}
              </div>
              
              <div className="flex space-x-3">
                {activeTab === 'all' && (
                  <>
                    <button
                      onClick={() => handleSaveToFavorites(selectedOpportunity.id)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        isOpportunityFavorite(selectedOpportunity.id)
                          ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                          : 'btn-outline'
                      }`}
                    >
                      <Heart 
                        size={18} 
                        className={`mr-2 ${
                          isOpportunityFavorite(selectedOpportunity.id) 
                            ? 'fill-red-500 text-red-500' 
                            : ''
                        }`} 
                      />
                      {isOpportunityFavorite(selectedOpportunity.id) ? 'Sauvegardé' : 'Sauvegarder'}
                    </button>
                    
                    <button
                      onClick={() => handleApplyToOpportunity(selectedOpportunity.id)}
                      disabled={appliedOpportunities.includes(selectedOpportunity.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        appliedOpportunities.includes(selectedOpportunity.id)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      <Send size={18} />
                      <span>
                        {appliedOpportunities.includes(selectedOpportunity.id) 
                          ? 'Candidature envoyée' 
                          : 'Candidater'
                        }
                      </span>
                    </button>
                  </>
                )}

                {activeTab === 'mine' && selectedOpportunity.authorId === user?.id && (
                  <>
                    <button
                      onClick={() => handleEditOpportunity(selectedOpportunity)}
                      className="btn-outline"
                    >
                      <Edit size={18} className="mr-2" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => handleDeleteOpportunity(selectedOpportunity.id)}
                      className="btn-danger"
                    >
                      <Trash2 size={18} className="mr-2" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}