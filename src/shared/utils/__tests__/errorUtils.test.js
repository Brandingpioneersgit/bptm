import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandlers, LoadingHandlers, ModalHandlers } from '../errorUtils';

describe('ErrorHandlers', () => {
  let mockNotify, mockSetError, mockSetLoading;

  beforeEach(() => {
    mockNotify = vi.fn();
    mockSetError = vi.fn();
    mockSetLoading = vi.fn();
  });

  describe('createAsyncErrorHandler', () => {
    it('handles successful async operations', async () => {
      const handler = ErrorHandlers.createAsyncErrorHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError
      });
      const successfulOperation = vi.fn().mockResolvedValue({ data: 'success' });

      const result = await handler(successfulOperation);

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(result).toEqual({ data: 'success' });
    });

    it('handles failed async operations', async () => {
      const handler = ErrorHandlers.createAsyncErrorHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError
      });
      const failedOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      try {
        await handler(failedOperation);
      } catch (error) {
        expect(error.message).toBe('Operation failed');
      }

      expect(mockSetError).toHaveBeenCalledWith('Operation failed');
      expect(mockNotify).toHaveBeenCalledWith({ type: 'error', title: 'Error', message: 'Operation failed' });
    });

    it('handles thrown exceptions', async () => {
      const handler = ErrorHandlers.createAsyncErrorHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError
      });
      const throwingOperation = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await handler(throwingOperation);
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      expect(mockSetError).toHaveBeenCalledWith('Network error');
      expect(mockNotify).toHaveBeenCalledWith({ type: 'error', title: 'Error', message: 'Network error' });
    });
  });

  describe('createDataFetchHandler', () => {
    it('fetches data successfully', async () => {
      const mockSetData = vi.fn();
      const handler = ErrorHandlers.createDataFetchHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError,
        setData: mockSetData
      });
      const mockData = [{ id: 1, name: 'Test' }];
      const fetchOperation = vi.fn().mockResolvedValue(mockData);

      const result = await handler(fetchOperation);

      expect(result).toEqual(mockData);
      expect(mockSetData).toHaveBeenCalledWith(mockData);
    });

    it('handles fetch errors with fallback', async () => {
      const mockSetData = vi.fn();
      const handler = ErrorHandlers.createDataFetchHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError,
        setData: mockSetData
      });
      const fetchOperation = vi.fn().mockRejectedValue(new Error('Fetch failed'));
      const fallbackData = [];

      try {
        await handler(fetchOperation, fallbackData);
      } catch (error) {
        // Expected to throw
      }

      expect(mockSetData).toHaveBeenCalledWith(fallbackData);
      expect(mockSetError).toHaveBeenCalledWith('Failed to load data');
    });
  });

  describe('createSubmissionErrorHandler', () => {
    it('handles successful submissions', async () => {
      const mockOnSuccess = vi.fn();
      const handler = ErrorHandlers.createSubmissionErrorHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError,
        onSuccess: mockOnSuccess
      });
      const submitOperation = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });

      await handler(submitOperation, { name: 'Test' });

      expect(mockOnSuccess).toHaveBeenCalledWith({ data: { id: 1 }, error: null });
      expect(mockNotify).toHaveBeenCalledWith('Successfully submitted', 'success');
    });

    it('handles submission failures', async () => {
      const mockOnSuccess = vi.fn();
      const handler = ErrorHandlers.createSubmissionErrorHandler({
        notify: mockNotify,
        setLoading: mockSetLoading,
        setError: mockSetError,
        onSuccess: mockOnSuccess
      });
      const submitOperation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      try {
        await handler(submitOperation, { name: '' });
      } catch (error) {
        // Expected to throw
      }

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith('Submission failed');
      expect(mockNotify).toHaveBeenCalledWith('Submission failed', 'error');
    });
  });

  describe('createNetworkErrorHandler', () => {
    it('handles different types of network errors', () => {
      const handler = ErrorHandlers.createNetworkErrorHandler(mockNotify);

      // Test timeout error
      handler({ code: 'NETWORK_TIMEOUT' });
      expect(mockNotify).toHaveBeenCalledWith('Request timed out. Please try again.', 'error');

      // Test connection error
      handler({ code: 'NETWORK_ERROR' });
      expect(mockNotify).toHaveBeenCalledWith('Network connection failed. Please check your internet connection.', 'error');

      // Test server error
      handler({ status: 500, message: 'Internal server error' });
      expect(mockNotify).toHaveBeenCalledWith('Server error (500): Internal server error', 'error');

      // Test generic error
      handler({ message: 'Unknown error' });
      expect(mockNotify).toHaveBeenCalledWith('An unexpected error occurred: Unknown error', 'error');
    });
  });

  describe('createValidationErrorHandler', () => {
    it('handles validation errors correctly', () => {
      const mockSetFieldErrors = vi.fn();
      const handler = ErrorHandlers.createValidationErrorHandler(mockSetFieldErrors, mockNotify);

      const validationErrors = {
        name: 'Name is required',
        email: 'Invalid email format'
      };

      handler(validationErrors);

      expect(mockSetFieldErrors).toHaveBeenCalledWith(validationErrors);
      expect(mockNotify).toHaveBeenCalledWith('Please fix the validation errors', 'warning');
    });

    it('handles single validation error', () => {
      const mockSetFieldErrors = vi.fn();
      const handler = ErrorHandlers.createValidationErrorHandler(mockSetFieldErrors, mockNotify);

      handler('Name is required');

      expect(mockNotify).toHaveBeenCalledWith('Name is required', 'warning');
    });
  });
});

