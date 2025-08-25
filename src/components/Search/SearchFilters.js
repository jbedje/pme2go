import React from 'react';
import { X, MapPin, Building, Star, Users, Globe } from 'lucide-react';

const SearchFilters = ({ availableFilters, activeFilters, onFilterChange, onClearFilters }) => {
  const {
    companies = [],
    positions = [],
    availability = [],
    skills = [],
    languages = []
  } = availableFilters;

  const {
    skills: selectedSkills = [],
    languages: selectedLanguages = [],
    company: selectedCompany = '',
    position: selectedPosition = '',
    availability: selectedAvailability = '',
    location: selectedLocation = ''
  } = activeFilters;

  const handleSkillToggle = (skill) => {
    onFilterChange('skills', skill);
  };

  const handleLanguageToggle = (language) => {
    onFilterChange('languages', language);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    count += selectedSkills.length;
    count += selectedLanguages.length;
    count += selectedCompany ? 1 : 0;
    count += selectedPosition ? 1 : 0;
    count += selectedAvailability ? 1 : 0;
    count += selectedLocation ? 1 : 0;
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filtres de recherche
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {getActiveFiltersCount()} filtres actifs
          </span>
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Tout effacer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Entreprise
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => onFilterChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les entreprises</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Poste */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Poste
          </label>
          <select
            value={selectedPosition}
            onChange={(e) => onFilterChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les postes</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Localisation
          </label>
          <input
            type="text"
            value={selectedLocation}
            onChange={(e) => onFilterChange('location', e.target.value)}
            placeholder="Ville, région, pays..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Disponibilité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Star className="w-4 h-4 inline mr-1" />
            Disponibilité
          </label>
          <select
            value={selectedAvailability}
            onChange={(e) => onFilterChange('availability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les disponibilités</option>
            <option value="available">Disponible</option>
            <option value="busy">Occupé</option>
            <option value="unavailable">Indisponible</option>
          </select>
        </div>
      </div>

      {/* Compétences */}
      {skills.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Compétences ({selectedSkills.length} sélectionnées)
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {skills.slice(0, 20).map((skill) => (
                <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {skill}
                  </span>
                </label>
              ))}
            </div>
            {skills.length > 20 && (
              <p className="text-xs text-gray-500 mt-2">
                Affichage des 20 premières compétences. Utilisez la recherche pour affiner.
              </p>
            )}
          </div>
          
          {/* Compétences sélectionnées */}
          {selectedSkills.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => handleSkillToggle(skill)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Langues */}
      {languages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Globe className="w-4 h-4 inline mr-1" />
            Langues ({selectedLanguages.length} sélectionnées)
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {languages.map((language) => (
                <label key={language} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {language}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Langues sélectionnées */}
          {selectedLanguages.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full"
                  >
                    {language}
                    <button
                      onClick={() => handleLanguageToggle(language)}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;