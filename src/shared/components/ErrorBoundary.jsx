import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI crash captured by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-red-800 font-semibold mb-2">Something went wrong.</div>
          <div className="text-sm text-red-700 mb-4">Please try again. If the issue persists, refresh the page.</div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => (window.location.hash = '')}
            >
              Go to Form
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

