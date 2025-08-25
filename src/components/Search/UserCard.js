import React from 'react';
import { 
  MapPin, 
  Building, 
  Star, 
  Mail, 
  ExternalLink, 
  User,
  Badge,
  Clock,
  Users,
  Eye
} from 'lucide-react';

const UserCard = ({ user, onClick, compact = false }) => {
  const {
    id,
    fullName,
    first_name,
    last_name,
    displayEmail,
    company,
    position,
    bio,
    avatar_url,
    skills = [],
    languages = [],
    availability,
    website,
    linkedin,
    twitter,
    hasCompany,
    hasPosition,
    hasBio,
    skillsCount,
    languagesCount,
    isAvailable,
    has_avatar
  } = user;

  const displayName = fullName || `${first_name || ''} ${last_name || ''}`.trim();
  const displaySkills = skills.slice(0, compact ? 2 : 3);
  const remainingSkills = Math.max(0, skills.length - displaySkills.length);

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'unavailable':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityText = (availability) => {
    switch (availability) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Occupé';
      case 'unavailable':
        return 'Indisponible';
      default:
        return 'Non spécifié';
    }
  };

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
            {has_avatar && avatar_url ? (
              <img
                src={avatar_url}
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
            
            {availability && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                isAvailable ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
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
              {hasCompany && hasPosition ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {position} chez {company}
                </p>
              ) : hasCompany ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {company}
                </p>
              ) : hasPosition ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {position}
                </p>
              ) : null}
              
              {availability && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(availability)}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {getAvailabilityText(availability)}
                </span>
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
          {has_avatar && avatar_url ? (
            <img
              src={avatar_url}
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
          
          {availability && (
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${
              isAvailable ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
          )}
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {displayName}
          </h3>
          
          {hasCompany && hasPosition ? (
            <p className="text-gray-600 dark:text-gray-400 mb-2 flex items-center">
              <Building className="w-4 h-4 mr-1" />
              {position} chez {company}
            </p>
          ) : hasCompany ? (
            <p className="text-gray-600 dark:text-gray-400 mb-2 flex items-center">
              <Building className="w-4 h-4 mr-1" />
              {company}
            </p>
          ) : hasPosition ? (
            <p className="text-gray-600 dark:text-gray-400 mb-2 flex items-center">
              <User className="w-4 h-4 mr-1" />
              {position}
            </p>
          ) : null}

          {availability && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(availability)}`}>
              <Clock className="w-3 h-3 mr-1" />
              {getAvailabilityText(availability)}
            </span>
          )}
        </div>

        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      {/* Bio */}
      {hasBio && (
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

      {/* Langues */}
      {languages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Langues
          </h4>
          <div className="flex flex-wrap gap-2">
            {languages.slice(0, 3).map((language, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
              >
                {language}
              </span>
            ))}
            {languages.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{languages.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer avec actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {skillsCount > 0 && (
            <span className="flex items-center">
              <Badge className="w-4 h-4 mr-1" />
              {skillsCount} compétences
            </span>
          )}
          {languagesCount > 0 && (
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {languagesCount} langues
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          {displayEmail && (
            <a
              href={`mailto:${displayEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors">
            Voir profil
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;