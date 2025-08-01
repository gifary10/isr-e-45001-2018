// data-service.js
import { updateAppState, getAppState } from './state-service.js';

const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes cache

async function loadClauseData(clauseNumber) {
    try {
        // Validate input
        clauseNumber = parseInt(clauseNumber);
        if (isNaN(clauseNumber) || clauseNumber < 1 || clauseNumber > 10) {
            throw new Error(`Invalid clause number: ${clauseNumber}`);
        }

        // Check cache first with expiry
        const state = getAppState();
        const cachedData = state.clausesData[clauseNumber];
        const lastFetchTime = state.lastFetchTime[clauseNumber] || 0;
        
        if (cachedData && Date.now() - lastFetchTime < CACHE_EXPIRY) {
            return validateClauseData(cachedData);
        }

        // Fetch fresh data
        const response = await fetch(`clause${clauseNumber}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load clause ${clauseNumber}: ${response.status}`);
        }
        
        const data = await response.json();
        const validatedData = validateClauseData(data);
        
        // Update cache with timestamp
        updateAppState({
            clausesData: { ...state.clausesData, [clauseNumber]: validatedData },
            lastFetchTime: { ...state.lastFetchTime, [clauseNumber]: Date.now() }
        });

        return validatedData;
    } catch (error) {
        console.error(`Error loading clause ${clauseNumber}:`, error);
        showErrorToast(`Gagal memuat data klausul ${clauseNumber}`);
        return getFallbackClauseData(clauseNumber);
    }
}

function validateClauseData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON data received');
    }

    // Validate basic structure
    const requiredKeys = ['metadata', 'clause', 'subClauses', 'implementationGuidance'];
    for (const key of requiredKeys) {
        if (!(key in data)) {
            throw new Error(`Missing required key: ${key}`);
        }
    }

    // Validate clause object
    if (typeof data.clause !== 'object' || !data.clause) {
        throw new Error('Invalid clause structure');
    }

    const requiredClauseKeys = ['number', 'title', 'introduction'];
    for (const key of requiredClauseKeys) {
        if (!(key in data.clause)) {
            throw new Error(`Missing required clause key: ${key}`);
        }
    }

    // Validate subClauses array
    if (!Array.isArray(data.subClauses)) {
        throw new Error('subClauses must be an array');
    }

    // Validate each subClause
    data.subClauses.forEach(subClause => {
        if (!subClause || typeof subClause !== 'object') {
            throw new Error('Invalid subClause structure');
        }

        const requiredSubClauseKeys = ['number', 'title', 'description'];
        for (const key of requiredSubClauseKeys) {
            if (!(key in subClause)) {
                throw new Error(`Missing required subClause key: ${key}`);
            }
        }
    });

    return data;
}

function getFallbackClauseData(clauseNumber) {
    return {
        metadata: {
            title: `Klausul ${clauseNumber}`,
            description: 'Failed to load data',
            keywords: ''
        },
        clause: {
            number: clauseNumber.toString(),
            title: 'Error',
            introduction: 'Failed to load clause data'
        },
        subClauses: [],
        implementationGuidance: {
            title: 'Panduan Implementasi',
            steps: []
        }
    };
}

function showErrorToast(message) {
    try {
        console.error('Error:', message);
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.warn('Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast show align-items-center text-white bg-danger';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${escapeHtml(message)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Add click handler for close button
        const closeBtn = toast.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            });
        }
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export { loadClauseData };