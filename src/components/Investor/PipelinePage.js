import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  Building2, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Filter,
  Search,
  Edit3,
  Eye,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function PipelinePage() {
  const { user, addNotification } = useSecureApp();
  const [activeStage, setActiveStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Étapes du pipeline d'investissement
  const pipelineStages = [
    { id: 'all', label: 'Tous', count: 47 },
    { id: 'sourcing', label: 'Sourcing', count: 12 },
    { id: 'initial', label: 'Contact Initial', count: 8 },
    { id: 'review', label: 'Analyse Préliminaire', count: 6 },
    { id: 'diligence', label: 'Due Diligence', count: 4 },
    { id: 'term-sheet', label: 'Term Sheet', count: 3 },
    { id: 'negotiation', label: 'Négociation', count: 2 },
    { id: 'closing', label: 'Closing', count: 1 }
  ];

  // Données de démonstration pour les deals
  const deals = [
    {
      id: 1,
      companyName: 'TechStart Solutions',
      sector: 'SaaS B2B',
      stage: 'diligence',
      fundingRound: 'Série A',
      amountSought: '1.5M€',
      valuation: '12M€',
      lastActivity: '2025-01-20',
      nextStep: 'Entretien équipe technique',
      probability: 75,
      contact: 'Marie Dubois',
      email: 'marie@techstart.fr',
      phone: '+33 6 12 34 56 78',
      location: 'Paris',
      description: 'Plateforme SaaS de gestion de projets avec IA intégrée',
      metrics: {
        arr: '2.5M€',
        growth: '25%',
        customers: 544,
        churn: '1.3%'
      }
    },
    {
      id: 2,
      companyName: 'HealthTech Innovations',
      sector: 'HealthTech',
      stage: 'term-sheet',
      fundingRound: 'Seed',
      amountSought: '800k€',
      valuation: '4M€',
      lastActivity: '2025-01-18',
      nextStep: 'Finalisation term sheet',
      probability: 85,
      contact: 'Dr. Jean Martin',
      email: 'jean@healthtech.fr',
      phone: '+33 6 98 76 54 32',
      location: 'Lyon',
      description: 'Solution de télémédecine pour le suivi des patients chroniques',
      metrics: {
        arr: '150k€',
        growth: '45%',
        customers: 12,
        churn: '2.1%'
      }
    },
    {
      id: 3,
      companyName: 'GreenEnergy Pro',
      sector: 'CleanTech',
      stage: 'review',
      fundingRound: 'Série B',
      amountSought: '5M€',
      valuation: '25M€',
      lastActivity: '2025-01-15',
      nextStep: 'Analyse financière approfondie',
      probability: 60,
      contact: 'Sophie Laurent',
      email: 'sophie@greenenergy.fr',
      phone: '+33 6 11 22 33 44',
      location: 'Toulouse',
      description: 'Solutions IoT pour l\'optimisation énergétique des entreprises',
      metrics: {
        arr: '1.8M€',
        growth: '35%',
        customers: 89,
        churn: '1.8%'
      }
    },
    {
      id: 4,
      companyName: 'FinTech Solutions',
      sector: 'FinTech',
      stage: 'initial',
      fundingRound: 'Seed',
      amountSought: '600k€',
      valuation: '3M€',
      lastActivity: '2025-01-10',
      nextStep: 'Première réunion d\'évaluation',
      probability: 40,
      contact: 'Pierre Durand',
      email: 'pierre@fintech-sol.fr',
      phone: '+33 6 55 66 77 88',
      location: 'Nice',
      description: 'Plateforme de paiements digitaux pour PME',
      metrics: {
        arr: '80k€',
        growth: '60%',
        customers: 45,
        churn: '3.2%'
      }
    },
    {
      id: 5,
      companyName: 'AI Robotics',
      sector: 'DeepTech',
      stage: 'closing',
      fundingRound: 'Série A',
      amountSought: '2M€',
      valuation: '15M€',
      lastActivity: '2025-01-22',
      nextStep: 'Signature finale',
      probability: 95,
      contact: 'Thomas Chen',
      email: 'thomas@ai-robotics.fr',
      phone: '+33 6 99 88 77 66',
      location: 'Grenoble',
      description: 'Solutions robotiques autonomes pour l\'industrie 4.0',
      metrics: {
        arr: '900k€',
        growth: '180%',
        customers: 8,
        churn: '0%'
      }
    }
  ];

  const getStageColor = (stage) => {
    switch (stage) {
      case 'sourcing': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'initial': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'diligence': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'term-sheet': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'negotiation': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'closing': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageName = (stage) => {
    const stageObj = pipelineStages.find(s => s.id === stage);
    return stageObj ? stageObj.label : stage;
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredDeals = deals.filter(deal => {
    const matchesStage = activeStage === 'all' || deal.stage === activeStage;
    const matchesSearch = deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.sector.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const handleMoveStage = (dealId, newStage) => {
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Deal déplacé avec succès',
      timestamp: new Date().toISOString()
    });
  };

  const totalPipelineValue = deals.reduce((sum, deal) => {
    return sum + parseFloat(deal.amountSought.replace('M€', '').replace('k€', '')) * (deal.amountSought.includes('M€') ? 1000000 : 1000);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Target className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Pipeline Investissement
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez vos opportunités d'investissement de bout en bout
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="btn-secondary flex items-center space-x-2">
              <Filter size={18} />
              <span>Filtrer</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <Plus size={18} />
              <span>Nouveau Deal</span>
            </button>
          </div>
        </div>

        {/* Métriques du pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Building2 className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Deals actifs</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{deals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <DollarSign className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valeur pipeline</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {(totalPipelineValue / 1000000).toFixed(1)}M€
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux de conversion</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">15%</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Clock className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cycle moyen</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">4.2 mois</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Étapes du pipeline */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {pipelineStages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeStage === stage.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{stage.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeStage === stage.id
                  ? 'bg-white text-primary-600'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans le pipeline..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Liste des deals */}
      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <div key={deal.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {deal.companyName}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStageColor(deal.stage)}`}>
                    {getStageName(deal.stage)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {deal.sector}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {deal.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Montant:</span>
                    <p className="font-medium">{deal.amountSought}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Valorisation:</span>
                    <p className="font-medium">{deal.valuation}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Round:</span>
                    <p className="font-medium">{deal.fundingRound}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Probabilité:</span>
                    <p className={`font-medium ${getProbabilityColor(deal.probability)}`}>
                      {deal.probability}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="ml-6 flex flex-col items-end space-y-2">
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">
                    <Eye size={16} />
                  </button>
                  <button className="btn-secondary text-sm">
                    <Edit3 size={16} />
                  </button>
                </div>
                <select
                  value={deal.stage}
                  onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                >
                  {pipelineStages.slice(1).map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Contact et métriques */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{deal.contact}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail size={16} />
                    <span>{deal.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={16} />
                    <span>{deal.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{deal.metrics.arr}</p>
                    <p className="text-gray-500 dark:text-gray-400">ARR</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-green-600">+{deal.metrics.growth}</p>
                    <p className="text-gray-500 dark:text-gray-400">Croissance</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{deal.metrics.customers}</p>
                    <p className="text-gray-500 dark:text-gray-400">Clients</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span>Prochaine étape: </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{deal.nextStep}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Dernière activité: {new Date(deal.lastActivity).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}