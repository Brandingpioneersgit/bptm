import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarDays, 
  Clock, 
  FileText, 
  Award, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Plus,
  Edit,
  Star,
  Target,
  BookOpen,
  GraduationCap,
  BarChart3,
  Calendar as CalendarIcon,
  User,
  Briefcase,
  MessageSquare,
  DollarSign,
  Camera,
  Video,
  Palette,
  Search,
  Share2,
  Filter,
  Upload,
  X,
  Check,
  Loader2,
  ExternalLink,
  FileImage,
  Play,
  Megaphone
} from 'lucide-react';
import { supabase } from '../shared/lib/supabase';
import DashboardLayout from './layouts/DashboardLayout';

const FreelancersDashboard = () => {
  const [userRole, setUserRole] = useState('freelancer'); // freelancer, manager, admin
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [freelancers, setFreelancers] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Using supabase directly from import

  // Load freelancers data from database
  useEffect(() => {
    const loadFreelancersData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch freelancers from database
        const { data: freelancersData, error: freelancersError } = await supabase
          .from('freelancer_users')
          .select('*')
          .eq('status', 'active')
          .order('name');

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('freelancer_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        // Handle freelancers data
        if (freelancersError) {
          console.error('Error fetching freelancers:', freelancersError);
          setFreelancers([]);
        } else {
          setFreelancers(freelancersData || []);
        }

        // Handle tasks data
        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          setTasks([]);
        } else {
          setTasks(tasksData || []);
        }
      } catch (error) {
        console.error('Error loading freelancers data:', error);
        setFreelancers([]);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (supabase) {
      loadFreelancersData();
    }
  }, [supabase]);

  // Functional button handlers
  const handleTaskApproval = async (taskId, status, rating = null) => {
    try {
      const updateData = {
        approval_status: status,
        approved_at: new Date().toISOString(),
        ...(rating && { rating })
      };

      const { error } = await supabase
        .from('freelancer_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks data
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updateData }
            : task
        )
      );

      alert(`Task ${status} successfully!`);
    } catch (error) {
      console.error('Error updating task approval:', error);
      alert('Failed to update task approval');
    }
  };

  const handleTaskSubmission = async (taskData) => {
    try {
      const { error } = await supabase
        .from('freelancer_task_reports')
        .insert({
          task_id: taskData.taskId,
          freelancer_id: taskData.freelancerId,
          completion_percentage: taskData.completionPercentage,
          work_description: taskData.workDescription,
          deliverables: taskData.deliverables,
          challenges: taskData.challenges,
          next_steps: taskData.nextSteps,
          hours_spent: taskData.hoursSpent,
          expected_completion: taskData.expectedCompletion,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update task status
      await supabase
        .from('freelancer_tasks')
        .update({ 
          status: 'in_review',
          progress: taskData.completionPercentage
        })
        .eq('id', taskData.taskId);

      alert('Task report submitted successfully!');
    } catch (error) {
      console.error('Error submitting task report:', error);
      alert('Failed to submit task report');
    }
  };

  const handleProfileUpdate = async (profileData) => {
    try {
      const { error } = await supabase
        .from('freelancer_users')
        .update(profileData)
        .eq('id', profileData.id);

      if (error) throw error;

      // Update local state
      setFreelancers(prevFreelancers => 
        prevFreelancers.map(freelancer => 
          freelancer.id === profileData.id 
            ? { ...freelancer, ...profileData }
            : freelancer
        )
      );

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const mockManagers = [
    { id: 'MGR001', name: 'Rajesh Verma', department: 'Creative' },
    { id: 'MGR002', name: 'Sunita Gupta', department: 'Marketing' },
    { id: 'MGR003', name: 'Vikram Shah', department: 'Digital' }
  ];

  const categoryIcons = {
    videographer: Camera,
    video_editor: Video,
    graphic_designer: Palette,
    ads_manager: Megaphone,
    seo: Search,
    social_media: Share2
  };

  const categoryLabels = {
    videographer: 'Videographer',
    video_editor: 'Video Editor',
    graphic_designer: 'Graphic Designer',
    ads_manager: 'Ads Manager',
    seo: 'SEO Specialist',
    social_media: 'Social Media Manager'
  };

  // Role-based component rendering
  const renderFreelancerView = () => {
    const currentFreelancer = freelancers[0]; // Assuming logged-in freelancer
    
    if (!currentFreelancer) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Freelancer Data</h3>
            <p className="text-muted-foreground">Unable to load freelancer information. Please try again later.</p>
          </div>
        </div>
      );
    }
    
    const freelancerTasks = tasks.filter(task => task.assignedTo === currentFreelancer?.id);
    
    return (
      <div className="space-y-6">
        {/* Personal Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(currentFreelancer.totalEarnings || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month: ₹{(currentFreelancer.monthlyEarnings || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentFreelancer.completedTasks || 0}/{currentFreelancer.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentFreelancer.rating || 0}/5</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentFreelancer.pendingTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Tasks pending</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="submit-report">Submit Report</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Tasks</h3>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4">
              {freelancerTasks.map((task) => {
                const IconComponent = categoryIcons[task.category];
                return (
                  <Card key={task.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            <CardDescription>{task.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">₹{task.totalCost.toLocaleString()}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {task.progress && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="w-full" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Due Date:</span>
                            <p>{new Date(task.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span>
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-sm">Deliverables:</span>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {task.deliverables.map((deliverable, index) => (
                              <li key={index}>{deliverable}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex gap-2">
                          {task.status === 'completed' ? (
                            <Button variant="outline" className="flex-1">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          ) : (
                            <>
                              <Button className="flex-1">
                                <Edit className="w-4 h-4 mr-2" />
                                Update Progress
                              </Button>
                              <Button variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="submit-report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Task Report</CardTitle>
                <CardDescription>Submit your completed work and progress updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-select">Select Task</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {freelancerTasks.filter(t => t.status !== 'completed').map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completion-percentage">Completion Percentage</Label>
                    <Input id="completion-percentage" type="number" min="0" max="100" placeholder="85" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work-description">Work Completed</Label>
                  <Textarea 
                    id="work-description" 
                    placeholder="Describe the work you've completed..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliverables-links">Deliverables/Links</Label>
                  <Textarea 
                    id="deliverables-links" 
                    placeholder="Provide links to completed work, files, or deliverables..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="challenges">Challenges Faced (Optional)</Label>
                  <Textarea 
                    id="challenges" 
                    placeholder="Describe any challenges or issues encountered..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="next-steps">Next Steps</Label>
                  <Textarea 
                    id="next-steps" 
                    placeholder="What are the next steps or remaining work?"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours-spent">Hours Spent</Label>
                    <Input id="hours-spent" type="number" step="0.5" placeholder="8.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected-completion">Expected Completion Date</Label>
                    <Input id="expected-completion" type="date" />
                  </div>
                </div>
                
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{currentFreelancer.monthlyEarnings.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">From {freelancerTasks.filter(t => t.status === 'completed').length} completed tasks</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{currentFreelancer.totalEarnings.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Since {new Date(currentFreelancer.joinDate).toLocaleDateString()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{freelancerTasks.filter(t => t.approvalStatus === 'pending').reduce((sum, t) => sum + t.totalCost, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Awaiting manager approval</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {freelancerTasks.filter(t => t.status === 'completed').map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.approvalDate ? new Date(task.approvalDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>₹{task.totalCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={task.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                            {task.approvalStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={currentFreelancer.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={currentFreelancer.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={currentFreelancer.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input id="portfolio" defaultValue={currentFreelancer.portfolio} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select defaultValue={currentFreelancer.category}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Input id="experience" defaultValue={currentFreelancer.experience} />
                  </div>
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentFreelancer.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderManagerView = () => (
    <div className="space-y-6">
      {/* Manager Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Freelancers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freelancers.length}</div>
            <p className="text-xs text-muted-foreground">Active freelancers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.approvalStatus === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Tasks awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{tasks.filter(t => t.approvalStatus === 'approved').reduce((sum, t) => sum + t.totalCost, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Approved this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freelancers.length > 0 ? (freelancers.reduce((sum, f) => sum + f.rating, 0) / freelancers.length).toFixed(1) : '0.0'}</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Task Approvals</TabsTrigger>
          <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Task Approvals</h3>
            <div className="flex gap-2">
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4">
            {tasks.filter(task => 
              (approvalFilter === 'all' || task.approvalStatus === approvalFilter) &&
              (selectedCategory === 'all' || task.category === selectedCategory)
            ).map((task) => {
              const freelancer = freelancers.find(f => f.id === task.assignedTo);
              const IconComponent = categoryIcons[task.category];
              
              return (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription>{task.description}</CardDescription>
                          <p className="text-sm text-muted-foreground mt-1">
                            Assigned to: {freelancer?.name} • Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={task.approvalStatus === 'approved' ? 'default' : task.approvalStatus === 'pending' ? 'secondary' : 'destructive'}>
                          {task.approvalStatus}
                        </Badge>
                        <Badge variant="outline">₹{task.totalCost.toLocaleString()}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Category:</span>
                          <p>{categoryLabels[task.category]}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span>
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Deliverables:</span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {task.deliverables.map((deliverable, index) => (
                            <li key={index}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {task.clientFeedback && (
                        <div>
                          <span className="font-medium text-sm">Client Feedback:</span>
                          <p className="text-sm text-muted-foreground mt-1">{task.clientFeedback}</p>
                        </div>
                      )}
                      
                      {task.approvalStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button className="flex-1">
                            <Check className="w-4 h-4 mr-2" />
                            Approve (₹{task.totalCost.toLocaleString()})
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            Request Changes
                          </Button>
                          <Button variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      )}
                      
                      {task.approvalStatus === 'approved' && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Approved on {new Date(task.approvalDate).toLocaleDateString()}
                            </span>
                          </div>
                          {task.rating && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < task.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="freelancers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Freelancer Management</h3>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Freelancer
              </Button>
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freelancers.filter(freelancer => 
                  selectedCategory === 'all' || freelancer.category === selectedCategory
                ).map((freelancer) => {
                  const IconComponent = categoryIcons[freelancer.category];
                  return (
                    <TableRow key={freelancer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{freelancer.name}</div>
                            <div className="text-sm text-muted-foreground">{freelancer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoryLabels[freelancer.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{freelancer.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {freelancer.completedTasks}/{freelancer.totalTasks}
                          <div className="text-xs text-muted-foreground">
                            {freelancer.pendingTasks} pending
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ₹{freelancer.monthlyEarnings.toLocaleString()}
                          <div className="text-xs text-muted-foreground">This month</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={freelancer.status === 'active' ? 'default' : 'secondary'}>
                          {freelancer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedFreelancer(freelancer)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Task Management</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Assign New Task
            </Button>
          </div>
          
          <div className="grid gap-4">
            {tasks.map((task) => {
              const freelancer = freelancers.find(f => f.id === task.assignedTo);
              const IconComponent = categoryIcons[task.category];
              
              return (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription>{task.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assigned To:</span>
                        <p>{freelancer?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <p>{categoryLabels[task.category]}</p>
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span>
                        <p>₹{task.totalCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p>{new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const categoryTasks = tasks.filter(t => t.category === key);
                    const completedTasks = categoryTasks.filter(t => t.status === 'completed');
                    const completionRate = categoryTasks.length > 0 ? (completedTasks.length / categoryTasks.length) * 100 : 0;
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{label}</span>
                          <span>{completionRate.toFixed(0)}%</span>
                        </div>
                        <Progress value={completionRate} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const categorySpending = tasks
                      .filter(t => t.category === key && t.approvalStatus === 'approved')
                      .reduce((sum, t) => sum + t.totalCost, 0);
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm">₹{categorySpending.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>₹{tasks.filter(t => t.approvalStatus === 'approved').reduce((sum, t) => sum + t.totalCost, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading freelancers data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freelancers Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'freelancer' ? 'Manage your tasks and track earnings' : 'Manage freelancer tasks and approvals'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer View</SelectItem>
                  <SelectItem value="manager">Manager View</SelectItem>
                  <SelectItem value="admin">Admin View</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {new Date().toLocaleDateString()}
              </Button>
            </div>
          </div>
        </div>

        {/* Role-based content */}
        {userRole === 'freelancer' ? renderFreelancerView() : renderManagerView()}
      </div>
      
      {/* Freelancer Detail Modal */}
      {selectedFreelancer && (
        <Dialog open={!!selectedFreelancer} onOpenChange={() => setSelectedFreelancer(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFreelancer.name} - Detailed View</DialogTitle>
              <DialogDescription>
                {categoryLabels[selectedFreelancer.category]} • {selectedFreelancer.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedFreelancer.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedFreelancer.phone}</div>
                    <div><span className="font-medium">Portfolio:</span> 
                      <a href={selectedFreelancer.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        View Portfolio <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </div>
                    <div><span className="font-medium">Experience:</span> {selectedFreelancer.experience}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedFreelancer.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{selectedFreelancer.rating}/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasks Completed:</span>
                      <span className="font-medium">{selectedFreelancer.completedTasks}/{selectedFreelancer.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Earnings:</span>
                      <span className="font-medium">₹{selectedFreelancer.monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings:</span>
                      <span className="font-medium">₹{selectedFreelancer.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Join Date:</span>
                      <span className="font-medium">{new Date(selectedFreelancer.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default FreelancersDashboard;