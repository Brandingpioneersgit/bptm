export const CLIENT_SERVICES = [
  "Website Development",
  "Website Maintenance", 
  "SEO",
  "Google Ads",
  "Meta Ads",
  "Social Media Management",
  "Content Creation",
  "Graphic Design",
  "Video Production",
  "Email Marketing",
  "Analytics & Reporting",
  "Lead Generation",
  "E-commerce Management",
  "Technical Support",
  "Consulting",
  "AI Tools"
];

// Team-based service configurations
export const TEAM_SERVICES = {
  "Web": [
    "Website Development",
    "Website Maintenance",
    "AI Tools",
    "Technical Support",
    "E-commerce Management",
    "SEO",
    "Analytics & Reporting"
  ],
  "Marketing": [
    "Website Development",
    "SEO",
    "Google Ads",
    "Meta Ads",
    "Social Media Management",
    "Content Creation",
    "Graphic Design",
    "Video Production",
    "Email Marketing",
    "Analytics & Reporting",
    "Lead Generation"
  ],
  "Website": [
    "Website Development",
    "Website Maintenance",
    "Technical Support"
  ]
};

// Get available services for a specific team
export const getServicesForTeam = (team) => {
  return TEAM_SERVICES[team] || CLIENT_SERVICES;
};

export const DELIVERY_FREQUENCIES = [
  "Daily",
  "Weekly", 
  "Bi-weekly",
  "Monthly",
  "Quarterly", 
  "As needed",
  "One-time",
  "Project-based"
];

export const SERVICE_FREQUENCY_DEFAULTS = {
  "Website Development": "Project-based",
  "Website Maintenance": "Monthly",
  "SEO": "Monthly", 
  "Google Ads": "Weekly",
  "Meta Ads": "Weekly",
  "Social Media Management": "Daily",
  "Content Creation": "Weekly",
  "Graphic Design": "As needed",
  "Video Production": "Monthly",
  "Email Marketing": "Weekly",
  "Analytics & Reporting": "Monthly",
  "Lead Generation": "Weekly",
  "E-commerce Management": "Daily",
  "Technical Support": "As needed",
  "Consulting": "As needed",
  "AI Tools": "Monthly"
};

export const EMPTY_CLIENT = {
  name: "",
  team: "Web",
  status: "Active",
  client_type: "Standard",
  services: [],
  contact_email: "",
  contact_phone: "",
  start_date: "",
  scope_notes: "",
  logo_url: "",
  brand_colors: "",
  created_at: "",
  updated_at: ""
};

export const createServiceObject = (service, frequency = null, notes = "") => ({
  service,
  frequency: frequency || SERVICE_FREQUENCY_DEFAULTS[service] || "Monthly",
  notes,
  added_date: new Date().toISOString()
});

export const findClientInRepository = (clients, clientName) => {
  return clients.find(c => 
    c.name.toLowerCase().trim() === clientName.toLowerCase().trim()
  );
};

export const mergeClientData = (repositoryClient, formClient) => ({
  ...repositoryClient,
  ...formClient,
  id: repositoryClient.id,
  created_at: repositoryClient.created_at,
  services: repositoryClient.services || [],
  updated_at: new Date().toISOString()
});

