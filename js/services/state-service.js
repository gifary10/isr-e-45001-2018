// state-service.js
const DEFAULT_STATE = {
    currentClause: null,
    currentSubclause: null,
    searchTerm: '',
    clausesData: {},
    lastFetchTime: {},
    progress: {},
    activeTab: 'implementation'
};

let appState = deepClone(DEFAULT_STATE);

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

function validateStateUpdate(updates) {
    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid state update: must be an object');
    }
    
    if ('currentClause' in updates && updates.currentClause !== null) {
        const clauseNum = parseInt(updates.currentClause);
        if (isNaN(clauseNum)) {
            throw new Error('Invalid currentClause value: must be a number');
        }
        if (clauseNum < 1 || clauseNum > 10) {
            throw new Error(`Invalid currentClause value: ${clauseNum}. Must be between 1-10`);
        }
    }
    
    return true;
}

export const getAppState = () => deepClone(appState);

export const updateAppState = (updates) => {
    try {
        validateStateUpdate(updates);
        appState = { ...appState, ...updates };
        return getAppState();
    } catch (error) {
        console.error('Invalid state update:', error);
        return getAppState();
    }
};

export const resetAppState = () => {
    appState = deepClone(DEFAULT_STATE);
    return getAppState();
};

export const getClauseData = (clauseNumber) => {
    const num = parseInt(clauseNumber);
    if (isNaN(num) || num < 1 || num > 10) {
        return null;
    }
    return deepClone(getAppState().clausesData[num] || null);
};