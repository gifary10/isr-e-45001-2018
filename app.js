// At the top of app.js
if (new URLSearchParams(window.location.search).has('auth')) {
    localStorage.setItem('isAuthenticated', 'true');
    window.history.replaceState({}, document.title, window.location.pathname);
}
// app.js - Improved version with better error handling and optimizations

// Constants
const CLAUSE_FILES = Array.from({length: 10}, (_, i) => `clause${i+1}.json`);
const DEBOUNCE_DELAY = 300;
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes cache

// DOM Elements
const elements = {
    clausesContainer: document.getElementById('clauses-container'),
    clauseDetailContainer: document.getElementById('clause-detail-container'),
    subclauseDetailContainer: document.getElementById('subclause-detail-container'),
    clausesList: document.getElementById('clauses-list'),
    subclausesList: document.getElementById('subclauses-list'),
    clauseTitle: document.getElementById('clause-title'),
    clauseDescription: document.getElementById('clause-description'),
    subclauseTitle: document.getElementById('subclause-title'),
    subclauseDescription: document.getElementById('subclause-description'),
    implementationList: document.getElementById('implementation-list'),
    documentsList: document.getElementById('documents-list'),
    guidanceContent: document.getElementById('guidance-content'),
    backBtn: document.getElementById('back-btn'),
    backSubclauseBtn: document.getElementById('back-subclause-btn'),
    searchInput: document.getElementById('search-input'),
    scrollTopBtn: document.getElementById('scroll-top-btn')
};

// State management
let appState = {
    currentClause: null,
    currentSubclause: null,
    searchTerm: '',
    clausesData: {},
    lastFetchTime: {}
};

// Utility functions
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

const animateElement = (element, animationProps) => {
    if (!element) return;
    
    // Cancel any existing animation
    anime.remove(element);
    
    return anime({
        targets: element,
        ...animationProps
    });
};

// Data loading with improved error handling and caching
async function loadClauseData(clauseNumber) {
    try {
        // Check cache first with expiry
        if (appState.clausesData[clauseNumber] && 
            Date.now() - (appState.lastFetchTime[clauseNumber] || 0) < CACHE_EXPIRY) {
            return appState.clausesData[clauseNumber];
        }

        const response = await fetch(`clause${clauseNumber}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load clause ${clauseNumber}: ${response.status}`);
        }
        
        const data = await response.json();
        // Cache the data with timestamp
        appState.clausesData[clauseNumber] = data;
        appState.lastFetchTime[clauseNumber] = Date.now();
        return data;
    } catch (error) {
        console.error(`Error loading clause ${clauseNumber}:`, error);
        showErrorToast(`Gagal memuat data klausul ${clauseNumber}`);
        return null;
    }
}

