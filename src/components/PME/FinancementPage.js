import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  FileText, 
  Calendar,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Clock,
  Target,
  Users
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function FinancementPage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Types de financement disponibles
  const financingTypes = [
    { id: 'all', label: 'Tous les types' },
    { id: 'seed', label: 'Seed Funding' },
    { id: 'series-a', label: 'Série A' },
    { id: 'series-b', label: 'Série B' },
    { id: 'grant', label: 'Subventions' },
    { id: 'loan', label: 'Prêts bancaires' },
    { id: 'crowdfunding', label: 'Crowdfunding' }
  ];

  // Opportunités de financement (données de démonstration)
  const financingOpportunities = [
    {
      id: 1,
      title: 'France 2030 - Innovation Deeptech',
      type: 'grant',
      amount: '50k - 500k €',
      deadline: '2025-03-15',
      status: 'open',
      description: 'Programme de soutien aux startups deeptech',
      eligibility: 'Startup technologique française',
      provider: 'Bpifrance'
    },
    {
      id: 2,
      title: 'Seed Funding - Tech Accelerator',
      type: 'seed',
      amount: '100k - 1M €',
      deadline: '2025-02-28',
      status: 'open',
      description: 'Financement pour startups early-stage',
      eligibility: 'MVP développé, équipe constituée',
      provider: 'TechStars Paris'
    },
    {
      id: 3,
      title: 'Prêt Innovation BPI',
      type: 'loan',
      amount: '200k - 3M €',
      deadline: '2025-04-30',
      status: 'open',
      description: 'Prêt à taux avantageux pour projets innovants',
      eligibility: 'Entreprise < 8 ans, projet R&D',
      provider: 'Bpifrance'
    },
    {
      id: 4,
      title: 'Série A - HealthTech Fund',
      type: 'series-a',
      amount: '2M - 15M €',
      deadline: '2025-06-01',
      status: 'open',
      description: 'Investissement pour scale-up santé',
      eligibility: 'Traction démontrée, marché validé',
      provider: 'Sofinnova Partners'
    }
  ];

  // Mes demandes de financement
  const myApplications = [
    {
      id: 1,
      title: 'France 2030 - Innovation Deeptech',
      amount: '300k €',
      status: 'pending',
      submittedDate: '2025-01-15',
      nextStep: 'Entretien pitch prévu le 10/02'
    },
    {
      id: 2,
      title: 'Seed Funding - Tech Accelerator',
      amount: '500k €',
      status: 'approved',
      submittedDate: '2024-12-20',
      nextStep: 'Signature des documents'
    },
    {
      id: 3,
      title: 'Prêt Innovation BPI',
      amount: '200k €',
      status: 'rejected',
      submittedDate: '2024-11-30',
      nextStep: 'Feedback reçu, possibilité de re-candidater'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'open': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'open': return 'Ouvert';
      default: return status;
    }
  };

  const filteredOpportunities = financingOpportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || opp.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleApply = (opportunity) => {
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: `Candidature envoyée pour ${opportunity.title}`,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-primary-100 p-3 rounded-xl">
            <DollarSign className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Financement
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Trouvez les meilleures opportunités de financement pour votre startup
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Target className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Opportunités disponibles</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{financingOpportunities.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FileText className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Candidatures actives</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{myApplications.filter(app => app.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'acceptation</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">33%</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Users className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Investisseurs intéressés</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'opportunities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Opportunités disponibles
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes candidatures
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ressources
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'opportunities' && (
        <div>
          {/* Filtres et recherche */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher des opportunités..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {financingTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Liste des opportunités */}
          <div className="space-y-4">
            {filteredOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {opportunity.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(opportunity.status)}`}>
                        {getStatusLabel(opportunity.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {opportunity.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <DollarSign size={14} />
                        <span>{opportunity.amount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Échéance: {new Date(opportunity.deadline).toLocaleDateString('fr-FR')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Building2 size={14} />
                        <span>{opportunity.provider}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(opportunity)}
                    className="btn-primary ml-4"
                  >
                    Candidater
                  </button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Éligibilité:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{opportunity.eligibility}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.map((application) => (
            <div key={application.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {application.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {getStatusLabel(application.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center space-x-1">
                      <DollarSign size={14} />
                      <span>{application.amount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Soumis le {new Date(application.submittedDate).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prochaine étape:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{application.nextStep}</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button className="btn-secondary text-sm">
                    Détails
                  </button>
                  {application.status === 'pending' && (
                    <button className="btn-primary text-sm">
                      Modifier
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Guides de financement
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Guide du Seed Funding</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comprendre les bases du financement early-stage</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Subventions publiques</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Liste complète des aides disponibles</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Business Plan Template</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Modèle de business plan pour investisseurs</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Webinaires à venir
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Calendar size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Pitch parfait en 10 min</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">15 février 2025 - 14h00</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Calendar size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Valorisation de startup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">22 février 2025 - 10h00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}