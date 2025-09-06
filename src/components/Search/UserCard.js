import React from 'react';
import { 
  MapPin, 
  Building, 
  User,
  ExternalLink,
  Eye,
  Badge
} from 'lucide-react';

const UserCard = ({ user, onClick, compact = false }) => {
  const {
    id,
    name,
    type,
    industry,
    location,
    description,
    avatar,
    verified,
    stats,
    profile_data
  } = user;

  const displayName = name || 'Nom non disponible';
  const skills = profile_data?.skills || [];
  const displaySkills = skills.slice(0, compact ? 2 : 3);
  const remainingSkills = Math.max(0, skills.length - displaySkills.length);
  const bio = description;

  const handleCardClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 bg-green-400"></div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </h3>
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-1">
              {type && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {type}
                </p>
              )}
              
              {industry && (
                <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                  {industry}
                </p>
              )}
              
              {location && (
                <p className="text-sm text-gray-500 dark:text-gray-500 truncate flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                </p>
              )}
            </div>
          </div>

          {/* Compétences (compact) */}
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displaySkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {remainingSkills > 0 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{remainingSkills}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer"
    >
      {/* En-tête de la carte */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-green-400">
              <Badge className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {displayName}
          </h3>
          
          {type && (
            <p className="text-gray-600 dark:text-gray-400 mb-2 flex items-center">
              <User className="w-4 h-4 mr-1" />
              {type}
            </p>
          )}
          
          {industry && (
            <p className="text-blue-600 dark:text-blue-400 mb-2 flex items-center">
              <Building className="w-4 h-4 mr-1" />
              {industry}
            </p>
          )}
          
          {location && (
            <p className="text-gray-500 dark:text-gray-500 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </p>
          )}
        </div>

        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {bio}
        </p>
      )}

      {/* Compétences */}
      {displaySkills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Compétences
          </h4>
          <div className="flex flex-wrap gap-2">
            {displaySkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                {skill}
              </span>
            ))}
            {remainingSkills > 0 && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-full">
                +{remainingSkills} autres
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats du profil */}
      {stats && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-4">
            {stats.connections && (
              <span>{stats.connections} connexions</span>
            )}
            {stats.rating && (
              <span>⭐ {stats.rating}/5</span>
            )}
          </div>
          <span className="text-xs">Voir profil</span>
        </div>
      )}
    </div>
  );
};

export default UserCard;