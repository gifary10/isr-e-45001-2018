// render-service.js
import { loadClauseData } from './data-service.js';
import { getAppState, updateAppState } from './state-service.js';

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
        element.innerHTML = html;
        return true;
    } catch (error) {
        console.error('Error setting innerHTML:', error);
        return false;
    }
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
    
    // Keep the home tab if it exists
    const homeTab = document.getElementById('home-tab');
    clausesNav.innerHTML = '';
    
    // Re-add home tab if it existed
    if (homeTab) {
        clausesNav.appendChild(homeTab);
    }
    
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
    
    return true;
}

function renderClauseCard(clauseData, handleClauseClick) {
    if (!clauseData?.clause || !handleClauseClick) return null;

    const clauseCard = document.createElement('div');
    clauseCard.className = 'col-12 clause-card';
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
    subclauseItem.className = 'subclause-item';
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
        
        safeAppendChild(implementationList, implementationItem);
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
        
        safeAppendChild(documentsList, docItem);
    });
    
    return true;
}

function renderGuidance(guidanceContent, clauseData) {
    if (!guidanceContent) return false;
    
    guidanceContent.innerHTML = '';
    
    if (!Array.isArray(clauseData?.implementationGuidance?.steps) || 
        clauseData.implementationGuidance.steps.length === 0) {
        showEmptyState(guidanceContent, 'Tidak ada panduan implementasi untuk klausul ini');
        return false;
    }
    
    const stepsContainer = document.createElement('div');
    if (!safeAppendChild(guidanceContent, stepsContainer)) return false;
    
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
        
        safeAppendChild(stepsContainer, stepItem);
    });
    
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