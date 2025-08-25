import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Users, Building } from 'lucide-react';
import { useApp } from '../../contexts/AppContextWithAPI';

export default function LoginForm() {
  const { login, setView, USER_TYPES } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = login(formData.email, formData.password);
      if (!success) {
        setError('Identifiants incorrects. Essayez avec un email de démonstration.');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const demoUsers = [
    { email: 'contact@techstart.fr', name: 'TechStart Solutions', type: USER_TYPES.PME },
    { email: 'marie.dubois@consulting.fr', name: 'Marie Dubois', type: USER_TYPES.EXPERT },
    { email: 'jp.martin@mentor.fr', name: 'Jean-Pierre Martin', type: USER_TYPES.MENTOR },
    { email: 'contact@innovhub-paris.fr', name: 'Innovation Hub', type: USER_TYPES.INCUBATOR },
    { email: 'deals@capitalventures.fr', name: 'Capital Ventures', type: USER_TYPES.INVESTOR },
    { email: 'pro@creditentreprise.fr', name: 'Crédit Entreprise', type: USER_TYPES.BANK }
  ];

  const fillDemoUser = (email) => {
    setFormData({ email, password: 'demo123' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-600">P2G</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PME2GO</h1>
          <p className="text-primary-100">
            Connectez-vous à l'écosystème PME
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
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
                  className="input-field pl-10"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
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
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Lien vers inscription */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Pas encore de compte ?{' '}
              <button
                onClick={() => setView('register')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>

        {/* Comptes de démonstration */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="text-white" size={20} />
            <h3 className="text-white font-semibold">Comptes de démonstration</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => fillDemoUser(user.email)}
                className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left"
              >
                <div>
                  <div className="text-white text-sm font-medium">{user.name}</div>
                  <div className="text-primary-100 text-xs">{user.type}</div>
                </div>
                <ArrowRight className="text-primary-200" size={16} />
              </button>
            ))}
          </div>
          
          <p className="text-primary-100 text-xs mt-4 text-center">
            Cliquez sur un profil pour vous connecter automatiquement
          </p>
        </div>
      </div>
    </div>
  );
}