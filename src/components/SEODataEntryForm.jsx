/**
 * SEO Data Entry Form
 * Comprehensive form for entering monthly SEO performance data
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Info, Save, X } from 'lucide-react';
import seoApi from '@/api/seoApi';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { toast } from 'react-hot-toast';

const SEODataEntryForm = ({ entry, onClose, onSave }) => {
  const { user } = useUnifiedAuth();
  const [formData, setFormData] = useState({
    employee_id: '',
    client_id: '',
    month: '',
    // Deliverables
    deliverables_blogs: 0,
    deliverables_backlinks: 0,
    deliverables_onpage: 0,
    deliverables_techfixes: 0,
    notes: '',
    // Traffic (GSC/GA)
    gsc_organic_prev_30d: 0,
    gsc_organic_curr_30d: 0,
    ga_total_prev_30d: 0,
    ga_total_curr_30d: 0,
    // Rankings
    serp_top3_count: 0,
    serp_top10_count: 0,
    gmb_top3_count: 0,
    // Technical
    pagespeed_home: 0,
    pagespeed_service: 0,
    pagespeed_location: 0,
    sc_errors_home: 0,
    sc_errors_service: 0,
    sc_errors_location: 0,
    // Client Relationship
    client_meeting_date: '',
    interactions_count: 0,
    nps_client: null,
    mentor_score: null
  });
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadClients();
    if (entry) {
      setFormData({ ...entry });
      if (entry.client_id) {
        loadClientInfo(entry.client_id);
      }
    } else {
      setFormData(prev => ({ ...prev, employee_id: user?.id }));
    }
  }, [entry, user?.id]);

  const loadClients = async () => {
    try {
      const clientsData = await seoApi.getClients({ active: true });
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const loadClientInfo = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Load client info when client is selected
    if (field === 'client_id' && value) {
      loadClientInfo(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    const requiredFields = {
      client_id: 'Client is required',
      month: 'Month is required',
      gsc_organic_prev_30d: 'Previous organic traffic is required',
      gsc_organic_curr_30d: 'Current organic traffic is required',
      ga_total_prev_30d: 'Previous total traffic is required',
      ga_total_curr_30d: 'Current total traffic is required',
      pagespeed_home: 'Home page speed is required',
      pagespeed_service: 'Service page speed is required',
      pagespeed_location: 'Location page speed is required'
    };
    
    Object.keys(requiredFields).forEach(field => {
      if (!formData[field] && formData[field] !== 0) {
        newErrors[field] = requiredFields[field];
      }
    });
    
    // Validate ranges
    if (formData.nps_client && (formData.nps_client < 1 || formData.nps_client > 10)) {
      newErrors.nps_client = 'NPS must be between 1 and 10';
    }
    
    if (formData.mentor_score && (formData.mentor_score < 1 || formData.mentor_score > 10)) {
      newErrors.mentor_score = 'Mentor score must be between 1 and 10';
    }
    
    ['pagespeed_home', 'pagespeed_service', 'pagespeed_location'].forEach(field => {
      if (formData[field] && (formData[field] < 0 || formData[field] > 100)) {
        newErrors[field] = 'Page speed must be between 0 and 100';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    try {
      setLoading(true);
      
      if (entry?.id) {
        await seoApi.updateEntry(entry.id, formData);
        toast.success('Entry updated successfully');
      } else {
        await seoApi.createEntry(formData);
        toast.success('Entry created successfully');
      }
      
      onSave();
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast.error(error.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryTargets = () => {
    if (!selectedClient) return null;
    
    // Mock targets - in real app, these would come from config
    const targets = {
      Large: { blogs: 8, backlinks: 12, onpage: 6, techfixes: 3 },
      SMB: { blogs: 4, backlinks: 6, onpage: 3, techfixes: 1 }
    };
    
    return targets[selectedClient.type] || targets.SMB;
  };

  const renderTooltip = (text) => (
    <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Info className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );

  const targets = getDeliveryTargets();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry?.id ? 'Edit SEO Entry' : 'Add Previous Month Data'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Client *</Label>
                  <select
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={!!entry?.id}
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.type})
                      </option>
                    ))}
                  </select>
                  {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
                </div>
                
                <div>
                  <Label htmlFor="month">Month *</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', e.target.value)}
                    disabled={!!entry?.id}
                  />
                  {errors.month && <p className="text-sm text-red-600">{errors.month}</p>}
                </div>
              </div>
              
              {selectedClient && (
                <div className="flex items-center gap-2">
                  <Badge variant={selectedClient.type === 'Large' ? 'default' : 'secondary'}>
                    {selectedClient.type} Client
                  </Badge>
                  {targets && (
                    <span className="text-sm text-muted-foreground">
                      Monthly targets: {targets.blogs} blogs, {targets.backlinks} backlinks, 
                      {targets.onpage} on-page, {targets.techfixes} tech fixes
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deliverables</CardTitle>
              {renderTooltip('Enter the number of deliverables completed in the previous month')}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="deliverables_blogs">
                    Blogs {targets && `(Target: ${targets.blogs})`}
                  </Label>
                  <Input
                    id="deliverables_blogs"
                    type="number"
                    min="0"
                    value={formData.deliverables_blogs}
                    onChange={(e) => handleInputChange('deliverables_blogs', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliverables_backlinks">
                    Backlinks {targets && `(Target: ${targets.backlinks})`}
                  </Label>
                  <Input
                    id="deliverables_backlinks"
                    type="number"
                    min="0"
                    value={formData.deliverables_backlinks}
                    onChange={(e) => handleInputChange('deliverables_backlinks', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliverables_onpage">
                    On-page Tasks {targets && `(Target: ${targets.onpage})`}
                  </Label>
                  <Input
                    id="deliverables_onpage"
                    type="number"
                    min="0"
                    value={formData.deliverables_onpage}
                    onChange={(e) => handleInputChange('deliverables_onpage', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliverables_techfixes">
                    Tech Fixes {targets && `(Target: ${targets.techfixes})`}
                  </Label>
                  <Input
                    id="deliverables_techfixes"
                    type="number"
                    min="0"
                    value={formData.deliverables_techfixes}
                    onChange={(e) => handleInputChange('deliverables_techfixes', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about deliverables..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Traffic Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traffic Data (GSC/GA)</CardTitle>
              {renderTooltip('Enter 30-day traffic data from Google Search Console and Google Analytics')}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Google Search Console (Organic)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="gsc_organic_prev_30d">Previous 30 Days *</Label>
                      <Input
                        id="gsc_organic_prev_30d"
                        type="number"
                        min="0"
                        value={formData.gsc_organic_prev_30d}
                        onChange={(e) => handleInputChange('gsc_organic_prev_30d', parseInt(e.target.value) || 0)}
                      />
                      {errors.gsc_organic_prev_30d && <p className="text-sm text-red-600">{errors.gsc_organic_prev_30d}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="gsc_organic_curr_30d">Current 30 Days *</Label>
                      <Input
                        id="gsc_organic_curr_30d"
                        type="number"
                        min="0"
                        value={formData.gsc_organic_curr_30d}
                        onChange={(e) => handleInputChange('gsc_organic_curr_30d', parseInt(e.target.value) || 0)}
                      />
                      {errors.gsc_organic_curr_30d && <p className="text-sm text-red-600">{errors.gsc_organic_curr_30d}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Google Analytics (Total)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="ga_total_prev_30d">Previous 30 Days *</Label>
                      <Input
                        id="ga_total_prev_30d"
                        type="number"
                        min="0"
                        value={formData.ga_total_prev_30d}
                        onChange={(e) => handleInputChange('ga_total_prev_30d', parseInt(e.target.value) || 0)}
                      />
                      {errors.ga_total_prev_30d && <p className="text-sm text-red-600">{errors.ga_total_prev_30d}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="ga_total_curr_30d">Current 30 Days *</Label>
                      <Input
                        id="ga_total_curr_30d"
                        type="number"
                        min="0"
                        value={formData.ga_total_curr_30d}
                        onChange={(e) => handleInputChange('ga_total_curr_30d', parseInt(e.target.value) || 0)}
                      />
                      {errors.ga_total_curr_30d && <p className="text-sm text-red-600">{errors.ga_total_curr_30d}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rankings</CardTitle>
              {renderTooltip('Enter current ranking counts for SERP and GMB positions')}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="serp_top3_count">SERP Top 3 Count</Label>
                  <Input
                    id="serp_top3_count"
                    type="number"
                    min="0"
                    value={formData.serp_top3_count}
                    onChange={(e) => handleInputChange('serp_top3_count', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="serp_top10_count">SERP Top 10 Count</Label>
                  <Input
                    id="serp_top10_count"
                    type="number"
                    min="0"
                    value={formData.serp_top10_count}
                    onChange={(e) => handleInputChange('serp_top10_count', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="gmb_top3_count">GMB Top 3 Count</Label>
                  <Input
                    id="gmb_top3_count"
                    type="number"
                    min="0"
                    value={formData.gmb_top3_count}
                    onChange={(e) => handleInputChange('gmb_top3_count', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Health</CardTitle>
              {renderTooltip('Enter PageSpeed scores (0-100) and Search Console error counts')}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">PageSpeed Scores (0-100)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="pagespeed_home">Home Page *</Label>
                      <Input
                        id="pagespeed_home"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pagespeed_home}
                        onChange={(e) => handleInputChange('pagespeed_home', parseInt(e.target.value) || 0)}
                      />
                      {errors.pagespeed_home && <p className="text-sm text-red-600">{errors.pagespeed_home}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="pagespeed_service">Service Page *</Label>
                      <Input
                        id="pagespeed_service"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pagespeed_service}
                        onChange={(e) => handleInputChange('pagespeed_service', parseInt(e.target.value) || 0)}
                      />
                      {errors.pagespeed_service && <p className="text-sm text-red-600">{errors.pagespeed_service}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="pagespeed_location">Location Page *</Label>
                      <Input
                        id="pagespeed_location"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pagespeed_location}
                        onChange={(e) => handleInputChange('pagespeed_location', parseInt(e.target.value) || 0)}
                      />
                      {errors.pagespeed_location && <p className="text-sm text-red-600">{errors.pagespeed_location}</p>}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Search Console Errors</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sc_errors_home">Home Page Errors</Label>
                      <Input
                        id="sc_errors_home"
                        type="number"
                        min="0"
                        value={formData.sc_errors_home}
                        onChange={(e) => handleInputChange('sc_errors_home', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sc_errors_service">Service Page Errors</Label>
                      <Input
                        id="sc_errors_service"
                        type="number"
                        min="0"
                        value={formData.sc_errors_service}
                        onChange={(e) => handleInputChange('sc_errors_service', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sc_errors_location">Location Page Errors</Label>
                      <Input
                        id="sc_errors_location"
                        type="number"
                        min="0"
                        value={formData.sc_errors_location}
                        onChange={(e) => handleInputChange('sc_errors_location', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Relationship */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Relationship</CardTitle>
              {renderTooltip('Enter client interaction data and satisfaction metrics')}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="client_meeting_date">Meeting Date</Label>
                  <Input
                    id="client_meeting_date"
                    type="date"
                    value={formData.client_meeting_date}
                    onChange={(e) => handleInputChange('client_meeting_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="interactions_count">Interactions Count</Label>
                  <Input
                    id="interactions_count"
                    type="number"
                    min="0"
                    value={formData.interactions_count}
                    onChange={(e) => handleInputChange('interactions_count', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="nps_client">Client NPS (1-10)</Label>
                  <Input
                    id="nps_client"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.nps_client || ''}
                    onChange={(e) => handleInputChange('nps_client', e.target.value ? parseInt(e.target.value) : null)}
                  />
                  {errors.nps_client && <p className="text-sm text-red-600">{errors.nps_client}</p>}
                </div>
                
                {authState.user?.role === 'tl' && (
                  <div>
                    <Label htmlFor="mentor_score">Mentor Score (1-10)</Label>
                    <Input
                      id="mentor_score"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.mentor_score || ''}
                      onChange={(e) => handleInputChange('mentor_score', e.target.value ? parseInt(e.target.value) : null)}
                    />
                    {errors.mentor_score && <p className="text-sm text-red-600">{errors.mentor_score}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SEODataEntryForm;