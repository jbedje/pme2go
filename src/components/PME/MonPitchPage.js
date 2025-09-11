import React, { useState } from 'react';
import { 
  FileText, 
  Play, 
  Edit3, 
  Share2, 
  Download,
  Eye,
  Clock,
  Target,
  Users,
  Star,
  Video,
  Image,
  Plus,
  Save,
  Upload
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function MonPitchPage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  // État du pitch (données de démonstration)
  const [pitchData, setPitchData] = useState({
    title: 'TechStart Solutions - Plateforme SaaS B2B',
    tagline: 'La solution digitale qui transforme la gestion de vos projets',
    description: `TechStart Solutions développe une plateforme SaaS innovante qui révolutionne la gestion de projets pour les PME. 

Notre solution combine intelligence artificielle, automatisation et interface intuitive pour permettre aux équipes de gagner jusqu'à 40% de productivité.

Avec plus de 500 clients déjà conquis et un ARR de 2,5M€, nous recherchons 1,5M€ pour accélérer notre expansion européenne.`,
    problem: 'Les PME perdent en moyenne 25% de leur temps sur des tâches administratives répétitives et la gestion de projets complexes.',
    solution: 'Une plateforme SaaS tout-en-un avec IA intégrée qui automatise 80% des tâches administratives et optimise la collaboration.',
    market: 'Marché européen du SaaS B2B évalué à 45Md€ avec une croissance de 15% par an.',
    businessModel: 'Modèle SaaS récurrent - Abonnements mensuels de 49€ à 199€ par utilisateur selon les fonctionnalités.',
    traction: '500 clients actifs, ARR de 2,5M€, croissance de 25% mois sur mois, NPS de 72.',
    team: 'Équipe de 12 personnes dirigée par 2 co-fondateurs avec 15 ans d\'expérience dans le SaaS.',
    financials: 'Objectif 10M€ ARR d\'ici 2026, recherche 1,5M€ pour expansion européenne.',
    competition: 'Avantage concurrentiel: IA propriétaire, intégration native, prix 30% inférieur aux concurrents.',
    lastUpdated: '2025-01-20'
  });

  const [metrics, setMetrics] = useState({
    views: 247,
    shares: 18,
    downloads: 42,
    avgViewTime: '3m 24s',
    conversionRate: '12%',
    lastViewed: '2025-02-05'
  });

  // Modèles de pitch
  const pitchTemplates = [
    {
      id: 1,
      name: 'Pitch Investisseur - Classique',
      description: 'Structure en 10 slides pour lever des fonds',
      slides: 10,
      duration: '8-12 min'
    },
    {
      id: 2,
      name: 'Pitch Commercial - Court',
      description: 'Présentation commerciale efficace',
      slides: 6,
      duration: '3-5 min'
    },
    {
      id: 3,
      name: 'Pitch Concours - Complet',
      description: 'Format concours startup avec démo',
      slides: 12,
      duration: '15-20 min'
    }
  ];

  const handleSave = () => {
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Pitch sauvegardé avec succès',
      timestamp: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleShare = () => {
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Lien de partage copié dans le presse-papier',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-xl">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Mon Pitch
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Créez et gérez votre pitch deck professionnel
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleShare}
              className="btn-secondary flex items-center space-x-2"
            >
              <Share2 size={18} />
              <span>Partager</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Download size={18} />
              <span>Exporter</span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit3 size={18} />
              <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
            </button>
          </div>
        </div>

        {/* Métriques du pitch */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Eye className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vues</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{metrics.views}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Share2 className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Partages</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{metrics.shares}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Download className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Téléchargements</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{metrics.downloads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Clock className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Temps moyen</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{metrics.avgViewTime}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Target className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{metrics.conversionRate}</p>
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
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Éditeur
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Modèles
            </button>
            <button
              onClick={() => setActiveTab('presentation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'presentation'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mode présentation
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Pitch principal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {pitchData.title}
                </h2>
                <p className="text-lg text-primary-600 mb-3">{pitchData.tagline}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dernière modification: {new Date(pitchData.lastUpdated).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="btn-secondary flex items-center space-x-2">
                  <Play size={18} />
                  <span>Prévisualiser</span>
                </button>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {pitchData.description}
              </div>
            </div>
          </div>

          {/* Sections détaillées */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Problème</h3>
              <p className="text-gray-700 dark:text-gray-300">{pitchData.problem}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Solution</h3>
              <p className="text-gray-700 dark:text-gray-300">{pitchData.solution}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Marché</h3>
              <p className="text-gray-700 dark:text-gray-300">{pitchData.market}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Traction</h3>
              <p className="text-gray-700 dark:text-gray-300">{pitchData.traction}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Édition du pitch
              </h2>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={18} />
                  <span>Sauvegarder</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du projet
                </label>
                <input
                  type="text"
                  value={pitchData.title}
                  onChange={(e) => setPitchData({...pitchData, title: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={pitchData.tagline}
                  onChange={(e) => setPitchData({...pitchData, tagline: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Présentation générale
                </label>
                <textarea
                  rows={6}
                  value={pitchData.description}
                  onChange={(e) => setPitchData({...pitchData, description: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Problème
                  </label>
                  <textarea
                    rows={3}
                    value={pitchData.problem}
                    onChange={(e) => setPitchData({...pitchData, problem: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Solution
                  </label>
                  <textarea
                    rows={3}
                    value={pitchData.solution}
                    onChange={(e) => setPitchData({...pitchData, solution: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid md:grid-cols-3 gap-6">
          {pitchTemplates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {template.name}
                </h3>
                <Star className="text-yellow-500" size={20} />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{template.slides} slides</span>
                <span>{template.duration}</span>
              </div>
              <button className="w-full btn-primary">
                Utiliser ce modèle
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'presentation' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded-xl inline-block mb-6">
              <Video className="text-primary-600 dark:text-primary-400" size={48} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Mode Présentation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Lancez votre présentation en mode plein écran pour impressionner votre audience.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="btn-primary flex items-center space-x-2">
                <Play size={18} />
                <span>Démarrer la présentation</span>
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <Eye size={18} />
                <span>Mode aperçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}