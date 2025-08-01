// render-service.js
import { loadClauseData } from './data-service.js';
import { renderNotesUI } from './notes-service.js';
import { renderProgressUI } from './progress-service.js';
import { getAppState, updateAppState } from './state-service.js';

const animationQueue = new Map();
const MAX_ANIMATION_DURATION = 1000;

function safeAppendChild(parent, child) {
    if (!parent || !child) return false;
    try {
        if (parent.contains(child)) {
            parent.removeChild(child);
        }
        parent.appendChild(child);
        return true;
    } catch (error) {
        console.error('Error appending child:', error);
        return false;
    }
}

function safeSetInnerHTML(element, html) {
    if (!element || typeof html !== 'string') return false;
    try {
        // Sanitize HTML if needed (consider using DOMPurify in production)
        element.innerHTML = html;
        return true;
    } catch (error) {
        console.error('Error setting innerHTML:', error);
        return false;
    }
}

function animateElement(element, animationProps) {
    if (!element || !animationProps) return null;
    
    // Cancel any existing animation for this element
    if (animationQueue.has(element)) {
        anime.remove(animationQueue.get(element));
        animationQueue.delete(element);
    }
    
    // Set default values
    const defaults = {
        duration: 300,
        easing: 'easeOutQuad',
        autoplay: true
    };
    
    const animation = anime({
        targets: element,
        ...defaults,
        ...animationProps,
        complete: () => {
            animationQueue.delete(element);
            if (animationProps.complete) animationProps.complete();
        }
    });
    
    // Set timeout to clean up stuck animations
    const timeout = setTimeout(() => {
        if (animationQueue.has(element)) {
            anime.remove(animation);
            animationQueue.delete(element);
        }
    }, MAX_ANIMATION_DURATION);
    
    animation.finished.then(() => clearTimeout(timeout));
    
    animationQueue.set(element, animation);
    return animation;
}

function showEmptyState(container, message) {
    if (!container || !message) return false;
    
    const sanitizedMessage = typeof message === 'string' ? message : 'Data tidak tersedia';
    
    const emptyStateHTML = `
        <div class="empty-state">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            <p>${sanitizedMessage}</p>
        </div>
    `;
    
    return safeSetInnerHTML(container, emptyStateHTML);
}

function renderClauseNavItems(clausesData, clausesNav, handleClauseClick) {
    if (!clausesNav || !handleClauseClick || !Array.isArray(clausesData)) return false;
    
    clausesNav.innerHTML = '';
    
    clausesData.forEach((clauseData, index) => {
        if (!clauseData?.clause?.number) return;
        
        const navItem = document.createElement('button');
        navItem.className = 'clause-nav-item';
        navItem.id = `clause-nav-${clauseData.clause.number}`;
        navItem.setAttribute('data-clause', clauseData.clause.number);
        navItem.setAttribute('role', 'tab');
        navItem.setAttribute('aria-selected', 'false');
        navItem.setAttribute('aria-controls', `clause-${clauseData.clause.number}`);
        navItem.setAttribute('tabindex', index === 0 ? '0' : '-1');
        navItem.textContent = `Klausul ${clauseData.clause.number}`;
        
        const handleInteraction = () => {
            if (typeof handleClauseClick === 'function') {
                handleClauseClick(clauseData.clause.number);
            }
        };
        
        navItem.addEventListener('click', handleInteraction);
        navItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInteraction();
            }
        });
        
        safeAppendChild(clausesNav, navItem);
    });
    
    // Set first item as active initially if available
    const firstNavItem = clausesNav.firstChild;
    if (firstNavItem) {
        firstNavItem.classList.add('active');
        firstNavItem.setAttribute('aria-selected', 'true');
    }
    
    return true;
}

function renderClauseCard(clauseData, handleClauseClick) {
    if (!clauseData?.clause || !handleClauseClick) return null;

    const clauseCard = document.createElement('div');
    clauseCard.className = 'col-12 clause-card fade-in';
    clauseCard.tabIndex = 0;
    clauseCard.setAttribute('role', 'button');
    clauseCard.setAttribute('aria-label', `Klausul ${clauseData.clause.number}: ${clauseData.clause.title}`);
    
    const introductionText = clauseData.clause.introduction 
        ? clauseData.clause.introduction.substring(0, 100) + '...' 
        : 'Deskripsi tidak tersedia';
    
    const subClauseCount = Array.isArray(clauseData.subClauses) ? clauseData.subClauses.length : 0;
    
    clauseCard.innerHTML = `
        <div class="clause-card-inner" data-clause="${clauseData.clause.number}">
            <div class="clause-header d-flex justify-content-between align-items-center">
                <span>Klausul ${clauseData.clause.number}: ${clauseData.clause.title}</span>
                <span class="badge badge-custom">${subClauseCount} Sub</span>
            </div>
            <div class="clause-body">
                <p class="mb-0">${introductionText}</p>
            </div>
        </div>
    `;

    animateElement(clauseCard, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: 100 * (parseInt(clauseData.clause.number) - 1),
        duration: 500,
        easing: 'easeOutQuad'
    });

    const handleInteraction = () => {
        if (typeof handleClauseClick === 'function') {
            handleClauseClick(clauseData.clause.number);
        }
    };
    
    clauseCard.addEventListener('click', handleInteraction);
    clauseCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInteraction();
        }
    });

    return clauseCard;
}