describe('LoadingHandlers', () => {
  let mockSetLoading;

  beforeEach(() => {
    mockSetLoading = vi.fn();
  });

  describe('createLoadingManager', () => {
    it('manages loading state correctly', () => {
      const manager = LoadingHandlers.createLoadingManager(mockSetLoading);

      manager.start();
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      manager.stop();
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('tracks multiple loading operations', () => {
      const manager = LoadingHandlers.createLoadingManager(mockSetLoading);

      manager.start('operation1');
      manager.start('operation2');
      expect(mockSetLoading).toHaveBeenCalledWith(true);

      manager.stop('operation1');
      expect(mockSetLoading).toHaveBeenCalledWith(true); // Still loading operation2

      manager.stop('operation2');
      expect(mockSetLoading).toHaveBeenCalledWith(false); // All operations complete
    });
  });

  describe('createAsyncWrapper', () => {
    it('wraps async operations with loading state', async () => {
      const wrapper = LoadingHandlers.createAsyncWrapper(mockSetLoading);
      const asyncOperation = vi.fn().mockResolvedValue('result');

      const result = await wrapper(asyncOperation);

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(result).toBe('result');
    });

    it('handles async operation errors', async () => {
      const wrapper = LoadingHandlers.createAsyncWrapper(mockSetLoading);
      const asyncOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(wrapper(asyncOperation)).rejects.toThrow('Operation failed');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });
});

describe('ModalHandlers', () => {
  let mockSetModal, mockNotify;

  beforeEach(() => {
    mockSetModal = vi.fn();
    mockNotify = vi.fn();
  });

  describe('createModalHandlers', () => {
    let handlers;

    beforeEach(() => {
      handlers = ModalHandlers.createModalHandlers(mockSetModal, mockNotify);
    });

    it('shows confirmation modal', async () => {
      const mockConfirm = vi.fn().mockResolvedValue(true);
      global.confirm = mockConfirm;

      const result = await handlers.showConfirmation('Are you sure?', 'This action cannot be undone');

      expect(result).toBe(true);
    });

    it('shows error modal', () => {
      handlers.showError('Something went wrong', 'Please try again later');

      expect(mockSetModal).toHaveBeenCalledWith({
        isOpen: true,
        type: 'error',
        title: 'Something went wrong',
        message: 'Please try again later',
        onClose: expect.any(Function)
      });
    });

    it('shows success modal', () => {
      handlers.showSuccess('Operation completed', 'Your data has been saved');

      expect(mockSetModal).toHaveBeenCalledWith({
        isOpen: true,
        type: 'success',
        title: 'Operation completed',
        message: 'Your data has been saved',
        onClose: expect.any(Function)
      });
    });

    it('shows info modal', () => {
      handlers.showInfo('Information', 'Here is some important information');

      expect(mockSetModal).toHaveBeenCalledWith({
        isOpen: true,
        type: 'info',
        title: 'Information',
        message: 'Here is some important information',
        onClose: expect.any(Function)
      });
    });

    it('closes modal', () => {
      handlers.closeModal();

      expect(mockSetModal).toHaveBeenCalledWith({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        onClose: null
      });
    });

    it('shows loading modal', () => {
      handlers.showLoading('Processing your request...');

      expect(mockSetModal).toHaveBeenCalledWith({
        isOpen: true,
        type: 'loading',
        title: 'Loading',
        message: 'Processing your request...',
        onClose: null
      });
    });
  });
});