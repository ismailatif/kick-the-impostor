"""
Advanced Examples & Recipes for Toast & Error Handling
========================================================
"""

# Recipe 1: API Call with Loading, Success, and Error States

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { getErrorMessage } from '@/lib/errorHandler';

function UserProfile() {
  const toast = useCustomToast();
  const [profile, setProfile] = useState(null);

  const loadProfile = async (userId) => {
    // Show loading toast
    const toastId = toast.loading('Loading Profile', 'Fetching your data...');

    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setProfile(data);

      // Replace loading toast with success
      toast.remove(toastId);
      toast.success('Profile Loaded', '✨ Your profile is ready');
    } catch (error) {
      // Replace loading toast with error
      toast.remove(toastId);
      const message = getErrorMessage(error);
      toast.error(message.title, message.description);
    }
  };

  return (
    <>
      {profile && <div>{profile.name}</div>}
      <button onClick={() => loadProfile(123)}>Load Profile</button>
    </>
  );
}
```


# Recipe 2: Form Validation with Multiple Field Errors

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { validatePlayerName, validateRoomCode } from '@/lib/errorHandler';

function MultiFieldForm() {
  const toast = useCustomToast();
  const [formData, setFormData] = useState({ name: '', code: '' });

  const validateForm = () => {
    const errors = [];

    const nameValidation = validatePlayerName(formData.name);
    if (!nameValidation.valid) {
      errors.push('Name: 1-20 characters required');
    }

    const codeValidation = validateRoomCode(formData.code);
    if (!codeValidation.valid) {
      errors.push('Code: 4 alphanumeric characters required');
    }

    if (errors.length > 0) {
      toast.error('Validation Failed', errors.join(' | '));
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    toast.success('Form Valid', 'All fields passed validation');
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Player name"
      />
      <input
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        placeholder="Room code"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```


# Recipe 3: Retry Logic with Exponential Backoff

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';

function RetryableComponent() {
  const toast = useCustomToast();

  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          toast.warning(
            'Retrying',
            `Attempt ${attempt}/${maxRetries} - Trying again in ${delay / 1000}s`
          );

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    toast.error('Failed After Retries', `Could not complete after ${maxRetries} attempts`);
    throw lastError;
  };

  const handleUnstableOperation = async () => {
    const id = toast.loading('Processing', 'Starting operation...');

    try {
      await retryWithBackoff(async () => {
        // This might fail occasionally
        const response = await fetch('/api/unstable-endpoint');
        if (!response.ok) throw new Error('API Error');
        return response.json();
      });

      toast.remove(id);
      toast.success('Success!', 'Operation completed successfully');
    } catch (error) {
      toast.remove(id);
      toast.error('Operation Failed', 'Failed after multiple retries');
    }
  };

  return <button onClick={handleUnstableOperation}>Unstable Operation</button>;
}
```


# Recipe 4: Batch Operations with Progress

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';

function BatchProcessor() {
  const toast = useCustomToast();

  const processBatch = async (items) => {
    const total = items.length;
    let completed = 0;

    const progressToastId = toast.loading(
      'Processing',
      `0/${total} items completed`
    );

    try {
      for (const item of items) {
        await processItem(item);
        completed++;

        // Update progress (remove and show new toast)
        toast.remove(progressToastId);
        toast.info(
          'Processing',
          `${completed}/${total} items completed (${Math.round(completed / total * 100)}%)`
        );
      }

      toast.remove(progressToastId);
      toast.success('Batch Complete', `All ${total} items processed`);
    } catch (error) {
      toast.remove(progressToastId);
      toast.error(
        'Processing Error',
        `Failed at item ${completed + 1}/${total}`
      );
    }
  };

  return (
    <button onClick={() => processBatch([1, 2, 3, 4, 5])}>
      Process Items
    </button>
  );
}
```


# Recipe 5: Socket Operations with Connection Status

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { useSocket } from '@/hooks/useSocket';

