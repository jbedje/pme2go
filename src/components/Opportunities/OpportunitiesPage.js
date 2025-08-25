import React, { useState } from 'react';
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
  Star
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { OpportunityCard } from '../UI/Card';
import { Modal } from '../UI/Modal';

export default function OpportunitiesPage() {
  const { 
    opportunities, 
    createOpportunity, 
    applyToOpportunity,
    appliedOpportunities,
    user,
    setView 
  } = useSecureApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filterOptions = [
    { key: 'all', label: 'Toutes', count: opportunities.length },
    { key: 'Financement', label: 'Financement', count: opportunities.filter(o => o.type === 'Financement').length },
    { key: 'Consulting', label: 'Consulting', count: opportunities.filter(o => o.type === 'Consulting').length },
    { key: 'Recrutement', label: 'Recrutement', count: opportunities.filter(o => o.type === 'Recrutement').length },
    { key: 'Partenariat', label: 'Partenariat', count: opportunities.filter(o => o.type === 'Partenariat').length }
  ];

  const getFilteredOpportunities = () => {
    let filtered = opportunities;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(opp => opp.type === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.company.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleApplyToOpportunity = (opportunityId) => {
    applyToOpportunity(opportunityId);
    setSelectedOpportunity(null);
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
                <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow">
                  <Heart size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  onClick={() => setSelectedOpportunity(opportunity)}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
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

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedOpportunity.applicants || 0} candidature(s) • 
                Publié le {new Date(selectedOpportunity.createdAt).toLocaleDateString('fr-FR')}
              </div>
              
              <div className="flex space-x-3">
                <button className="btn-outline">
                  <Heart size={18} className="mr-2" />
                  Sauvegarder
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
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}