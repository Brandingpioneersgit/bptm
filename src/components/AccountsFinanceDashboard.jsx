import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, Target, BarChart3, PieChart, Users, Building2 } from 'lucide-react';
import { supabase } from '../shared/lib/supabase';

const AccountsFinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('accounts_executive'); // accounts_executive, accounts_lead, finance_manager, admin
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [recurringClients, setRecurringClients] = useState([]);
  const [webProjects, setWebProjects] = useState([]);
  const [annualFees, setAnnualFees] = useState([]);
  const [compliance, setCompliance] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [performance, setPerformance] = useState({});

  // Load accounts and finance data from database
  useEffect(() => {
    const loadAccountsData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('accounts_users')
          .select('*')
          .eq('role', userRole)
          .single();

        // Fetch recurring clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('recurring_clients')
          .select('*')
          .order('client_name');

        // Fetch web projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('web_projects')
          .select('*')
          .order('invoice_date', { ascending: false });

        // Fetch annual fees
        const { data: feesData, error: feesError } = await supabase
          .from('annual_fees')
          .select('*')
          .order('billing_month', { ascending: false });

        // Fetch compliance data
        const { data: complianceData, error: complianceError } = await supabase
          .from('compliance_tracking')
          .select('*')
          .order('month', { ascending: false });

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('accounts_expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        // Fetch performance data
        const { data: performanceData, error: performanceError } = await supabase
          .from('accounts_performance')
          .select('*')
          .eq('month', selectedMonth)
          .single();

        // Handle errors and fallback to mock data
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          const mockUser = {
            id: 'af001',
            name: 'Priya Sharma',
            role: userRole,
            employee_id: 'AF001'
          };
          setUser(mockUser);
        } else {
          setUser(userData);
        }

        if (clientsError || !clientsData) {
          console.error('Error fetching clients:', clientsError);
          const mockRecurringClients = [
    {
      id: '1',
      client_name: 'TechCorp Solutions',
      billing_cycle: 'Monthly',
      plan_amount: 50000,
      due_day: 5,
      po_contract_number: 'PO-2024-001',
      am_owner: 'Amit Singh',
      payments: {
        '2024-01': { amount: 50000, payment_date: '2024-01-05', bank: 'HDFC - Medappz', status: 'Paid' },
        '2024-02': { amount: 50000, payment_date: '2024-02-06', bank: 'HDFC BP', status: 'Paid' },
        '2024-03': { amount: 50000, payment_date: null, bank: null, status: 'Pending' }
      }
    },
    {
      id: '2',
      client_name: 'Digital Marketing Pro',
      billing_cycle: 'Monthly',
      plan_amount: 75000,
      due_day: 10,
      po_contract_number: 'PO-2024-002',
      am_owner: 'Neha Verma',
      payments: {
        '2024-01': { amount: 75000, payment_date: '2024-01-08', bank: 'AXIS BP', status: 'Paid' },
        '2024-02': { amount: 75000, payment_date: '2024-02-12', bank: 'Kotak BP', status: 'Paid' },
        '2024-03': { amount: 75000, payment_date: null, bank: null, status: 'Overdue' }
      }
    }
          ];
          setRecurringClients(mockRecurringClients);
        } else {
          setRecurringClients(clientsData);
        }

        if (projectsError || !projectsData) {
          console.error('Error fetching projects:', projectsError);
          const mockWebProjects = [
    {
      id: '1',
      invoice_number: 'INV-2024-001',
      client_name: 'E-commerce Startup',
      scope_milestone: 'Website Development - Phase 1',
      amount: 150000,
      invoice_date: '2024-02-01',
      due_date: '2024-02-15',
      payment_date: '2024-02-14',
      bank: 'HDFC - Medappz',
      status: 'Paid',
      remarks: 'Payment received on time'
    },
    {
      id: '2',
      invoice_number: 'INV-2024-002',
      client_name: 'Healthcare App',
      scope_milestone: 'Mobile App Development',
      amount: 200000,
      invoice_date: '2024-02-15',
      due_date: '2024-03-01',
      payment_date: null,
      bank: null,
      status: 'Unpaid',
      remarks: 'Follow up required'
    }
          ];
          setWebProjects(mockWebProjects);
        } else {
          setWebProjects(projectsData);
        }

        if (feesError || !feesData) {
          console.error('Error fetching fees:', feesError);
          const mockAnnualFees = [
    {
      id: '1',
      client_name: 'TechCorp Solutions',
      plan_amount: 25000,
      billing_month: '2024-03',
      invoice_date: '2024-03-01',
      payment_date: '2024-03-05',
      bank: 'HDFC BP',
      status: 'Paid'
    }
          ];
          setAnnualFees(mockAnnualFees);
        } else {
          setAnnualFees(feesData);
        }

        if (complianceError || !complianceData) {
          console.error('Error fetching compliance:', complianceError);
          const mockCompliance = {
    '2024-02': {
      bookkeeping_monthly: true,
      tds_deposit_monthly: true,
      gst_filing_monthly: true,
      pf_esi_monthly: true,
      quarterly_advance_tax_q4: true,
      itr_filing_annual: false,
      completion_percentage: 83.33,
      notes: 'All monthly tasks completed. Q4 advance tax filed.'
    }
          };
          setCompliance(mockCompliance);
        } else {
          // Transform compliance data array to object
          const complianceObj = {};
          complianceData.forEach(item => {
            complianceObj[item.month] = item;
          });
          setCompliance(complianceObj);
        }

        if (expensesError || !expensesData) {
          console.error('Error fetching expenses:', expensesError);
          const mockExpenses = [
    {
      id: '1',
      expense_date: '2024-02-05',
      vendor: 'Office Supplies Ltd',
      category: 'Office Expenses',
      description: 'Stationery and printing materials',
      amount: 5000,
      tax_amount: 900,
      payment_mode: 'HDFC BP',
      invoice_number: 'OSL-2024-001'
    },
    {
      id: '2',
      expense_date: '2024-02-10',
      vendor: 'Software Solutions',
      category: 'Software Licenses',
      description: 'Annual subscription renewal',
      amount: 25000,
      tax_amount: 4500,
      payment_mode: 'AXIS BP',
      invoice_number: 'SS-2024-002'
    }
          ];
          setExpenses(mockExpenses);
        } else {
          setExpenses(expensesData);
        }

        if (performanceError || !performanceData) {
          console.error('Error fetching performance:', performanceError);
          const mockPerformance = {
    current_month_score: 87,
    collections_score: 35,
    compliance_score: 29,
    accuracy_score: 15,
    expense_score: 8,
    invoices_due: 325000,
    invoices_received: 275000,
    ontime_recovery_rate: 92,
    compliance_rate: 83.33,
    total_expenses: 30000,
    net_collections: 245000,
    performance_band: 'Good',
    total_penalties: 0
          };
          setPerformance(mockPerformance);
        } else {
          setPerformance(performanceData);
        }
      } catch (error) {
        console.error('Error loading accounts data:', error);
        // Set fallback data on error
        setUser({ id: 'af001', name: 'Priya Sharma', role: userRole, employee_id: 'AF001' });
        setRecurringClients([]);
        setWebProjects([]);
        setAnnualFees([]);
        setCompliance({});
        setExpenses([]);
        setPerformance({ current_month_score: 0, performance_band: 'No Data' });
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountsData();
  }, [userRole, selectedMonth]);

  const bankOptions = ['HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP'];
  const paymentModeOptions = [...bankOptions, 'Cash', 'Card', 'UPI'];
  const expenseCategories = ['Office Expenses', 'Software Licenses', 'Travel', 'Marketing', 'Utilities', 'Professional Services'];

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      case 'Partial': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceBandColor = (band) => {
    switch (band) {
      case 'Excellent': return 'text-green-700 bg-green-100';
      case 'Good': return 'text-blue-700 bg-blue-100';
      case 'Satisfactory': return 'text-yellow-700 bg-yellow-100';
      case 'Needs Improvement': return 'text-orange-700 bg-orange-100';
      case 'Poor': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Month Score</p>
              <p className="text-2xl font-bold text-gray-900">{performance.current_month_score}/100</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceBandColor(performance.performance_band)}`}>
                  {performance.performance_band}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collections Rate</p>
              <p className="text-2xl font-bold text-gray-900">{performance.ontime_recovery_rate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">On-time Recovery</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{performance.compliance_rate}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Monthly Tasks</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Collections</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance.net_collections)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">This Month</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown (100 Points)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{performance.collections_score}/40</div>
            <div className="text-sm text-gray-600">Collections & Timeliness</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(performance.collections_score/40)*100}%`}}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{performance.compliance_score}/35</div>
            <div className="text-sm text-gray-600">Compliance</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: `${(performance.compliance_score/35)*100}%`}}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{performance.accuracy_score}/15</div>
            <div className="text-sm text-gray-600">Accuracy & Hygiene</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{width: `${(performance.accuracy_score/15)*100}%`}}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{performance.expense_score}/10</div>
            <div className="text-sm text-gray-600">Expense Discipline</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{width: `${(performance.expense_score/10)*100}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-3">Pending Payments</h4>
          <div className="space-y-2">
            {recurringClients.map(client => {
              const currentMonth = '2024-03';
              const payment = client.payments[currentMonth];
              if (payment && payment.status !== 'Paid') {
                return (
                  <div key={client.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{client.client_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-3">Compliance Tasks</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Monthly Bookkeeping</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">TDS Deposit</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">GST Filing</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Expenses</h4>
          <div className="space-y-2">
            {expenses.slice(0, 3).map(expense => (
              <div key={expense.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate">{expense.description}</span>
                <span className="font-medium">{formatCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const RecurringMarketingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Recurring Marketing Payments</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Cycle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Day</th>
                {months.map(month => (
                  <th key={month} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurringClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.client_name}</div>
                      <div className="text-sm text-gray-500">AM: {client.am_owner}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.billing_cycle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(client.plan_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.due_day}</td>
                  {months.map((month, index) => {
                    const monthKey = `2024-${String(index + 1).padStart(2, '0')}`;
                    const payment = client.payments[monthKey];
                    return (
                      <td key={month} className="px-3 py-4 text-center">
                        {payment ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{formatCurrency(payment.amount || 0)}</div>
                            <div className="text-xs text-gray-500">{payment.payment_date || 'Pending'}</div>
                            <div className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const WebProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Web Projects & Annual Fees</h2>
        <div className="space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add Project
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Add Annual Fee
          </button>
        </div>
      </div>

      {/* Web Projects */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Web Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope/Milestone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {webProjects.map(project => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.client_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.scope_milestone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(project.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.due_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.payment_date || 'Pending'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.bank || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Fees */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Annual Fees (Server & Maintenance)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {annualFees.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.client_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(fee.plan_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.billing_month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.invoice_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.payment_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.bank}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ComplianceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Compliance Tracker</h2>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="2024-02">February 2024</option>
          <option value="2024-03">March 2024</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Compliance Tasks</h3>
          <p className="text-sm text-gray-600 mt-1">Track completion of statutory and regulatory requirements</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Monthly Tasks */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Monthly Tasks</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Bookkeeping</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">TDS Deposit</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">GST Filing</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">PF/ESI</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Quarterly Tasks */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Quarterly Tasks</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Q1 Advance Tax</span>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Q2 Advance Tax</span>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Q3 Advance Tax</span>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Q4 Advance Tax</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Annual Tasks */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Annual Tasks</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">ITR Filing</span>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Completion</span>
              <span className="text-lg font-bold text-gray-900">{compliance['2024-02']?.completion_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className="bg-blue-600 h-3 rounded-full" 
                style={{width: `${compliance['2024-02']?.completion_percentage || 0}%`}}
              ></div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Notes & Evidence</h4>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              rows="3"
              placeholder="Add notes and evidence links..."
              defaultValue={compliance['2024-02']?.notes || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const ExpensesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Expenses Ledger</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.expense_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.vendor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(expense.tax_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.payment_mode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.invoice_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-2">Total Expenses</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance.total_expenses)}</p>
          <p className="text-sm text-gray-600 mt-1">This Month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-2">By Category</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Office Expenses</span>
              <span className="font-medium">{formatCurrency(5000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Software Licenses</span>
              <span className="font-medium">{formatCurrency(25000)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-2">Payment Modes</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">HDFC BP</span>
              <span className="font-medium">{formatCurrency(5000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">AXIS BP</span>
              <span className="font-medium">{formatCurrency(25000)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const KPIsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">KPIs & Performance Report</h2>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="2024-02">February 2024</option>
          <option value="2024-03">March 2024</option>
        </select>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invoices Due</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance.invoices_due)}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invoices Received</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance.invoices_received)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-time Recovery</p>
              <p className="text-2xl font-bold text-gray-900">{performance.ontime_recovery_rate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Collections</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(performance.net_collections)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Detailed Scoring */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Performance Scoring (100 Points)</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Collections & Timeliness */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">1. Collections & Timeliness (40 points)</h4>
                <span className="text-lg font-bold text-blue-600">{performance.collections_score}/40</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>On-time Recovery Rate: {performance.ontime_recovery_rate}%</span>
                <span className="font-medium">Score: {performance.collections_score}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(performance.collections_score/40)*100}%`}}></div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">2. Compliance (35 points)</h4>
                <span className="text-lg font-bold text-green-600">{performance.compliance_score}/35</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monthly Completion:</span>
                    <span className="font-medium ml-2">{performance.compliance_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quarterly Tax:</span>
                    <span className="font-medium ml-2">On Time</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ITR Filing:</span>
                    <span className="font-medium ml-2">Pending</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: `${(performance.compliance_score/35)*100}%`}}></div>
                </div>
              </div>
            </div>

            {/* Accuracy & Hygiene */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">3. Accuracy & Hygiene (15 points)</h4>
                <span className="text-lg font-bold text-purple-600">{performance.accuracy_score}/15</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bank Mispostings:</span>
                    <span className="font-medium ml-2">0</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invoices Reconciled:</span>
                    <span className="font-medium ml-2">100%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Proofs Uploaded:</span>
                    <span className="font-medium ml-2">100%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: `${(performance.accuracy_score/15)*100}%`}}></div>
                </div>
              </div>
            </div>

            {/* Expense Discipline */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">4. Expense Discipline (10 points)</h4>
                <span className="text-lg font-bold text-orange-600">{performance.expense_score}/10</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Report Submitted On Time:</span>
                    <span className="font-medium ml-2">Yes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bills Complete:</span>
                    <span className="font-medium ml-2">Partial</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-orange-600 h-2 rounded-full" style={{width: `${(performance.expense_score/10)*100}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Penalties */}
          {performance.total_penalties > 0 && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Penalties Applied</h4>
              <div className="text-sm text-red-700">
                <div>Total Penalties: -{performance.total_penalties} points</div>
              </div>
            </div>
          )}

          {/* Final Score */}
          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-blue-900">Final Score</h4>
                <p className="text-sm text-blue-700">Performance Band: {performance.performance_band}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900">{performance.current_month_score}/100</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, component: OverviewTab },
    { id: 'recurring', name: 'Recurring Marketing', icon: Calendar, component: RecurringMarketingTab },
    { id: 'projects', name: 'Web Projects', icon: Building2, component: WebProjectsTab },
    { id: 'compliance', name: 'Compliance', icon: CheckCircle, component: ComplianceTab },
    { id: 'expenses', name: 'Expenses', icon: DollarSign, component: ExpensesTab },
    { id: 'kpis', name: 'KPIs & Reports', icon: TrendingUp, component: KPIsTab }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accounts & Finance Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.name} ({user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceBandColor(performance.performance_band)}`}>
                {performance.performance_band}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{performance.current_month_score}/100</div>
                <div className="text-xs text-gray-500">Current Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AccountsFinanceDashboard;