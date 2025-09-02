import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Filter, 
  Search, 
  Plus,
  Star,
  ExternalLink,
  Heart,
  Share2,
  Video,
  X
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { EventCard } from '../UI/Card';
import { Modal } from '../UI/Modal';

export default function EventsPage() {
  const { events, user, addNotification, createEvent } = useSecureApp();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Workshop',
    eventDate: '',
    location: '',
    description: '',
    price: 'Gratuit',
    tags: ''
  });

  const eventTypes = ['Networking', 'Formation', 'Conférence', 'Workshop', 'Pitch', 'Webinar'];
  
  const filterOptions = [
    { key: 'all', label: 'Tous les événements' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'today', label: 'Aujourd\'hui' },
    { key: 'this-week', label: 'Cette semaine' },
    { key: 'free', label: 'Gratuits' },
    { key: 'online', label: 'En ligne' }
  ];

  const getFilteredEvents = () => {
    let filtered = events;

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrage par catégorie
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.date) > now);
        break;
      case 'today':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'this-week':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= weekFromNow;
        });
        break;
      case 'free':
        filtered = filtered.filter(event => event.price === 'Gratuit');
        break;
      case 'online':
        filtered = filtered.filter(event => event.location.toLowerCase().includes('ligne'));
        break;
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const filteredEvents = getFilteredEvents();

  const handleRegisterToEvent = (eventId) => {
    if (!registeredEvents.includes(eventId)) {
      setRegisteredEvents(prev => [...prev, eventId]);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Inscription à l\'événement confirmée !',
        timestamp: new Date().toISOString()
      });
    }
    setSelectedEvent(null);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    const eventData = {
      ...newEvent,
      tags: newEvent.tags.split(',').map(t => t.trim()).filter(Boolean),
      date: newEvent.eventDate
    };

    const success = await createEvent(eventData);
    if (success) {
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        type: 'Workshop',
        eventDate: '',
        location: '',
        description: '',
        price: 'Gratuit',
        tags: ''
      });
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      dayMonth: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'Networking': 'bg-blue-100 text-blue-800',
      'Formation': 'bg-green-100 text-green-800',
      'Conférence': 'bg-purple-100 text-purple-800',
      'Workshop': 'bg-yellow-100 text-yellow-800',
      'Pitch': 'bg-red-100 text-red-800',
      'Webinar': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Événements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez et participez aux événements de l'écosystème PME
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Créer un événement</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des événements..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-outline px-4 py-3 ${showFilters ? 'bg-primary-50 border-primary-300' : ''}`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filtres</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`p-3 text-sm rounded-lg transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {events.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Événements actifs
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {events.reduce((acc, event) => acc + (event.attendees || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Participants totaux
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Video className="text-purple-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {events.filter(e => e.location.toLowerCase().includes('ligne')).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Événements en ligne
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="text-yellow-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {registeredEvents.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mes inscriptions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucun événement trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || activeFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche.'
              : 'Aucun événement programmé pour le moment.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const eventDate = formatEventDate(event.date);
            const isRegistered = registeredEvents.includes(event.id);
            
            return (
              <div key={event.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Date */}
                    <div className="bg-primary-100 dark:bg-primary-900 rounded-lg p-3 text-center min-w-16">
                      <div className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">
                        {eventDate.dayMonth.split(' ')[1]}
                      </div>
                      <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                        {eventDate.dayMonth.split(' ')[0]}
                      </div>
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                          {event.price === 'Gratuit' ? (
                            <span className="badge-success">Gratuit</span>
                          ) : (
                            <span className="badge-warning">{event.price}</span>
                          )}
                          {isRegistered && (
                            <span className="badge-primary">Inscrit</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Heart size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Organisé par {event.organizer}
                      </p>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{eventDate.time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin size={12} />
                            <span>{event.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users size={12} />
                            <span>{event.attendees}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de création d'événement */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouvel événement"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre de l'événement
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Ex: Conférence Innovation & Startups"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type d'événement
              </label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="input-field"
                required
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date et heure
              </label>
              <input
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lieu
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="input-field"
                placeholder="Ex: Paris, France - Centre des Congrès"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prix
              </label>
              <input
                type="text"
                value={newEvent.price}
                onChange={(e) => setNewEvent(prev => ({ ...prev, price: e.target.value }))}
                className="input-field"
                placeholder="Ex: 50€, Gratuit"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="input-field resize-none"
              placeholder="Décrivez votre événement, le programme, les objectifs..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={newEvent.tags}
              onChange={(e) => setNewEvent(prev => ({ ...prev, tags: e.target.value }))}
              className="input-field"
              placeholder="Ex: Innovation, Startups, Networking, Tech"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer l'événement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de détail d'événement */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Détail de l'événement"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className={`badge ${getEventTypeColor(selectedEvent.type)}`}>
                  {selectedEvent.type}
                </span>
                {selectedEvent.price === 'Gratuit' ? (
                  <span className="badge-success">Gratuit</span>
                ) : (
                  <span className="badge-warning">{selectedEvent.price}</span>
                )}
                {registeredEvents.includes(selectedEvent.id) && (
                  <span className="badge-primary">Inscrit</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedEvent.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Organisé par {selectedEvent.organizer}
              </p>
            </div>

            {/* Informations clés */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Date et heure</div>
                <div className="font-medium">
                  {formatEventDate(selectedEvent.date).fullDate} à {formatEventDate(selectedEvent.date).time}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lieu</div>
                <div className="font-medium">{selectedEvent.location}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
                <div className="font-medium">{selectedEvent.attendees} inscrits</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Prix</div>
                <div className="font-medium">{selectedEvent.price}</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            {/* Tags */}
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button className="btn-outline flex items-center space-x-2">
                  <Heart size={18} />
                  <span>Sauvegarder</span>
                </button>
                <button className="btn-outline flex items-center space-x-2">
                  <Share2 size={18} />
                  <span>Partager</span>
                </button>
              </div>
              
              <button
                onClick={() => handleRegisterToEvent(selectedEvent.id)}
                disabled={registeredEvents.includes(selectedEvent.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  registeredEvents.includes(selectedEvent.id)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                <Calendar size={18} />
                <span>
                  {registeredEvents.includes(selectedEvent.id) 
                    ? 'Déjà inscrit' 
                    : 'S\'inscrire'
                  }
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}