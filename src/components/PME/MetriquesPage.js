import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function MetriquesPage() {
  const { user, addNotification } = useSecureApp();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Données de démonstration pour les graphiques
  const revenueData = [
    { month: 'Jan', revenue: 45000, recurring: 38000, oneTime: 7000 },
    { month: 'Fév', revenue: 52000, recurring: 43000, oneTime: 9000 },
    { month: 'Mar', revenue: 48000, recurring: 41000, oneTime: 7000 },
    { month: 'Avr', revenue: 61000, recurring: 52000, oneTime: 9000 },
    { month: 'Mai', revenue: 67000, recurring: 56000, oneTime: 11000 },
    { month: 'Jun', revenue: 73000, recurring: 62000, oneTime: 11000 }
  ];

  const customerData = [
    { month: 'Jan', acquired: 45, churned: 8, total: 320 },
    { month: 'Fév', acquired: 62, churned: 12, total: 370 },
    { month: 'Mar', acquired: 38, churned: 15, total: 393 },
    { month: 'Avr', acquired: 71, churned: 9, total: 455 },
    { month: 'Mai', acquired: 58, churned: 11, total: 502 },
    { month: 'Jun', acquired: 49, churned: 7, total: 544 }
  ];

  const conversionFunnelData = [
    { stage: 'Visiteurs site', count: 15420, percentage: 100 },
    { stage: 'Leads qualifiés', count: 2314, percentage: 15 },
    { stage: 'Démo demandées', count: 463, percentage: 3 },
    { stage: 'Trials activés', count: 231, percentage: 1.5 },
    { stage: 'Clients payants', count: 69, percentage: 0.45 }
  ];

  const kpiData = [
    {
      label: 'ARR (Annual Recurring Revenue)',
      value: '2,5M€',
      change: '+23%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'MRR (Monthly Recurring Revenue)',
      value: '208k€',
      change: '+15%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'Clients actifs',
      value: '544',
      change: '+8%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'ARPU (Average Revenue per User)',
      value: '382€',
      change: '+12%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'Churn Rate',
      value: '1,3%',
      change: '-0,2%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'CAC (Customer Acquisition Cost)',
      value: '245€',
      change: '-8%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'LTV (Customer Lifetime Value)',
      value: '4,2k€',
      change: '+18%',
      trend: 'up',
      period: 'vs mois précédent'
    },
    {
      label: 'Burn Rate',
      value: '45k€',
      change: '+5%',
      trend: 'down',
      period: 'vs mois précédent'
    }
  ];

  const channelData = [
    { name: 'Organique', value: 45, color: '#3B82F6' },
    { name: 'Payant', value: 28, color: '#10B981' },
    { name: 'Référencement', value: 18, color: '#F59E0B' },
    { name: 'Direct', value: 9, color: '#EF4444' }
  ];

  const timeRanges = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '12m', label: '12 mois' }
  ];

  const handleExport = () => {
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Rapport exporté avec succès',
      timestamp: new Date().toISOString()
    });
  };

  const renderKPICard = (kpi, index) => (
    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {kpi.label}
        </h3>
        {kpi.trend === 'up' ? (
          <ArrowUpRight className="text-green-500" size={20} />
        ) : (
          <ArrowDownRight className="text-red-500" size={20} />
        )}
      </div>
      <div className="flex items-baseline space-x-2 mb-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {kpi.value}
        </span>
        <span className={`text-sm font-medium ${
          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {kpi.change}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {kpi.period}
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-xl">
              <BarChart3 className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Métriques
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Suivez les performances et la croissance de votre startup
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            <button className="btn-secondary flex items-center space-x-2">
              <RefreshCw size={18} />
              <span>Actualiser</span>
            </button>
            <button
              onClick={handleExport}
              className="btn-primary flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi, index) => renderKPICard(kpi, index))}
      </div>

      {/* Graphiques principaux */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenus */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Évolution du chiffre d'affaires
            </h2>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="recurring" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Acquisition de clients
            </h2>
            <Users className="text-blue-500" size={20} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="acquired" fill="#10B981" />
                <Bar dataKey="churned" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funnel de conversion */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Funnel de conversion
            </h2>
            <Target className="text-orange-500" size={20} />
          </div>
          <div className="space-y-3">
            {conversionFunnelData.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.stage}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition des canaux */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Canaux d'acquisition
            </h2>
            <Eye className="text-purple-500" size={20} />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertes et insights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Insights & Alertes
            </h2>
            <AlertCircle className="text-yellow-500" size={20} />
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Croissance accélérée
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +23% de croissance ce mois
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="text-yellow-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Churn en augmentation
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Surveiller la rétention
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="text-blue-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Objectif mensuel
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  78% de l'objectif atteint
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}