// View rendering with accessibility improvements
function renderClauseCard(clauseData) {
    if (!clauseData) return null;

    const clauseCard = document.createElement('div');
    clauseCard.className = 'col-12 clause-card';
    clauseCard.tabIndex = 0;
    clauseCard.setAttribute('role', 'button');
    clauseCard.setAttribute('aria-label', `Klausul ${clauseData.clause.number}: ${clauseData.clause.title}`);
    clauseCard.innerHTML = `
        <div class="clause-card-inner" data-clause="${clauseData.clause.number}">
            <div class="clause-header d-flex justify-content-between align-items-center">
                <span>Klausul ${clauseData.clause.number}: ${clauseData.clause.title}</span>
                <span class="badge badge-custom">${clauseData.subClauses.length} Sub</span>
            </div>
            <div class="clause-body">
                <p class="mb-0">${clauseData.clause.introduction.substring(0, 100)}...</p>
            </div>
        </div>
    `;

    // Animation
    animateElement(clauseCard, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: 100 * (parseInt(clauseData.clause.number) - 1),
        duration: 500,
        easing: 'easeOutQuad'
    });

    // Event listeners
    const handleInteraction = () => {
        handleClauseClick(clauseData.clause.number);
        animateElement(clauseCard.querySelector('.clause-card-inner'), {
            scale: 0.95,
            duration: 200,
            easing: 'easeInOutQuad',
            direction: 'alternate'
        });
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

function renderSubclauseItem(subclause, clauseNumber) {
    const subclauseItem = document.createElement('div');
    subclauseItem.className = 'subclause-item';
    subclauseItem.setAttribute('data-subclause', subclause.number);
    subclauseItem.tabIndex = 0;
    subclauseItem.setAttribute('role', 'button');
    subclauseItem.setAttribute('aria-label', `Subklausul ${subclause.number} ${subclause.title}`);
    subclauseItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <strong>${subclause.number} ${subclause.title}</strong>
            <span class="badge bg-primary">${subclause.implementation.length} Langkah</span>
        </div>
        <p class="mb-0 small">${subclause.description.substring(0, 80)}...</p>
    `;

    // Animation
    animateElement(subclauseItem, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 300,
        delay: 100 * subclause.number.split('.')[1],
        easing: 'easeOutQuad'
    });

    // Event listeners
    const handleInteraction = () => showSubclauseDetail(clauseNumber, subclause.number);
    
    subclauseItem.addEventListener('click', handleInteraction);
    subclauseItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInteraction();
        }
    });

    return subclauseItem;
}

// Event handlers
function handleClauseClick(clauseNumber) {
    showClauseDetail(clauseNumber);
}

// Main functions with better loading states
async function displayClauses() {
    elements.clausesList.innerHTML = '';
    
    try {
        // Show loading state
        const loadingPlaceholder = document.createElement('div');
        loadingPlaceholder.className = 'col-12 text-center py-4';
        loadingPlaceholder.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        elements.clausesList.appendChild(loadingPlaceholder);

        // Load all clauses in parallel with error handling
        const clausesPromises = CLAUSE_FILES.map((_, index) => 
            loadClauseData(index + 1).catch(error => {
                console.error(`Error loading clause ${index + 1}:`, error);
                return null;
            })
        );

        const clausesData = await Promise.all(clausesPromises);
        elements.clausesList.innerHTML = '';
        
        if (clausesData.every(data => !data)) {
            showEmptyState(elements.clausesList, 'Tidak ada data klausul yang dapat dimuat');
            return;
        }

        clausesData.forEach(clauseData => {
            if (!clauseData) return;
            const clauseCard = renderClauseCard(clauseData);
            if (clauseCard) {
                elements.clausesList.appendChild(clauseCard);
            }
        });
    } catch (error) {
        console.error('Error displaying clauses:', error);
        showEmptyState(elements.clausesList, 'Gagal memuat data klausul. Silakan coba lagi.');
    }
}

async function showClauseDetail(clauseNumber) {
    try {
        // Show loading state
        elements.subclausesList.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        const clauseData = await loadClauseData(clauseNumber);
        if (!clauseData) {
            backToClauses();
            return;
        }

        appState.currentClause = clauseNumber;
        appState.currentSubclause = null;
        
        // Update UI
        elements.clausesContainer.classList.add('d-none');
        elements.clauseDetailContainer.classList.remove('d-none');
        elements.subclauseDetailContainer.classList.add('d-none');

        elements.clauseTitle.textContent = `Klausul ${clauseData.clause.number}: ${clauseData.clause.title}`;
        elements.clauseDescription.textContent = clauseData.clause.introduction;

        // Render subclauses
        elements.subclausesList.innerHTML = '';
        
        if (clauseData.subClauses.length === 0) {
            showEmptyState(elements.subclausesList, 'Tidak ada sub klausul untuk klausul ini');
            return;
        }

        clauseData.subClauses.forEach(subclause => {
            const subclauseItem = renderSubclauseItem(subclause, clauseNumber);
            elements.subclausesList.appendChild(subclauseItem);
        });

        // Focus management
        elements.clauseTitle.focus();
    } catch (error) {
        console.error(`Error showing clause detail ${clauseNumber}:`, error);
        showErrorToast(`Gagal memuat detail klausul ${clauseNumber}`);
        backToClauses();
    }
}

async function showSubclauseDetail(clauseNumber, subclauseNumber) {
    try {
        // Show loading state
        elements.implementationList.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        elements.documentsList.innerHTML = '';
        elements.guidanceContent.innerHTML = '';
        
        const clauseData = await loadClauseData(clauseNumber);
        if (!clauseData) {
            backToClauseDetail();
            return;
        }

        const subclause = clauseData.subClauses.find(s => s.number === subclauseNumber);
        if (!subclause) {
            backToClauseDetail();
            return;
        }

        appState.currentClause = clauseNumber;
        appState.currentSubclause = subclauseNumber;
        
        // Update UI
        elements.clausesContainer.classList.add('d-none');
        elements.clauseDetailContainer.classList.add('d-none');
        elements.subclauseDetailContainer.classList.remove('d-none');

        elements.subclauseTitle.textContent = `${clauseData.clause.number}.${subclause.number} ${subclause.title}`;
        elements.subclauseDescription.textContent = subclause.description;

        // Reset tabs to implementation view
        resetTabs();

        // Render content
        renderImplementation(subclause);
        renderDocuments(subclause);
        renderGuidance(clauseData);

        // Focus management
        elements.subclauseTitle.focus();
    } catch (error) {
        console.error(`Error showing subclause detail ${clauseNumber}.${subclauseNumber}:`, error);
        showErrorToast(`Gagal memuat detail subklausul ${subclauseNumber}`);
        backToClauseDetail();
    }
}

function renderImplementation(subclause) {
    elements.implementationList.innerHTML = '';
    
    if (!subclause.implementation || subclause.implementation.length === 0) {
        showEmptyState(elements.implementationList, 'Tidak ada data implementasi untuk sub klausul ini');
    } else {
        subclause.implementation.forEach((item, index) => {
            const implementationItem = document.createElement('li');
            implementationItem.className = 'implementation-item';
            implementationItem.innerHTML = `
                <div class="step-number" aria-label="Langkah ${index + 1}">${index + 1}</div>
                <div class="step-text">${item}</div>
            `;
            elements.implementationList.appendChild(implementationItem);
            
            animateElement(implementationItem, {
                opacity: [0, 1],
                translateX: [-10, 0],
                duration: 300,
                delay: 100 * index,
                easing: 'easeOutQuad'
            });
        });
    }
}

function renderDocuments(subclause) {
    elements.documentsList.innerHTML = '';
    
    if (!subclause.documents || subclause.documents.length === 0) {
        showEmptyState(elements.documentsList, 'Tidak ada dokumen terkait untuk sub klausul ini');
    } else {
        subclause.documents.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'doc-item';
            docItem.innerHTML = `
                <span class="badge doc-badge ${doc.type === 'wajib' ? 'doc-wajib' : 'doc-pendukung'}">
                    ${doc.type === 'wajib' ? 'Wajib' : 'Pendukung'}
                </span>
                <strong>${doc.name}</strong>
                <p class="mb-0">${doc.description}</p>
            `;
            elements.documentsList.appendChild(docItem);
            
            animateElement(docItem, {
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                delay: 100 * subclause.documents.indexOf(doc),
                easing: 'easeOutQuad'
            });
        });
    }
}

function renderGuidance(clauseData) {
    elements.guidanceContent.innerHTML = '';
    
    if (!clauseData.implementationGuidance || !clauseData.implementationGuidance.steps || clauseData.implementationGuidance.steps.length === 0) {
        showEmptyState(elements.guidanceContent, 'Tidak ada panduan implementasi untuk klausul ini');
    } else {
        clauseData.implementationGuidance.steps.forEach(step => {
            const stepItem = document.createElement('div');
            stepItem.className = 'mb-4';
            stepItem.innerHTML = `
                <h6 class="mb-2">${step.title}</h6>
                <p class="small text-muted mb-2">${step.description}</p>
                <ul class="list-unstyled small">
                    ${step.activities.map(activity => `<li class="mb-1">• ${activity}</li>`).join('')}
                </ul>
            `;
            elements.guidanceContent.appendChild(stepItem);
            
            animateElement(stepItem, {
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                delay: 100 * clauseData.implementationGuidance.steps.indexOf(step),
                easing: 'easeOutQuad'
            });
        });
    }
}

// Helper functions
function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            <p>${message}</p>
        </div>
    `;
}

function showErrorToast(message) {
    // In a real app, you would implement a proper toast notification
    console.error('Error:', message);
}

function resetTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const implementationTab = document.querySelector('.tab[data-tab="implementation"]');
    if (implementationTab) {
        implementationTab.classList.add('active');
        implementationTab.setAttribute('aria-selected', 'true');
        elements.implementationList.classList.add('active');
    }
}

