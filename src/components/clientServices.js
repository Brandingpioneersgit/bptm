// Client Services and Scope Management

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
  "Consulting"
];

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
  "Consulting": "As needed"
};

// Default client structure for repository
export const EMPTY_CLIENT = {
  name: "",
  team: "Web",
  status: "Active",
  client_type: "Standard",
  services: [], // Array of service objects: {service: string, frequency: string, notes: string}
  contact_email: "",
  contact_phone: "",
  start_date: "",
  scope_notes: "",
  created_at: "",
  updated_at: ""
};

// Utility function to create service object
export const createServiceObject = (service, frequency = null, notes = "") => ({
  service,
  frequency: frequency || SERVICE_FREQUENCY_DEFAULTS[service] || "Monthly",
  notes,
  added_date: new Date().toISOString()
});

// Function to check if client exists in repository
export const findClientInRepository = (clients, clientName) => {
  return clients.find(c => 
    c.name.toLowerCase().trim() === clientName.toLowerCase().trim()
  );
};

// Function to merge form client with repository client
export const mergeClientData = (repositoryClient, formClient) => ({
  ...repositoryClient,
  ...formClient,
  // Preserve repository data that shouldn't be overwritten
  id: repositoryClient.id,
  created_at: repositoryClient.created_at,
  services: repositoryClient.services || [],
  // Update timestamp
  updated_at: new Date().toISOString()
});
// Link an employee to a client with scope and frequency
export const linkEmployeeClient = async (supabase, { employee_id, client_id, scope, frequency }) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('employee_clients')
      .upsert({ employee_id, client_id, scope, frequency }, { onConflict: 'employee_id,client_id,scope' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error linking employee and client:', error);
    return null;
  }
};

// Fetch clients linked to an employee. If no employee_id provided, returns all links
export const fetchEmployeeClients = async (supabase, employee_id = null) => {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('employee_clients')
      .select('*, clients(*)');
    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employee clients:', error);
    return [];
  }
};