function renderSubclauseItem(subclause, clauseNumber, showSubclauseDetail) {
    if (!subclause?.number || !showSubclauseDetail) return null;

    const subclauseItem = document.createElement('div');
    subclauseItem.className = 'subclause-item slide-up';
    subclauseItem.id = `subclause-${clauseNumber}-${subclause.number}`;
    subclauseItem.setAttribute('data-subclause', subclause.number);
    subclauseItem.tabIndex = 0;
    subclauseItem.setAttribute('role', 'button');
    subclauseItem.setAttribute('aria-label', `Subklausul ${subclause.number} ${subclause.title}`);
    
    const implementationCount = Array.isArray(subclause.implementation) ? subclause.implementation.length : 0;
    const descriptionText = subclause.description 
        ? subclause.description.substring(0, 80) + '...' 
        : 'Deskripsi tidak tersedia';
    
    subclauseItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <strong>${subclause.number} ${subclause.title}</strong>
            <span class="badge bg-primary">${implementationCount} Langkah</span>
        </div>
        <p class="mb-0 small">${descriptionText}</p>
    `;

    animateElement(subclauseItem, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 300,
        delay: 100 * (parseInt(subclause.number.split('.')[1]) || 0),
        easing: 'easeOutQuad'
    });

    const handleInteraction = () => {
        if (typeof showSubclauseDetail === 'function') {
            showSubclauseDetail(clauseNumber, subclause.number);
        }
    };
    
    subclauseItem.addEventListener('click', handleInteraction);
    subclauseItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInteraction();
        }
    });

    return subclauseItem;
}

function renderImplementation(implementationList, subclause) {
    if (!implementationList) return false;
    
    implementationList.innerHTML = '';
    
    if (!Array.isArray(subclause?.implementation) || subclause.implementation.length === 0) {
        showEmptyState(implementationList, 'Tidak ada data implementasi untuk sub klausul ini');
        return false;
    }

    subclause.implementation.forEach((item, index) => {
        if (!item) return;
        
        const implementationItem = document.createElement('li');
        implementationItem.className = 'implementation-item';
        implementationItem.innerHTML = `
            <div class="step-number" aria-label="Langkah ${index + 1}">${index + 1}</div>
            <div class="step-text">${item}</div>
        `;
        
        if (safeAppendChild(implementationList, implementationItem)) {
            animateElement(implementationItem, {
                opacity: [0, 1],
                translateX: [-10, 0],
                duration: 300,
                delay: 100 * index,
                easing: 'easeOutQuad'
            });
        }
    });
    
    return true;
}

function renderDocuments(documentsList, subclause) {
    if (!documentsList) return false;
    
    documentsList.innerHTML = '';
    
    if (!Array.isArray(subclause?.documents) || subclause.documents.length === 0) {
        showEmptyState(documentsList, 'Tidak ada dokumen terkait untuk sub klausul ini');
        return false;
    }

    subclause.documents.forEach((doc, index) => {
        if (!doc?.name) return;
        
        const docItem = document.createElement('div');
        docItem.className = 'doc-item';
        
        const docType = doc.type === 'wajib' ? 'doc-wajib' : 'doc-pendukung';
        const docTypeText = doc.type === 'wajib' ? 'Wajib' : 'Pendukung';
        
        docItem.innerHTML = `
            <span class="badge doc-badge ${docType}">
                ${docTypeText}
            </span>
            <strong>${doc.name}</strong>
            <p class="mb-0">${doc.description || 'Tidak ada deskripsi'}</p>
        `;
        
        if (safeAppendChild(documentsList, docItem)) {
            animateElement(docItem, {
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                delay: 100 * index,
                easing: 'easeOutQuad'
            });
        }
    });
    
    return true;
}

function renderGuidance(guidanceContent, clauseData) {
    if (!guidanceContent) return false;
    
    guidanceContent.innerHTML = '';
    
    const state = getAppState();
    const subclauseNumber = state.currentSubclause || null;
    
    if (!Array.isArray(clauseData?.implementationGuidance?.steps) || 
        clauseData.implementationGuidance.steps.length === 0) {
        showEmptyState(guidanceContent, 'Tidak ada panduan implementasi untuk klausul ini');
        return false;
    }
    
    // Create container for guidance steps
    const stepsContainer = document.createElement('div');
    if (!safeAppendChild(guidanceContent, stepsContainer)) return false;
    
    // Render each guidance step
    clauseData.implementationGuidance.steps.forEach((step, index) => {
        if (!step?.title) return;
        
        const stepItem = document.createElement('div');
        stepItem.className = 'mb-4 guidance-step';
        
        const activitiesHTML = Array.isArray(step.activities) 
            ? step.activities.map(activity => `<li class="mb-1">• ${activity || ''}</li>`).join('') 
            : '';
        
        stepItem.innerHTML = `
            <h6 class="mb-2">${step.title || 'Step'}</h6>
            <p class="small text-muted mb-2">${step.description || ''}</p>
            <ul class="list-unstyled small">
                ${activitiesHTML}
            </ul>
        `;
        
        if (safeAppendChild(stepsContainer, stepItem)) {
            animateElement(stepItem, {
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                delay: 100 * index,
                easing: 'easeOutQuad'
            });
        }
    });
    
    // Create container for notes and progress
    const notesProgressContainer = document.createElement('div');
    notesProgressContainer.className = 'notes-progress-container mt-4';
    
    if (safeAppendChild(guidanceContent, notesProgressContainer)) {
        // Notes section
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-container';
        safeAppendChild(notesProgressContainer, notesContainer);
        renderNotesUI(notesContainer, state.currentClause, subclauseNumber);
        
        // Progress section
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container mt-4';
        safeAppendChild(notesProgressContainer, progressContainer);
        renderProgressUI(progressContainer, state.currentClause, subclauseNumber);
    }
    
    return true;
}

export {
    renderClauseNavItems,
    renderClauseCard,
    renderSubclauseItem,
    renderImplementation,
    renderDocuments,
    renderGuidance,
    showEmptyState
};