// Navigation functions
function backToClauses() {
    elements.clausesContainer.classList.remove('d-none');
    elements.clauseDetailContainer.classList.add('d-none');
    elements.subclauseDetailContainer.classList.add('d-none');
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    elements.searchInput.focus();
}

function backToClauseDetail() {
    elements.clausesContainer.classList.add('d-none');
    elements.clauseDetailContainer.classList.remove('d-none');
    elements.subclauseDetailContainer.classList.add('d-none');
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    elements.backBtn.focus();
}

// Tab functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update tab states
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
        
        // Keyboard navigation for tabs
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            }
        });
    });
}

// Scroll to top button
function setupScrollTopButton() {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            elements.scrollTopBtn.style.display = 'flex';
        } else {
            elements.scrollTopBtn.style.display = 'none';
        }
    });
    
    elements.scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Search functionality
function setupSearchFunctionality() {
    const handleSearch = debounce(() => {
        appState.searchTerm = elements.searchInput.value.toLowerCase().trim();
        const clauseCards = document.querySelectorAll('.clause-card');
        let visibleCount = 0;
        
        clauseCards.forEach(card => {
            const title = card.querySelector('.clause-header span').textContent.toLowerCase();
            const description = card.querySelector('.clause-body p').textContent.toLowerCase();
            
            if (appState.searchTerm === '' || title.includes(appState.searchTerm) || description.includes(appState.searchTerm)) {
                card.style.display = 'block';
                visibleCount++;
                animateElement(card, {
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            showEmptyState(elements.clausesList, 'Tidak ada hasil pencarian untuk "' + appState.searchTerm + '"');
        }
    }, DEBOUNCE_DELAY);

    elements.searchInput.addEventListener('input', handleSearch);
    
    elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.searchInput.value = '';
            handleSearch();
        }
    });
}

// Initialize the app
function init() {
    // Check if all required elements exist
    if (!elements.clausesContainer || !elements.clauseDetailContainer || !elements.subclauseDetailContainer) {
        console.error('Critical elements missing from DOM');
        return;
    }

    displayClauses();
    
    // Event listeners
    elements.backBtn.addEventListener('click', backToClauses);
    elements.backSubclauseBtn.addEventListener('click', backToClauseDetail);
    
    // Setup additional functionality
    setupTabs();
    setupScrollTopButton();
    setupSearchFunctionality();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export for testing/modularization
export {
    loadClauseData,
    displayClauses,
    showClauseDetail,
    showSubclauseDetail,
    backToClauses,
    backToClauseDetail,
    setupTabs,
    setupScrollTopButton,
    setupSearchFunctionality
};