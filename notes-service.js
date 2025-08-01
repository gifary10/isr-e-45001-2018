// notes-service.js
import { updateAppState, getAppState } from './state-service.js';

const NOTES_KEY = 'iso45001_notes';

function sanitizeNoteText(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function validateNoteId(clauseNumber, subclauseNumber) {
    const clauseNum = parseInt(clauseNumber);
    if (isNaN(clauseNum) || clauseNum < 1 || clauseNum > 10) {
        throw new Error('Invalid clause number');
    }
    
    if (subclauseNumber) {
        const parts = subclauseNumber.split('.');
        if (parts.length !== 2 || isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1]))) {
            throw new Error('Invalid subclause number format');
        }
    }
    
    return true;
}

function initializeNotes() {
    try {
        const notesStr = localStorage.getItem(NOTES_KEY);
        const notes = notesStr ? JSON.parse(notesStr) : {};
        
        if (notes && typeof notes === 'object') {
            updateAppState({ notes });
            return notes;
        }
        return {};
    } catch (error) {
        console.error('Error initializing notes:', error);
        return {};
    }
}

export function saveNote(clauseNumber, subclauseNumber, noteText) {
    try {
        if (!clauseNumber) throw new Error('Clause number is required');
        validateNoteId(clauseNumber, subclauseNumber);
        
        const notes = { ...getAppState().notes };
        const noteId = `${clauseNumber}_${subclauseNumber || 'main'}`;
        
        notes[noteId] = {
            text: sanitizeNoteText(noteText || ''),
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        updateAppState({ notes });
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

export function getNote(clauseNumber, subclauseNumber) {
    try {
        if (!clauseNumber) return null;
        validateNoteId(clauseNumber, subclauseNumber);
        
        const notes = getAppState().notes;
        const noteId = `${clauseNumber}_${subclauseNumber || 'main'}`;
        return notes[noteId] || null;
    } catch (error) {
        console.error('Error getting note:', error);
        return null;
    }
}

export function getAllNotes() {
    return getAppState().notes;
}

export function deleteNote(clauseNumber, subclauseNumber) {
    try {
        if (!clauseNumber) return;
        validateNoteId(clauseNumber, subclauseNumber);
        
        const notes = { ...getAppState().notes };
        const noteId = `${clauseNumber}_${subclauseNumber || 'main'}`;
        
        if (notes[noteId]) {
            delete notes[noteId];
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
            updateAppState({ notes });
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

export function renderNotesUI(container, clauseNumber, subclauseNumber) {
    try {
        if (!container || !clauseNumber) return;
        validateNoteId(clauseNumber, subclauseNumber);
        
        const note = getNote(clauseNumber, subclauseNumber);
        const lastUpdated = note?.lastUpdated 
            ? new Date(note.lastUpdated).toLocaleString() 
            : '';
        
        container.innerHTML = `
            <div class="notes-section">
                <h6 class="notes-title">Catatan Anda</h6>
                <textarea class="notes-textarea form-control mb-2" 
                          placeholder="Tulis catatan Anda di sini...">${note?.text || ''}</textarea>
                <div class="notes-actions d-flex justify-content-between">
                    <small class="text-muted">${lastUpdated ? `Terakhir diupdate: ${lastUpdated}` : ''}</small>
                    <button class="btn btn-sm btn-primary save-notes-btn">
                        <i class="bi bi-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        const saveBtn = container.querySelector('.save-notes-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const textarea = container.querySelector('.notes-textarea');
                if (textarea) {
                    saveNote(clauseNumber, subclauseNumber, textarea.value);
                    renderNotesUI(container, clauseNumber, subclauseNumber);
                }
            });
        }
    } catch (error) {
        console.error('Error rendering notes UI:', error);
    }
}

initializeNotes();