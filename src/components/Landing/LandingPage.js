import React from 'react';
import { 
  ArrowRight, 
  Users, 
  Building, 
  TrendingUp, 
  MessageSquare, 
  Star, 
  Globe, 
  Target,
  Award,
  CheckCircle,
  Play,
  ChevronDown,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { CirclePattern, WavePattern, GeometricPattern } from './BackgroundPatterns';

export default function LandingPage({ onGetStarted }) {
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { number: '500+', label: 'Entrepreneurs', icon: Users },
    { number: '100+', label: 'Experts & Mentors', icon: Award },
    { number: '50+', label: 'Investisseurs', icon: TrendingUp },
    { number: '25+', label: 'Institutions', icon: Building }
  ];

  const features = [
    {
      icon: Users,
      title: 'Networking Professionnel',
      description: 'Connectez-vous avec des entrepreneurs, experts, mentors et investisseurs de l\'écosystème ivoirien'
    },
    {
      icon: Target,
      title: 'Opportunités d\'Affaires',
      description: 'Découvrez des missions, partenariats, financements et opportunités adaptés à votre profil'
    },
    {
      icon: MessageSquare,
      title: 'Messagerie Intégrée',
      description: 'Communiquez directement avec vos contacts et développez vos relations d\'affaires'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Suivez vos performances et obtenez des analyses pour optimiser votre activité'
    },
    {
      icon: Award,
      title: 'Accompagnement Expert',
      description: 'Bénéficiez du soutien de mentors expérimentés et d\'experts sectoriels'
    },
    {
      icon: Globe,
      title: 'Écosystème Complet',
      description: 'Accédez à tout l\'écosystème PME ivoirien sur une seule plateforme'
    }
  ];

  const userTypes = [
    {
      title: 'Entrepreneurs & PME',
      description: 'Développez votre réseau, trouvez des opportunités de financement et accédez à l\'accompagnement',
      benefits: ['Accès aux investisseurs', 'Réseau d\'experts', 'Opportunités de partenariat'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Experts & Consultants',
      description: 'Proposez vos services, développez votre clientèle et partagez votre expertise',
      benefits: ['Visibilité accrue', 'Nouvelles missions', 'Réseau professionnel'],
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Investisseurs',
      description: 'Découvrez des opportunités d\'investissement prometteuses dans l\'écosystème ivoirien',
      benefits: ['Deal flow qualifié', 'Due diligence facilitée', 'Réseau d\'entrepreneurs'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Institutions',
      description: 'Banques, organismes publics, partenaires tech - connectez-vous à l\'écosystème',
      benefits: ['Accès aux PME', 'Programmes ciblés', 'Impact mesurable'],
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/cipme-logo.png" alt="CIPME" className="w-10 h-10" />
            <div>
              <h3 className="font-bold text-white text-lg">PME2GO</h3>
              <p className="text-xs text-orange-200">by CIPME</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => scrollToSection('features')}
              className="text-white hover:text-orange-200 transition-colors"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-white hover:text-orange-200 transition-colors hidden md:block"
            >
              À propos
            </button>
            <button
              onClick={onGetStarted}
              className="bg-white text-primary-600 px-6 py-2 rounded-full font-medium hover:bg-orange-50 transition-all"
            >
              Se connecter
            </button>
          </div>
        </div>
      </nav>
      
      {/* Hero Section with CIPME Branding */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/cipme-hero-image.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <div className="mb-8">
            <img 
              src="/cipme-logo.png" 
              alt="CIPME" 
              className="w-24 h-24 mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              PME2GO
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-orange-200">
              L'écosystème digital des PME ivoiriennes
            </p>
            <p className="text-lg text-orange-300 mb-8 max-w-3xl mx-auto">
              Accompagner l'audace et l'ambition de nos entrepreneur.e.s
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onGetStarted}
              className="cipme-gradient text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Commencer maintenant</span>
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Play size={20} />
              <span>Découvrir la plateforme</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="text-orange-300" size={24} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-orange-300">{stat.number}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 relative overflow-hidden">
        <CirclePattern className="text-gray-300" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Une plateforme complète pour votre réussite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PME2GO by CIPME offre tous les outils nécessaires pour développer votre activité 
              et connecter avec l'écosystème PME ivoirien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="cipme-gradient w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <GeometricPattern className="text-orange-100" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pour tous les acteurs de l'écosystème
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Que vous soyez entrepreneur, expert, investisseur ou institution, 
              PME2GO s'adapte à vos besoins spécifiques.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {userTypes.map((type, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className={`bg-gradient-to-r ${type.color} p-6 text-white`}>
                  <h3 className="text-2xl font-bold mb-2">{type.title}</h3>
                  <p className="text-white/90">{type.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About CIPME Section */}
      <section id="about" className="py-20 cipme-gradient text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/cipme-logo-black.png" 
                alt="CIPME Logo" 
                className="w-32 h-32 mb-8 bg-white p-4 rounded-2xl"
              />
              <h2 className="text-4xl font-bold mb-6">
                À propos de CIPME
              </h2>
              <p className="text-xl text-orange-100 mb-6 leading-relaxed">
                Le Centre d'Information PME (CIPME) est l'organisme de référence pour 
                l'accompagnement et le développement des Petites et Moyennes Entreprises 
                en Côte d'Ivoire.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-300 flex-shrink-0" size={24} />
                  <span className="text-orange-100">Plus de 10 ans d'expérience dans l'accompagnement PME</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-300 flex-shrink-0" size={24} />
                  <span className="text-orange-100">Réseau national d'experts et de partenaires</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-300 flex-shrink-0" size={24} />
                  <span className="text-orange-100">Soutien gouvernemental et institutionnel</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4">Notre Mission</h3>
                <p className="text-orange-100">
                  Accompagner l'audace et l'ambition des entrepreneur.e.s ivoirien.ne.s 
                  en leur offrant un écosystème digital intégré pour développer leurs activités.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4">Notre Vision</h3>
                <p className="text-orange-100">
                  Faire de la Côte d'Ivoire un hub entrepreneurial dynamique et innovant, 
                  où chaque PME peut accéder aux ressources nécessaires pour prospérer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à rejoindre l'écosystème PME2GO ?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Connectez-vous avec les meilleurs entrepreneurs, experts et investisseurs 
            de Côte d'Ivoire. Votre réussite commence ici.
          </p>
          <button
            onClick={onGetStarted}
            className="cipme-gradient text-white px-12 py-4 rounded-full font-semibold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-3"
          >
            <span>Créer mon compte gratuitement</span>
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/cipme-logo.png" alt="CIPME" className="w-12 h-12" />
                <div>
                  <h3 className="font-bold text-lg cipme-text-gradient">CIPME</h3>
                  <p className="text-sm text-gray-600">Centre d'Information PME</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Accompagner l'audace et l'ambition de nos entrepreneur.e.s
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-primary-500" />
                  <span>Abidjan, Côte d'Ivoire</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-primary-500" />
                  <span>info@cipme.ci</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-primary-500" />
                  <span>+225 XX XX XX XX</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Networking professionnel</li>
                <li>• Opportunités d'affaires</li>
                <li>• Accompagnement & Mentoring</li>
                <li>• Financement & Investissement</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Plateforme</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Formation & Événements</li>
                <li>• Analyse & Insights</li>
                <li>• Support technique</li>
                <li>• Community management</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-8 text-center text-sm text-gray-500">
            © 2024 CIPME - Centre d'Information PME, Côte d'Ivoire. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}