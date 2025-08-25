import React from 'react';
import { Star, MapPin, Calendar, ExternalLink, Heart, Share2 } from 'lucide-react';

export function UserCard({ user, onClick, showActions = true, compact = false }) {
  const handleCardClick = () => {
    if (onClick) onClick(user);
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

  if (compact) {
    return (
      <div 
        className="card-interactive cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            {user.verified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
                <Star size={8} className="text-white fill-current" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {user.type}
            </p>
            {user.location && (
              <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
                <MapPin size={12} className="mr-1" />
                {user.location}
              </p>
            )}
          </div>
          
          {user.stats?.rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.stats.rating}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-interactive" onClick={handleCardClick}>
      {/* Header with avatar and basic info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          {user.verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
              <Star size={12} className="text-white fill-current" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                {user.name}
              </h3>
              <span className={`badge ${getBadgeColor(user.type)} mb-2`}>
                {user.type}
              </span>
            </div>
            
            {showActions && (
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Heart size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          {user.location && (
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-2">
              <MapPin size={14} className="mr-1" />
              {user.location}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
        {user.description}
      </p>

      {/* Tags/Interests */}
      {user.interests && user.interests.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {user.interests.slice(0, 3).map((interest, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
            >
              {interest}
            </span>
          ))}
          {user.interests.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
              +{user.interests.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Star size={14} className="text-yellow-500 fill-current" />
            <span>{user.stats?.rating || 0}</span>
            <span>({user.stats?.reviews || 0})</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>{user.stats?.connections || 0} connexions</span>
          </div>
        </div>
        
        {user.createdAt && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
            <Calendar size={12} />
            <span>Rejoint {new Date(user.createdAt).getFullYear()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function OpportunityCard({ opportunity, onClick, showActions = true }) {
  const handleCardClick = () => {
    if (onClick) onClick(opportunity);
  };

  const getTypeColor = (type) => {
    const colors = {
      'Financement': 'bg-green-100 text-green-800',
      'Recrutement': 'bg-blue-100 text-blue-800',
      'Consulting': 'bg-purple-100 text-purple-800',
      'Partenariat': 'bg-yellow-100 text-yellow-800',
      'Autre': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ouvert': 'bg-success-100 text-success-800',
      'En cours': 'bg-warning-100 text-warning-800',
      'Fermé': 'bg-gray-100 text-gray-800',
      'Annulé': 'bg-danger-100 text-danger-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card-interactive" onClick={handleCardClick}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`badge ${getTypeColor(opportunity.type)}`}>
              {opportunity.type}
            </span>
            <span className={`badge ${getStatusColor(opportunity.status)}`}>
              {opportunity.status}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
            {opportunity.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {opportunity.company}
          </p>
        </div>
        
        {showActions && (
          <div className="flex space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <ExternalLink size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
        {opportunity.description}
      </p>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {opportunity.budget && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Budget:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{opportunity.budget}</span>
          </div>
        )}
        
        {opportunity.duration && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Durée:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{opportunity.duration}</span>
          </div>
        )}
        
        {opportunity.location && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Lieu:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{opportunity.location}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {opportunity.tags && opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {opportunity.tags.slice(0, 4).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{opportunity.applicants || 0} candidatures</span>
          {opportunity.deadline && (
            <span className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>Échéance: {new Date(opportunity.deadline).toLocaleDateString('fr-FR')}</span>
            </span>
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(opportunity.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </div>
  );
}

export function EventCard({ event, onClick }) {
  const handleCardClick = () => {
    if (onClick) onClick(event);
  };

  const getTypeColor = (type) => {
    const colors = {
      'Networking': 'bg-blue-100 text-blue-800',
      'Formation': 'bg-green-100 text-green-800',
      'Conférence': 'bg-purple-100 text-purple-800',
      'Workshop': 'bg-yellow-100 text-yellow-800',
      'Pitch': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card-interactive" onClick={handleCardClick}>
      <div className="flex items-start space-x-4">
        {/* Date */}
        <div className="bg-primary-100 dark:bg-primary-900 rounded-lg p-3 text-center min-w-16">
          <div className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">
            {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
          </div>
          <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {new Date(event.date).getDate()}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`badge ${getTypeColor(event.type)}`}>
              {event.type}
            </span>
            {event.price === 'Gratuit' ? (
              <span className="badge-success">Gratuit</span>
            ) : (
              <span className="badge-warning">{event.price}</span>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {event.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {event.organizer}
          </p>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <MapPin size={12} />
                <span>{event.location}</span>
              </span>
              <span>{event.attendees} participants</span>
            </div>
            
            <span className="text-xs">
              {new Date(event.date).toLocaleDateString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default { UserCard, OpportunityCard, EventCard };