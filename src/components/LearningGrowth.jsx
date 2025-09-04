import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { 
  BookOpenIcon, 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  TrophyIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

// Progress Bar Component
const ProgressBar = ({ current, target, label, showPercentage = true }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;
  const isOverTarget = current > target;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${
            isComplete ? 'text-green-600' : current > target * 0.7 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {current}/{target} hours
          </span>
          {showPercentage && (
            <span className={`text-xs ${
              isComplete ? 'text-green-600' : 'text-gray-500'
            }`}>
              ({Math.round(percentage)}%)
            </span>
          )}
          {isComplete && (
            <CheckCircleIconSolid className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isOverTarget ? 'bg-gradient-to-r from-green-500 to-blue-500' :
            isComplete ? 'bg-green-500' :
            percentage > 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isOverTarget && (
        <div className="flex items-center space-x-1 text-xs text-blue-600">
          <TrophyIcon className="h-3 w-3" />
          <span>Exceeded target by {current - target} hours!</span>
        </div>
      )}
    </div>
  );
};

// Learning Entry Form Component
const LearningEntryForm = ({ entry, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    url: entry?.url || '',
    hours: entry?.hours || '',
    learning_type: entry?.learning_type || 'video',
    description: entry?.description || '',
    key_takeaways: entry?.key_takeaways || '',
    completion_date: entry?.completion_date || new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  
  const learningTypes = [
    { value: 'video', label: '📹 Video/YouTube', icon: '📹' },
    { value: 'course', label: '🎓 Online Course', icon: '🎓' },
    { value: 'book', label: '📚 Book/Article', icon: '📚' },
    { value: 'workshop', label: '🛠️ Workshop/Webinar', icon: '🛠️' },
    { value: 'podcast', label: '🎧 Podcast', icon: '🎧' },
    { value: 'conference', label: '🎤 Conference/Talk', icon: '🎤' },
    { value: 'practice', label: '💻 Hands-on Practice', icon: '💻' },
    { value: 'other', label: '📝 Other', icon: '📝' }
  ];
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }
    
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
    } else if (parseFloat(formData.hours) > 24) {
      newErrors.hours = 'Hours cannot exceed 24 per entry';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.key_takeaways.trim()) {
      newErrors.key_takeaways = 'Key takeaways are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        hours: parseFloat(formData.hours)
      });
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {entry ? 'Edit Learning Entry' : 'Add Learning Entry'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., React Hooks Tutorial"
          />
          {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
        </div>
        
        {/* Learning Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            value={formData.learning_type}
            onChange={(e) => setFormData({ ...formData, learning_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {learningTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* URL and Hours Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.url ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://..."
            />
            {errors.url && <p className="text-red-600 text-xs mt-1">{errors.url}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.hours ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="2.5"
            />
            {errors.hours && <p className="text-red-600 text-xs mt-1">{errors.hours}</p>}
          </div>
        </div>
        
        {/* Completion Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Completion Date *
          </label>
          <input
            type="date"
            value={formData.completion_date}
            onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Brief description of the content..."
          />
          {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
        </div>
        
        {/* Key Takeaways */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What did you learn? *
          </label>
          <textarea
            value={formData.key_takeaways}
            onChange={(e) => setFormData({ ...formData, key_takeaways: e.target.value })}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.key_takeaways ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Key concepts, skills, or insights gained..."
          />
          {errors.key_takeaways && <p className="text-red-600 text-xs mt-1">{errors.key_takeaways}</p>}
        </div>
        
        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {entry ? 'Update Entry' : 'Add Entry'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Learning Entry Card Component
const LearningEntryCard = ({ entry, onEdit, onDelete, canEdit = true }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullTakeaways, setShowFullTakeaways] = useState(false);
  
  const getTypeIcon = (type) => {
    const icons = {
      video: '📹',
      course: '🎓',
      book: '📚',
      workshop: '🛠️',
      podcast: '🎧',
      conference: '🎤',
      practice: '💻',
      other: '📝'
    };
    return icons[type] || '📝';
  };
  
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getTypeIcon(entry.learning_type)}</span>
            <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
            <div className="flex items-center space-x-1 text-sm text-blue-600">
              <ClockIcon className="h-4 w-4" />
              <span>{entry.hours}h</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <span>Completed: {new Date(entry.completion_date).toLocaleDateString()}</span>
            <a 
              href={entry.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              View Resource
            </a>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit entry"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete entry"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Description */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
        <p className="text-sm text-gray-600">
          {showFullDescription ? entry.description : truncateText(entry.description)}
          {entry.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 hover:text-blue-700 ml-1"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      </div>
      
      {/* Key Takeaways */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Takeaways</h4>
        <p className="text-sm text-gray-600">
          {showFullTakeaways ? entry.key_takeaways : truncateText(entry.key_takeaways)}
          {entry.key_takeaways.length > 150 && (
            <button
              onClick={() => setShowFullTakeaways(!showFullTakeaways)}
              className="text-blue-600 hover:text-blue-700 ml-1"
            >
              {showFullTakeaways ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

// Learning Statistics Component
const LearningStats = ({ entries, currentMonth }) => {
  const currentMonthEntries = entries.filter(entry => 
    entry.completion_date.startsWith(currentMonth)
  );
  
  const totalHours = currentMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const typeBreakdown = currentMonthEntries.reduce((acc, entry) => {
    acc[entry.learning_type] = (acc[entry.learning_type] || 0) + entry.hours;
    return acc;
  }, {});
  
  const getTypeLabel = (type) => {
    const labels = {
      video: 'Videos',
      course: 'Courses',
      book: 'Books/Articles',
      workshop: 'Workshops',
      podcast: 'Podcasts',
      conference: 'Conferences',
      practice: 'Practice',
      other: 'Other'
    };
    return labels[type] || 'Other';
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{currentMonthEntries.length}</div>
          <div className="text-sm text-gray-600">Entries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-600">Total Hours</div>
        </div>
      </div>
      
      {Object.keys(typeBreakdown).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Learning Types</h4>
          <div className="space-y-2">
            {Object.entries(typeBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([type, hours]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{getTypeLabel(type)}</span>
                  <span className="text-sm font-medium">{hours.toFixed(1)}h</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// Main Learning & Growth Component
export const LearningGrowth = ({ employee }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [learningEntries, setLearningEntries] = useState([]);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyTarget] = useState(6); // 6 hours minimum per month
  const [canSubmitReport, setCanSubmitReport] = useState(true);
  
  // Load learning entries on component mount
  useEffect(() => {
    if (employee?.id) {
      loadLearningEntries();
    }
  }, [employee?.id]);
  
  // Check if user can submit monthly report
  useEffect(() => {
    const currentMonthEntries = learningEntries.filter(entry => 
      entry.completion_date.startsWith(currentMonth)
    );
    const totalHours = currentMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
    setCanSubmitReport(totalHours >= monthlyTarget);
  }, [learningEntries, currentMonth, monthlyTarget]);
  
  const loadLearningEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .order('completion_date', { ascending: false });
      
      if (error) throw error;
      setLearningEntries(data || []);
      
    } catch (error) {
      console.error('Error loading learning entries:', error);
      notify('Failed to load learning entries', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveEntry = async (entryData) => {
    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('learning_entries')
          .update({
            ...entryData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        notify('Learning entry updated successfully!', 'success');
        
      } else {
        // Create new entry
        const { error } = await supabase
          .from('learning_entries')
          .insert({
            ...entryData,
            employee_id: employee.id,
            month: entryData.completion_date.slice(0, 7)
          });
        
        if (error) throw error;
        notify('Learning entry added successfully!', 'success');
      }
      
      setShowForm(false);
      setEditingEntry(null);
      loadLearningEntries();
      
    } catch (error) {
      console.error('Error saving learning entry:', error);
      notify('Failed to save learning entry', 'error');
    }
  };
  
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this learning entry?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('learning_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      notify('Learning entry deleted successfully!', 'success');
      loadLearningEntries();
      
    } catch (error) {
      console.error('Error deleting learning entry:', error);
      notify('Failed to delete learning entry', 'error');
    }
  };
  
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };
  
  const currentMonthEntries = learningEntries.filter(entry => 
    entry.completion_date.startsWith(currentMonth)
  );
  const currentMonthHours = currentMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <Section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning & Growth</h2>
          <p className="text-gray-600">Track your continuous learning journey</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {!canSubmitReport && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg">
              <LockClosedIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Report submission blocked</span>
            </div>
          )}
          
          <button
            onClick={() => {
              setEditingEntry(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Learning</span>
          </button>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Progress</h3>
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <ProgressBar 
            current={currentMonthHours} 
            target={monthlyTarget} 
            label="Learning Hours" 
          />
          
          {currentMonthHours < monthlyTarget && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Learning Target Not Met</p>
                  <p>
                    You need <strong>{(monthlyTarget - currentMonthHours).toFixed(1)} more hours</strong> to reach 
                    the minimum {monthlyTarget} hours required this month. Complete your learning to unlock 
                    monthly report submission.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {currentMonthHours >= monthlyTarget && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIconSolid className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Learning Target Achieved!</p>
                  <p>
                    Great job! You've completed {currentMonthHours.toFixed(1)} hours of learning this month. 
                    Your monthly report submission is now unlocked.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Learning Statistics */}
        <LearningStats entries={learningEntries} currentMonth={currentMonth} />
      </div>
      
      {/* Learning Entries */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Learning Entries</h3>
          <div className="text-sm text-gray-600">
            {learningEntries.length} total entries
          </div>
        </div>
        
        {showForm && (
          <LearningEntryForm
            entry={editingEntry}
            onSave={handleSaveEntry}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
          />
        )}
        
        {learningEntries.length > 0 ? (
          <div className="space-y-4">
            {learningEntries.map((entry) => (
              <LearningEntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No learning entries yet</p>
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Learning Entry
            </button>
          </div>
        )}
      </div>
      
      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Learning Requirements:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Minimum 6 hours</strong> of learning required per month</li>
              <li>• Include URL links to all learning materials</li>
              <li>• Document key takeaways and learnings for each entry</li>
              <li>• Monthly report submission is blocked until learning target is met</li>
              <li>• Learning hours carry over - exceeding targets is encouraged!</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default LearningGrowth;