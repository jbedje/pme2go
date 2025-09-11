import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  User,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Euro,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  BarChart3,
  Users,
  Target,
  Award,
  FileText,
  Building2,
  Zap,
  Globe
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PROJECT_STATUS = {
  ACTIVE: 'En cours',
  COMPLETED: 'Terminé',
  PAUSED: 'En pause',
  CANCELLED: 'Annulé'
};

const PROJECT_TYPES = {
  STRATEGY: 'Stratégie',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  HR: 'Ressources Humaines',
  IT: 'Informatique',
  OPERATIONS: 'Opérations',
  LEGAL: 'Juridique',
  OTHER: 'Autre'
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function PortfolioPage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);

  // Initialize projects data
  useEffect(() => {
    const initialProjects = [
    {
      id: 1,
      title: 'Transformation digitale PME',
      client: 'TechStart Solutions',
      clientLogo: '🚀',
      type: PROJECT_TYPES.STRATEGY,
      status: PROJECT_STATUS.ACTIVE,
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      budget: 25000,
      completion: 65,
      description: 'Accompagnement dans la transformation digitale et l\'optimisation des processus.',
      tasks: [
        { name: 'Audit des processus actuels', completed: true },
        { name: 'Définition de la stratégie digitale', completed: true },
        { name: 'Mise en place des outils', completed: false },
        { name: 'Formation des équipes', completed: false },
        { name: 'Suivi et optimisation', completed: false }
      ],
      contact: {
        name: 'Sarah Chen',
        email: 'sarah@techstart.com',
        phone: '+33 1 23 45 67 89'
      },
      location: 'Paris, France',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Stratégie marketing digital',
      client: 'GreenTech Innovation',
      clientLogo: '🌱',
      type: PROJECT_TYPES.MARKETING,
      status: PROJECT_STATUS.COMPLETED,
      startDate: '2023-10-01',
      endDate: '2024-01-31',
      budget: 15000,
      completion: 100,
      description: 'Développement d\'une stratégie marketing digital complète pour le lancement produit.',
      tasks: [
        { name: 'Analyse concurrentielle', completed: true },
        { name: 'Personas et segmentation', completed: true },
        { name: 'Stratégie content marketing', completed: true },
        { name: 'Campagnes publicitaires', completed: true },
        { name: 'Mesure des performances', completed: true }
      ],
      contact: {
        name: 'Pierre Dubois',
        email: 'pierre@greentech.fr',
        phone: '+33 1 34 56 78 90'
      },
      location: 'Lyon, France',
      rating: 4.9
    },
    {
      id: 3,
      title: 'Optimisation financière',
      client: 'HealthTech Solutions',
      clientLogo: '🏥',
      type: PROJECT_TYPES.FINANCE,
      status: PROJECT_STATUS.ACTIVE,
      startDate: '2024-02-01',
      endDate: '2024-05-30',
      budget: 30000,
      completion: 40,
      description: 'Restructuration financière et optimisation de la trésorerie.',
      tasks: [
        { name: 'Audit financier complet', completed: true },
        { name: 'Analyse des flux de trésorerie', completed: true },
        { name: 'Plan de restructuration', completed: false },
        { name: 'Négociation avec les banques', completed: false },
        { name: 'Mise en place du suivi', completed: false }
      ],
      contact: {
        name: 'Dr. Jean Martin',
        email: 'jean@healthtech.fr',
        phone: '+33 1 56 78 90 12'
      },
      location: 'Marseille, France',
      rating: 4.6
    },
    {
      id: 4,
      title: 'Transformation RH',
      client: 'InnovateCorp',
      clientLogo: '💼',
      type: PROJECT_TYPES.HR,
      status: PROJECT_STATUS.PAUSED,
      startDate: '2023-11-15',
      endDate: '2024-03-15',
      budget: 20000,
      completion: 30,
      description: 'Modernisation des processus RH et mise en place d\'outils de gestion.',
      tasks: [
        { name: 'Audit des processus RH', completed: true },
        { name: 'Définition des besoins', completed: true },
        { name: 'Sélection des outils', completed: false },
        { name: 'Déploiement', completed: false },
        { name: 'Formation et suivi', completed: false }
      ],
      contact: {
        name: 'Marie Lefebvre',
        email: 'marie@innovatecorp.fr',
        phone: '+33 1 67 89 01 23'
      },
      location: 'Toulouse, France',
      rating: 4.4
    },
    {
      id: 5,
      title: 'Audit opérationnel',
      client: 'Manufacturing Plus',
      clientLogo: '🏭',
      type: PROJECT_TYPES.OPERATIONS,
      status: PROJECT_STATUS.COMPLETED,
      startDate: '2023-08-01',
      endDate: '2023-12-15',
      budget: 18000,
      completion: 100,
      description: 'Audit complet des opérations et optimisation des processus de production.',
      tasks: [
        { name: 'Cartographie des processus', completed: true },
        { name: 'Identification des goulots', completed: true },
        { name: 'Plan d\'optimisation', completed: true },
        { name: 'Mise en œuvre', completed: true },
        { name: 'Mesure des gains', completed: true }
      ],
      contact: {
        name: 'Thomas Wilson',
        email: 'thomas@manufacturing.com',
        phone: '+33 1 78 90 12 34'
      },
      location: 'Lille, France',
      rating: 4.7
    }
    ];
    setProjects(initialProjects);
  }, []);

  // CRUD Functions
  const addProject = (projectData) => {
    const newProject = {
      ...projectData,
      id: Date.now(),
      completion: 0,
      status: PROJECT_STATUS.ACTIVE,
      tasks: projectData.tasks || [],
      rating: 0,
      clientLogo: projectData.clientLogo || '🏢',
      location: projectData.location || ''
    };
    setProjects([...projects, newProject]);
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Projet ajouté avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateProject = (projectId, projectData) => {
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, ...projectData } : project
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Projet mis à jour avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(project => project.id !== projectId));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Projet supprimé avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateProjectProgress = (projectId, newProgress) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            completion: newProgress,
            status: newProgress === 100 ? PROJECT_STATUS.COMPLETED : project.status
          } 
        : project
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Progression mise à jour!',
      timestamp: new Date().toISOString()
    });
  };

  const skills = [
    { name: 'Stratégie d\'entreprise', level: 95, projects: 12 },
    { name: 'Transformation digitale', level: 90, projects: 8 },
    { name: 'Marketing digital', level: 85, projects: 6 },
    { name: 'Finance d\'entreprise', level: 88, projects: 10 },
    { name: 'Gestion de projet', level: 92, projects: 15 },
    { name: 'Ressources humaines', level: 80, projects: 5 }
  ];

  const testimonials = [
    {
      id: 1,
      client: 'Sarah Chen',
      company: 'TechStart Solutions',
      rating: 5,
      comment: 'Expertise exceptionnelle en transformation digitale. Marie a su nous guider avec brio dans notre modernisation.',
      project: 'Transformation digitale PME',
      date: '2024-02-15'
    },
    {
      id: 2,
      client: 'Pierre Dubois',
      company: 'GreenTech Innovation',
      rating: 5,
      comment: 'Stratégie marketing remarquable qui a généré +200% de leads qualifiés. Très professionnel.',
      project: 'Stratégie marketing digital',
      date: '2024-01-30'
    },
    {
      id: 3,
      client: 'Thomas Wilson',
      company: 'Manufacturing Plus',
      rating: 5,
      comment: 'Audit opérationnel complet qui nous a fait économiser 30% sur nos coûts. Recommande vivement.',
      project: 'Audit opérationnel',
      date: '2023-12-20'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const portfolioStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length,
    completedProjects: projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length,
    totalRevenue: projects.reduce((sum, project) => sum + project.budget, 0),
    averageRating: projects.reduce((sum, project) => sum + project.rating, 0) / projects.length,
    completionRate: projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length / projects.length * 100
  };

  const projectTypeDistribution = [
    { name: 'Stratégie', value: 3, color: COLORS[0] },
    { name: 'Marketing', value: 1, color: COLORS[1] },
    { name: 'Finance', value: 2, color: COLORS[2] },
    { name: 'RH', value: 1, color: COLORS[3] },
    { name: 'Opérations', value: 1, color: COLORS[4] }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 25000, projects: 2 },
    { month: 'Fév', revenue: 15000, projects: 1 },
    { month: 'Mar', revenue: 30000, projects: 2 },
    { month: 'Avr', revenue: 20000, projects: 1 },
    { month: 'Mai', revenue: 35000, projects: 3 },
    { month: 'Jun', revenue: 28000, projects: 2 }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PROJECT_STATUS.COMPLETED:
        return <CheckCircle className="text-green-500" size={16} />;
      case PROJECT_STATUS.ACTIVE:
        return <Zap className="text-blue-500" size={16} />;
      case PROJECT_STATUS.PAUSED:
        return <Clock className="text-yellow-500" size={16} />;
      case PROJECT_STATUS.CANCELLED:
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <FileText className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PROJECT_STATUS.COMPLETED:
        return 'text-green-600 bg-green-100';
      case PROJECT_STATUS.ACTIVE:
        return 'text-blue-600 bg-blue-100';
      case PROJECT_STATUS.PAUSED:
        return 'text-yellow-600 bg-yellow-100';
      case PROJECT_STATUS.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const NewProjectModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: '',
      client: '',
      clientLogo: '🏢',
      type: PROJECT_TYPES.STRATEGY,
      description: '',
      budget: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      location: '',
      contact: {
        name: '',
        email: '',
        phone: ''
      }
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title || !formData.client || !formData.budget) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Veuillez remplir tous les champs obligatoires',
          timestamp: new Date().toISOString()
        });
        return;
      }
      onSave(formData);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Nouveau Projet
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
                  Titre du projet *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Transformation digitale"
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
                  Type de projet
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.values(PROJECT_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget (€) *
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de fin prévue
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
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
                placeholder="Description du projet..."
              />
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Contact client</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nom du contact"
                  value={formData.contact.name}
                  onChange={(e) => setFormData({...formData, contact: {...formData.contact, name: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
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
                Créer le projet
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProjectModal = ({ project, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{project.clientLogo}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {project.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{project.client}</p>
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

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Description du projet</h3>
                <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Progression des tâches</h3>
                <div className="space-y-3">
                  {project.tasks && project.tasks.length > 0 ? project.tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        task.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {task.completed && <CheckCircle className="text-white" size={12} />}
                      </div>
                      <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.name}
                      </span>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">Aucune tâche définie pour ce projet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informations projet</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{project.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium">{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium">{project.completion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Début</span>
                    <span className="font-medium">
                      {new Date(project.startDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fin prévue</span>
                    <span className="font-medium">
                      {new Date(project.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Contact client</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span>{project.contact?.name || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{project.contact?.email || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{project.contact?.phone || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{project.location || 'Non défini'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Évaluation</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={index < Math.floor(project.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{project.rating}/5</span>
                </div>
              </div>
            </div>
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
            Mon Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestion de vos projets de conseil et expertise
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <BarChart3 size={18} />
            Rapport
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowNewProjectModal(true)}
          >
            <Plus size={18} />
            Nouveau projet
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Projets actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {portfolioStats.activeProjects}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <Zap className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Projets terminés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {portfolioStats.completedProjects}
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(portfolioStats.totalRevenue)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-xl">
              <Euro className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {portfolioStats.averageRating.toFixed(1)}/5
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
              <Star className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'projects', label: 'Projets', icon: Briefcase },
            { key: 'skills', label: 'Compétences', icon: Award },
            { key: 'testimonials', label: 'Témoignages', icon: Star },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'projects' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tous les statuts</option>
                <option value={PROJECT_STATUS.ACTIVE}>En cours</option>
                <option value={PROJECT_STATUS.COMPLETED}>Terminé</option>
                <option value={PROJECT_STATUS.PAUSED}>En pause</option>
                <option value={PROJECT_STATUS.CANCELLED}>Annulé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{project.clientLogo}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{project.client}</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span>{project.status}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progression</span>
                    <span className="text-sm font-medium">{project.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>{formatCurrency(project.budget)}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-400 fill-current" size={14} />
                      <span>{project.rating}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-6">Mes compétences</h3>
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{skill.name}</span>
                    <span className="text-sm text-gray-600">{skill.projects} projets</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-sm font-medium text-primary-600">{skill.level}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'testimonials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card">
              <div className="flex items-start space-x-4 mb-4">
                <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
                  <User className="text-primary-600" size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{testimonial.client}</h4>
                      <p className="text-sm text-gray-600">{testimonial.company}</p>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, index) => (
                        <Star key={index} className="text-yellow-400 fill-current" size={14} />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 italic mb-3">
                    "{testimonial.comment}"
                  </blockquote>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{testimonial.project}</span> • {new Date(testimonial.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Évolution du chiffre d'affaires</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Répartition par type de projet</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={projectTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {projectTypeDistribution.map((type, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                  <span>{type.name}</span>
                  <span className="text-gray-500">({type.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProjectModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSave={addProject}
        />
      )}
    </div>
  );
}