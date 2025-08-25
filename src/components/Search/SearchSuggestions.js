import React from 'react';
import { Search, TrendingUp, User, Building } from 'lucide-react';

const SearchSuggestions = ({ suggestions, onSelect, onClose }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = (suggestion) => {
    onSelect(suggestion);
  };

  const getSuggestionIcon = (suggestion) => {
    // Simple heuristic to determine icon based on suggestion content
    if (suggestion.includes('@') || suggestion.toLowerCase().includes('email')) {
      return <User className="w-4 h-4 text-blue-500" />;
    }
    if (suggestion.toLowerCase().includes('inc') || 
        suggestion.toLowerCase().includes('ltd') || 
        suggestion.toLowerCase().includes('corp') ||
        suggestion.toLowerCase().includes('company')) {
      return <Building className="w-4 h-4 text-green-500" />;
    }
    return <Search className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
      <div className="p-2">
        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Suggestions
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
          >
            Fermer
          </button>
        </div>
        
        <div className="mt-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {getSuggestionIcon(suggestion)}
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                {suggestion}
              </span>
              <TrendingUp className="w-3 h-3 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer avec info */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Appuyez sur Entrée ou cliquez pour rechercher
        </p>
      </div>
    </div>
  );
};

export default SearchSuggestions;