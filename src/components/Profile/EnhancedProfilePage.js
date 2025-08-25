import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Building, Briefcase, Globe, Linkedin, Twitter,
  Camera, Upload, X, Save, Edit, FileText, Trash2, Eye, Download, Plus,
  Languages, Award, Calendar, Star, Check, AlertCircle, Loader
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import profileApi from '../../services/profileApi';

export default function EnhancedProfilePage() {
  const { user, updateProfile } = useSecureApp();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [profileServiceAvailable, setProfileServiceAvailable] = useState(false);

  const avatarInputRef = useRef(null);
  const docsInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    industry: '',
    company: '',
    position: '',
    bio: '',
    website: '',
    linkedin: '',
    twitter: '',
    skills: [],
    languages: [],
    availability: 'available'
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const availabilityOptions = [
    { value: 'available', label: 'Disponible', color: 'text-green-600', bgColor: 'bg-green-100' },
    { value: 'busy', label: 'Occupé', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { value: 'unavailable', label: 'Non disponible', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // Check if profile service is available
        const serviceAvailable = await profileApi.isServiceAvailable();
        setProfileServiceAvailable(serviceAvailable);

        if (serviceAvailable) {
          const response = await profileApi.getProfile();
          if (response.success) {
            setProfileData(response.profile);
            setFormData({
              name: response.profile.name || '',
              email: response.profile.email || '',
              phone: response.profile.phone || '',
              location: response.profile.location || '',
              industry: response.profile.industry || '',
              company: response.profile.company || '',
              position: response.profile.position || '',
              bio: response.profile.bio || '',
              website: response.profile.website || '',
              linkedin: response.profile.linkedin || '',
              twitter: response.profile.twitter || '',
              skills: response.profile.skills || [],
              languages: response.profile.languages || [],
              availability: response.profile.availability || 'available'
            });
          }

          // Load documents
          const docsResponse = await profileApi.getDocuments();
          if (docsResponse.success) {
            setDocuments(docsResponse.documents);
          }
        } else {
          // Use user data from context if service is not available
          if (user) {
            setFormData({
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              location: user.location || '',
              industry: user.industry || '',
              company: user.company || '',
              position: user.position || '',
              bio: user.bio || user.description || '',
              website: user.website || '',
              linkedin: user.linkedin || '',
              twitter: user.twitter || '',
              skills: user.skills || [],
              languages: user.languages || [],
              availability: user.availability || 'available'
            });
            setProfileData(user);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add skill
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Add language
  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  // Remove language
  const removeLanguage = (langToRemove) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== langToRemove)
    }));
  };

  // Save profile
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (profileServiceAvailable) {
        const response = await profileApi.updateProfile(formData);
        if (response.success) {
          setProfileData(response.profile);
          setSuccess('Profil mis à jour avec succès !');
          setIsEditing(false);
        }
      } else {
        // Fallback to context update if service is not available
        await updateProfile(formData);
        setSuccess('Profil mis à jour avec succès !');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      profileApi.validateAvatar(file);
      setUploadingAvatar(true);
      setError('');

      if (profileServiceAvailable) {
        const response = await profileApi.uploadAvatar(file);
        if (response.success) {
          setProfileData(prev => ({
            ...prev,
            avatar: response.avatar
          }));
          setSuccess('Avatar mis à jour avec succès !');
        }
      } else {
        setError('Service d\'upload indisponible');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Erreur lors de l\'upload de l\'avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      // Validate all files
      files.forEach(file => profileApi.validateFile(file));
      
      setUploadingDocs(true);
      setError('');

      if (profileServiceAvailable) {
        const response = await profileApi.uploadDocuments(files);
        if (response.success) {
          setDocuments(prev => [...prev, ...response.documents]);
          setSuccess(`${response.documents.length} document(s) téléchargé(s) avec succès !`);
        }
      } else {
        setError('Service d\'upload indisponible');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError(error.message || 'Erreur lors de l\'upload des documents');
    } finally {
      setUploadingDocs(false);
      if (docsInputRef.current) {
        docsInputRef.current.value = '';
      }
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      setError('');
      
      if (profileServiceAvailable) {
        const response = await profileApi.deleteDocument(documentId);
        if (response.success) {
          setDocuments(prev => prev.filter(doc => doc.id !== documentId));
          setSuccess('Document supprimé avec succès !');
        }
      } else {
        setError('Service indisponible');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Chargement du profil...</span>
        </div>
      </div>
    );
  }

  const displayData = profileData || user;
  const currentAvailability = availabilityOptions.find(opt => opt.value === (displayData?.availability || 'available'));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Service Status */}
      {!profileServiceAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Service de profil étendu indisponible. Fonctionnalités limitées.
          </span>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {displayData?.avatar ? (
                <img
                  src={displayData.avatar}
                  alt={displayData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            {profileServiceAvailable && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayData?.name || 'Utilisateur'}
              </h1>
              <div className="flex items-center space-x-2">
                {currentAvailability && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentAvailability.color} ${currentAvailability.bgColor}`}>
                    {currentAvailability.label}
                  </span>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{displayData?.email}</span>
              </div>
              {displayData?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{displayData.phone}</span>
                </div>
              )}
              {displayData?.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{displayData.location}</span>
                </div>
              )}
              {displayData?.company && (
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{displayData.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Modifier le profil
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Paris, France"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secteur d'activité
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Technologie"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entreprise
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mon Entreprise"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poste
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Développeur Full-Stack"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disponibilité
              </label>
              <select
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Site web
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 dark:bg-gray-600 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://monsite.com"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LinkedIn
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 dark:bg-gray-600 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500 dark:text-gray-400">
                  <Linkedin className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://linkedin.com/in/monprofil"
                />
              </div>
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Twitter
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 dark:bg-gray-600 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500 dark:text-gray-400">
                  <Twitter className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="@moncompte"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio / Description
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Parlez-nous de vous, votre expérience, vos passions..."
              maxLength={1000}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.bio.length}/1000 caractères
            </div>
          </div>

          {/* Skills */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compétences
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ajouter une compétence"
              />
              <button
                onClick={addSkill}
                className="btn-primary flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Languages */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Langues
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.languages.map((language, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <Languages className="w-3 h-3" />
                  <span>{language}</span>
                  <button
                    onClick={() => removeLanguage(language)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ajouter une langue"
              />
              <button
                onClick={addLanguage}
                className="btn-primary flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Documents Section */}
      {profileServiceAvailable && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Documents ({documents.length})</span>
            </h2>
            <button
              onClick={() => docsInputRef.current?.click()}
              disabled={uploadingDocs}
              className="btn-primary flex items-center space-x-2"
            >
              {uploadingDocs ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploadingDocs ? 'Upload...' : 'Ajouter'}</span>
            </button>
            <input
              ref={docsInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,image/*"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document téléchargé</p>
              <p className="text-sm">Ajoutez des documents pour enrichir votre profil</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-2xl">
                        {profileApi.getFileTypeIcon(doc.mimetype)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.originalname}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profileApi.formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = doc.url;
                          a.download = doc.originalname;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Ajouté le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Stats */}
      {displayData?.stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Statistiques
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {displayData.stats.connections || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connexions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayData.stats.projects || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Projets</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl font-bold text-yellow-600">
                {displayData.stats.rating || 0}
                <Star className="w-5 h-5 ml-1" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Note moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayData.stats.reviews || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avis</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}