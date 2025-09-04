import React, { useState } from 'react';
import { X, Search, Book, MessageCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const HelpModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "How do I add a new employee to the system?",
      answer: "Navigate to the Employee Management section, click 'Add New Employee', fill in the required information including personal details, role, department, and contact information. Make sure to save the form when complete."
    },
    {
      id: 2,
      question: "What should I do if the form crashes while entering data?",
      answer: "The system has auto-save functionality that saves your progress every 30 seconds. If a crash occurs, refresh the page and your data should be recovered automatically. You can also manually save using Ctrl+S."
    },
    {
      id: 3,
      question: "How do I switch between light and dark mode?",
      answer: "Click the theme toggle button in the top-right corner of the header. You can choose between Light, Dark, or System theme which follows your device's preference."
    },
    {
      id: 4,
      question: "Why are some form fields not appearing?",
      answer: "This might be due to validation errors or missing required fields. Check for error messages and ensure all required fields are filled. If the issue persists, try refreshing the page."
    },
    {
      id: 5,
      question: "How do I add custom roles for employees?",
      answer: "In the role selection field, start typing a new role name. If it doesn't exist, you'll see an option to 'Add [Role Name]' which you can click to create a custom role."
    },
    {
      id: 6,
      question: "Can I navigate between form sections without completing them?",
      answer: "Yes, you can navigate between sections using the progress indicators at the top. However, some sections may require certain fields to be completed before proceeding."
    },
    {
      id: 7,
      question: "How do I add clients or KPIs to departments?",
      answer: "In the Department Management section, select the department and use the 'Add Client' or 'Add KPI' buttons. Make sure to fill in all required information and save your changes."
    },
    {
      id: 8,
      question: "What accessibility features are available?",
      answer: "The system includes ARIA labels for screen readers, keyboard navigation support, high contrast mode in dark theme, and proper focus management throughout the application."
    }
  ];

  const documentationSections = [
    {
      title: "Getting Started",
      items: [
        "System Overview",
        "User Roles and Permissions",
        "Navigation Guide",
        "Basic Operations"
      ]
    },
    {
      title: "Employee Management",
      items: [
        "Adding New Employees",
        "Editing Employee Information",
        "Role Assignment",
        "Department Management"
      ]
    },
    {
      title: "Data Management",
      items: [
        "Auto-save Features",
        "Data Validation",
        "Error Handling",
        "Backup and Recovery"
      ]
    },
    {
      title: "Advanced Features",
      items: [
        "Custom Roles",
        "Bulk Operations",
        "Reporting",
        "Integration Options"
      ]
    }
  ];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden theme-transition">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help & Support</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg theme-transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent theme-transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-600">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center px-6 py-3 font-medium theme-transition ${
              activeTab === 'faq'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center px-6 py-3 font-medium theme-transition ${
              activeTab === 'docs'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Book className="w-4 h-4 mr-2" />
            Documentation
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center px-6 py-3 font-medium theme-transition ${
              activeTab === 'contact'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Contact Support
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin">
          {activeTab === 'faq' && (
            <div className="space-y-4">
              {filteredFAQ.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No FAQ items found matching your search.
                </p>
              ) : (
                filteredFAQ.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-dark-600 rounded-lg">
                    <button
                      onClick={() => toggleFAQ(item.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700 theme-transition"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.question}
                      </span>
                      {expandedFAQ === item.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFAQ === item.id && (
                      <div className="px-4 pb-4 text-gray-600 dark:text-gray-300">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentationSections.map((section, index) => (
                <div key={index} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm theme-transition">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Need Additional Help?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our support team is here to help you with any questions or issues.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="text-center p-6 border border-gray-200 dark:border-dark-600 rounded-lg">
                  <MessageCircle className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Live Chat</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Get instant help from our support team
                  </p>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 theme-transition">
                    Start Chat
                  </button>
                </div>

                <div className="text-center p-6 border border-gray-200 dark:border-dark-600 rounded-lg">
                  <FileText className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Submit Ticket</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Create a support ticket for detailed assistance
                  </p>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 theme-transition">
                    Create Ticket
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Email:</strong> support@bptm.com
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;