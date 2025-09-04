// Script to add dummy payment data for existing clients
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random date within a month
const getRandomDateInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  date.setDate(Math.floor(Math.random() * 28) + 1); // Random day between 1-28
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Main function to add dummy payment data
async function addDummyPaymentData() {
  try {
    console.log('Fetching existing clients...');
    
    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, monthly_retainer, contract_start_date')
      .eq('status', 'Active');
    
    if (clientsError) {
      throw clientsError;
    }
    
    // If no clients exist, create sample clients
    let clientsToUse = clients;
    if (!clients || clients.length === 0) {
      console.log('No existing clients found. Creating sample clients...');
      
      const sampleClients = [
        { name: 'TechCorp Solutions', team: 'Marketing', monthly_retainer: 50000, status: 'Active', contact_person: 'Amit Singh' },
        { name: 'Digital Marketing Pro', team: 'Marketing', monthly_retainer: 75000, status: 'Active', contact_person: 'Neha Verma' },
        { name: 'E-commerce Giant', team: 'Web', monthly_retainer: 200000, status: 'Active', contact_person: 'Rohit Jain' },
        { name: 'Healthcare Innovations', team: 'Marketing', monthly_retainer: 60000, status: 'Active', contact_person: 'Priya Sharma' },
        { name: 'Retail Solutions', team: 'Marketing', monthly_retainer: 45000, status: 'Active', contact_person: 'Vikram Patel' },
        { name: 'Education Tech', team: 'Web', monthly_retainer: 55000, status: 'Active', contact_person: 'Ananya Gupta' },
        { name: 'Travel Portal', team: 'Web', monthly_retainer: 65000, status: 'Active', contact_person: 'Rahul Mehta' },
        { name: 'Food Delivery App', team: 'Marketing', monthly_retainer: 80000, status: 'Active', contact_person: 'Deepak Verma' }
      ];
      
      const { data: newClients, error: insertError } = await supabase
        .from('clients')
        .upsert(sampleClients, { onConflict: 'name' })
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`Created ${newClients.length} sample clients`);
      
      // Use the newly created clients
      clientsToUse = newClients;
    }
    
    console.log(`Found ${clientsToUse.length} clients. Adding payment data...`);
    
    // Get current and previous month in YYYY-MM-01 format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const prevMonth = new Date(now);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const previousMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Possible status values and banks
    const statusOptions = ['Paid', 'Partial', 'Pending', 'Overdue'];
    const bankOptions = ['HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP'];
    
    // We'll use a temporary in-memory approach for payment data
    console.log('Using in-memory approach for payment data...');
    
    // Assign due days to clients based on their id
    const assignDueDay = (clientId) => {
      // Use the client ID to generate a consistent due day between 1-28
      const idSum = clientId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return (idSum % 28) + 1; // 1-28 range for due day
    };
    
    // For each client, add a due_day property if it doesn't exist
    clientsToUse = clientsToUse.map(client => ({
      ...client,
      due_day: client.due_day || assignDueDay(client.id),
      plan_amount: client.monthly_retainer || 50000 // Use monthly_retainer or default to 50000
    }));
    
    console.log(`Prepared ${clientsToUse.length} clients for payment data...`);
    
    // Create payment records for each client
    const paymentRecords = [];
    
    // For current month
    for (const client of clientsToUse) {
      const status = getRandomElement(statusOptions);
      const isPaid = status === 'Paid' || status === 'Partial';
      const paymentDate = isPaid ? getRandomDateInMonth(now.getFullYear(), now.getMonth()) : null;
      const bank = isPaid ? getRandomElement(bankOptions) : null;
      const amount = status === 'Partial' ? client.monthly_retainer * (0.5 + Math.random() * 0.3) : client.monthly_retainer;
      
      let remarks = '';
      if (status === 'Overdue') remarks = 'Payment delayed';
      else if (status === 'Partial') remarks = 'Partial payment received';
      else if (status === 'Paid') remarks = 'Full payment received';
      
      paymentRecords.push({
        client_id: client.id,
        payment_month: currentMonth,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        payment_date: paymentDate,
        bank,
        status,
        remarks
      });
    }
    
    // For previous month (mostly paid)
    for (const client of clientsToUse) {
      // 80% chance of being paid for previous month
      const status = Math.random() < 0.8 ? 'Paid' : getRandomElement(['Partial', 'Overdue']);
      const isPaid = status === 'Paid' || status === 'Partial';
      const paymentDate = isPaid ? getRandomDateInMonth(prevMonth.getFullYear(), prevMonth.getMonth()) : null;
      const bank = isPaid ? getRandomElement(bankOptions) : null;
      const amount = status === 'Partial' ? client.monthly_retainer * (0.5 + Math.random() * 0.3) : client.monthly_retainer;
      
      let remarks = '';
      if (status === 'Overdue') remarks = 'Payment delayed';
      else if (status === 'Partial') remarks = 'Partial payment received';
      else if (status === 'Paid') remarks = 'Full payment received';
      
      paymentRecords.push({
        client_id: client.id,
        payment_month: previousMonth,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        payment_date: paymentDate,
        bank,
        status,
        remarks
      });
    }
    
    // Save payment records to a local JSON file
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'src', 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save payment data to JSON file
      const paymentDataFile = path.join(dataDir, 'client_payments.json');
      await fs.writeFile(paymentDataFile, JSON.stringify(paymentRecords, null, 2));
      
      console.log(`Successfully saved ${paymentRecords.length} payment records to ${paymentDataFile}`);
      
      // Also save client data with due days for reference
      const clientDataFile = path.join(dataDir, 'client_data.json');
      await fs.writeFile(clientDataFile, JSON.stringify(clientsToUse, null, 2));
      
      console.log(`Successfully saved ${clientsToUse.length} client records to ${clientDataFile}`);
    } catch (error) {
      console.log('Error saving payment data to file:', error);
    }
    
    console.log('Dummy payment data has been added successfully!');
    
  } catch (error) {
    console.error('Error adding dummy payment data:', error);
  }
}

// Run the main function
addDummyPaymentData();