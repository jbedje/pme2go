import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Star,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Target,
  Award,
  Activity,
  Briefcase
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const PORTFOLIO_STATUS = {
  ACTIVE: 'Active',
  EXITED: 'Exited',
  UNDERPERFORMING: 'Underperforming',
  GROWTH: 'Growth',
  MATURE: 'Mature'
};

const INVESTMENT_STAGES = {
  SEED: 'Seed',
  SERIES_A: 'Série A',
  SERIES_B: 'Série B',
  SERIES_C: 'Série C+',
  GROWTH: 'Growth',
  BUYOUT: 'Buyout'
};

export default function PortefeuillePage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const portfolioCompanies = [
    {
      id: 1,
      name: 'TechStart Solutions',
      logo: '🚀',
      sector: 'SaaS B2B',
      stage: INVESTMENT_STAGES.SERIES_A,
      status: PORTFOLIO_STATUS.GROWTH,
      investmentDate: '2023-03-15',
      initialInvestment: 500000,
      currentValuation: 3200000,
      ownership: 15.6,
      lastRound: '2024-01-15',
      employees: 25,
      revenue: 480000,
      growth: 180,
      metrics: {
        mrr: 40000,
        churn: 3.2,
        cac: 120,
        ltv: 3600
      },
      contact: {
        ceo: 'Sarah Chen',
        email: 'sarah@techstart.com',
        phone: '+33 1 23 45 67 89'
      },
      updates: [
        { date: '2024-02-15', title: 'Nouveau contrat majeur signé', value: '+€50k MRR' },
        { date: '2024-01-30', title: 'Levée Série A finalisée', value: '€2M' }
      ]
    },
    {
      id: 2,
      name: 'GreenTech Innovation',
      logo: '🌱',
      sector: 'CleanTech',
      stage: INVESTMENT_STAGES.SEED,
      status: PORTFOLIO_STATUS.ACTIVE,
      investmentDate: '2023-09-20',
      initialInvestment: 200000,
      currentValuation: 800000,
      ownership: 25.0,
      lastRound: '2023-09-20',
      employees: 8,
      revenue: 120000,
      growth: 45,
      metrics: {
        mrr: 10000,
        churn: 5.1,
        cac: 200,
        ltv: 2000
      },
      contact: {
        ceo: 'Pierre Dubois',
        email: 'pierre@greentech.fr',
        phone: '+33 1 34 56 78 90'
      },
      updates: [
        { date: '2024-02-10', title: 'Nouveau partenariat stratégique', value: 'EDF' },
        { date: '2024-01-25', title: 'Brevet déposé', value: 'Innovation énergétique' }
      ]
    },
    {
      id: 3,
      name: 'FinanceAI Corp',
      logo: '💳',
      sector: 'FinTech',
      stage: INVESTMENT_STAGES.SERIES_B,
      status: PORTFOLIO_STATUS.MATURE,
      investmentDate: '2022-05-10',
      initialInvestment: 1000000,
      currentValuation: 15000000,
      ownership: 8.5,
      lastRound: '2023-11-30',
      employees: 85,
      revenue: 2400000,
      growth: 95,
      metrics: {
        mrr: 200000,
        churn: 2.1,
        cac: 80,
        ltv: 4800
      },
      contact: {
        ceo: 'Maria Rodriguez',
        email: 'maria@financeai.com',
        phone: '+33 1 45 67 89 01'
      },
      updates: [
        { date: '2024-02-20', title: 'IPO en préparation', value: 'Q4 2024' },
        { date: '2024-02-01', title: 'Croissance record', value: '+125% YoY' }
      ]
    },
    {
      id: 4,
      name: 'HealthTech Solutions',
      logo: '🏥',
      sector: 'HealthTech',
      stage: INVESTMENT_STAGES.GROWTH,
      status: PORTFOLIO_STATUS.UNDERPERFORMING,
      investmentDate: '2021-12-08',
      initialInvestment: 800000,
      currentValuation: 2100000,
      ownership: 12.3,
      lastRound: '2023-06-15',
      employees: 45,
      revenue: 890000,
      growth: -15,
      metrics: {
        mrr: 74000,
        churn: 8.5,
        cac: 350,
        ltv: 2800
      },
      contact: {
        ceo: 'Dr. Jean Martin',
        email: 'jean@healthtech.fr',
        phone: '+33 1 56 78 90 12'
      },
      updates: [
        { date: '2024-02-12', title: 'Plan de restructuration', value: 'En cours' },
        { date: '2024-01-20', title: 'Nouveau directeur marketing', value: 'Recrutement' }
      ]
    },
    {
      id: 5,
      name: 'EdTech Academy',
      logo: '📚',
      sector: 'EdTech',
      stage: INVESTMENT_STAGES.SERIES_C,
      status: PORTFOLIO_STATUS.EXITED,
      investmentDate: '2020-08-15',
      initialInvestment: 1500000,
      currentValuation: 0,
      ownership: 0,
      lastRound: '2023-12-20',
      employees: 0,
      revenue: 0,
      growth: 0,
      exitDate: '2024-01-30',
      exitMultiple: 4.2,
      exitValue: 6300000,
      contact: {
        ceo: 'Thomas Wilson',
        email: 'thomas@edtech.com',
        phone: 'N/A'
      },
      updates: [
        { date: '2024-01-30', title: 'Sortie réussie', value: '4.2x multiple' },
        { date: '2023-12-20', title: 'Acquisition finalisée', value: 'Pearson Education' }
      ]
    }
  ];

  const filteredCompanies = portfolioCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || company.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const portfolioStats = {
    totalInvestments: portfolioCompanies.length,
    totalInvested: portfolioCompanies.reduce((sum, company) => sum + company.initialInvestment, 0),
    currentValue: portfolioCompanies.reduce((sum, company) => 
      company.status === PORTFOLIO_STATUS.EXITED ? sum : sum + company.currentValuation, 0),
    totalReturns: portfolioCompanies
      .filter(company => company.status === PORTFOLIO_STATUS.EXITED)
      .reduce((sum, company) => sum + (company.exitValue || 0), 0),
    activeInvestments: portfolioCompanies.filter(company => company.status !== PORTFOLIO_STATUS.EXITED).length
  };

  const sectorDistribution = [
    { name: 'SaaS B2B', value: 2, color: COLORS[0] },
    { name: 'FinTech', value: 1, color: COLORS[1] },
    { name: 'HealthTech', value: 1, color: COLORS[2] },
    { name: 'CleanTech', value: 1, color: COLORS[3] },
    { name: 'EdTech', value: 1, color: COLORS[4] }
  ];

  const performanceData = [
    { month: 'Jan', value: 8500000, invested: 6200000 },
    { month: 'Fév', value: 9200000, invested: 6200000 },
    { month: 'Mar', value: 11300000, invested: 6800000 },
    { month: 'Avr', value: 12100000, invested: 7200000 },
    { month: 'Mai', value: 13800000, invested: 7200000 },
    { month: 'Jun', value: 15200000, invested: 8000000 }
  ];

  const handleViewInvestment = (investment) => {
    setSelectedInvestment(investment);
    setShowInvestmentModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PORTFOLIO_STATUS.GROWTH:
        return <TrendingUp className="text-green-500" size={16} />;
      case PORTFOLIO_STATUS.UNDERPERFORMING:
        return <TrendingDown className="text-red-500" size={16} />;
      case PORTFOLIO_STATUS.EXITED:
        return <Target className="text-blue-500" size={16} />;
      case PORTFOLIO_STATUS.MATURE:
        return <Award className="text-yellow-500" size={16} />;
      default:
        return <Activity className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PORTFOLIO_STATUS.GROWTH:
        return 'text-green-600 bg-green-100';
      case PORTFOLIO_STATUS.UNDERPERFORMING:
        return 'text-red-600 bg-red-100';
      case PORTFOLIO_STATUS.EXITED:
        return 'text-blue-600 bg-blue-100';
      case PORTFOLIO_STATUS.MATURE:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount);
  };

  const InvestmentModal = ({ investment, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{investment.logo}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {investment.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{investment.sector}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informations d'investissement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investissement initial</span>
                    <span className="font-medium">{formatCurrency(investment.initialInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valorisation actuelle</span>
                    <span className="font-medium">{formatCurrency(investment.currentValuation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participation</span>
                    <span className="font-medium">{investment.ownership}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date d'investissement</span>
                    <span className="font-medium">{new Date(investment.investmentDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {investment.exitDate && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date de sortie</span>
                        <span className="font-medium">{new Date(investment.exitDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Multiple de sortie</span>
                        <span className="font-medium text-green-600">{investment.exitMultiple}x</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Métriques clés</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{formatCurrency(investment.metrics.mrr)}</div>
                    <div className="text-sm text-gray-600">MRR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{investment.metrics.churn}%</div>
                    <div className="text-sm text-gray-600">Churn Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(investment.metrics.cac)}</div>
                    <div className="text-sm text-gray-600">CAC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(investment.metrics.ltv)}</div>
                    <div className="text-sm text-gray-600">LTV</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">CEO: </span>
                    <span className="font-medium">{investment.contact.ceo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email: </span>
                    <span className="font-medium">{investment.contact.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Téléphone: </span>
                    <span className="font-medium">{investment.contact.phone}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Dernières actualités</h3>
                <div className="space-y-3">
                  {investment.updates.map((update, index) => (
                    <div key={index} className="border-l-4 border-primary-500 pl-4">
                      <div className="font-medium">{update.title}</div>
                      <div className="text-sm text-gray-600">{update.value}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(update.date).toLocaleDateString('fr-FR')}
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
            Mon Portefeuille
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivez vos investissements et leurs performances
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="btn-secondary"
            onClick={() => addNotification({
              id: Date.now().toString(),
              type: 'info',
              message: 'Génération du rapport en cours...',
              timestamp: new Date().toISOString()
            })}
          >
            <BarChart3 size={18} />
            Rapport
          </button>
          <button 
            className="btn-primary"
            onClick={() => addNotification({
              id: Date.now().toString(),
              type: 'info',
              message: 'Fonctionnalité bientôt disponible',
              timestamp: new Date().toISOString()
            })}
          >
            <Plus size={18} />
            Nouvel investissement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total investi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(portfolioStats.totalInvested)}
              </p>
            </div>
            <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl">
              <DollarSign className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Valeur actuelle</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(portfolioStats.currentValue)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Investissements actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {portfolioStats.activeInvestments}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <Briefcase className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Sorties réalisées</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(portfolioStats.totalReturns)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-xl">
              <Target className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Performance du portefeuille</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Valeur portfolio"
                />
                <Line 
                  type="monotone" 
                  dataKey="invested" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Capital investi"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Répartition sectorielle</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={sectorDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {sectorDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {sectorDistribution.map((sector, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: sector.color }}
                ></div>
                <span>{sector.name}</span>
                <span className="text-gray-500">({sector.value})</span>
              </div>
            ))}
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
                placeholder="Rechercher une société..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value={PORTFOLIO_STATUS.ACTIVE}>Actif</option>
              <option value={PORTFOLIO_STATUS.GROWTH}>Croissance</option>
              <option value={PORTFOLIO_STATUS.MATURE}>Mature</option>
              <option value={PORTFOLIO_STATUS.UNDERPERFORMING}>Sous-performance</option>
              <option value={PORTFOLIO_STATUS.EXITED}>Sorti</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Société</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Stage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Investissement</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Valorisation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{company.logo}</div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500">{company.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(company.status)}`}>
                      {getStatusIcon(company.status)}
                      <span>{company.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{company.stage}</td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                    {formatCurrency(company.initialInvestment)}
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                    {company.status === PORTFOLIO_STATUS.EXITED 
                      ? formatCurrency(company.exitValue) 
                      : formatCurrency(company.currentValuation)}
                  </td>
                  <td className="py-4 px-4">
                    <div className={`flex items-center space-x-1 ${company.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {company.growth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="font-medium">{Math.abs(company.growth)}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleViewInvestment(company)}
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

      {showInvestmentModal && selectedInvestment && (
        <InvestmentModal
          investment={selectedInvestment}
          onClose={() => {
            setShowInvestmentModal(false);
            setSelectedInvestment(null);
          }}
        />
      )}
    </div>
  );
}