import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  FileText, 
  PieChart, 
  BarChart3, 
  CreditCard, 
  Wallet, 
  Receipt, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Building, 
  Calendar, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Plus, 
  Filter, 
  Search, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  CreditCard as Card2,
  Landmark,
  ShoppingCart
} from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { supabase } from '../../shared/lib/supabase';
import DashboardLayout from '../layouts/DashboardLayout';
import { FinancialService } from '../../services/financialService';
import { useToast } from '../../shared/components/Toast';
import { exportReport, reportUtils } from '../../utils/reportGenerator';

const AccountantDashboard = () => {
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    monthlyGrowth: 0,
    yearlyGrowth: 0,
    outstandingInvoices: 0,
    pendingPayments: 0,
    taxLiability: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load financial data from FinancialService
  useEffect(() => {
    const loadFinancialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [metrics, transactions, clients, expenses] = await Promise.all([
          FinancialService.getFinancialMetrics(selectedPeriod),
          FinancialService.getRecentTransactions(10),
          FinancialService.getClientAccountsData(),
          FinancialService.getExpenseCategories(selectedPeriod)
        ]);

        setFinancialMetrics(metrics);
        setRecentTransactions(transactions);
        setClientAccounts(clients);
        setExpenseCategories(expenses);
      } catch (error) {
        console.error('Error loading financial data:', error);
        setError('Failed to load financial data. Please try again.');
        notify('Failed to load financial data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadFinancialData();
  }, [selectedPeriod, notify]);

  // Handler functions for button actions
  const handleExportReport = async () => {
    try {
      setIsLoading(true);
      const result = await FinancialService.exportReport('financial-overview', selectedPeriod);
      notify(result.message, 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      notify('Failed to export report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'invoice':
        alert('Invoice generation feature will be implemented. This would open a form to create new invoices.');
        break;
      case 'expense':
        alert('Expense recording feature will be implemented. This would open a form to record new expenses.');
        break;
      case 'report':
        alert('Financial report generation feature will be implemented. This would open report configuration options.');
        break;
      case 'reconciliation':
        alert('Bank reconciliation feature will be implemented. This would open bank statement matching interface.');
        break;
      case 'budget':
        alert('Budget analysis feature will be implemented. This would open budget vs actual comparison tools.');
        break;
      default:
        alert('Feature coming soon!');
    }
  };

  const handleTransactionAction = (transaction, action) => {
    switch (action) {
      case 'view':
        setSelectedTransaction(transaction);
        alert(`Viewing transaction: ${transaction.description}\nAmount: ${formatCurrency(Math.abs(transaction.amount))}\nDate: ${transaction.date}\nStatus: ${transaction.status}`);
        break;
      case 'edit':
        alert(`Edit transaction feature will be implemented for: ${transaction.description}`);
        break;
      default:
        alert('Action not recognized');
    }
  };

  const handleAccountAction = (account, action) => {
    switch (action) {
      case 'view':
        setSelectedAccount(account);
        alert(`Viewing account: ${account.name}\nOutstanding: ${formatCurrency(account.outstanding)}\nLast Payment: ${account.lastPayment}\nStatus: ${account.status}`);
        break;
      case 'invoice':
        alert(`Generate invoice feature will be implemented for: ${account.name}`);
        break;
      default:
        alert('Action not recognized');
    }
  };

  const handleGenerateReport = async (reportType) => {
    const reports = {
      'pl': 'Profit & Loss Statement',
      'cashflow': 'Cash Flow Report',
      'tax': 'Tax Report'
    };
    
    try {
      setIsLoading(true);
      notify(`Generating ${reports[reportType]}...`, 'info');
      
      // Prepare report data based on type
      let reportData = {};
      
      switch (reportType) {
        case 'pl':
          reportData = {
            month: selectedPeriod,
            generatedBy: user?.email || 'Accountant',
            metrics: {
              'Total Revenue': formatCurrency(financialData.revenue || 0),
              'Total Expenses': formatCurrency(financialData.expenses || 0),
              'Net Profit': formatCurrency((financialData.revenue || 0) - (financialData.expenses || 0)),
              'Profit Margin': `${(((financialData.revenue || 0) - (financialData.expenses || 0)) / (financialData.revenue || 1) * 100).toFixed(1)}%`
            },
            departmentBreakdown: financialData.departmentBreakdown || []
          };
          break;
        case 'cashflow':
          reportData = {
            month: selectedPeriod,
            generatedBy: user?.email || 'Accountant',
            metrics: {
              'Cash Inflow': formatCurrency(financialData.cashInflow || 0),
              'Cash Outflow': formatCurrency(financialData.cashOutflow || 0),
              'Net Cash Flow': formatCurrency((financialData.cashInflow || 0) - (financialData.cashOutflow || 0)),
              'Opening Balance': formatCurrency(financialData.openingBalance || 0)
            },
            departmentBreakdown: financialData.cashFlowBreakdown || []
          };
          break;
        case 'tax':
          reportData = {
            month: selectedPeriod,
            generatedBy: user?.email || 'Accountant',
            metrics: {
              'Taxable Income': formatCurrency(financialData.taxableIncome || 0),
              'Tax Liability': formatCurrency(financialData.taxLiability || 0),
              'Tax Paid': formatCurrency(financialData.taxPaid || 0),
              'Tax Due': formatCurrency((financialData.taxLiability || 0) - (financialData.taxPaid || 0))
            },
            departmentBreakdown: financialData.taxBreakdown || []
          };
          break;
      }
      
      const filename = reportUtils.generateFilename(`${reportType}-report`);
      const result = await exportReport(reportData, 'excel', 'monthlyReport', filename);
      
      if (result.success) {
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      notify(`Failed to generate ${reports[reportType]}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'current': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Finance & Accounting Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Finance & Accounting Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Accountant'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
            </select>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => handleExportReport()}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowNewEntryModal(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading financial data...</span>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financialMetrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{financialMetrics.monthlyGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(financialMetrics.totalExpenses)}</div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5.2% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialMetrics.netProfit)}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {financialMetrics.profitMargin}% margin
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              <Wallet className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(financialMetrics.cashFlow)}</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Positive trend
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Accounts Receivable</span>
                    <span className="font-bold text-green-600">{formatCurrency(financialMetrics.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Accounts Payable</span>
                    <span className="font-bold text-red-600">{formatCurrency(financialMetrics.accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Tax Liability</span>
                    <span className="font-bold text-orange-600">{formatCurrency(financialMetrics.taxLiability)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Outstanding Invoices</span>
                    <span className="font-bold text-blue-600">{financialMetrics.outstandingInvoices}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('invoice')}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('expense')}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Record Expense
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('report')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Financial Report
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('reconciliation')}
                  >
                    <Landmark className="h-4 w-4 mr-2" />
                    Bank Reconciliation
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('budget')}
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Budget Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={transaction.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {formatCurrency(Math.abs(transaction.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTransactionAction(transaction, 'view')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTransactionAction(transaction, 'edit')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(account.outstanding)}</TableCell>
                        <TableCell>{account.lastPayment}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(account.status)}>
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAccountAction(account, 'view')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAccountAction(account, 'invoice')}
                            >
                              <Receipt className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-sm text-gray-500">{category.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-bold">{formatCurrency(category.amount)}</div>
                        <div className={`text-sm flex items-center ${
                          category.change > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {category.change > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(category.change)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    P&L Statement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Generate comprehensive profit and loss statement</p>
                  <Button 
                    className="w-full"
                    onClick={() => handleGenerateReport('pl')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Cash Flow Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Analyze cash inflows and outflows</p>
                  <Button 
                    className="w-full"
                    onClick={() => handleGenerateReport('cashflow')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Tax Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Prepare tax calculations and filings</p>
                  <Button 
                    className="w-full"
                    onClick={() => handleGenerateReport('tax')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;