function OnlineGame() {
  const toast = useCustomToast();
  const { joinRoom, connectionStatus, room } = useSocket();
  const [joining, setJoining] = useState(false);

  const safeJoinRoom = async (code, name) => {
    // Check connection first
    if (connectionStatus !== 'connected') {
      toast.warning(
        'Not Ready',
        `Connection status: ${connectionStatus}. Please wait...`
      );
      return;
    }

    if (joining) {
      toast.warning('Please Wait', 'Join operation in progress');
      return;
    }

    setJoining(true);
    const id = toast.loading('Joining', `Connecting to room ${code}...`);

    try {
      joinRoom(code, name);

      // Wait a moment for server response
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.remove(id);

      if (room?.code === code) {
        toast.success('Joined!', `Welcome to room ${code}`);
      } else {
        // This would trigger error event if failed
        toast.remove(id);
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      <p>Connection: {connectionStatus}</p>
      <button
        onClick={() => safeJoinRoom('ABCD', 'Player1')}
        disabled={connectionStatus !== 'connected' || joining}
      >
        {joining ? 'Joining...' : 'Join Room'}
      </button>
    </div>
  );
}
```


# Recipe 6: Context for App-wide Toast Management

```jsx
// Create a context for complex toast scenarios
import { createContext, useContext, useCallback } from 'react';
import { useCustomToast } from '@/components/ui/CustomToast';

const ToastContextObj = createContext();

export const ToastProvider = ({ children }) => {
  const toast = useCustomToast();

  const showOperationResult = useCallback((success, title, description) => {
    if (success) {
      toast.success(title, description);
    } else {
      toast.error(title, description);
    }
  }, [toast]);

  const showLoadingOperation = useCallback((message, operation) => {
    return async () => {
      const id = toast.loading(message, 'Processing...');
      try {
        const result = await operation();
        toast.remove(id);
        return result;
      } catch (error) {
        toast.remove(id);
        throw error;
      }
    };
  }, [toast]);

  const confirmAction = useCallback((action, onConfirm) => {
    const confirmed = window.confirm(action);
    if (confirmed) {
      onConfirm();
    }
  }, []);

  return (
    <ToastContextObj.Provider value={{ 
      showOperationResult, 
      showLoadingOperation, 
      confirmAction 
    }}>
      {children}
    </ToastContextObj.Provider>
  );
};

export const useAppToast = () => useContext(ToastContextObj);

// Usage:
function MyComponent() {
  const { showLoadingOperation } = useAppToast();

  const handleClick = showLoadingOperation(
    'Saving',
    async () => {
      await saveToServer();
    }
  );

  return <button onClick={handleClick}>Save</button>;
}
```


# Recipe 7: Debounced Operations with Toast

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { useCallback, useRef } from 'react';

function DebouncedSearch() {
  const toast = useCustomToast();
  const timeoutRef = useRef(null);
  const toastIdRef = useRef(null);

  const debouncedSearch = useCallback((query) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query) {
      if (toastIdRef.current) {
        toast.remove(toastIdRef.current);
        toastIdRef.current = null;
      }
      return;
    }

    // Show loading after 500ms
    toastIdRef.current = toast.loading('Searching', `Searching for "${query}"...`);

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetch(`/api/search?q=${query}`).then(r => r.json());

        toast.remove(toastIdRef.current);
        toast.success('Found Results', `${results.length} results found`);
      } catch (error) {
        toast.remove(toastIdRef.current);
        toast.error('Search Failed', 'Could not perform search');
      }
    }, 500);
  }, [toast]);

  return (
    <input
      placeholder="Search..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```


# Recipe 8: Error Boundary with Toast Integration

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';
import { useCustomToast } from '@/components/ui/CustomToast';

// Custom error boundary with toast notification
class NotifyingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Could send toast here if we had access to it
    console.error('Caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage:
<NotifyingErrorBoundary>
  <YourComponent />
</NotifyingErrorBoundary>
```


# Recipe 9: Custom Hook for Common Operations

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { useCallback } from 'react';

export const useAsyncOperation = () => {
  const toast = useCustomToast();

  const execute = useCallback(
    async (fn, options = {}) => {
      const {
        loadingMessage = 'Processing',
        loadingDescription = 'Please wait...',
        successMessage = 'Success',
        successDescription = 'Operation completed',
        errorMessage = 'Failed',
        errorDescription = 'An error occurred',
      } = options;

      const id = toast.loading(loadingMessage, loadingDescription);

      try {
        const result = await fn();
        toast.remove(id);
        toast.success(successMessage, successDescription);
        return result;
      } catch (error) {
        toast.remove(id);
        toast.error(errorMessage, errorDescription);
        throw error;
      }
    },
    [toast]
  );

  return { execute };
};

// Usage:
function Component() {
  const { execute } = useAsyncOperation();

  return (
    <button
      onClick={() =>
        execute(
          async () => {
            await saveData();
          },
          {
            loadingMessage: 'Saving...',
            successMessage: 'Saved!',
            errorMessage: 'Save failed',
          }
        )
      }
    >
      Save
    </button>
  );
}
```


# Recipe 10: Notification Settings/Preferences

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { useState } from 'react';

function WithToastPreferences() {
  const toast = useCustomToast();
  const [preferences, setPreferences] = useState({
    showSuccess: true,
    showInfo: true,
    duration: 4000,
  });

  const smartToast = (type, message, description) => {
    if (!preferences[`show${type}`]) return;

    const method = toast[type.toLowerCase()];
    method(message, description, preferences.duration);
  };

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={preferences.showSuccess}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              showSuccess: e.target.checked,
            })
          }
        />
        Show Success Messages
      </label>

      <label>
        Duration:
        <input
          type="number"
          value={preferences.duration}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              duration: parseInt(e.target.value),
            })
          }
        />
        ms
      </label>

      <button onClick={() => smartToast('Success', 'Test', 'This respects preferences')}>
        Test
      </button>
    </>
  );
}
```

---

All examples include error handling, loading states, and user feedback!
Copy and adapt these patterns for your components.
