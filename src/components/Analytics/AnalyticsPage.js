import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  Download,
  Filter,
  Eye,
  Heart,
  Star,
  Target,
  DollarSign
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function AnalyticsPage() {
  const { user, users, opportunities, messages, USER_TYPES } = useSecureApp();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Données de démonstration pour les graphiques
  const activityData = [
    { date: '01/02', connexions: 12, messages: 8, vues: 24 },
    { date: '02/02', connexions: 19, messages: 12, vues: 31 },
    { date: '03/02', connexions: 15, messages: 6, vues: 18 },
    { date: '04/02', connexions: 25, messages: 15, vues: 42 },
    { date: '05/02', connexions: 22, messages: 11, vues: 35 },
    { date: '06/02', connexions: 18, messages: 9, vues: 28 },
    { date: '07/02', connexions: 30, messages: 18, vues: 48 }
  ];

  const userTypeData = [
    { name: 'PME/Startup', value: 35, color: '#3b82f6' },
    { name: 'Expert/Consultant', value: 25, color: '#10b981' },
    { name: 'Investisseur', value: 15, color: '#ef4444' },
    { name: 'Incubateur', value: 12, color: '#8b5cf6' },
    { name: 'Autres', value: 13, color: '#f59e0b' }
  ];

  const opportunityData = [
    { type: 'Financement', count: 45, budget: 2500000 },
    { type: 'Consulting', count: 32, budget: 890000 },
    { type: 'Recrutement', count: 28, budget: 1200000 },
    { type: 'Partenariat', count: 18, budget: 650000 },
    { type: 'Formation', count: 12, budget: 340000 }
  ];

  const monthlyGrowthData = [
    { month: 'Jan', users: 820, opportunities: 45, messages: 1200 },
    { month: 'Fév', users: 932, opportunities: 52, messages: 1450 },
    { month: 'Mar', users: 1045, opportunities: 61, messages: 1680 },
    { month: 'Avr', users: 1198, opportunities: 73, messages: 1920 },
    { month: 'Mai', users: 1321, opportunities: 85, messages: 2150 },
    { month: 'Jun', users: 1456, opportunities: 92, messages: 2380 }
  ];

  const getKPIs = () => {
    const totalUsers = users.length;
    const totalOpportunities = opportunities.length;
    const totalMessages = messages.length;
    const avgRating = users.reduce((acc, user) => acc + (user.stats?.rating || 0), 0) / totalUsers;

    return [
      {
        title: 'Utilisateurs actifs',
        value: totalUsers.toLocaleString(),
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Opportunités publiées',
        value: totalOpportunities.toLocaleString(),
        change: '+8.3%',
        trend: 'up',
        icon: Briefcase,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Messages échangés',
        value: totalMessages.toLocaleString(),
        change: '+15.7%',
        trend: 'up',
        icon: MessageSquare,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Note moyenne',
        value: avgRating.toFixed(1),
        change: '+0.2',
        trend: 'up',
        icon: Star,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      }
    ];
  };

  const kpis = getKPIs();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analytics & Reporting
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tableau de bord analytique de votre activité PME2GO
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">1 an</option>
          </select>
          
          <button className="btn-outline flex items-center space-x-2">
            <Download size={18} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.bgColor} ${kpi.color} p-3 rounded-xl`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                kpi.trend === 'up' ? 'text-success-600' : 'text-danger-600'
              }`}>
                <TrendingUp size={16} />
                <span>{kpi.change}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {kpi.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {kpi.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation des métriques */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { key: 'overview', label: 'Vue d\'ensemble' },
          { key: 'users', label: 'Utilisateurs' },
          { key: 'opportunities', label: 'Opportunités' },
          { key: 'engagement', label: 'Engagement' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedMetric(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedMetric === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu selon la métrique sélectionnée */}
      {selectedMetric === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité quotidienne */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Activité quotidienne
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="connexions" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="vues" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition des types d'utilisateurs */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Répartition des profils
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {userTypeData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name} ({entry.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Croissance mensuelle */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Croissance mensuelle
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="opportunities" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedMetric === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nouveaux utilisateurs */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nouveaux utilisateurs
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Profils les plus actifs */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Profils les plus actifs
            </h3>
            <div className="space-y-4">
              {users.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.stats?.connections || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      connexions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'opportunities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunités par type */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Opportunités par type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={opportunityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="type" type="category" className="text-xs" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget par type */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Budget total par type
            </h3>
            <div className="space-y-4">
              {opportunityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-purple-500' :
                      index === 2 ? 'bg-blue-500' :
                      index === 3 ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {(item.budget / 1000000).toFixed(1)}M€
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count} opportunités
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métriques d'engagement */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Taux d'engagement
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Messages quotidiens</span>
                  <span className="text-sm font-medium">87%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profils consultés</span>
                  <span className="text-sm font-medium">72%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Candidatures</span>
                  <span className="text-sm font-medium">64%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '64%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Actions populaires
            </h3>
            <div className="space-y-3">
              {[
                { action: 'Consultation de profils', count: 1247, icon: Eye },
                { action: 'Messages envoyés', count: 892, icon: MessageSquare },
                { action: 'Favoris ajoutés', count: 634, icon: Heart },
                { action: 'Candidatures', count: 421, icon: Target },
                { action: 'Recherches', count: 356, icon: Filter }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <item.icon size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {item.action}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Satisfaction */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Satisfaction utilisateur
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Taux de satisfaction</p>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center space-x-2">
                    <span className="text-sm w-8">{stars}★</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stars === 5 ? 68 : stars === 4 ? 22 : stars === 3 ? 7 : stars === 2 ? 2 : 1}%` 
                        }} 
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {stars === 5 ? '68%' : stars === 4 ? '22%' : stars === 3 ? '7%' : stars === 2 ? '2%' : '1%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}