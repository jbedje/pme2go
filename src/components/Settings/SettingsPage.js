import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  Camera,
  Eye,
  EyeOff,
  Key,
  Trash2,
  Check,
  X,
  Settings as SettingsIcon
} from 'lucide-react';

function SettingsPage() {
  const { user, updateUser, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    industry: '',
    company: '',
    bio: '',
    linkedin: '',
    website: ''
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newMessages: true,
    opportunityMatches: true,
    eventReminders: true,
    weeklyDigest: true
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    contactInfoVisible: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    industryVisible: true,
    locationVisible: true
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Theme settings state
  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    language: 'fr'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        industry: user.industry || '',
        company: user.company || '',
        bio: user.bio || '',
        linkedin: user.linkedin || '',
        website: user.website || ''
      });
    }
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3002/api/users/${user.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Profil mis à jour avec succès',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la mise à jour du profil',
        timestamp: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Les mots de passe ne correspondent pas',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Le mot de passe doit contenir au moins 6 caractères',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3002/api/users/${user.uuid}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Mot de passe modifié avec succès',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du changement de mot de passe',
        timestamp: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = () => {
    // Save notification settings
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Paramètres de notification sauvegardés',
      timestamp: new Date().toISOString()
    });
  };

  const handlePrivacySave = () => {
    // Save privacy settings
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Paramètres de confidentialité sauvegardés',
      timestamp: new Date().toISOString()
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Confidentialité', icon: Shield },
    { id: 'security', label: 'Sécurité', icon: Key },
    { id: 'appearance', label: 'Apparence', icon: Palette }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informations personnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Localisation
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secteur d'activité
            </label>
            <input
              type="text"
              value={profileData.industry}
              onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entreprise
            </label>
            <input
              type="text"
              value={profileData.company}
              onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Biographie
        </label>
        <textarea
          value={profileData.bio}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          placeholder="Décrivez-vous en quelques mots..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn
          </label>
          <input
            type="url"
            value={profileData.linkedin}
            onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Site web
          </label>
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileSave}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
        >
          {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2" size={16} />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Préférences de notification
        </h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Notifications par email', description: 'Recevoir les notifications importantes par email' },
            { key: 'pushNotifications', label: 'Notifications push', description: 'Notifications en temps réel dans le navigateur' },
            { key: 'marketingEmails', label: 'Emails marketing', description: 'Recevoir des informations sur les nouvelles fonctionnalités' },
            { key: 'newMessages', label: 'Nouveaux messages', description: 'Notifications pour les nouveaux messages privés' },
            { key: 'opportunityMatches', label: 'Opportunités correspondantes', description: 'Notifications pour les nouvelles opportunités qui vous correspondent' },
            { key: 'eventReminders', label: 'Rappels d\'événements', description: 'Rappels avant les événements auxquels vous participez' },
            { key: 'weeklyDigest', label: 'Résumé hebdomadaire', description: 'Résumé de votre activité chaque semaine' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <button
                onClick={() => setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationSettings[key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNotificationSave}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
        >
          <Save className="mr-2" size={16} />
          Sauvegarder
        </button>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Paramètres de confidentialité
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibilité du profil
            </label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="public">Public - Visible par tous</option>
              <option value="network">Réseau - Visible par vos connexions</option>
              <option value="private">Privé - Visible par vous seul</option>
            </select>
          </div>

          {[
            { key: 'contactInfoVisible', label: 'Informations de contact visibles', description: 'Permettre aux autres de voir votre email et téléphone' },
            { key: 'showOnlineStatus', label: 'Afficher le statut en ligne', description: 'Montrer quand vous êtes actif sur la plateforme' },
            { key: 'allowDirectMessages', label: 'Autoriser les messages directs', description: 'Permettre aux autres utilisateurs de vous envoyer des messages' },
            { key: 'industryVisible', label: 'Secteur d\'activité visible', description: 'Afficher votre secteur d\'activité sur votre profil' },
            { key: 'locationVisible', label: 'Localisation visible', description: 'Afficher votre localisation sur votre profil' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <button
                onClick={() => setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacySettings[key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    privacySettings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePrivacySave}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
        >
          <Save className="mr-2" size={16} />
          Sauvegarder
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Changer le mot de passe
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Key className="mr-2" size={16} />}
            {saving ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
          Zone de danger
        </h3>
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Supprimer le compte
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
            <Trash2 className="mr-2" size={16} />
            Supprimer le compte
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Apparence et langue
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thème
            </label>
            <select
              value={themeSettings.theme}
              onChange={(e) => setThemeSettings(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Automatique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Langue
            </label>
            <select
              value={themeSettings.language}
              onChange={(e) => setThemeSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center">
          <Save className="mr-2" size={16} />
          Sauvegarder
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'privacy':
        return renderPrivacyTab();
      case 'security':
        return renderSecurityTab();
      case 'appearance':
        return renderAppearanceTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Chargement des paramètres...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="mr-3 text-primary-500" size={32} />
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="mr-3 flex-shrink-0" size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;