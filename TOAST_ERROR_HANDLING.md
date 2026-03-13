# Professional Toast & Error Handling System 🎨

Complete guide to using the new professional toast system and error handling in Happy Render Flow.

## Features

✅ **Professional Toast Component** - Beautiful, animated toast notifications with multiple variants  
✅ **Comprehensive Error Handling** - Centralized error classification and user-friendly messages  
✅ **Error Boundary** - React error boundary for catching and displaying errors gracefully  
✅ **Backend Error Validation** - Input validation and error categorization on server  
✅ **Socket Error Handling** - Automatic error detection and recovery for real-time connections  

---

## Quick Start

### 1. Using Custom Toast

Import and use the toast hook in any component:

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';

function MyComponent() {
  const toast = useCustomToast();

  return (
    <>
      <button onClick={() => toast.success('Success!', 'Operation completed')}>
        Success
      </button>
      
      <button onClick={() => toast.error('Error!', 'Something went wrong')}>
        Error
      </button>
      
      <button onClick={() => toast.warning('Warning!', 'Please review')}>
        Warning
      </button>
      
      <button onClick={() => toast.info('Info', 'Here is some information')}>
        Info
      </button>
      
      <button onClick={() => {
        const id = toast.loading('Loading...', 'Processing your request');
        setTimeout(() => toast.remove(id), 3000);
      }}>
        Loading
      </button>
    </>
  );
}
```

### 2. Toast Methods

```javascript
const toast = useCustomToast();

// Success toast - auto-closes after 4 seconds
toast.success(
  message: string,        // Required: "Profile Updated"
  description?: string,   // Optional: "Your changes have been saved"
  duration?: number       // Optional: milliseconds (default: 4000)
);

// Error toast - auto-closes after 5 seconds
toast.error(
  message: string,
  description?: string,
  duration?: number       // default: 5000
);

// Warning toast
toast.warning(message, description, duration);

// Info toast
toast.info(message, description, duration);

// Loading toast - doesn't auto-close
const id = toast.loading(message, description);
// ... do something ...
toast.remove(id); // Close manually

// Clear all toasts
toast.clear();

// Remove specific toast
toast.remove(toastId);
```

---

## Error Handling

### Error Classification

All errors are automatically classified into one of these types:

```javascript
ErrorTypes = {
  // Network
  NETWORK_ERROR,
  CONNECTION_TIMEOUT,
  CONNECTION_REFUSED,
  
  // Room Errors
  ROOM_NOT_FOUND,
  ROOM_FULL,
  GAME_IN_PROGRESS,
  
  // Validation
  INVALID_INPUT,
  INVALID_ROOM_CODE,
  INVALID_PLAYER_NAME,
  INVALID_SETTINGS,
  
  // Authorization
  NOT_HOST,
  PERMISSION_DENIED,
  
  // Game Logic
  NOT_READY,
  INSUFFICIENT_PLAYERS,
  VOTE_ALREADY_CAST,
  
  // Server
  INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE,
  
  // Client
  UNKNOWN_ERROR
}
```

### Using Error Handler

```javascript
import { 
  classifyError, 
  getErrorMessage, 
  handleSocketError,
  validateRoomCode,
  validatePlayerName
} from '@/lib/errorHandler';

// Classify any error
const classified = classifyError(error);
console.log(classified.type); // e.g., "ROOM_NOT_FOUND"

// Get user-friendly message
const message = getErrorMessage(classified.type);
// Returns: { title: "...", description: "...", duration: ... }

// Handle socket errors
const result = handleSocketError(error, toast);

// Validate input
const roomValidation = validateRoomCode('ABC1');
if (!roomValidation.valid) {
  console.log(roomValidation.error);
}

const nameValidation = validatePlayerName('John');
if (nameValidation.valid) {
  console.log(nameValidation.name); // "John"
}
```

---

## Safe Operation Wrapper

Execute code safely with automatic error handling:

```javascript
import { tryCatch } from '@/lib/errorHandler';

