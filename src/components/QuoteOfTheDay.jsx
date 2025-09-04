import React, { useState, useEffect } from 'react';

// Quote of the Day Component
const QuoteOfTheDay = ({ isManager = false }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Predefined quotes for different categories
  const quotes = {
    motivation: [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "motivation"
      },
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        category: "motivation"
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        category: "motivation"
      },
      {
        text: "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle",
        category: "motivation"
      },
      {
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        category: "motivation"
      }
    ],
    leadership: [
      {
        text: "A leader is one who knows the way, goes the way, and shows the way.",
        author: "John C. Maxwell",
        category: "leadership"
      },
      {
        text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.",
        author: "Ronald Reagan",
        category: "leadership"
      },
      {
        text: "Leadership is not about being in charge. It's about taking care of those in your charge.",
        author: "Simon Sinek",
        category: "leadership"
      },
      {
        text: "The art of leadership is saying no, not saying yes. It is very easy to say yes.",
        author: "Tony Blair",
        category: "leadership"
      },
      {
        text: "A good leader takes a little more than his share of the blame, a little less than his share of the credit.",
        author: "Arnold H. Glasow",
        category: "leadership"
      }
    ],
    productivity: [
      {
        text: "Focus on being productive instead of busy.",
        author: "Tim Ferriss",
        category: "productivity"
      },
      {
        text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
        author: "Stephen Covey",
        category: "productivity"
      },
      {
        text: "Efficiency is doing things right; effectiveness is doing the right things.",
        author: "Peter Drucker",
        category: "productivity"
      },
      {
        text: "Time is what we want most, but what we use worst.",
        author: "William Penn",
        category: "productivity"
      },
      {
        text: "You don't have to be great to get started, but you have to get started to be great.",
        author: "Les Brown",
        category: "productivity"
      }
    ],
    teamwork: [
      {
        text: "Alone we can do so little; together we can do so much.",
        author: "Helen Keller",
        category: "teamwork"
      },
      {
        text: "Teamwork makes the dream work.",
        author: "John C. Maxwell",
        category: "teamwork"
      },
      {
        text: "Coming together is a beginning, staying together is progress, and working together is success.",
        author: "Henry Ford",
        category: "teamwork"
      },
      {
        text: "The strength of the team is each individual member. The strength of each member is the team.",
        author: "Phil Jackson",
        category: "teamwork"
      },
      {
        text: "If you want to go fast, go alone. If you want to go far, go together.",
        author: "African Proverb",
        category: "teamwork"
      }
    ]
  };

  // Get random quote based on user type
  const getRandomQuote = () => {
    let availableQuotes = [];
    
    if (isManager) {
      // Managers get leadership and teamwork quotes
      availableQuotes = [...quotes.leadership, ...quotes.teamwork];
    } else {
      // Regular employees get motivation and productivity quotes
      availableQuotes = [...quotes.motivation, ...quotes.productivity];
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    return availableQuotes[randomIndex];
  };

  // Load quote on component mount
  useEffect(() => {
    try {
      setLoading(true);
      const selectedQuote = getRandomQuote();
      setQuote(selectedQuote);
      setError(null);
    } catch (err) {
      setError('Failed to load quote');
      console.error('Error loading quote:', err);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  // Refresh quote function
  const refreshQuote = () => {
    try {
      const newQuote = getRandomQuote();
      setQuote(newQuote);
    } catch (err) {
      setError('Failed to refresh quote');
      console.error('Error refreshing quote:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-brand p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-brand p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={refreshQuote}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-brand p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-brand-text flex items-center">
          <span className="mr-2">💡</span>
          {isManager ? 'Leadership Insight' : 'Daily Inspiration'}
        </h3>
        <button
          onClick={refreshQuote}
          className="text-brand-text-secondary hover:text-brand-text transition-colors duration-200"
          title="Get new quote"
        >
          🔄
        </button>
      </div>
      
      {quote && (
        <div className="space-y-4">
          <blockquote className="text-brand-text italic text-lg leading-relaxed">
            "{quote.text}"
          </blockquote>
          
          <div className="flex justify-between items-center">
            <cite className="text-brand-text-secondary font-medium not-italic">
              — {quote.author}
            </cite>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              quote.category === 'leadership' ? 'bg-purple-100 text-purple-800' :
              quote.category === 'teamwork' ? 'bg-blue-100 text-blue-800' :
              quote.category === 'motivation' ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {quote.category}
            </span>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
        <p className="text-xs text-brand-text-secondary text-center">
          {isManager 
            ? 'Leadership wisdom to guide your team' 
            : 'Daily motivation to fuel your success'
          }
        </p>
      </div>
    </div>
  );
};

export default QuoteOfTheDay;