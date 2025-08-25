import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export default function SecureLoginForm() {
  const { login, setView, loadingStates, authError } = useSecureApp();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Clear form error when auth error changes
  useEffect(() => {
    if (authError) {
      setFormError('');
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!formData.email || !formData.password) {
      setFormError('Veuillez remplir tous les champs');
      return;
    }

    if (!formData.email.includes('@')) {
      setFormError('Veuillez entrer un email valide');
      return;
    }

    try {
      const success = await login(formData.email, formData.password);
      if (!success) {
        setFormError('Échec de la connexion. Vérifiez vos identifiants.');
      }
    } catch (err) {
      setFormError('Une erreur est survenue lors de la connexion.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (formError) setFormError('');
  };

  const displayError = authError || formError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">PME2GO</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mode Sécurisé</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Connexion sécurisée
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connectez-vous à votre compte avec authentification JWT
          </p>

          {/* Security Badge */}
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
            <Shield size={12} className="mr-1" />
            Authentification sécurisée avec JWT
          </div>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{displayError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-10 py-3 pr-12 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loadingStates.login}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loadingStates.login ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Shield className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                )}
              </span>
              {loadingStates.login ? 'Connexion en cours...' : 'Se connecter'}
              {!loadingStates.login && (
                <ArrowRight className="ml-2 h-5 w-5" />
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setView('register')}
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Pas encore de compte ? Créer un compte sécurisé
            </button>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Comptes de démonstration :
          </h3>
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <p><strong>Email:</strong> test.secure@example.com</p>
            <p><strong>Mot de passe:</strong> SecurePass123</p>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Ou créez votre propre compte sécurisé avec validation complète
          </p>
        </div>

        {/* Security Features */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <Shield size={12} className="mr-1" />
              JWT Tokens
            </span>
            <span className="flex items-center">
              <Lock size={12} className="mr-1" />
              bcrypt Hashing
            </span>
            <span className="flex items-center">
              <AlertCircle size={12} className="mr-1" />
              Rate Limiting
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}