// Basic usage
tryCatch(async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// With error callback
tryCatch(
  async () => {
    // Your operation
  },
  (error) => {
    console.log('Operation failed:', error);
  },
  'Fetch Data' // Context for logging
);
```

---

## Socket Error Handling

The `useSocket` hook now includes automatic error handling:

```javascript
import { useSocket } from '@/hooks/useSocket';
import { useCustomToast } from '@/components/ui/CustomToast';

function GameComponent() {
  const { room, joinRoom, connectionStatus } = useSocket();
  const toast = useCustomToast();

  // Error messages are automatically shown via toast
  // when socket events fail

  if (connectionStatus === 'error') {
    return <div>Connection error - retrying...</div>;
  }

  if (connectionStatus === 'disconnected') {
    return <div>Disconnected from server</div>;
  }

  return <div>Connected!</div>;
}
```

### Socket Error Types Handled

- Connection failures
- Room not found
- Room full
- Game in progress
- Not host (permission denied)
- Invalid inputs
- Insufficient players
- Already voted

---

## Error Boundary

The app is wrapped with an Error Boundary that catches React errors:

```jsx
// No setup needed - already included in App.jsx
// It will automatically:
// 1. Catch React errors
// 2. Display beautiful error UI
// 3. Log errors for debugging
// 4. Offer "Try Again" or "Go Home" buttons
```

Custom implementation:

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## Backend Error Handling

### Server Validation

All server events validate input and return proper errors:

```javascript
// Server automatically validates:
// - Player name (1-20 characters)
// - Room code (4 alphanumeric characters)
// - Settings (proper ranges)
// - Game data (valid structure)
// - Permissions (host-only actions)

// If validation fails, client receives:
{
  message: "User-friendly error message",
  code: "ERROR_TYPE",
  timestamp: "2024-03-13T..."
}
```

### Error Response Format

```javascript
// Server sends structured error objects
socket.emit('error', {
  message: 'Room not found',
  code: 'ROOM_NOT_FOUND',
  timestamp: '2024-03-13T10:30:00Z'
});
```

---

## Best Practices

### ✅ Do

- Use the toast hook for feedback
- Validate user input before sending to server
- Handle errors gracefully with try-catch
- Clear loading toasts when done
- Log errors in development mode
- Show descriptive error messages to users

### ❌ Don't

- Use `console.error()` for user-facing errors
- Ignore socket errors
- Send unvalidated data to the server
- Show technical error messages (handled by error handler)
- Block UI on errors (show error toast instead)

---

## Common Patterns

### Form Submission with Error Handling

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const id = toast.loading('Submitting...', 'Please wait');
  
  try {
    const { valid, error } = validatePlayerName(name);
    if (!valid) {
      toast.remove(id);
      toast.error('Invalid Name', 'Name must be 1-20 characters');
      return;
    }
    
    await submitForm(name);
    toast.remove(id);
    toast.success('Success!', 'Form submitted');
  } catch (error) {
    toast.remove(id);
    const message = getErrorMessage(error);
    toast.error(message.title, message.description);
  }
};
```

### Async Operation with Loading State

```jsx
const handleAsyncOp = async () => {
  const id = toast.loading('Loading', 'Processing...');
  
  try {
    const result = await someAsyncOperation();
    toast.remove(id);
    toast.success('Complete!', 'Operation successful');
    return result;
  } catch (error) {
    toast.remove(id);
    handleSocketError(error, toast);
  }
};
```

### Retry Logic

```jsx
const retryOperation = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        toast.error('Failed', 'Operation failed after retries');
        throw error;
      }
      toast.info('Retrying', `Attempt ${i + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

---

## Customization

### Toast Colors

Edit [src/components/ui/CustomToast.jsx](src/components/ui/CustomToast.jsx):

```jsx
const variants = {
  success: { 
    bg: 'bg-emerald-50 dark:bg-emerald-950',  // Change background
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-50',
    icon: CheckCircle2
  },
  // ... other variants
};
```

### Error Messages

Edit [src/lib/errorHandler.js](src/lib/errorHandler.js):

```javascript
const errorMessages = {
  [ErrorTypes.ROOM_NOT_FOUND]: {
    title: 'Custom Title',
    description: 'Custom description',
    duration: 4000
  },
  // ... other messages
};
```

---

## Debugging

### Development Mode

Errors are logged to console in development:

```javascript
// In development, you'll see detailed logs:
console.group('⚠️ Error: ROOM_NOT_FOUND (Socket.IO Event)');
console.error('Original Error:', error);
console.error('Classification:', classified);
console.groupEnd();
```

### Socket Connection Status

```jsx
function DebugComponent() {
  const { connectionStatus } = useSocket();
  
  return (
    <div className="p-4 bg-blue-100">
      Connection Status: <strong>{connectionStatus}</strong>
    </div>
  );
}
```

---

## Troubleshooting

### Toasts Not Appearing?
- Check that `<CustomToastContainer />` is in App.jsx ✓ (already configured)
- Ensure `useCustomToast` is used inside a component (not at module level)

### Socket Errors Not Showing?
- Verify `SocketProvider` wraps the app ✓ (already configured)
- Check browser console for detailed error logs

### Errors Still Breaking UI?
- They're caught by `<ErrorBoundary>` and displayed gracefully
- Check browser console for error details

---

## Files Reference

| File | Purpose |
|------|---------|
| [src/components/ui/CustomToast.jsx](src/components/ui/CustomToast.jsx) | Toast component & hook |
| [src/lib/errorHandler.js](src/lib/errorHandler.js) | Error classification & utilities |
| [src/components/ErrorBoundary.jsx](src/components/ErrorBoundary.jsx) | React error boundary |
| [src/hooks/useSocket.jsx](src/hooks/useSocket.jsx) | Socket with error handling |
| [server/index.js](server/index.js) | Backend validation & errors |

---

## Example: Complete Component

```jsx
import { useCustomToast } from '@/components/ui/CustomToast';
import { useSocket } from '@/hooks/useSocket';
import { validatePlayerName, getErrorMessage } from '@/lib/errorHandler';

export default function JoinGame() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useCustomToast();
  const { joinRoom, connectionStatus } = useSocket();

  const handleJoin = async (roomCode) => {
    setLoading(true);
    
    try {
      // Validate
      const validation = validatePlayerName(name);
      if (!validation.valid) {
        toast.error('Invalid Name', 'Name must be 1-20 characters');
        return;
      }

      // Check connection
      if (connectionStatus !== 'connected') {
        toast.error('Not Connected', 'Waiting for connection...');
        return;
      }

      // Join
      const id = toast.loading('Joining Game', 'Connecting to room...');
      joinRoom(roomCode, validation.name);
      
      // Success feedback
      setTimeout(() => {
        toast.remove(id);
        toast.success('Joined!', '✨ You joined the game');
      }, 1000);
    } catch (error) {
      const msg = getErrorMessage(error);
      toast.error(msg.title, msg.description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleJoin('ABCD'); }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        disabled={loading || connectionStatus !== 'connected'}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Joining...' : 'Join Game'}
      </button>
      
      {connectionStatus !== 'connected' && (
        <p className="text-xs text-orange-600">
          ⚠️ Connecting to server...
        </p>
      )}
    </form>
  );
}
```

---

## Support

For issues or questions, refer to the error logs in browser console during development.
All errors are automatically classified and logged with context.
