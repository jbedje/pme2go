import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { User, Mail, MapPin, Building, Phone, Globe, Camera, Save, Edit3, Shield, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';

const USER_TYPES = {
  'PME/Startup': 'PME/Startup',
  'Expert/Consultant': 'Expert/Consultant',
  'Mentor': 'Mentor',
  'Incubateur': 'Incubateur',
  'Investisseur': 'Investisseur',
  'Institution Financière': 'Institution Financière',
  'Organisme Public': 'Organisme Public',
  'Partenaire Tech': 'Partenaire Tech'
};

function ProfilePage() {
  const { user, updateProfile, addNotification, loadingStates } = useSecureApp();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    type: '',
    industry: '',
    location: '',
    phone: '',
    bio: '',
    
    // Professional Info
    skills: [],
    experience: '',
    availability: 'available',
    
    // Social Links
    website: '',
    linkedin: '',
    twitter: '',
    
    // Settings
    emailNotifications: true,
    profileVisibility: 'public',
    showContactInfo: true
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        type: user.type || '',
        industry: user.industry || '',
        location: user.location || '',
        phone: user.phone || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experience: user.experience || '',
        availability: user.availability || 'available',
        website: user.website || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        emailNotifications: user.emailNotifications !== false,
        profileVisibility: user.profileVisibility || 'public',
        showContactInfo: user.showContactInfo !== false
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSkillsChange = (value) => {
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    handleInputChange('skills', skillsArray);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.type) {
      newErrors.type = 'Le type de profil est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile(formData);
      setIsEditing(false);
      addNotification('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification('Erreur lors de la mise à jour du profil', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      // TODO: Implement password change API
      addNotification('Mot de passe mis à jour avec succès', 'success');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      addNotification('Erreur lors du changement de mot de passe', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'Informations générales', icon: User },
    { id: 'professional', name: 'Profil professionnel', icon: Building },
    { id: 'social', name: 'Réseaux sociaux', icon: Globe },
    { id: 'security', name: 'Sécurité', icon: Shield }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {user.type}
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {user.location || 'Localisation non renseignée'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  isEditing
                    ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={loadingStates.profile}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loadingStates.profile ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="w-5 h-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {activeTab === 'general' && (
            <GeneralTab
              formData={formData}
              isEditing={isEditing}
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'professional' && (
            <ProfessionalTab
              formData={formData}
              isEditing={isEditing}
              errors={errors}
              onInputChange={handleInputChange}
              onSkillsChange={handleSkillsChange}
            />
          )}
          
          {activeTab === 'social' && (
            <SocialTab
              formData={formData}
              isEditing={isEditing}
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'security' && (
            <SecurityTab
              formData={formData}
              passwordData={passwordData}
              passwordErrors={passwordErrors}
              showPasswordForm={showPasswordForm}
              isEditing={isEditing}
              onInputChange={handleInputChange}
              onPasswordChange={setPasswordData}
              onTogglePasswordForm={setShowPasswordForm}
              onPasswordSubmit={handlePasswordChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// General Information Tab
function GeneralTab({ formData, isEditing, errors, onInputChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom complet *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${!isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'}`}
              placeholder="Votre nom complet"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${!isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'}`}
              placeholder="votre@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de profil *
          </label>
          <select
            value={formData.type}
            onChange={(e) => onInputChange('type', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
              errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${!isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'}`}
          >
            <option value="">Sélectionnez un type</option>
            {Object.entries(USER_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Secteur d'activité
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => onInputChange('industry', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
              !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="ex: Technologie, Finance, Santé..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Localisation
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => onInputChange('location', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Paris, France"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Téléphone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Présentation
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => onInputChange('bio', e.target.value)}
          disabled={!isEditing}
          rows={4}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          placeholder="Présentez-vous en quelques lignes..."
        />
      </div>
    </div>
  );
}

// Professional Tab
function ProfessionalTab({ formData, isEditing, errors, onInputChange, onSkillsChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Compétences
        </label>
        <input
          type="text"
          value={formData.skills.join(', ')}
          onChange={(e) => onSkillsChange(e.target.value)}
          disabled={!isEditing}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          placeholder="React, Marketing, Finance, Gestion de projet..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Séparez les compétences par des virgules
        </p>
        {formData.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Expérience
        </label>
        <textarea
          value={formData.experience}
          onChange={(e) => onInputChange('experience', e.target.value)}
          disabled={!isEditing}
          rows={4}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          placeholder="Décrivez votre parcours professionnel..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Disponibilité
        </label>
        <select
          value={formData.availability}
          onChange={(e) => onInputChange('availability', e.target.value)}
          disabled={!isEditing}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
        >
          <option value="available">Disponible</option>
          <option value="limited">Disponibilité limitée</option>
          <option value="busy">Occupé</option>
          <option value="unavailable">Indisponible</option>
        </select>
      </div>
    </div>
  );
}

// Social Media Tab
function SocialTab({ formData, isEditing, errors, onInputChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Site web
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="url"
            value={formData.website}
            onChange={(e) => onInputChange('website', e.target.value)}
            disabled={!isEditing}
            className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
              !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="https://www.mon-site.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn
        </label>
        <input
          type="url"
          value={formData.linkedin}
          onChange={(e) => onInputChange('linkedin', e.target.value)}
          disabled={!isEditing}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          placeholder="https://linkedin.com/in/votre-profil"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Twitter
        </label>
        <input
          type="url"
          value={formData.twitter}
          onChange={(e) => onInputChange('twitter', e.target.value)}
          disabled={!isEditing}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
            !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          placeholder="https://twitter.com/votre-compte"
        />
      </div>
    </div>
  );
}

// Security Tab
function SecurityTab({ 
  formData, 
  passwordData, 
  passwordErrors, 
  showPasswordForm, 
  isEditing, 
  onInputChange, 
  onPasswordChange, 
  onTogglePasswordForm, 
  onPasswordSubmit 
}) {
  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Paramètres de confidentialité
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibilité du profil
            </label>
            <select
              value={formData.profileVisibility}
              onChange={(e) => onInputChange('profileVisibility', e.target.value)}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                !isEditing ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }`}
            >
              <option value="public">Public - Visible par tous</option>
              <option value="members">Membres uniquement</option>
              <option value="connections">Mes connexions uniquement</option>
              <option value="private">Privé</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Afficher les informations de contact
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permet aux autres utilisateurs de voir votre email et téléphone
              </p>
            </div>
            <button
              onClick={() => onInputChange('showContactInfo', !formData.showContactInfo)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.showContactInfo ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.showContactInfo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notifications par email
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recevoir les notifications importantes par email
              </p>
            </div>
            <button
              onClick={() => onInputChange('emailNotifications', !formData.emailNotifications)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.emailNotifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Sécurité du compte
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Mot de passe
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dernière modification il y a 30 jours
              </p>
            </div>
            <button
              onClick={() => onTogglePasswordForm(!showPasswordForm)}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {showPasswordForm ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => onPasswordChange(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Entrez votre mot de passe actuel"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => onPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => onPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirmez le nouveau mot de passe"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onPasswordSubmit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-sm font-medium"
                >
                  Changer le mot de passe
                </button>
                <button
                  onClick={() => onTogglePasswordForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;