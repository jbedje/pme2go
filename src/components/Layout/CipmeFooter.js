import React from 'react';
import { Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function CipmeFooter() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* CIPME Info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <img 
                src="/cipme-logo.png" 
                alt="CIPME" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="font-bold text-lg cipme-text-gradient">
                  CÔTE D'IVOIRE PME
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Centre d'Information PME
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Accompagner l'audace et l'ambition de nos entrepreneur.e.s
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPin size={16} className="text-primary-500" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Mail size={16} className="text-primary-500" />
                <span>info@cipme.ci</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Phone size={16} className="text-primary-500" />
                <span>+225 XX XX XX XX</span>
              </div>
            </div>
          </div>

          {/* PME2GO Info */}
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              PME2GO Platform
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              La plateforme digitale de l'écosystème PME ivoirien connectant entrepreneurs, 
              experts, mentors, investisseurs et institutions financières.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">500+</div>
                <div className="text-xs text-gray-500">Entrepreneurs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">100+</div>
                <div className="text-xs text-gray-500">Experts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">50+</div>
                <div className="text-xs text-gray-500">Investisseurs</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nos Services
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Networking professionnel</li>
              <li>• Opportunités d'affaires</li>
              <li>• Accompagnement & Mentoring</li>
              <li>• Financement & Investissement</li>
              <li>• Formation & Événements</li>
              <li>• Analyse & Insights</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Made with</span>
              <Heart size={16} className="text-red-500" />
              <span>by CIPME Team</span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 CIPME - Centre d'Information PME, Côte d'Ivoire. Tous droits réservés.
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-primary-500 transition-colors">
                <Globe size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}