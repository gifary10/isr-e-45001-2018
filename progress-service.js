// progress-service.js
import { updateAppState, getAppState } from './state-service.js';

const PROGRESS_KEY = 'iso45001_progress';

function validateProgressId(clauseNumber, subclauseNumber) {
    const clauseNum = parseInt(clauseNumber);
    if (isNaN(clauseNum)) {
        throw new Error('Invalid clause number');
    }
    
    if (subclauseNumber) {
        const parts = subclauseNumber.split('.');
        if (parts.length !== 2 || isNaN(parseInt(parts[0]))) {
            throw new Error('Invalid subclause number format');
        }
    }
    
    return true;
}

function initializeProgress() {
    try {
        const progressStr = localStorage.getItem(PROGRESS_KEY);
        const progress = progressStr ? JSON.parse(progressStr) : {};
        
        if (progress && typeof progress === 'object') {
            updateAppState({ progress });
            return progress;
        }
        return {};
    } catch (error) {
        console.error('Error initializing progress:', error);
        return {};
    }
}

export function markAsComplete(clauseNumber, subclauseNumber, isComplete) {
    try {
        if (!clauseNumber) throw new Error('Clause number is required');
        validateProgressId(clauseNumber, subclauseNumber);
        
        const progress = { ...getAppState().progress };
        const progressId = `${clauseNumber}_${subclauseNumber || 'main'}`;
        
        progress[progressId] = {
            completed: !!isComplete,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        updateAppState({ progress });
    } catch (error) {
        console.error('Error marking progress:', error);
        throw error;
    }
}

export function isComplete(clauseNumber, subclauseNumber) {
    try {
        if (!clauseNumber) return false;
        validateProgressId(clauseNumber, subclauseNumber);
        
        const progress = getAppState().progress;
        const progressId = `${clauseNumber}_${subclauseNumber || 'main'}`;
        return !!progress[progressId]?.completed;
    } catch (error) {
        console.error('Error checking completion status:', error);
        return false;
    }
}

export function getAllProgress() {
    return getAppState().progress;
}

export function calculateOverallProgress() {
    try {
        const progress = getAppState().progress;
        const progressItems = Object.values(progress);
        
        if (progressItems.length === 0) return 0;
        
        const completedItems = progressItems.filter(item => item.completed).length;
        const percentage = Math.round((completedItems / progressItems.length) * 100);
        
        return Math.min(100, Math.max(0, percentage));
    } catch (error) {
        console.error('Error calculating progress:', error);
        return 0;
    }
}

export function renderProgressUI(container, clauseNumber, subclauseNumber) {
    try {
        if (!container || !clauseNumber) return;
        validateProgressId(clauseNumber, subclauseNumber);
        
        const completed = isComplete(clauseNumber, subclauseNumber);
        const overallProgress = calculateOverallProgress();
        
        container.innerHTML = `
            <div class="progress-section">
                <h6 class="progress-title">Progress Pembelajaran</h6>
                <div class="form-check form-switch">
                    <input class="form-check-input progress-toggle" type="checkbox" 
                           id="progressToggle" ${completed ? 'checked' : ''}>
                    <label class="form-check-label" for="progressToggle">
                        Tandai sebagai selesai
                    </label>
                </div>
                <div class="progress-overall mt-2">
                    <small>Progress keseluruhan: ${overallProgress}%</small>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${overallProgress}%" 
                             aria-valuenow="${overallProgress}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                    </div>
                </div>
            </div>
        `;
        
        const toggle = container.querySelector('.progress-toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                markAsComplete(clauseNumber, subclauseNumber, e.target.checked);
                renderProgressUI(container, clauseNumber, subclauseNumber);
            });
        }
    } catch (error) {
        console.error('Error rendering progress UI:', error);
    }
}

initializeProgress();