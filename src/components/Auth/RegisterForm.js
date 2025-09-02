import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Building, 
  MapPin, 
  Globe, 
  ArrowRight, 
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContextWithAPI';

export default function RegisterForm() {
  const { register, setView, USER_TYPES } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: '',
    industry: '',
    location: '',
    description: '',
    website: '',
    linkedin: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    if (step === 2) {
      if (!formData.type) newErrors.type = 'Veuillez sélectionner un type de profil';
      if (!formData.industry.trim()) newErrors.industry = 'Le secteur d\'activité est requis';
      if (!formData.location.trim()) newErrors.location = 'La localisation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const success = register(formData);
      if (success) {
        // L'utilisateur sera automatiquement connecté
      }
    } catch (err) {
      setErrors({ submit: 'Une erreur est survenue lors de l\'inscription' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Effacer l'erreur du champ modifié
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const userTypeOptions = Object.entries(USER_TYPES).map(([key, value]) => ({
    value,
    label: value,
    description: {
      PME: 'Entreprise en recherche de financement, expertise ou partenariats',
      EXPERT: 'Consultant proposant services et expertises spécialisées',
      MENTOR: 'Entrepreneur expérimenté accompagnant d\'autres entrepreneurs',
      INCUBATOR: 'Structure d\'accompagnement pour startups et PME',
      INVESTOR: 'Investisseur en recherche d\'opportunités d\'investissement',
      BANK: 'Institution proposant des solutions de financement',
      PUBLIC: 'Organisme public informant sur aides et dispositifs',
      TECH: 'Partenaire technologique proposant des solutions'
    }[key]
  }));

  const industryOptions = [
    'Technologie', 'Finance', 'Santé', 'Éducation', 'E-commerce', 
    'Industrie', 'Services', 'Retail', 'Immobilier', 'Transport',
    'Énergie', 'Agriculture', 'Tourisme', 'Médias', 'Autre'
  ];

  return (
    <div className="min-h-screen cipme-gradient-hero flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Back to landing page button */}
        <button
          onClick={() => setView('landing')}
          className="mb-6 flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour à l'accueil</span>
        </button>
        {/* CIPME Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg">
            <img 
              src="/cipme-logo.png" 
              alt="CIPME" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Rejoignez PME2GO</h1>
          <p className="text-orange-100 mb-1">
            Créez votre compte et connectez-vous à l'écosystème
          </p>
          <p className="text-xs text-orange-200 font-medium">
            Powered by CIPME - Côte d'Ivoire
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step <= currentStep
                    ? 'bg-white border-white text-primary-600'
                    : 'border-white/50 text-white/50'
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle size={16} className="text-primary-600" />
                ) : (
                  step
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Étape 1: Informations de base */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Informations de base
                  </h2>
                  <p className="text-gray-600">
                    Commençons par vos informations essentielles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet / Nom de l'entreprise
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.name ? 'border-danger-500' : ''}`}
                      placeholder="Votre nom ou nom d'entreprise"
                    />
                  </div>
                  {errors.name && <p className="text-danger-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.email ? 'border-danger-500' : ''}`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {errors.email && <p className="text-danger-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-danger-600 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-danger-600 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {/* Étape 2: Type de profil */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Type de profil
                  </h2>
                  <p className="text-gray-600">
                    Quel type d'acteur êtes-vous dans l'écosystème PME ?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sélectionnez votre profil
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {userTypeOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.type === option.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={formData.type === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.type && <p className="text-danger-600 text-sm mt-1">{errors.type}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`input-field ${errors.industry ? 'border-danger-500' : ''}`}
                  >
                    <option value="">Sélectionnez un secteur</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="text-danger-600 text-sm mt-1">{errors.industry}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.location ? 'border-danger-500' : ''}`}
                      placeholder="Paris, France"
                    />
                  </div>
                  {errors.location && <p className="text-danger-600 text-sm mt-1">{errors.location}</p>}
                </div>
              </>
            )}

            {/* Étape 3: Informations complémentaires */}
            {currentStep === 3 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Finalisation
                  </h2>
                  <p className="text-gray-600">
                    Ajoutez quelques informations pour compléter votre profil
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Décrivez brièvement votre activité, vos objectifs ou votre expertise..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web (optionnel)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="https://www.votre-site.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn (optionnel)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="https://linkedin.com/in/votre-profil"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}
              </>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Retour</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 btn-primary px-6 py-3 ml-auto"
                >
                  <span>Suivant</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 btn-primary px-6 py-3 ml-auto"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Créer mon compte</span>
                      <CheckCircle size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <button
                onClick={() => setView('login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}