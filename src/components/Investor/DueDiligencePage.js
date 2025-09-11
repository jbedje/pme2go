import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Building2,
  BarChart3,
  Shield,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Edit,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  Star,
  Book,
  Gavel,
  Globe,
  Database
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { ProgressBar } from '../UI/ProgressBar';

const DD_CATEGORIES = {
  LEGAL: 'Juridique',
  FINANCIAL: 'Financier',
  COMMERCIAL: 'Commercial', 
  TECHNICAL: 'Technique',
  TEAM: 'Équipe',
  MARKET: 'Marché',
  IP: 'Propriété intellectuelle',
  COMPLIANCE: 'Conformité'
};

const DD_STATUS = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  UNDER_REVIEW: 'En révision',
  COMPLETED: 'Terminé',
  ISSUE_FOUND: 'Problème identifié'
};

const RISK_LEVELS = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique'
};

export default function DueDiligencePage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const dueDiligenceDeals = [
    {
      id: 1,
      companyName: 'TechStart Solutions',
      logo: '🚀',
      dealValue: 2000000,
      stage: 'Série A',
      startDate: '2024-02-01',
      expectedClose: '2024-03-15',
      progress: 75,
      riskLevel: RISK_LEVELS.LOW,
      assignedAnalyst: 'Sophie Martin',
      categories: {
        [DD_CATEGORIES.LEGAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 0 },
        [DD_CATEGORIES.FINANCIAL]: { status: DD_STATUS.IN_PROGRESS, progress: 80, issues: 2 },
        [DD_CATEGORIES.COMMERCIAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 1 },
        [DD_CATEGORIES.TECHNICAL]: { status: DD_STATUS.IN_PROGRESS, progress: 60, issues: 0 },
        [DD_CATEGORIES.TEAM]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 0 },
        [DD_CATEGORIES.MARKET]: { status: DD_STATUS.UNDER_REVIEW, progress: 90, issues: 3 },
        [DD_CATEGORIES.IP]: { status: DD_STATUS.NOT_STARTED, progress: 0, issues: 0 },
        [DD_CATEGORIES.COMPLIANCE]: { status: DD_STATUS.IN_PROGRESS, progress: 40, issues: 1 }
      },
      documents: [
        { name: 'Statuts société', category: DD_CATEGORIES.LEGAL, status: 'Validé', uploadDate: '2024-02-02' },
        { name: 'Comptes annuels 2023', category: DD_CATEGORIES.FINANCIAL, status: 'En révision', uploadDate: '2024-02-03' },
        { name: 'Plan d\'affaires', category: DD_CATEGORIES.COMMERCIAL, status: 'Validé', uploadDate: '2024-02-01' },
        { name: 'Architecture technique', category: DD_CATEGORIES.TECHNICAL, status: 'En attente', uploadDate: null }
      ],
      keyFindings: [
        { type: 'positive', text: 'Croissance du CA de 180% sur 12 mois' },
        { type: 'positive', text: 'Équipe technique expérimentée avec track record' },
        { type: 'concern', text: 'Dépendance à 2 clients principaux (60% du CA)' },
        { type: 'issue', text: 'Retard sur la protection IP du produit principal' }
      ]
    },
    {
      id: 2,
      companyName: 'GreenTech Innovation',
      logo: '🌱',
      dealValue: 800000,
      stage: 'Seed',
      startDate: '2024-01-15',
      expectedClose: '2024-02-28',
      progress: 45,
      riskLevel: RISK_LEVELS.MEDIUM,
      assignedAnalyst: 'Pierre Dubois',
      categories: {
        [DD_CATEGORIES.LEGAL]: { status: DD_STATUS.IN_PROGRESS, progress: 70, issues: 1 },
        [DD_CATEGORIES.FINANCIAL]: { status: DD_STATUS.NOT_STARTED, progress: 0, issues: 0 },
        [DD_CATEGORIES.COMMERCIAL]: { status: DD_STATUS.IN_PROGRESS, progress: 50, issues: 0 },
        [DD_CATEGORIES.TECHNICAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 2 },
        [DD_CATEGORIES.TEAM]: { status: DD_STATUS.IN_PROGRESS, progress: 60, issues: 0 },
        [DD_CATEGORIES.MARKET]: { status: DD_STATUS.NOT_STARTED, progress: 0, issues: 0 },
        [DD_CATEGORIES.IP]: { status: DD_STATUS.UNDER_REVIEW, progress: 85, issues: 1 },
        [DD_CATEGORIES.COMPLIANCE]: { status: DD_STATUS.NOT_STARTED, progress: 0, issues: 0 }
      },
      documents: [
        { name: 'Pitch deck v2.1', category: DD_CATEGORIES.COMMERCIAL, status: 'Validé', uploadDate: '2024-01-16' },
        { name: 'Brevet en cours', category: DD_CATEGORIES.IP, status: 'En révision', uploadDate: '2024-01-20' },
        { name: 'Due diligence technique', category: DD_CATEGORIES.TECHNICAL, status: 'Validé', uploadDate: '2024-01-25' }
      ],
      keyFindings: [
        { type: 'positive', text: 'Technologie brevetable avec forte différenciation' },
        { type: 'concern', text: 'Marché encore émergent avec peu de références' },
        { type: 'concern', text: 'Équipe technique limitée pour la scalabilité' }
      ]
    },
    {
      id: 3,
      companyName: 'HealthTech Solutions',
      logo: '🏥',
      dealValue: 5000000,
      stage: 'Série B',
      startDate: '2023-12-01',
      expectedClose: '2024-03-30',
      progress: 95,
      riskLevel: RISK_LEVELS.HIGH,
      assignedAnalyst: 'Dr. Marie Lefebvre',
      categories: {
        [DD_CATEGORIES.LEGAL]: { status: DD_STATUS.ISSUE_FOUND, progress: 100, issues: 3 },
        [DD_CATEGORIES.FINANCIAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 1 },
        [DD_CATEGORIES.COMMERCIAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 0 },
        [DD_CATEGORIES.TECHNICAL]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 2 },
        [DD_CATEGORIES.TEAM]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 1 },
        [DD_CATEGORIES.MARKET]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 0 },
        [DD_CATEGORIES.IP]: { status: DD_STATUS.COMPLETED, progress: 100, issues: 0 },
        [DD_CATEGORIES.COMPLIANCE]: { status: DD_STATUS.ISSUE_FOUND, progress: 100, issues: 4 }
      },
      documents: [
        { name: 'Certification CE Medical', category: DD_CATEGORIES.COMPLIANCE, status: 'Problème', uploadDate: '2023-12-05' },
        { name: 'États financiers certifiés', category: DD_CATEGORIES.FINANCIAL, status: 'Validé', uploadDate: '2023-12-10' },
        { name: 'Contrats clients majeurs', category: DD_CATEGORIES.LEGAL, status: 'Problème', uploadDate: '2023-12-08' },
        { name: 'Rapport sécurité données', category: DD_CATEGORIES.COMPLIANCE, status: 'Problème', uploadDate: '2023-12-12' }
      ],
      keyFindings: [
        { type: 'positive', text: 'Produit mature avec traction commerciale forte' },
        { type: 'positive', text: 'Équipe de direction expérimentée dans le secteur' },
        { type: 'issue', text: 'Non-conformité RGPD - risque de sanctions importantes' },
        { type: 'issue', text: 'Clauses contractuelles défavorables avec clients majeurs' },
        { type: 'issue', text: 'Retard sur certifications médicales requises' }
      ]
    }
  ];

  const filteredDeals = dueDiligenceDeals.filter(deal => {
    const matchesSearch = deal.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case DD_STATUS.COMPLETED:
        return <CheckCircle className="text-green-500" size={16} />;
      case DD_STATUS.IN_PROGRESS:
        return <Clock className="text-blue-500" size={16} />;
      case DD_STATUS.UNDER_REVIEW:
        return <Eye className="text-yellow-500" size={16} />;
      case DD_STATUS.ISSUE_FOUND:
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <FileText className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case DD_STATUS.COMPLETED:
        return 'text-green-600 bg-green-100';
      case DD_STATUS.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      case DD_STATUS.UNDER_REVIEW:
        return 'text-yellow-600 bg-yellow-100';
      case DD_STATUS.ISSUE_FOUND:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case RISK_LEVELS.LOW:
        return 'text-green-600 bg-green-100';
      case RISK_LEVELS.MEDIUM:
        return 'text-yellow-600 bg-yellow-100';
      case RISK_LEVELS.HIGH:
        return 'text-orange-600 bg-orange-100';
      case RISK_LEVELS.CRITICAL:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case DD_CATEGORIES.LEGAL: return <Gavel size={16} />;
      case DD_CATEGORIES.FINANCIAL: return <DollarSign size={16} />;
      case DD_CATEGORIES.COMMERCIAL: return <TrendingUp size={16} />;
      case DD_CATEGORIES.TECHNICAL: return <Database size={16} />;
      case DD_CATEGORIES.TEAM: return <Users size={16} />;
      case DD_CATEGORIES.MARKET: return <Globe size={16} />;
      case DD_CATEGORIES.IP: return <Award size={16} />;
      case DD_CATEGORIES.COMPLIANCE: return <Shield size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount);
  };

  const DealDetailModal = ({ deal, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{deal.logo}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Due Diligence - {deal.companyName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {deal.stage} • {formatCurrency(deal.dealValue)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Progression par catégorie</h3>
                <div className="space-y-4">
                  {Object.entries(deal.categories).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(category)}
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${getStatusColor(data.status)}`}>
                            {getStatusIcon(data.status)}
                            <span>{data.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {data.issues > 0 && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            {data.issues} problème{data.issues > 1 ? 's' : ''}
                          </span>
                        )}
                        <div className="w-20">
                          <ProgressBar progress={data.progress} size="sm" />
                        </div>
                        <span className="text-sm font-medium w-8">{data.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 font-medium">Document</th>
                        <th className="text-left py-2 font-medium">Catégorie</th>
                        <th className="text-left py-2 font-medium">Statut</th>
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-left py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deal.documents.map((doc, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <FileText size={16} />
                              <span>{doc.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{doc.category}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'Validé' ? 'bg-green-100 text-green-800' :
                              doc.status === 'En révision' ? 'bg-yellow-100 text-yellow-800' :
                              doc.status === 'Problème' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">
                            {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td className="py-3">
                            <button className="text-primary-600 hover:text-primary-700">
                              <Download size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analyste assigné</span>
                    <span className="font-medium">{deal.assignedAnalyst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de début</span>
                    <span className="font-medium">
                      {new Date(deal.startDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clôture prévue</span>
                    <span className="font-medium">
                      {new Date(deal.expectedClose).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Niveau de risque</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskColor(deal.riskLevel)}`}>
                      {deal.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progression globale</span>
                    <span className="font-medium">{deal.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Observations clés</h3>
                <div className="space-y-3">
                  {deal.keyFindings.map((finding, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border-l-4 ${
                        finding.type === 'positive' ? 'border-green-500 bg-green-50' :
                        finding.type === 'concern' ? 'border-yellow-500 bg-yellow-50' :
                        'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {finding.type === 'positive' && <CheckCircle className="text-green-500 mt-0.5" size={16} />}
                        {finding.type === 'concern' && <Clock className="text-yellow-500 mt-0.5" size={16} />}
                        {finding.type === 'issue' && <AlertCircle className="text-red-500 mt-0.5" size={16} />}
                        <span className="text-sm">{finding.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Due Diligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivi et analyse des processus de due diligence
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <FileText size={18} />
            Template
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Nouvelle DD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">DD actives</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {filteredDeals.filter(d => d.progress < 100).length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">DD terminées</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {filteredDeals.filter(d => d.progress === 100).length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Problèmes identifiés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {filteredDeals.reduce((total, deal) => 
                  total + Object.values(deal.categories).reduce((sum, cat) => sum + cat.issues, 0), 0
                )}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Valeur deals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(filteredDeals.reduce((sum, deal) => sum + deal.dealValue, 0))}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-xl">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un deal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Société</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Valeur deal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Progression</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Risque</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Analyste</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Échéance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{deal.logo}</div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {deal.companyName}
                        </div>
                        <div className="text-sm text-gray-500">{deal.stage}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(deal.dealValue)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-24">
                        <ProgressBar progress={deal.progress} />
                      </div>
                      <span className="text-sm font-medium">{deal.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(deal.riskLevel)}`}>
                      {deal.riskLevel}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                    {deal.assignedAnalyst}
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                    {new Date(deal.expectedClose).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => {
                        setSelectedDealId(deal.id);
                        setShowDocumentModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDocumentModal && selectedDealId && (
        <DealDetailModal
          deal={filteredDeals.find(d => d.id === selectedDealId)}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDealId(null);
          }}
        />
      )}
    </div>
  );
}