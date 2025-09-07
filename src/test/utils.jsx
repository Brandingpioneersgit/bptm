import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { UnifiedAuthProvider } from '../features/auth/UnifiedAuthContext';
import { DataSyncProvider } from '../components/DataSyncContext';

/**
 * Test utilities for React components
 */

/**
 * Enhanced render function with common providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialState = {},
    ...renderOptions
  } = options;

  // Mock providers that are commonly used
  const AllTheProviders = ({ children }) => {
    return (
      <DataSyncProvider>
        <UnifiedAuthProvider>
          <MemoryRouter>
            <div data-testid="test-wrapper">
              {children}
            </div>
          </MemoryRouter>
        </UnifiedAuthProvider>
      </DataSyncProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

/**
 * Create a mock Supabase client for testing
 */
export const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    then: vi.fn((callback) => {
      // Default successful response
      return Promise.resolve(callback({ data: [], error: null }));
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signIn: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        remove: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    }
  };

  return mockSupabase;
};

/**
 * Mock notification system
 */
export const createMockNotify = () => {
  return vi.fn((message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  });
};

/**
 * Wait for element to appear with timeout
 */
export const waitForElement = async (selector, timeout = 5000) => {
  return waitFor(
    () => {
      const element = screen.getByTestId(selector) || screen.getByText(selector);
      expect(element).toBeInTheDocument();
      return element;
    },
    { timeout }
  );
};

/**
 * Simulate user interactions
 */
export const userInteractions = {
  /**
   * Type in an input field
   */
  typeInInput: async (input, value) => {
    const user = userEvent.setup();
    await user.clear(input);
    await user.type(input, value);
  },

  /**
   * Click an element
   */
  clickElement: async (element) => {
    const user = userEvent.setup();
    await user.click(element);
  },

  /**
   * Submit a form
   */
  submitForm: async (form) => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /submit/i }));
  },

  /**
   * Select option from dropdown
   */
  selectOption: async (select, option) => {
    const user = userEvent.setup();
    await user.selectOptions(select, option);
  }
};

/**
 * Mock data generators
 */
export const mockData = {
  /**
   * Generate mock employee data
   */
  employee: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    department: 'Engineering',
    role: 'Developer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate mock client data
   */
  client: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate mock submission data
   */
  submission: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    employee_name: 'John Doe',
    client_name: 'Acme Corp',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate array of mock data
   */
  array: (generator, count = 5) => {
    return Array.from({ length: count }, (_, index) => generator({ id: index + 1 }));
  }
};

/**
 * Test assertions helpers
 */
export const assertions = {
  /**
   * Assert element is visible
   */
  expectVisible: (element) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  },

  /**
   * Assert element is not visible
   */
  expectNotVisible: (selector) => {
    expect(screen.queryByTestId(selector)).not.toBeInTheDocument();
  },

  /**
   * Assert form field has value
   */
  expectFieldValue: (fieldName, value) => {
    const field = screen.getByLabelText(fieldName) || screen.getByDisplayValue(value);
    expect(field).toHaveValue(value);
  },

  /**
   * Assert loading state
   */
  expectLoading: () => {
    expect(screen.getByTestId('loading-spinner') || screen.getByText(/loading/i)).toBeInTheDocument();
  },

  /**
   * Assert error message
   */
  expectError: (message) => {
    expect(screen.getByText(message) || screen.getByRole('alert')).toBeInTheDocument();
  }
};

/**
 * Performance testing helpers
 */
export const performance = {
  /**
   * Measure render time
   */
  measureRenderTime: async (renderFn) => {
    const start = performance.now();
    const result = await renderFn();
    const end = performance.now();
    return {
      result,
      renderTime: end - start
    };
  },

  /**
   * Test component re-renders
   */
  trackRerenders: (Component) => {
    let renderCount = 0;
    const TrackedComponent = (props) => {
      renderCount++;
      return <Component {...props} />;
    };
    TrackedComponent.getRenderCount = () => renderCount;
    TrackedComponent.resetRenderCount = () => { renderCount = 0; };
    return TrackedComponent;
  }
};

/**
 * Accessibility testing helpers
 */
export const accessibility = {
  /**
   * Check for proper ARIA labels
   */
  expectAriaLabel: (element, label) => {
    expect(element).toHaveAttribute('aria-label', label);
  },

  /**
   * Check for keyboard navigation
   */
  testKeyboardNavigation: async (elements) => {
    const user = userEvent.setup();
    
    for (let i = 0; i < elements.length; i++) {
      await user.tab();
      expect(elements[i]).toHaveFocus();
    }
  },

  /**
   * Check color contrast (basic)
   */
  expectSufficientContrast: (element) => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Basic check - in real tests, you'd use a proper contrast checker
    expect(backgroundColor).not.toBe(color);
  }
};

export {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent
};