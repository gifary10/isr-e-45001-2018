// app.js
import { loadClauseData } from './services/data-service.js';
import { renderHomeView } from './services/home-service.js';
import {
    renderClauseNavItems,
    renderClauseCard,
    renderSubclauseItem,
    renderImplementation,
    renderDocuments,
    renderGuidance,
    showEmptyState
} from './services/render-service.js';
import { getAppState, updateAppState, resetAppState } from './services/state-service.js';

const CLAUSE_FILES = Array.from({length: 10}, (_, i) => `clause${i+1}.json`);
const DEBOUNCE_DELAY = 300;
const SCROLL_TOP_THRESHOLD = 300;

// DOM Elements
const elements = {
    homeViewContainer: document.getElementById('home-view-container'),
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
    scrollTopBtn: document.getElementById('scroll-top-btn'),
    clausesNav: document.getElementById('clauses-nav'),
    toastContainer: document.getElementById('toast-container')
};

function checkRequiredElements() {
    const requiredElements = [
        'homeViewContainer', 'clausesContainer', 'clauseDetailContainer', 'subclauseDetailContainer',
        'clausesList', 'subclausesList', 'clauseTitle', 'clauseDescription',
        'subclauseTitle', 'subclauseDescription', 'implementationList',
        'documentsList', 'guidanceContent', 'backBtn', 'backSubclauseBtn',
        'searchInput', 'scrollTopBtn', 'clausesNav'
    ];
    
    const missingElements = requiredElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return false;
    }
    return true;
}

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

function createHomeTab() {
    if (!elements.clausesNav) return;

    const homeTab = document.createElement('button');
    homeTab.className = 'clause-nav-item active';
    homeTab.id = 'home-tab';
    homeTab.setAttribute('data-clause', 'home');
    homeTab.setAttribute('role', 'tab');
    homeTab.setAttribute('aria-selected', 'true');
    homeTab.setAttribute('aria-controls', 'home-view');
    homeTab.textContent = 'Beranda';

    const handleInteraction = () => {
        showHomeView();
    };
    
    homeTab.addEventListener('click', handleInteraction);
    homeTab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInteraction();
        }
    });

    elements.clausesNav.appendChild(homeTab);
}

function showHomeView() {
    // Hide all other views
    elements.clausesContainer?.classList.add('d-none');
    elements.clauseDetailContainer?.classList.add('d-none');
    elements.subclauseDetailContainer?.classList.add('d-none');
    
    // Show home view
    elements.homeViewContainer?.classList.remove('d-none');
    
    // Hide back buttons
    elements.backBtn && (elements.backBtn.style.display = 'none');
    elements.backSubclauseBtn && (elements.backSubclauseBtn.style.display = 'none');
    
    // Update nav highlighting
    document.querySelectorAll('.clause-nav-item').forEach(item => {
        if (item) {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
        }
    });
    
    const homeTab = document.getElementById('home-tab');
    if (homeTab) {
        homeTab.classList.add('active');
        homeTab.setAttribute('aria-selected', 'true');
    }
    
    // Render home content
    if (elements.homeViewContainer) {
        renderHomeView(elements.homeViewContainer);
    }
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    updateAppState({ currentClause: null, currentSubclause: null });
}

