import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Euro,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  Calculator,
  Percent,
  Hash
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const INVOICE_STATUS = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée'
};

const PAYMENT_METHODS = {
  TRANSFER: 'Virement',
  CHECK: 'Chèque',
  CASH: 'Espèces',
  CARD: 'Carte bancaire'
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function FacturationPage() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState([]);

  // Initialize invoices data
  useEffect(() => {
    const initialInvoices = [
    {
      id: 'FAC-2024-001',
      number: 'FAC-2024-001',
      client: 'TechStart Solutions',
      clientLogo: '🚀',
      project: 'Transformation digitale PME',
      status: INVOICE_STATUS.PAID,
      issueDate: '2024-02-15',
      dueDate: '2024-03-17',
      paidDate: '2024-03-10',
      amount: 7500,
      taxAmount: 1500,
      totalAmount: 9000,
      taxRate: 20,
      items: [
        { description: 'Audit des processus actuels', quantity: 1, unitPrice: 3000, total: 3000 },
        { description: 'Définition stratégie digitale', quantity: 1, unitPrice: 2500, total: 2500 },
        { description: 'Formation équipes (2 jours)', quantity: 2, unitPrice: 1000, total: 2000 }
      ],
      clientInfo: {
        name: 'TechStart Solutions',
        address: '15 rue de la Tech',
        city: '75001 Paris',
        email: 'comptabilite@techstart.com',
        contact: 'Sarah Chen'
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: 'Mission réalisée avec succès. Livrables conformes aux attentes.'
    },
    {
      id: 'FAC-2024-002',
      number: 'FAC-2024-002',
      client: 'GreenTech Innovation',
      clientLogo: '🌱',
      project: 'Stratégie marketing digital',
      status: INVOICE_STATUS.SENT,
      issueDate: '2024-03-01',
      dueDate: '2024-04-01',
      paidDate: null,
      amount: 12500,
      taxAmount: 2500,
      totalAmount: 15000,
      taxRate: 20,
      items: [
        { description: 'Analyse concurrentielle', quantity: 1, unitPrice: 2000, total: 2000 },
        { description: 'Stratégie content marketing', quantity: 1, unitPrice: 3500, total: 3500 },
        { description: 'Campagnes publicitaires', quantity: 1, unitPrice: 4000, total: 4000 },
        { description: 'Formation équipe marketing', quantity: 1, unitPrice: 3000, total: 3000 }
      ],
      clientInfo: {
        name: 'GreenTech Innovation',
        address: '25 Avenue de l\'Innovation',
        city: '69000 Lyon',
        email: 'finance@greentech.fr',
        contact: 'Pierre Dubois'
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: 'Paiement sous 30 jours. Merci de nous transmettre le bon de commande signé.'
    },
    {
      id: 'FAC-2024-003',
      number: 'FAC-2024-003',
      client: 'HealthTech Solutions',
      clientLogo: '🏥',
      project: 'Optimisation financière',
      status: INVOICE_STATUS.OVERDUE,
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      paidDate: null,
      amount: 8000,
      taxAmount: 1600,
      totalAmount: 9600,
      taxRate: 20,
      items: [
        { description: 'Audit financier complet', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Analyse flux de trésorerie', quantity: 1, unitPrice: 3000, total: 3000 }
      ],
      clientInfo: {
        name: 'HealthTech Solutions',
        address: '10 Boulevard de la Santé',
        city: '13000 Marseille',
        email: 'admin@healthtech.fr',
        contact: 'Dr. Jean Martin'
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: 'Relance nécessaire. Client en difficulté de trésorerie.'
    },
    {
      id: 'FAC-2024-004',
      number: 'FAC-2024-004',
      client: 'InnovateCorp',
      clientLogo: '💼',
      project: 'Transformation RH',
      status: INVOICE_STATUS.DRAFT,
      issueDate: '2024-03-08',
      dueDate: '2024-04-08',
      paidDate: null,
      amount: 6000,
      taxAmount: 1200,
      totalAmount: 7200,
      taxRate: 20,
      items: [
        { description: 'Audit processus RH', quantity: 1, unitPrice: 3500, total: 3500 },
        { description: 'Recommandations outils', quantity: 1, unitPrice: 2500, total: 2500 }
      ],
      clientInfo: {
        name: 'InnovateCorp',
        address: '5 Rue de l\'Innovation',
        city: '31000 Toulouse',
        email: 'rh@innovatecorp.fr',
        contact: 'Marie Lefebvre'
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: 'Projet en cours. Facturation phase 1.'
    },
    {
      id: 'FAC-2024-005',
      number: 'FAC-2024-005',
      client: 'Manufacturing Plus',
      clientLogo: '🏭',
      project: 'Audit opérationnel',
      status: INVOICE_STATUS.PAID,
      issueDate: '2023-12-20',
      dueDate: '2024-01-20',
      paidDate: '2024-01-15',
      amount: 15000,
      taxAmount: 3000,
      totalAmount: 18000,
      taxRate: 20,
      items: [
        { description: 'Audit opérationnel complet', quantity: 1, unitPrice: 10000, total: 10000 },
        { description: 'Plan d\'optimisation', quantity: 1, unitPrice: 3000, total: 3000 },
        { description: 'Accompagnement mise en œuvre', quantity: 1, unitPrice: 2000, total: 2000 }
      ],
      clientInfo: {
        name: 'Manufacturing Plus',
        address: 'Zone Industrielle Nord',
        city: '59000 Lille',
        email: 'direction@manufacturing.com',
        contact: 'Thomas Wilson'
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: 'Mission terminée avec succès. Gains de productivité mesurés : +25%.'
    }
    ];
    setInvoices(initialInvoices);
  }, []);

  // CRUD Functions
  const addInvoice = (invoiceData) => {
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice = {
      ...invoiceData,
      id: invoiceNumber,
      number: invoiceNumber,
      status: INVOICE_STATUS.DRAFT,
      issueDate: new Date().toISOString().split('T')[0]
    };
    setInvoices([...invoices, newInvoice]);
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Facture créée avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateInvoice = (invoiceId, invoiceData) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...invoiceData } : invoice
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Facture mise à jour avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const deleteInvoice = (invoiceId) => {
    setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Facture supprimée avec succès!',
      timestamp: new Date().toISOString()
    });
  };

  const updateInvoiceStatus = (invoiceId, newStatus) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { 
            ...invoice, 
            status: newStatus,
            paidDate: newStatus === INVOICE_STATUS.PAID ? new Date().toISOString().split('T')[0] : invoice.paidDate
          } 
        : invoice
    ));
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Statut de facture mis à jour!',
      timestamp: new Date().toISOString()
    });
  };

  const sendInvoice = (invoiceId) => {
    updateInvoiceStatus(invoiceId, INVOICE_STATUS.SENT);
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Facture envoyée au client!',
      timestamp: new Date().toISOString()
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const billingStats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    paidRevenue: invoices.filter(inv => inv.status === INVOICE_STATUS.PAID)
                        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    pendingRevenue: invoices.filter(inv => [INVOICE_STATUS.SENT, INVOICE_STATUS.VIEWED].includes(inv.status))
                           .reduce((sum, inv) => sum + inv.totalAmount, 0),
    overdueRevenue: invoices.filter(inv => inv.status === INVOICE_STATUS.OVERDUE)
                           .reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === INVOICE_STATUS.PAID).length,
    pendingInvoices: invoices.filter(inv => [INVOICE_STATUS.SENT, INVOICE_STATUS.VIEWED].includes(inv.status)).length,
    overdueInvoices: invoices.filter(inv => inv.status === INVOICE_STATUS.OVERDUE).length
  };

  const statusDistribution = [
    { name: 'Payées', value: billingStats.paidInvoices, color: COLORS[1] },
    { name: 'Envoyées', value: billingStats.pendingInvoices, color: COLORS[0] },
    { name: 'En retard', value: billingStats.overdueInvoices, color: COLORS[3] },
    { name: 'Brouillons', value: invoices.filter(inv => inv.status === INVOICE_STATUS.DRAFT).length, color: COLORS[4] }
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 18000, invoices: 1 },
    { month: 'Fév', revenue: 9000, invoices: 1 },
    { month: 'Mar', revenue: 15000, invoices: 1 },
    { month: 'Avr', revenue: 0, invoices: 0 },
    { month: 'Mai', revenue: 0, invoices: 0 },
    { month: 'Jun', revenue: 0, invoices: 0 }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case INVOICE_STATUS.PAID:
        return <CheckCircle className="text-green-500" size={16} />;
      case INVOICE_STATUS.SENT:
      case INVOICE_STATUS.VIEWED:
        return <Clock className="text-blue-500" size={16} />;
      case INVOICE_STATUS.OVERDUE:
        return <AlertCircle className="text-red-500" size={16} />;
      case INVOICE_STATUS.DRAFT:
        return <Edit className="text-gray-500" size={16} />;
      case INVOICE_STATUS.CANCELLED:
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <FileText className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case INVOICE_STATUS.PAID:
        return 'text-green-600 bg-green-100';
      case INVOICE_STATUS.SENT:
      case INVOICE_STATUS.VIEWED:
        return 'text-blue-600 bg-blue-100';
      case INVOICE_STATUS.OVERDUE:
        return 'text-red-600 bg-red-100';
      case INVOICE_STATUS.DRAFT:
        return 'text-gray-600 bg-gray-100';
      case INVOICE_STATUS.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const NewInvoiceModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      client: '',
      clientLogo: '🏢',
      project: '',
      amount: '',
      taxRate: 20,
      dueDate: '',
      items: [{ description: '', quantity: 1, unitPrice: '', total: 0 }],
      clientInfo: {
        name: '',
        address: '',
        city: '',
        email: '',
        contact: ''
      },
      paymentMethod: PAYMENT_METHODS.TRANSFER,
      notes: ''
    });

    const addItem = () => {
      setFormData({
        ...formData,
        items: [...formData.items, { description: '', quantity: 1, unitPrice: '', total: 0 }]
      });
    };

    const updateItem = (index, field, value) => {
      const newItems = [...formData.items];
      newItems[index][field] = value;
      
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * (newItems[index].unitPrice || 0);
      }
      
      setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    };

    const calculateTotals = () => {
      const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (formData.taxRate / 100);
      const total = subtotal + taxAmount;
      return { subtotal, taxAmount, total };
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.client || !formData.project || formData.items.length === 0) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Veuillez remplir tous les champs obligatoires',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const { subtotal, taxAmount, total } = calculateTotals();
      const invoiceData = {
        ...formData,
        amount: subtotal,
        taxAmount: taxAmount,
        totalAmount: total,
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      onSave(invoiceData);
      onClose();
    };

    const { subtotal, taxAmount, total } = calculateTotals();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Nouvelle Facture
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Projet *
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Nom du projet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Information client</h4>
                <input
                  type="text"
                  placeholder="Nom du contact"
                  value={formData.clientInfo.contact}
                  onChange={(e) => setFormData({...formData, clientInfo: {...formData.clientInfo, contact: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.clientInfo.email}
                  onChange={(e) => setFormData({...formData, clientInfo: {...formData.clientInfo, email: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={formData.clientInfo.address}
                  onChange={(e) => setFormData({...formData, clientInfo: {...formData.clientInfo, address: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Prestations</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  <Plus size={16} className="inline mr-1" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Sous-total HT:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>TVA ({formData.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Notes ou conditions de paiement..."
              />
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
                Créer la facture
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const InvoiceModal = ({ invoice, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{invoice.clientLogo}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Facture {invoice.number}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{invoice.client}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">FACTURE</h3>
                    <p className="text-gray-600">N° {invoice.number}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Date d'émission</div>
                    <div className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Prestataire</h4>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{user?.name}</div>
                      <div>Expert Consultant</div>
                      <div>{user?.email}</div>
                      <div>{user?.phone}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Client</h4>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{invoice.clientInfo.name}</div>
                      <div>{invoice.clientInfo.address}</div>
                      <div>{invoice.clientInfo.city}</div>
                      <div>{invoice.clientInfo.email}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Prestations</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-medium text-gray-900">Description</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-900">Qté</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-900">Prix unitaire</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-900">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 text-sm text-gray-800">{item.description}</td>
                            <td className="py-2 text-sm text-gray-800 text-right">{item.quantity}</td>
                            <td className="py-2 text-sm text-gray-800 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-sm text-gray-800 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Sous-total HT</span>
                      <span className="text-sm font-medium">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">TVA ({invoice.taxRate}%)</span>
                      <span className="text-sm font-medium">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total TTC</span>
                      <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projet</span>
                    <span className="font-medium">{invoice.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date limite</span>
                    <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {invoice.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de paiement</span>
                      <span className="font-medium text-green-600">{new Date(invoice.paidDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode de paiement</span>
                    <span className="font-medium">{invoice.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full btn-secondary"
                    onClick={() => addNotification({
                      id: Date.now().toString(),
                      type: 'success',
                      message: 'PDF téléchargé!',
                      timestamp: new Date().toISOString()
                    })}
                  >
                    <Download size={16} />
                    Télécharger PDF
                  </button>
                  {invoice.status === INVOICE_STATUS.DRAFT && (
                    <button 
                      className="w-full btn-primary"
                      onClick={() => sendInvoice(invoice.id)}
                    >
                      <Send size={16} />
                      Envoyer
                    </button>
                  )}
                  {[INVOICE_STATUS.SENT, INVOICE_STATUS.VIEWED, INVOICE_STATUS.OVERDUE].includes(invoice.status) && (
                    <button 
                      className="w-full btn-secondary"
                      onClick={() => addNotification({
                        id: Date.now().toString(),
                        type: 'success',
                        message: 'Email de relance envoyé!',
                        timestamp: new Date().toISOString()
                      })}
                    >
                      <Mail size={16} />
                      Relancer
                    </button>
                  )}
                  {[INVOICE_STATUS.SENT, INVOICE_STATUS.VIEWED, INVOICE_STATUS.OVERDUE].includes(invoice.status) && (
                    <button 
                      className="w-full btn-success"
                      onClick={() => updateInvoiceStatus(invoice.id, INVOICE_STATUS.PAID)}
                    >
                      <CheckCircle size={16} />
                      Marquer payée
                    </button>
                  )}
                  <button 
                    className="w-full btn-secondary"
                    onClick={() => addNotification({
                      id: Date.now().toString(),
                      type: 'info',
                      message: 'Modification en cours...',
                      timestamp: new Date().toISOString()
                    })}
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                  {invoice.status === INVOICE_STATUS.DRAFT && (
                    <button 
                      className="w-full btn-secondary text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                          deleteInvoice(invoice.id);
                          onClose();
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Contact client</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span>{invoice.clientInfo.contact}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{invoice.clientInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{invoice.clientInfo.address}, {invoice.clientInfo.city}</span>
                  </div>
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
            Facturation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestion de vos factures et revenus
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Calculator size={18} />
            Calculs
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowNewInvoiceModal(true)}
          >
            <Plus size={18} />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">CA total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(billingStats.totalRevenue)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <Euro className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Encaissé</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(billingStats.paidRevenue)}
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
                {formatCurrency(billingStats.pendingRevenue)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Impayés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(billingStats.overdueRevenue)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Évolution du chiffre d'affaires</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Statut des factures</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusDistribution.map((status, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                <span>{status.name}</span>
                <span className="text-gray-500">({status.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une facture..."
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
              <option value={INVOICE_STATUS.DRAFT}>Brouillons</option>
              <option value={INVOICE_STATUS.SENT}>Envoyées</option>
              <option value={INVOICE_STATUS.PAID}>Payées</option>
              <option value={INVOICE_STATUS.OVERDUE}>En retard</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Facture</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Échéance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-gray-400" size={20} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.number}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.project}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{invoice.clientLogo}</span>
                      <span className="text-gray-900 dark:text-gray-100">{invoice.client}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span>{invoice.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                    {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showNewInvoiceModal && (
        <NewInvoiceModal
          onClose={() => setShowNewInvoiceModal(false)}
          onSave={addInvoice}
        />
      )}
    </div>
  );
}