/**
 * Comprehensive Error Handler for Happy Render Flow
 * Handles error classification, logging, and user-friendly messages
 */

// Error types and codes
export const ErrorTypes = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    CONNECTION_REFUSED: 'CONNECTION_REFUSED',
    ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
    ROOM_FULL: 'ROOM_FULL',
    GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',

    // Validation errors
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_ROOM_CODE: 'INVALID_ROOM_CODE',
    INVALID_PLAYER_NAME: 'INVALID_PLAYER_NAME',
    INVALID_SETTINGS: 'INVALID_SETTINGS',

    // Authorization errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_HOST: 'NOT_HOST',

    // Game logic errors
    NOT_READY: 'NOT_READY',
    INSUFFICIENT_PLAYERS: 'INSUFFICIENT_PLAYERS',
    VOTE_ALREADY_CAST: 'VOTE_ALREADY_CAST',

    // Server errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

    // Client errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    JSON_PARSE_ERROR: 'JSON_PARSE_ERROR'
};

// Error messages configuration
const errorMessages = {
    [ErrorTypes.NETWORK_ERROR]: {
        title: 'Network Error',
        description: 'Could not connect to the server. Please check your internet connection.',
        duration: 5000
    },
    [ErrorTypes.CONNECTION_TIMEOUT]: {
        title: 'Connection Timeout',
        description: 'Server took too long to respond. Please try again.',
        duration: 5000
    },
    [ErrorTypes.CONNECTION_REFUSED]: {
        title: 'Connection Failed',
        description: 'Could not connect to the server. It may be offline.',
        duration: 5000
    },
    [ErrorTypes.ROOM_NOT_FOUND]: {
        title: 'Room Not Found',
        description: 'The room code you entered does not exist. Please check and try again.',
        duration: 4000
    },
    [ErrorTypes.ROOM_FULL]: {
        title: 'Room Full',
        description: 'This room has reached its maximum player capacity (20 players).',
        duration: 4000
    },
    [ErrorTypes.GAME_IN_PROGRESS]: {
        title: 'Game In Progress',
        description: 'The game is already in progress. Please wait for it to finish.',
        duration: 4000
    },
    [ErrorTypes.INVALID_INPUT]: {
        title: 'Invalid Input',
        description: 'Please check your input and try again.',
        duration: 3000
    },
    [ErrorTypes.INVALID_ROOM_CODE]: {
        title: 'Invalid Room Code',
        description: 'Room code must be 4 characters long (letters and numbers only).',
        duration: 4000
    },
    [ErrorTypes.INVALID_PLAYER_NAME]: {
        title: 'Invalid Player Name',
        description: 'Player name must be between 1 and 20 characters.',
        duration: 3000
    },
    [ErrorTypes.INVALID_SETTINGS]: {
        title: 'Invalid Settings',
        description: 'The settings you provided are invalid. Please review and try again.',
        duration: 4000
    },
    [ErrorTypes.UNAUTHORIZED]: {
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action.',
        duration: 3000
    },
    [ErrorTypes.NOT_HOST]: {
        title: 'Permission Denied',
        description: 'Only the host can perform this action.',
        duration: 3000
    },
    [ErrorTypes.NOT_READY]: {
        title: 'Not Ready',
        description: 'All players must be ready before starting the game.',
        duration: 3000
    },
    [ErrorTypes.INSUFFICIENT_PLAYERS]: {
        title: 'Insufficient Players',
        description: 'At least 3 players are required to start the game.',
        duration: 3000
    },
    [ErrorTypes.VOTE_ALREADY_CAST]: {
        title: 'Vote Already Cast',
        description: 'You have already cast your vote.',
        duration: 3000
    },
    [ErrorTypes.INTERNAL_SERVER_ERROR]: {
        title: 'Server Error',
        description: 'An unexpected server error occurred. Please try again later.',
        duration: 5000
    },
    [ErrorTypes.SERVICE_UNAVAILABLE]: {
        title: 'Service Unavailable',
        description: 'The server is temporarily unavailable. Please try again later.',
        duration: 5000
    },
    [ErrorTypes.UNKNOWN_ERROR]: {
        title: 'Unexpected Error',
        description: 'Something went wrong. Please try again.',
        duration: 5000
    }
};

