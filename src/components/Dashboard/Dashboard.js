import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Star,
  Calendar,
  Target,
  DollarSign,
  Award,
  ArrowUp,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { UserCard, OpportunityCard, EventCard } from '../UI/Card';

export default function Dashboard() {
  const { 
    user, 
    users, 
    opportunities, 
    events, 
    getRecommendedUsers, 
    setView, 
    setSelectedProfile,
    USER_TYPES 
  } = useSecureApp();

  const recommendedUsers = getRecommendedUsers();
  const recentOpportunities = opportunities.slice(0, 3);
  const upcomingEvents = events.slice(0, 2);

  const getPersonalizedStats = () => {
    if (!user) return [];

    const baseStats = [
      {
        title: 'Connexions',
        value: user.stats?.connections || 0,
        change: '+12%',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Messages',
        value: 24,
        change: '+5%',
        icon: MessageSquare,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Note moyenne',
        value: user.stats?.rating || 0,
        change: '+0.2',
        icon: Star,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      }
    ];

    // Stats spécifiques par type d'utilisateur
    if (user.type === USER_TYPES.PME) {
      baseStats.push({
        title: 'Opportunités',
        value: 8,
        change: '+3',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      });
    } else if (user.type === USER_TYPES.INVESTOR) {
      baseStats.push({
        title: 'Deal Pipeline',
        value: 12,
        change: '+4',
        icon: Briefcase,
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      });
    } else if (user.type === USER_TYPES.EXPERT) {
      baseStats.push({
        title: 'Projets actifs',
        value: 6,
        change: '+2',
        icon: Award,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      });
    }

    return baseStats;
  };

  const personalizedStats = getPersonalizedStats();

  const getWelcomeMessage = () => {
    const timeOfDay = new Date().getHours();
    let greeting = 'Bonjour';
    
    if (timeOfDay >= 18) greeting = 'Bonsoir';
    else if (timeOfDay >= 12) greeting = 'Bon après-midi';

    return `${greeting}, ${user?.name || 'Utilisateur'} !`;
  };

  const getPersonalizedRecommendations = () => {
    if (!user) return [];

    const recommendations = [];

    if (user.type === USER_TYPES.PME) {
      recommendations.push(
        {
          title: 'Complétez votre pitch deck',
          description: 'Augmentez vos chances de financement en finalisant votre présentation.',
          action: 'Compléter',
          color: 'bg-blue-50 border-blue-200',
          icon: Briefcase
        },
        {
          title: 'Connectez-vous avec des investisseurs',
          description: '5 nouveaux investisseurs correspondent à votre profil.',
          action: 'Voir les profils',
          color: 'bg-green-50 border-green-200',
          icon: Users
        }
      );
    } else if (user.type === USER_TYPES.INVESTOR) {
      recommendations.push(
        {
          title: 'Nouvelles opportunités d\'investissement',
          description: '3 startups prometteuses recherchent un financement.',
          action: 'Explorer',
          color: 'bg-purple-50 border-purple-200',
          icon: Target
        }
      );
    }

    return recommendations;
  };

  const recommendations = getPersonalizedRecommendations();

  return (
    <div className="space-y-8">
      {/* Header de bienvenue */}
      <div className="gradient-bg rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getWelcomeMessage()}</h1>
            <p className="text-primary-100 text-lg">
              Voici un aperçu de votre activité sur PME2GO
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-primary-100 text-sm">En ligne</span>
              </div>
              {user?.verified && (
                <div className="flex items-center space-x-2">
                  <Star className="text-yellow-400" size={16} />
                  <span className="text-primary-100 text-sm">Profil vérifié</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            <img 
              src={user?.avatar} 
              alt={user?.name}
              className="w-20 h-20 rounded-full border-4 border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Statistiques personnalisées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personalizedStats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stat.value}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <ArrowUp className="text-success-600" size={16} />
                  <span className="text-success-600 text-sm font-medium">{stat.change}</span>
                  <span className="text-gray-500 text-sm">ce mois</span>
                </div>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommandations personnalisées */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recommandations pour vous
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`border-2 ${rec.color} rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <rec.icon size={24} className="text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{rec.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{rec.description}</p>
                    <button className="btn-primary text-sm px-4 py-2">
                      {rec.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profils recommandés */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Profils recommandés
          </h2>
          <button
            onClick={() => setView('search')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>Voir tous</span>
            <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedUsers.map((recommendedUser) => (
            <UserCard
              key={recommendedUser.id}
              user={recommendedUser}
              onClick={(user) => {
                setSelectedProfile(user);
                setView('profile-detail');
              }}
              compact={false}
            />
          ))}
        </div>
      </div>

      {/* Opportunités récentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Opportunités récentes
          </h2>
          <button
            onClick={() => setView('opportunities')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>Voir toutes</span>
            <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recentOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onClick={() => setView('opportunities')}
            />
          ))}
        </div>
      </div>

      {/* Événements à venir */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Événements à venir
          </h2>
          <button
            onClick={() => setView('events')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>Voir tous</span>
            <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setView('events')}
            />
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setView('opportunities')}
          className="card-interactive text-left p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Plus className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Publier une opportunité
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Partagez vos besoins avec la communauté
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setView('search')}
          className="card-interactive text-left p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Découvrir des profils
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Trouvez vos prochains partenaires
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setView('events')}
          className="card-interactive text-left p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Rejoindre un événement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Participez aux événements de l'écosystème
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}