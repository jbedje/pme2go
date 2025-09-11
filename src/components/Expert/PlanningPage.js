import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Video,
  MapPin,
  User,
  Users,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Bell,
  Repeat,
  FileText,
  Building2
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

const APPOINTMENT_TYPES = {
  MEETING: 'Réunion',
  CALL: 'Appel',
  WORKSHOP: 'Atelier',
  PRESENTATION: 'Présentation',
  CONSULTATION: 'Consultation',
  AUDIT: 'Audit'
};

const APPOINTMENT_STATUS = {
  SCHEDULED: 'Planifié',
  CONFIRMED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  RESCHEDULED: 'Reporté'
};

const MEETING_MODES = {
  IN_PERSON: 'Présentiel',
  VIDEO: 'Visioconférence',
  PHONE: 'Téléphone'
};

export default function PlanningPage() {
  const { user, addNotification } = useSecureApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month'); // month, week, day
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [appointments, setAppointments] = useState([]);

  // Initialize appointments data
  useEffect(() => {
    const initialAppointments = [
    {
      id: 1,
      title: 'Réunion stratégie digitale',
      client: 'TechStart Solutions',
      clientLogo: '🚀',
      type: APPOINTMENT_TYPES.MEETING,
      status: APPOINTMENT_STATUS.CONFIRMED,
      date: '2024-03-08',
      startTime: '09:00',
      endTime: '10:30',
      duration: 90,
      mode: MEETING_MODES.IN_PERSON,
      location: '15 rue de la Tech, Paris',
      participants: [
        { name: 'Sarah Chen', role: 'CEO', email: 'sarah@techstart.com' },
        { name: 'Marc Dubois', role: 'CTO', email: 'marc@techstart.com' }
      ],
      description: 'Définition de la stratégie de transformation digitale pour les 6 prochains mois.',
      notes: 'Préparer les slides sur les solutions Cloud et les outils de collaboration.',
      project: 'Transformation digitale PME',
      recurring: false,
      reminder: 30
    },
    {
      id: 2,
      title: 'Consultation financière',
      client: 'HealthTech Solutions',
      clientLogo: '🏥',
      type: APPOINTMENT_TYPES.CONSULTATION,
      status: APPOINTMENT_STATUS.SCHEDULED,
      date: '2024-03-08',
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      mode: MEETING_MODES.VIDEO,
      location: 'Zoom Meeting',
      participants: [
        { name: 'Dr. Jean Martin', role: 'Directeur', email: 'jean@healthtech.fr' }
      ],
      description: 'Analyse des flux de trésorerie et optimisation des coûts.',
      notes: 'Demander les états financiers des 12 derniers mois.',
      project: 'Optimisation financière',
      recurring: false,
      reminder: 15
    },
    {
      id: 3,
      title: 'Atelier formation équipe',
      client: 'GreenTech Innovation',
      clientLogo: '🌱',
      type: APPOINTMENT_TYPES.WORKSHOP,
      status: APPOINTMENT_STATUS.CONFIRMED,
      date: '2024-03-09',
      startTime: '10:00',
      endTime: '12:00',
      duration: 120,
      mode: MEETING_MODES.IN_PERSON,
      location: '25 Avenue de l\'Innovation, Lyon',
      participants: [
        { name: 'Pierre Dubois', role: 'CEO', email: 'pierre@greentech.fr' },
        { name: 'Marie Martin', role: 'Marketing Manager', email: 'marie@greentech.fr' },
        { name: 'Thomas Wilson', role: 'Dev Lead', email: 'thomas@greentech.fr' }
      ],
      description: 'Formation sur les nouvelles méthodologies agiles et la gestion de projet.',
      notes: 'Apporter les supports de formation et les exercices pratiques.',
      project: 'Stratégie marketing digital',
      recurring: false,
      reminder: 60
    },
    {
      id: 4,
      title: 'Suivi hebdomadaire',
      client: 'InnovateCorp',
      clientLogo: '💼',
      type: APPOINTMENT_TYPES.CALL,
      status: APPOINTMENT_STATUS.CONFIRMED,
      date: '2024-03-10',
      startTime: '16:00',
      endTime: '16:30',
      duration: 30,
      mode: MEETING_MODES.PHONE,
      location: 'Appel téléphonique',
      participants: [
        { name: 'Marie Lefebvre', role: 'DRH', email: 'marie@innovatecorp.fr' }
      ],
      description: 'Point hebdomadaire sur l\'avancement du projet de transformation RH.',
      notes: 'Préparer le rapport de suivi et les KPI.',
      project: 'Transformation RH',
      recurring: true,
      reminder: 10
    },
    {
      id: 5,
      title: 'Audit opérationnel final',
      client: 'Manufacturing Plus',
      clientLogo: '🏭',
      type: APPOINTMENT_TYPES.AUDIT,
      status: APPOINTMENT_STATUS.COMPLETED,
      date: '2024-03-05',
      startTime: '08:00',
      endTime: '17:00',
      duration: 480,
      mode: MEETING_MODES.IN_PERSON,
      location: 'Zone industrielle, Lille',
      participants: [
        { name: 'Thomas Wilson', role: 'Directeur Général', email: 'thomas@manufacturing.com' },
        { name: 'Sophie Martin', role: 'Responsable Production', email: 'sophie@manufacturing.com' }
      ],
      description: 'Audit final des processus de production après optimisation.',
      notes: 'Rapport d\'audit remis - gains de productivité de 25% confirmés.',
      project: 'Audit opérationnel',
      recurring: false,
      reminder: 120
    },
    {
      id: 6,
      title: 'Présentation résultats Q1',
      client: 'FinanceAI Corp',
      clientLogo: '💳',
      type: APPOINTMENT_TYPES.PRESENTATION,
      status: APPOINTMENT_STATUS.SCHEDULED,
      date: '2024-03-12',
      startTime: '15:00',
      endTime: '16:00',
      duration: 60,
      mode: MEETING_MODES.VIDEO,
      location: 'Teams Meeting',
      participants: [
        { name: 'Maria Rodriguez', role: 'CEO', email: 'maria@financeai.com' },
        { name: 'David Kim', role: 'CFO', email: 'david@financeai.com' },
        { name: 'Lisa Chen', role: 'COO', email: 'lisa@financeai.com' }
      ],
      description: 'Présentation des résultats et recommandations pour le Q2.',
      notes: 'Préparer les slides avec les métriques clés et le plan d\'action.',
      project: 'Conseil stratégique Q1',
      recurring: false,
      reminder: 45
    }
    ];
    setAppointments(initialAppointments);
  }, []);

  // CRUD Functions
  const addAppointment = (appointmentData) => {
    const newAppointment = {
      ...appointmentData,
      id: Date.now(),
      status: APPOINTMENT_STATUS.SCHEDULED
    };
    setAppointments([...appointments, newAppointment]);
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Rendez-vous ajouté avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateAppointment = (appointmentId, appointmentData) => {
    setAppointments(appointments.map(appointment => 
      appointment.id === appointmentId ? { ...appointment, ...appointmentData } : appointment
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Rendez-vous mis à jour avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const deleteAppointment = (appointmentId) => {
    setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Rendez-vous supprimé avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateAppointmentStatus = (appointmentId, newStatus) => {
    setAppointments(appointments.map(appointment => 
      appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Statut mis à jour!',
      timestamp: new Date().toISOString()
    });
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date + ' ' + a.startTime) - new Date(b.date + ' ' + b.startTime));

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today;
  });

  const thisWeekAppointments = appointments.filter(apt => {
    const today = new Date();
    const appointmentDate = new Date(apt.date);
    const diffTime = appointmentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return <CheckCircle className="text-green-500" size={16} />;
      case APPOINTMENT_STATUS.SCHEDULED:
        return <Clock className="text-blue-500" size={16} />;
      case APPOINTMENT_STATUS.COMPLETED:
        return <CheckCircle className="text-green-600" size={16} />;
      case APPOINTMENT_STATUS.CANCELLED:
        return <AlertCircle className="text-red-500" size={16} />;
      case APPOINTMENT_STATUS.RESCHEDULED:
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <Calendar className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return 'text-green-600 bg-green-100';
      case APPOINTMENT_STATUS.SCHEDULED:
        return 'text-blue-600 bg-blue-100';
      case APPOINTMENT_STATUS.COMPLETED:
        return 'text-green-600 bg-green-100';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'text-red-600 bg-red-100';
      case APPOINTMENT_STATUS.RESCHEDULED:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case MEETING_MODES.VIDEO:
        return <Video className="text-blue-500" size={16} />;
      case MEETING_MODES.PHONE:
        return <Phone className="text-green-500" size={16} />;
      case MEETING_MODES.IN_PERSON:
        return <MapPin className="text-purple-500" size={16} />;
      default:
        return <Calendar className="text-gray-400" size={16} />;
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const NewAppointmentModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: '',
      client: '',
      clientLogo: '🏢',
      type: APPOINTMENT_TYPES.MEETING,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      mode: MEETING_MODES.IN_PERSON,
      location: '',
      description: '',
      participants: [{ name: '', role: '', email: '' }],
      reminder: 30
    });

    const addParticipant = () => {
      setFormData({
        ...formData,
        participants: [...formData.participants, { name: '', role: '', email: '' }]
      });
    };

    const updateParticipant = (index, field, value) => {
      const newParticipants = [...formData.participants];
      newParticipants[index][field] = value;
      setFormData({ ...formData, participants: newParticipants });
    };

    const removeParticipant = (index) => {
      setFormData({
        ...formData,
        participants: formData.participants.filter((_, i) => i !== index)
      });
    };

    const calculateDuration = () => {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      return Math.abs(end - start) / (1000 * 60); // minutes
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title || !formData.client || !formData.date) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Veuillez remplir tous les champs obligatoires',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const appointmentData = {
        ...formData,
        duration: calculateDuration(),
        project: formData.title // For now, use title as project
      };
      
      onSave(appointmentData);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Nouveau Rendez-vous
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Réunion stratégie"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de rendez-vous
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.values(APPOINTMENT_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode de réunion
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({...formData, mode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.values(MEETING_MODES).map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lieu/Lien
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Adresse ou lien de visioconférence"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Description du rendez-vous..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Participants</h4>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  <Plus size={16} className="inline mr-1" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {formData.participants.map((participant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Nom"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="text"
                      placeholder="Rôle"
                      value={participant.role}
                      onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                <Plus size={16} />
                Créer le rendez-vous
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AppointmentModal = ({ appointment, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{appointment.clientLogo}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {appointment.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{appointment.client}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Informations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{new Date(appointment.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-400" />
                    <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)} ({formatDuration(appointment.duration)})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getModeIcon(appointment.mode)}
                    <span>{appointment.mode}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{appointment.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-gray-400" />
                    <span>{appointment.type}</span>
                  </div>
                  {appointment.recurring && (
                    <div className="flex items-center space-x-2">
                      <Repeat size={16} className="text-gray-400" />
                      <span>Récurrent</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Bell size={16} className="text-gray-400" />
                    <span>Rappel {appointment.reminder} min avant</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Statut</h3>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
                  {getStatusIcon(appointment.status)}
                  <span>{appointment.status}</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Participants</h3>
                <div className="space-y-2">
                  {appointment.participants.map((participant, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <User size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{participant.name}</div>
                        <div className="text-xs text-gray-500">{participant.role}</div>
                        <div className="text-xs text-gray-500">{participant.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{appointment.description}</p>
          </div>

          {appointment.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-400">{appointment.notes}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button className="btn-secondary flex-1">
              <Edit size={16} />
              Modifier
            </button>
            <button 
              className="btn-primary flex-1"
              onClick={() => {
                if (appointment.mode === MEETING_MODES.VIDEO) {
                  addNotification({
                    id: Date.now().toString(),
                    type: 'success',
                    message: 'Lien de visioconférence copié!',
                    timestamp: new Date().toISOString()
                  });
                }
              }}
            >
              {appointment.mode === MEETING_MODES.VIDEO ? <Video size={16} /> : <Eye size={16} />}
              {appointment.mode === MEETING_MODES.VIDEO ? 'Rejoindre' : 'Voir détails'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestion de vos rendez-vous et réunions
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['day', 'week', 'month'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedView === view
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {view === 'day' ? 'Jour' : view === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowNewAppointmentModal(true)}
          >
            <Plus size={18} />
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {todayAppointments.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {thisWeekAppointments.length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Confirmés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {appointments.filter(apt => apt.status === APPOINTMENT_STATUS.CONFIRMED).length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">En attente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {appointments.filter(apt => apt.status === APPOINTMENT_STATUS.SCHEDULED).length}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-xl">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Prochains rendez-vous */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Prochains rendez-vous</h3>
        <div className="space-y-4">
          {upcomingAppointments.slice(0, 5).map((appointment) => (
            <div 
              key={appointment.id} 
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowAppointmentModal(true);
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{appointment.clientLogo}</div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{appointment.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(appointment.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getModeIcon(appointment.mode)}
                      <span>{appointment.mode}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building2 size={14} />
                      <span>{appointment.client}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {appointment.recurring && (
                  <Repeat className="text-gray-400" size={16} />
                )}
                <Eye className="text-primary-600" size={16} />
              </div>
            </div>
          ))}
        </div>

        {upcomingAppointments.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Aucun rendez-vous programmé</p>
            <button 
              className="btn-primary mt-4"
              onClick={() => setShowNewAppointmentModal(true)}
            >
              <Plus size={16} />
              Planifier un rendez-vous
            </button>
          </div>
        )}
      </div>

      {showAppointmentModal && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {showNewAppointmentModal && (
        <NewAppointmentModal
          onClose={() => setShowNewAppointmentModal(false)}
          onSave={addAppointment}
        />
      )}
    </div>
  );
}