async function displayClauses() {
    if (!elements.clausesList) return;
    
    elements.clausesList.innerHTML = '';
    
    try {
        // Show loading state
        const loadingPlaceholder = document.createElement('div');
        loadingPlaceholder.className = 'col-12 text-center py-4';
        loadingPlaceholder.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        elements.clausesList.appendChild(loadingPlaceholder);

        // Load all clauses in parallel with error handling
        const clausesPromises = CLAUSE_FILES.map((_, index) => 
            loadClauseData(index + 1)
                .catch(error => {
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

        // Update state with loaded data
        const clausesDataMap = clausesData.reduce((acc, data, index) => {
            if (data) acc[index + 1] = data;
            return acc;
        }, {});

        updateAppState({ clausesData: clausesDataMap });

        // Render nav items and cards
        renderClauseNavItems(clausesData.filter(Boolean), elements.clausesNav, handleClauseClick);

        clausesData.forEach(clauseData => {
            if (!clauseData) return;
            const clauseCard = renderClauseCard(clauseData, handleClauseClick);
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
    if (!elements.subclausesList || !elements.clauseTitle || !elements.clauseDescription) return;
    
    try {
        // Show loading state
        elements.subclausesList.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        const clauseData = await loadClauseData(clauseNumber);
        if (!clauseData) {
            backToClauses();
            return;
        }

        // Update state
        updateAppState({
            currentClause: clauseNumber,
            currentSubclause: null
        });
        
        // Update UI visibility
        elements.homeViewContainer?.classList.add('d-none');
        elements.clausesContainer?.classList.add('d-none');
        elements.clauseDetailContainer?.classList.remove('d-none');
        elements.subclauseDetailContainer?.classList.add('d-none');

        // Show back button
        if (elements.backBtn) {
            elements.backBtn.style.display = 'flex';
            elements.backBtn.setAttribute('aria-label', `Kembali ke daftar klausul`);
        }
        elements.backSubclauseBtn && (elements.backSubclauseBtn.style.display = 'none');

        // Update content
        if (elements.clauseTitle) {
            elements.clauseTitle.textContent = `Klausul ${clauseData.clause.number}: ${clauseData.clause.title}`;
            elements.clauseTitle.focus();
        }
        
        if (elements.clauseDescription) {
            elements.clauseDescription.textContent = clauseData.clause.introduction || 'Tidak ada deskripsi';
        }

        // Update active nav item
        document.querySelectorAll('.clause-nav-item').forEach(item => {
            if (item) {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
                
                if (item.getAttribute('data-clause') === clauseNumber.toString()) {
                    item.classList.add('active');
                    item.setAttribute('aria-selected', 'true');
                    
                    // Scroll nav item into view
                    item.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        });

        // Render subclauses
        elements.subclausesList.innerHTML = '';
        
        if (!Array.isArray(clauseData.subClauses) || clauseData.subClauses.length === 0) {
            showEmptyState(elements.subclausesList, 'Tidak ada sub klausul untuk klausul ini');
            return;
        }

        clauseData.subClauses.forEach(subclause => {
            const subclauseItem = renderSubclauseItem(subclause, clauseNumber, showSubclauseDetail);
            if (subclauseItem) {
                elements.subclausesList.appendChild(subclauseItem);
            }
        });
    } catch (error) {
        console.error(`Error showing clause detail ${clauseNumber}:`, error);
        backToClauses();
    }
}

async function showSubclauseDetail(clauseNumber, subclauseNumber) {
    if (!elements.implementationList || !elements.subclauseTitle) return;
    
    try {
        // Show loading state
        elements.implementationList.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        elements.documentsList && (elements.documentsList.innerHTML = '');
        elements.guidanceContent && (elements.guidanceContent.innerHTML = '');
        
        const clauseData = await loadClauseData(clauseNumber);
        if (!clauseData) {
            backToClauseDetail();
            return;
        }

        const subclause = clauseData.subClauses?.find(s => s.number === subclauseNumber);
        if (!subclause) {
            backToClauseDetail();
            return;
        }

        // Update state
        updateAppState({
            currentClause: clauseNumber,
            currentSubclause: subclauseNumber
        });
        
        // Update UI visibility
        elements.homeViewContainer?.classList.add('d-none');
        elements.clausesContainer?.classList.add('d-none');
        elements.clauseDetailContainer?.classList.add('d-none');
        elements.subclauseDetailContainer?.classList.remove('d-none');

        // Show back button
        elements.backBtn && (elements.backBtn.style.display = 'none');
        if (elements.backSubclauseBtn) {
            elements.backSubclauseBtn.style.display = 'flex';
            elements.backSubclauseBtn.setAttribute('aria-label', `Kembali ke klausul ${clauseNumber}`);
        }

        // Update content
        if (elements.subclauseTitle) {
            elements.subclauseTitle.textContent = `${clauseData.clause.number}.${subclause.number} ${subclause.title}`;
            elements.subclauseTitle.focus();
        }
        
        if (elements.subclauseDescription) {
            elements.subclauseDescription.textContent = subclause.description || 'Tidak ada deskripsi';
        }

        // Reset tabs to implementation view
        resetTabs();

        // Render content
        renderImplementation(elements.implementationList, subclause);
        renderDocuments(elements.documentsList, subclause);
        renderGuidance(elements.guidanceContent, clauseData);
    } catch (error) {
        console.error(`Error showing subclause detail ${clauseNumber}.${subclauseNumber}:`, error);
        backToClauseDetail();
    }
}

function backToClauses() {
    elements.homeViewContainer?.classList.add('d-none');
    elements.clausesContainer?.classList.remove('d-none');
    elements.clauseDetailContainer?.classList.add('d-none');
    elements.subclauseDetailContainer?.classList.add('d-none');
    
    // Hide back buttons
    elements.backBtn && (elements.backBtn.style.display = 'none');
    elements.backSubclauseBtn && (elements.backSubclauseBtn.style.display = 'none');
    
    // Reset nav highlighting
    document.querySelectorAll('.clause-nav-item').forEach(item => {
        if (item) {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
        }
    });
    
    // Highlight first clause item if available
    const firstClauseNavItem = document.querySelector('.clause-nav-item[data-clause="1"]');
    if (firstClauseNavItem) {
        firstClauseNavItem.classList.add('active');
        firstClauseNavItem.setAttribute('aria-selected', 'true');
    }
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    elements.searchInput?.focus();
    updateAppState({ currentClause: null, currentSubclause: null });
}

function backToClauseDetail() {
    const state = getAppState();
    if (!state.currentClause) {
        backToClauses();
        return;
    }

    elements.homeViewContainer?.classList.add('d-none');
    elements.clausesContainer?.classList.add('d-none');
    elements.clauseDetailContainer?.classList.remove('d-none');
    elements.subclauseDetailContainer?.classList.add('d-none');
    
    // Show back button
    elements.backBtn && (elements.backBtn.style.display = 'flex');
    elements.backSubclauseBtn && (elements.backSubclauseBtn.style.display = 'none');
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    elements.clauseTitle?.focus();
    updateAppState({ currentSubclause: null });
}

function resetTabs() {
    updateAppState({ activeTab: 'implementation' });

    document.querySelectorAll('.tab').forEach(tab => {
        if (tab) {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content) content.classList.remove('active');
    });
    
    const implementationTab = document.querySelector('.tab[data-tab="implementation"]');
    if (implementationTab) {
        implementationTab.classList.add('active');
        implementationTab.setAttribute('aria-selected', 'true');
        elements.implementationList?.classList.add('active');
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs) return;

    tabs.forEach((tab, index) => {
        if (!tab) return;

        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            // Update state
            updateAppState({ activeTab: tabId });
            
            // Update tab states
            tabs.forEach(t => {
                if (t) {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                }
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content) content.classList.remove('active');
            });
            
            const contentElement = document.getElementById(`${tabId}-content`);
            if (contentElement) {
                contentElement.classList.add('active');
                contentElement.focus();
            }
        });
        
        // Keyboard navigation for tabs
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextTab = tabs[(index + 1) % tabs.length];
                nextTab?.focus();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevTab = tabs[(index - 1 + tabs.length) % tabs.length];
                prevTab?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                tabs[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                tabs[tabs.length - 1]?.focus();
            }
        });
    });
}

function setupScrollTopButton() {
    if (!elements.scrollTopBtn) return;

    const handleScroll = () => {
        if (window.pageYOffset > SCROLL_TOP_THRESHOLD) {
            elements.scrollTopBtn.style.display = 'flex';
        } else {
            elements.scrollTopBtn.style.display = 'none';
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    elements.scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        elements.scrollTopBtn.blur();
    });
}

function setupSearchFunctionality() {
    if (!elements.searchInput) return;

    const handleSearch = debounce(() => {
        const searchTerm = elements.searchInput.value.toLowerCase().trim();
        updateAppState({ searchTerm });
        
        const clauseCards = document.querySelectorAll('.clause-card');
        let visibleCount = 0;
        
        clauseCards.forEach(card => {
            if (!card) return;
            
            const title = card.querySelector('.clause-header span')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.clause-body p')?.textContent.toLowerCase() || '';
            
            if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0 && elements.clausesList) {
            showEmptyState(elements.clausesList, 'Tidak ada hasil pencarian untuk "' + searchTerm + '"');
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

function handleClauseClick(clauseNumber) {
    showClauseDetail(clauseNumber);
}

function cleanupEventListeners() {
    // Clean up any existing event listeners
    const homeTab = document.getElementById('home-tab');
    if (homeTab) {
        const newHomeTab = homeTab.cloneNode(true);
        homeTab.parentNode.replaceChild(newHomeTab, homeTab);
    }
    
    if (elements.backBtn) {
        const newBackBtn = elements.backBtn.cloneNode(true);
        elements.backBtn.parentNode.replaceChild(newBackBtn, elements.backBtn);
        elements.backBtn = newBackBtn;
    }
    
    if (elements.backSubclauseBtn) {
        const newBackSubclauseBtn = elements.backSubclauseBtn.cloneNode(true);
        elements.backSubclauseBtn.parentNode.replaceChild(newBackSubclauseBtn, elements.backSubclauseBtn);
        elements.backSubclauseBtn = newBackSubclauseBtn;
    }
}

function init() {
    if (!checkRequiredElements()) {
        console.error('Aplikasi tidak dapat dijalankan karena elemen yang diperlukan tidak ditemukan');
        return;
    }

    // Clean up any existing event listeners
    cleanupEventListeners();

    // Reset state
    resetAppState();
    
    // Create home tab and show home view by default
    createHomeTab();
    showHomeView();
    
    // Load clauses data
    displayClauses();
    
    // Event listeners
    elements.backBtn?.addEventListener('click', backToClauses);
    elements.backSubclauseBtn?.addEventListener('click', backToClauseDetail);
    
    // Setup additional functionality
    setupTabs();
    setupScrollTopButton();
    setupSearchFunctionality();
}

document.addEventListener('DOMContentLoaded', init);

export { showClauseDetail, showSubclauseDetail };