/**
 * Parse and classify errors
 */
export const classifyError = (error) => {
    // Socket.IO specific errors
    if (error?.type === 'connect_error') {
        return {
            type: ErrorTypes.CONNECTION_REFUSED,
            originalError: error
        };
    }

    // Handle error messages from server
    if (typeof error === 'string') {
        const msg = error.toLowerCase();

        if (msg.includes('room not found') || msg.includes('invalid code')) {
            return { type: ErrorTypes.ROOM_NOT_FOUND, originalError: error };
        }
        if (msg.includes('room is full')) {
            return { type: ErrorTypes.ROOM_FULL, originalError: error };
        }
        if (msg.includes('game already in progress') || msg.includes('game in progress')) {
            return { type: ErrorTypes.GAME_IN_PROGRESS, originalError: error };
        }
        if (msg.includes('not host') || msg.includes('only host')) {
            return { type: ErrorTypes.NOT_HOST, originalError: error };
        }
        if (msg.includes('all players must be ready') || msg.includes('not ready')) {
            return { type: ErrorTypes.NOT_READY, originalError: error };
        }
        if (msg.includes('insufficient players') || msg.includes('at least')) {
            return { type: ErrorTypes.INSUFFICIENT_PLAYERS, originalError: error };
        }
        if (msg.includes('already')) {
            return { type: ErrorTypes.VOTE_ALREADY_CAST, originalError: error };
        }
    }

    // Handle Error objects
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        if (msg.includes('network') || msg.includes('failed to fetch')) {
            return { type: ErrorTypes.NETWORK_ERROR, originalError: error };
        }
        if (msg.includes('timeout')) {
            return { type: ErrorTypes.CONNECTION_TIMEOUT, originalError: error };
        }
        if (msg.includes('json')) {
            return { type: ErrorTypes.JSON_PARSE_ERROR, originalError: error };
        }
    }

    // Default to unknown error
    return { type: ErrorTypes.UNKNOWN_ERROR, originalError: error };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (errorTypeOrError) => {
    let errorType = errorTypeOrError;

    // If it's not already classified, classify it
    if (typeof errorTypeOrError !== 'string' || !errorMessages[errorTypeOrError]) {
        const classified = classifyError(errorTypeOrError);
        errorType = classified.type;
    }

    return errorMessages[errorType] || errorMessages[ErrorTypes.UNKNOWN_ERROR];
};

/**
 * Log error for debugging (in development)
 */
export const logError = (error, context = '') => {
    if (process.env.NODE_ENV === 'development') {
        const classified = classifyError(error);
        console.group(`%c⚠️ Error: ${classified.type}${context ? ` (${context})` : ''}`, 'color: #ff6b6b; font-weight: bold;');
        console.error('Original Error:', error);
        console.error('Classification:', classified);
        console.groupEnd();
    }
};

/**
 * Safe operation wrapper with error handling
 */
export const tryCatch = async (
    operation,
    onError = null,
    context = 'Operation'
) => {
    try {
        return await operation();
    } catch (error) {
        logError(error, context);
        if (onError) onError(error);
        throw error;
    }
};

/**
 * Validation helpers
 */
export const validateRoomCode = (code) => {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: ErrorTypes.INVALID_ROOM_CODE };
    }
    const trimmed = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(trimmed)) {
        return { valid: false, error: ErrorTypes.INVALID_ROOM_CODE };
    }
    return { valid: true, code: trimmed };
};

export const validatePlayerName = (name) => {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: ErrorTypes.INVALID_PLAYER_NAME };
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
        return { valid: false, error: ErrorTypes.INVALID_PLAYER_NAME };
    }
    return { valid: true, name: trimmed };
};

/**
 * Error handler for socket.io events
 */
export const handleSocketError = (error, toast) => {
    const classified = classifyError(error);
    const message = getErrorMessage(classified.type);

    logError(error, 'Socket.IO Event');

    if (toast) {
        toast.error(message.title, message.description);
    }

    return classified;
};

export default {
    ErrorTypes,
    classifyError,
    getErrorMessage,
    logError,
    tryCatch,
    validateRoomCode,
    validatePlayerName,
    handleSocketError
};
