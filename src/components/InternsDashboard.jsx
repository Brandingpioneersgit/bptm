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
  MessageSquare
} from 'lucide-react';
import { supabase } from '../shared/lib/supabase';

const InternsDashboard = () => {
  const [userRole, setUserRole] = useState('intern'); // intern, mentor, manager, admin
  const [selectedDepartment, setSelectedDepartment] = useState('AI');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interns, setInterns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // Load interns data from database
  useEffect(() => {
    const loadInternsData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch interns from database
        const { data: internsData, error: internsError } = await supabase
          .from('interns')
          .select('*')
          .order('name');

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('intern_projects')
          .select('*')
          .order('startDate', { ascending: false });

        // Fetch daily reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('intern_daily_reports')
          .select('*')
          .order('date', { ascending: false });

        // Fetch certificates
        const { data: certificatesData, error: certificatesError } = await supabase
          .from('intern_certificates')
          .select('*')
          .order('issueDate', { ascending: false });

        // Handle errors and fallback to mock data
        if (internsError || !internsData) {
          console.error('Error fetching interns:', internsError);
          const mockInterns = [
    {
      id: 'INT001',
      name: 'Rahul Sharma',
      department: 'AI',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      mentor: 'Dr. Priya Singh',
      currentScore: 87,
      grade: 'A',
      projectsCompleted: 2,
      projectsAssigned: 3,
      attendanceRate: 95,
      status: 'active',
      certificateStatus: 'eligible',
      skills: ['Python', 'Machine Learning', 'TensorFlow'],
      college: 'IIT Delhi',
      course: 'Computer Science'
    },
    {
      id: 'INT002',
      name: 'Priya Patel',
      department: 'Marketing',
      startDate: '2024-01-20',
      endDate: '2024-04-20',
      mentor: 'Amit Kumar',
      currentScore: 92,
      grade: 'A+',
      projectsCompleted: 3,
      projectsAssigned: 3,
      attendanceRate: 98,
      status: 'active',
      certificateStatus: 'eligible',
      skills: ['Digital Marketing', 'Content Writing', 'Social Media'],
      college: 'Delhi University',
      course: 'Business Administration'
    },
    {
      id: 'INT003',
      name: 'Amit Kumar',
      department: 'Sales',
      startDate: '2024-02-01',
      endDate: '2024-05-01',
      mentor: 'Sneha Gupta',
      currentScore: 78,
      grade: 'B+',
      projectsCompleted: 1,
      projectsAssigned: 2,
      attendanceRate: 88,
      status: 'active',
      certificateStatus: 'not_eligible',
      skills: ['Sales', 'Communication', 'CRM'],
      college: 'Symbiosis',
      course: 'Management'
    },
    {
      id: 'INT004',
      name: 'Sneha Gupta',
      department: 'HR',
      startDate: '2024-02-10',
      endDate: '2024-05-10',
      mentor: 'Rajesh Verma',
      currentScore: 85,
      grade: 'A',
      projectsCompleted: 2,
      projectsAssigned: 2,
      attendanceRate: 92,
      status: 'active',
      certificateStatus: 'eligible',
      skills: ['Recruitment', 'Employee Relations', 'HR Analytics'],
      college: 'XLRI',
      course: 'Human Resources'
     }
           ];
           setInterns(mockInterns);
        } else {
          setInterns(internsData);
        }

        if (projectsError || !projectsData) {
          console.error('Error fetching projects:', projectsError);
          const mockProjects = [
    {
      id: 'PROJ-AI-001',
      title: 'Customer Sentiment Analysis',
      description: 'Build a sentiment analysis model for customer reviews',
      department: 'AI',
      assignedTo: 'INT001',
      mentor: 'Dr. Priya Singh',
      startDate: '2024-01-20',
      dueDate: '2024-03-20',
      status: 'in_progress',
      progress: 75,
      difficulty: 'intermediate',
      skills: ['Python', 'NLP', 'Machine Learning']
    },
    {
      id: 'PROJ-MKT-001',
      title: 'Social Media Campaign Analysis',
      description: 'Analyze performance of recent social media campaigns',
      department: 'Marketing',
      assignedTo: 'INT002',
      mentor: 'Amit Kumar',
      startDate: '2024-01-25',
      dueDate: '2024-03-25',
      status: 'completed',
      progress: 100,
      difficulty: 'beginner',
      skills: ['Analytics', 'Social Media', 'Reporting']
     }
           ];
           setProjects(mockProjects);
        } else {
          setProjects(projectsData);
        }

        if (reportsError || !reportsData) {
          console.error('Error fetching daily reports:', reportsError);
          const mockDailyReports = [
    {
      id: 'RPT001',
      internId: 'INT001',
      date: '2024-03-15',
      tasksCompleted: 'Implemented data preprocessing pipeline for sentiment analysis',
      tasksInProgress: 'Training the ML model with different algorithms',
      tasksPlanned: 'Model evaluation and hyperparameter tuning',
      hoursWorked: 7.5,
      skillsLearned: 'NLTK library, Text preprocessing techniques',
      challengesFaced: 'Handling imbalanced dataset',
      productivityRating: 4,
      learningRating: 5,
      satisfactionRating: 4,
      status: 'approved'
     }
           ];
           setDailyReports(mockDailyReports);
        } else {
          setDailyReports(reportsData);
        }

        if (certificatesError || !certificatesData) {
          console.error('Error fetching certificates:', certificatesError);
          const mockCertificates = [
    {
      id: 'CERT-2024-AI-001',
      internId: 'INT001',
      internName: 'Rahul Sharma',
      department: 'AI',
      issueDate: '2024-04-15',
      certificateType: 'completion',
      duration: 90,
      projectsCompleted: 3,
      averageRating: 4.2,
      totalHours: 540,
      attendancePercentage: 95,
      verificationCode: 'VER-A1B2C3D4',
      status: 'issued'
     }
           ];
           setCertificates(mockCertificates);
        } else {
          setCertificates(certificatesData);
        }
        
      } catch (error) {
        console.error('Error loading interns data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInternsData();
  }, []);

  // Role-based component rendering
  const renderInternView = () => (
    <div className="space-y-6">
      {/* Personal Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87/100</div>
            <p className="text-xs text-muted-foreground">Grade: A</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2/3</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-green-600">Eligible</div>
            <p className="text-xs text-muted-foreground">Ready for generation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Work Report</CardTitle>
              <CardDescription>Submit your daily work progress and learnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-date">Report Date</Label>
                  <Input 
                    id="report-date" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours-worked">Hours Worked</Label>
                  <Input id="hours-worked" type="number" step="0.5" placeholder="7.5" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tasks-completed">Tasks Completed Today</Label>
                <Textarea 
                  id="tasks-completed" 
                  placeholder="Describe what you accomplished today..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tasks-progress">Tasks In Progress</Label>
                <Textarea 
                  id="tasks-progress" 
                  placeholder="What are you currently working on?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tasks-planned">Tasks Planned for Tomorrow</Label>
                <Textarea 
                  id="tasks-planned" 
                  placeholder="What do you plan to work on tomorrow?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills-learned">Skills/Technologies Learned</Label>
                <Textarea 
                  id="skills-learned" 
                  placeholder="What new skills or technologies did you learn?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="challenges">Challenges Faced & Solutions</Label>
                <Textarea 
                  id="challenges" 
                  placeholder="Describe any challenges and how you solved them..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productivity-rating">Productivity Rating</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate 1-5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="learning-rating">Learning Rating</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate 1-5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="satisfaction-rating">Satisfaction Rating</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate 1-5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="w-full">Submit Daily Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {mockProjects.filter(p => p.assignedTo === 'INT001').map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="w-full" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Start Date:</span>
                        <p>{new Date(project.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p>{new Date(project.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Mentor:</span>
                        <p>{project.mentor}</p>
                      </div>
                      <div>
                        <span className="font-medium">Difficulty:</span>
                        <Badge variant="outline">{project.difficulty}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-sm">Required Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {project.status === 'completed' ? (
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Completion Report
                      </Button>
                    ) : (
                      <Button className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Update Progress
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">January 2024</span>
                    <Badge>B+ (82)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">February 2024</span>
                    <Badge>A- (85)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">March 2024</span>
                    <Badge>A (87)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skills Development</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Python Programming</span>
                      <span>90%</span>
                    </div>
                    <Progress value={90} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Machine Learning</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Analysis</span>
                      <span>80%</span>
                    </div>
                    <Progress value={80} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-muted-foreground">March 10, 2024 - Dr. Priya Singh</p>
                  <p className="mt-1">"Excellent progress on the sentiment analysis project. Shows great understanding of NLP concepts and implementation skills."</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-muted-foreground">March 5, 2024 - Dr. Priya Singh</p>
                  <p className="mt-1">"Good initiative in exploring different ML algorithms. Recommend focusing on model evaluation techniques next."</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Status</CardTitle>
              <CardDescription>Track your internship completion certificate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Congratulations! You are eligible for the internship completion certificate.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Internship Duration</Label>
                    <p className="text-sm text-muted-foreground">90 days (Jan 15 - Apr 15, 2024)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Projects Completed</Label>
                    <p className="text-sm text-muted-foreground">2 out of 3 assigned</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Average Performance</Label>
                    <p className="text-sm text-muted-foreground">87/100 (Grade A)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Attendance Rate</Label>
                    <p className="text-sm text-muted-foreground">95%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Skills Acquired</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'NLP'].map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Request Certificate Generation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderManagerView = () => (
    <div className="space-y-6">
      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInterns.length}</div>
            <p className="text-xs text-muted-foreground">Active interns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85.5</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8/10</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Ready to issue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="interns">Interns Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="reports">Daily Reports</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="interns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Intern
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInterns.filter(intern => 
                  selectedDepartment === 'all' || intern.department === selectedDepartment
                ).map((intern) => (
                  <TableRow key={intern.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{intern.name}</div>
                        <div className="text-sm text-muted-foreground">{intern.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{intern.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(intern.startDate).toLocaleDateString()} - 
                        {new Date(intern.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={intern.grade === 'A+' ? 'default' : intern.grade === 'A' ? 'secondary' : 'outline'}>
                          {intern.grade}
                        </Badge>
                        <span className="text-sm">{intern.currentScore}/100</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {intern.projectsCompleted}/{intern.projectsAssigned}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{intern.attendanceRate}%</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={intern.status === 'active' ? 'default' : 'secondary'}>
                        {intern.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedIntern(intern)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Management</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Assign New Project
            </Button>
          </div>
          
          <div className="grid gap-4">
            {mockProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Assigned To:</span>
                      <p>{mockInterns.find(i => i.id === project.assignedTo)?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Department:</span>
                      <p>{project.department}</p>
                    </div>
                    <div>
                      <span className="font-medium">Progress:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={project.progress} className="flex-1" />
                        <span>{project.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>
                      <p>{new Date(project.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daily Reports Review</h3>
            <div className="flex gap-2">
              <Input type="date" className="w-40" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Productivity</TableHead>
                  <TableHead>Learning</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDailyReports.map((report) => {
                  const intern = mockInterns.find(i => i.id === report.internId);
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{intern?.name}</div>
                        <div className="text-sm text-muted-foreground">{intern?.department}</div>
                      </TableCell>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>{report.hoursWorked}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < report.productivityRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < report.learningRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
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

        <TabsContent value="certificates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Certificate Management</h3>
            <Button>
              <GraduationCap className="w-4 h-4 mr-2" />
              Generate Certificates
            </Button>
          </div>
          
          <div className="grid gap-4">
            {mockInterns.filter(intern => intern.certificateStatus === 'eligible').map((intern) => (
              <Card key={intern.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{intern.name}</CardTitle>
                      <CardDescription>{intern.department} Intern • {intern.id}</CardDescription>
                    </div>
                    <Badge variant="default">Certificate Eligible</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p>90 days</p>
                    </div>
                    <div>
                      <span className="font-medium">Performance:</span>
                      <p>{intern.currentScore}/100 ({intern.grade})</p>
                    </div>
                    <div>
                      <span className="font-medium">Projects:</span>
                      <p>{intern.projectsCompleted}/{intern.projectsAssigned} completed</p>
                    </div>
                    <div>
                      <span className="font-medium">Attendance:</span>
                      <p>{intern.attendanceRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Certificate
                    </Button>
                    <Button>
                      <Award className="w-4 h-4 mr-2" />
                      Generate Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interns Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'intern' ? 'Track your internship progress and submit daily reports' : 'Manage intern performance and track progress'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">Intern View</SelectItem>
                  <SelectItem value="mentor">Mentor View</SelectItem>
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
        {userRole === 'intern' ? renderInternView() : renderManagerView()}
      </div>
      
      {/* Intern Detail Modal */}
      {selectedIntern && (
        <Dialog open={!!selectedIntern} onOpenChange={() => setSelectedIntern(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedIntern.name} - Detailed View</DialogTitle>
              <DialogDescription>
                {selectedIntern.department} Intern • {selectedIntern.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">College:</span> {selectedIntern.college}</div>
                    <div><span className="font-medium">Course:</span> {selectedIntern.course}</div>
                    <div><span className="font-medium">Mentor:</span> {selectedIntern.mentor}</div>
                    <div><span className="font-medium">Duration:</span> {selectedIntern.startDate} to {selectedIntern.endDate}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedIntern.skills.map((skill, index) => (
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
                      <span>Current Score:</span>
                      <span className="font-medium">{selectedIntern.currentScore}/100 ({selectedIntern.grade})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects Completed:</span>
                      <span className="font-medium">{selectedIntern.projectsCompleted}/{selectedIntern.projectsAssigned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance Rate:</span>
                      <span className="font-medium">{selectedIntern.attendanceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Certificate Status:</span>
                      <Badge variant={selectedIntern.certificateStatus === 'eligible' ? 'default' : 'secondary'}>
                        {selectedIntern.certificateStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InternsDashboard;