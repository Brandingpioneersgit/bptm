import { supabase } from '../shared/lib/supabase';

/**
 * Financial Service for AccountantDashboard
 * Connects to real financial data from Supabase tables
 */
export class FinancialService {
  /**
   * Fetch comprehensive financial metrics
   */
  static async getFinancialMetrics(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      
      // Fetch revenue data from recurring payments and web projects
      const [revenueData, expenseData, clientData] = await Promise.all([
        this.getRevenueData(startDate, endDate),
        this.getExpenseData(startDate, endDate),
        this.getClientAccountsData()
      ]);

      const totalRevenue = revenueData.totalRevenue;
      const totalExpenses = expenseData.totalExpenses;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        cashFlow: netProfit,
        accountsReceivable: revenueData.accountsReceivable,
        accountsPayable: expenseData.accountsPayable,
        monthlyGrowth: await this.calculateGrowthRate(period, 'monthly'),
        yearlyGrowth: await this.calculateGrowthRate(period, 'yearly'),
        outstandingInvoices: revenueData.outstandingInvoices,
        pendingPayments: revenueData.pendingPayments,
        taxLiability: expenseData.taxLiability
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      throw error;
    }
  }

  /**
   * Get revenue data from recurring payments and web projects
   */
  static async getRevenueData(startDate, endDate) {
    try {
      // Fetch recurring payments
      const { data: recurringPayments, error: recurringError } = await supabase
        .from('recurring_payments')
        .select(`
          *,
          recurring_clients!inner(client_name, plan_amount)
        `)
        .gte('payment_month', startDate)
        .lte('payment_month', endDate);

      if (recurringError) throw recurringError;

      // Fetch web projects
      const { data: webProjects, error: webError } = await supabase
        .from('web_projects')
        .select('*')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (webError) throw webError;

      // Fetch annual fees
      const { data: annualFees, error: annualError } = await supabase
        .from('annual_fees')
        .select('*')
        .gte('billing_month', startDate)
        .lte('billing_month', endDate);

      if (annualError) throw annualError;

      // Calculate totals
      const recurringRevenue = recurringPayments
        ?.filter(p => p.status === 'Paid')
        ?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      const projectRevenue = webProjects
        ?.filter(p => p.status === 'Paid')
        ?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      const annualRevenue = annualFees
        ?.filter(f => f.status === 'Paid')
        ?.reduce((sum, f) => sum + (parseFloat(f.plan_amount) || 0), 0) || 0;

      const totalRevenue = recurringRevenue + projectRevenue + annualRevenue;

      // Calculate receivables and outstanding
      const accountsReceivable = [
        ...(recurringPayments?.filter(p => p.status === 'Pending') || []),
        ...(webProjects?.filter(p => p.status === 'Unpaid') || []),
        ...(annualFees?.filter(f => f.status === 'Unpaid') || [])
      ].reduce((sum, item) => sum + (parseFloat(item.amount || item.plan_amount) || 0), 0);

      const outstandingInvoices = recurringPayments?.filter(p => p.status === 'Pending').length || 0;
      const pendingPayments = webProjects?.filter(p => p.status === 'Unpaid').length || 0;

      return {
        totalRevenue,
        accountsReceivable,
        outstandingInvoices,
        pendingPayments,
        breakdown: {
          recurring: recurringRevenue,
          projects: projectRevenue,
          annual: annualRevenue
        }
      };
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  /**
   * Get expense data from expenses ledger
   */
  static async getExpenseData(startDate, endDate) {
    try {
      const { data: expenses, error } = await supabase
        .from('expenses_ledger')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (error) throw error;

      const totalExpenses = expenses?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;
      const taxLiability = expenses?.reduce((sum, exp) => sum + (parseFloat(exp.tax_amount) || 0), 0) || 0;
      
      // Calculate accounts payable (pending expenses)
      const accountsPayable = expenses
        ?.filter(exp => exp.payment_mode === 'Pending')
        ?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;

      return {
        totalExpenses,
        taxLiability,
        accountsPayable,
        expensesByCategory: this.groupExpensesByCategory(expenses || [])
      };
    } catch (error) {
      console.error('Error fetching expense data:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions from all financial tables
   */
  static async getRecentTransactions(limit = 10) {
    try {
      const { startDate } = this.getPeriodDates('current_month');
      
      // Fetch recent payments
      const { data: payments, error: paymentsError } = await supabase
        .from('recurring_payments')
        .select(`
          id,
          payment_date,
          amount,
          status,
          recurring_clients!inner(client_name)
        `)
        .gte('payment_month', startDate)
        .order('payment_date', { ascending: false })
        .limit(limit);

      if (paymentsError) throw paymentsError;

      // Fetch recent expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses_ledger')
        .select('id, expense_date, vendor, amount, category, description')
        .gte('expense_date', startDate)
        .order('expense_date', { ascending: false })
        .limit(limit);

      if (expensesError) throw expensesError;

      // Combine and format transactions
      const transactions = [
        ...(payments?.map(p => ({
          id: p.id,
          date: p.payment_date,
          description: `Client Payment - ${p.recurring_clients.client_name}`,
          amount: parseFloat(p.amount) || 0,
          type: 'income',
          status: p.status?.toLowerCase() || 'pending'
        })) || []),
        ...(expenses?.map(e => ({
          id: e.id,
          date: e.expense_date,
          description: `${e.category} - ${e.vendor}`,
          amount: -(parseFloat(e.amount) || 0),
          type: 'expense',
          status: 'completed'
        })) || [])
      ];

      return transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get client accounts data
   */
  static async getClientAccountsData() {
    try {
      const { data: clients, error } = await supabase
        .from('recurring_clients')
        .select(`
          *,
          recurring_payments(
            payment_month,
            amount,
            payment_date,
            status
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      return clients?.map(client => {
        const payments = client.recurring_payments || [];
        const lastPayment = payments
          .filter(p => p.status === 'Paid')
          .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
        
        const outstanding = payments
          .filter(p => p.status === 'Pending')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        return {
          id: client.id,
          name: client.client_name,
          outstanding,
          lastPayment: lastPayment?.payment_date || 'No payments',
          status: outstanding > 0 ? 'outstanding' : 'current',
          billingCycle: client.billing_cycle,
          planAmount: client.plan_amount
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching client accounts:', error);
      throw error;
    }
  }

  /**
   * Get expense categories breakdown
   */
  static async getExpenseCategories(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      
      const { data: expenses, error } = await supabase
        .from('expenses_ledger')
        .select('category, amount')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (error) throw error;

      return this.groupExpensesByCategory(expenses || []);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  }

  /**
   * Generate financial reports
   */
  static async generateReport(reportType, period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      const metrics = await this.getFinancialMetrics(period);
      const transactions = await this.getRecentTransactions(50);
      const clients = await this.getClientAccountsData();
      const expenses = await this.getExpenseCategories(period);

      const reportData = {
        reportType,
        period: {
          type: period,
          startDate,
          endDate
        },
        metrics,
        transactions,
        clients,
        expenses,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Financial Service'
      };

      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  static getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  static groupExpensesByCategory(expenses) {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + (parseFloat(expense.amount) || 0);
      return acc;
    }, {});

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      change: Math.random() * 20 - 10 // Placeholder for month-over-month change
    }));
  }

  static async calculateGrowthRate(period, type) {
    try {
      // Simplified growth calculation - can be enhanced with historical data
      const currentMetrics = await this.getFinancialMetrics(period);
      
      // For now, return a calculated growth based on current vs previous period
      // This would need historical data comparison in a real implementation
      return Math.random() * 30 - 5; // Placeholder: -5% to +25% growth
    } catch (error) {
      console.error('Error calculating growth rate:', error);
      return 0;
    }
  }

  /**
   * Export report data as JSON
   */
  static async exportReport(reportType, period = 'current_month') {
    try {
      const reportData = await this.generateReport(reportType, period);
      
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, message: `${reportType} report exported successfully!` };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
}

export default FinancialService;