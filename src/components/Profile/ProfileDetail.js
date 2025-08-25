import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Globe,
  Linkedin,
  Mail,
  MessageSquare,
  Heart,
  Share2,
  Award,
  Users,
  Calendar,
  ExternalLink,
  Download,
  Shield,
  TrendingUp,
  Building,
  DollarSign
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function ProfileDetail() {
  const { 
    selectedProfile, 
    setView, 
    favoriteProfiles, 
    toggleFavorite,
    setChatActiveContact,
    getMatchingScore,
    user
  } = useSecureApp();

  const [activeTab, setActiveTab] = useState('overview');

  if (!selectedProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Aucun profil sélectionné</p>
        <button 
          onClick={() => setView('search')}
          className="btn-primary mt-4"
        >
          Retour à la recherche
        </button>
      </div>
    );
  }

  const profile = selectedProfile;
  const isFavorite = favoriteProfiles.includes(profile.id);
  const matchingScore = user ? getMatchingScore(user, profile) : 0;

  const handleSendMessage = () => {
    setChatActiveContact(profile);
    setView('messages');
  };

  const getBadgeColor = (type) => {
    const colors = {
      'PME/Startup': 'bg-blue-100 text-blue-800',
      'Expert/Consultant': 'bg-green-100 text-green-800',
      'Mentor': 'bg-yellow-100 text-yellow-800',
      'Incubateur': 'bg-purple-100 text-purple-800',
      'Investisseur': 'bg-red-100 text-red-800',
      'Institution Financière': 'bg-cyan-100 text-cyan-800',
      'Organisme Public': 'bg-gray-100 text-gray-800',
      'Partenaire Tech': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Users },
    { id: 'experience', label: 'Expérience', icon: Award },
    { id: 'portfolio', label: 'Portfolio', icon: Building },
    { id: 'reviews', label: 'Avis', icon: Star }
  ];

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setView('search')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Profil détaillé
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Informations complètes du profil
          </p>
        </div>
      </div>

      {/* Carte principale du profil */}
      <div className="card p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Avatar et infos principales */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-6 lg:mb-0">
            <div className="relative mb-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success-500 rounded-full border-4 border-white flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {profile.name}
            </h2>
            
            <span className={`badge ${getBadgeColor(profile.type)} mb-3`}>
              {profile.type}
            </span>

            {/* Score de matching */}
            {matchingScore > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="text-primary-600" size={16} />
                <span className="text-sm font-medium text-primary-600">
                  {matchingScore}% de compatibilité
                </span>
              </div>
            )}

            {/* Actions principales */}
            <div className="flex space-x-3">
              <button
                onClick={handleSendMessage}
                className="btn-primary flex items-center space-x-2"
              >
                <MessageSquare size={18} />
                <span>Contacter</span>
              </button>
              
              <button
                onClick={() => toggleFavorite(profile.id)}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorite 
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
              </button>
              
              <button className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="flex-1 space-y-6">
            {/* Localisation et contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.location && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={18} />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.email && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Mail size={18} />
                  <span>{profile.email}</span>
                </div>
              )}
              
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Globe size={18} />
                  <span>Site web</span>
                  <ExternalLink size={14} />
                </a>
              )}
              
              {profile.linkedin && (
                <a 
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Linkedin size={18} />
                  <span>LinkedIn</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.description}
              </p>
            </div>

            {/* Tags/Intérêts */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Domaines d'intérêt</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.stats?.connections || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connexions</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.stats?.projects || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Projets</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.stats?.rating || 0}
                  </span>
                  <Star size={16} className="text-yellow-500 fill-current" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Note</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.stats?.reviews || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de contenu */}
      <div className="card">
        {/* Navigation des onglets */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Informations spécifiques au type */}
              {profile.type === 'PME/Startup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Informations entreprise</h4>
                    <div className="space-y-2 text-sm">
                      {profile.stage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Stade:</span>
                          <span className="font-medium">{profile.stage}</span>
                        </div>
                      )}
                      {profile.funding && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Financement:</span>
                          <span className="font-medium">{profile.funding}</span>
                        </div>
                      )}
                      {profile.employees && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Employés:</span>
                          <span className="font-medium">{profile.employees}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {profile.achievements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Réalisations</h4>
                      <ul className="space-y-1 text-sm">
                        {profile.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Award size={14} className="text-yellow-500" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {profile.type === 'Expert/Consultant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Expertise</h4>
                    <div className="space-y-2 text-sm">
                      {profile.experience && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expérience:</span>
                          <span className="font-medium">{profile.experience}</span>
                        </div>
                      )}
                      {profile.rates && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tarifs:</span>
                          <span className="font-medium">{profile.rates}</span>
                        </div>
                      )}
                      {profile.availability && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Disponibilité:</span>
                          <span className="font-medium text-success-600">{profile.availability}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {profile.expertise && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Domaines d'expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.expertise.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {profile.documents && profile.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <span className="text-sm font-medium">{doc}</span>
                        <button className="text-primary-600 hover:text-primary-700">
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Section expérience en cours de développement</p>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building size={48} className="mx-auto mb-4 opacity-50" />
              <p>Section portfolio en cours de développement</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Star size={48} className="mx-auto mb-4 opacity-50" />
              <p>Section avis en cours de développement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}