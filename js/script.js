/**
 * ISO 45001:2018 Documentation System
 * Main JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize all functionality
        handleClauseNavigation();
        highlightCurrentClause();
        setupBackToTop();
        setupPrintButtons();
        setupSearch();
        setupAccordions();
        setupTooltips();
        setupCopyButtons();
        trackActiveSection();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

/**
 * Handles navigation between clauses via dropdown
 */
function handleClauseNavigation() {
    const clauseSelector = document.getElementById('clauseSelector');
    if (!clauseSelector) return;

    // Set current clause in dropdown
    const currentFile = window.location.pathname.split('/').pop();
    const optionToSelect = Array.from(clauseSelector.options).find(
        option => option.value === currentFile
    );

    if (optionToSelect) {
        clauseSelector.value = currentFile;
    }

    // Handle dropdown change
    clauseSelector.addEventListener('change', () => {
        const selected = clauseSelector.value;
        if (selected) {
            // Add loading indicator
            clauseSelector.disabled = true;
            clauseSelector.classList.add('loading');
            
            // Navigate to selected clause
            window.location.href = selected;
        }
    });
}

/**
 * Highlights the current clause based on URL hash
 */
function highlightCurrentClause() {
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            // Add highlight class
            target.classList.add('highlighted-clause');
            
            // Scroll to element with offset
            setTimeout(() => {
                const headerHeight = document.querySelector('header')?.offsetHeight || 100;
                const position = target.getBoundingClientRect().top + window.scrollY - (headerHeight + 20);
                window.scrollTo({ top: position, behavior: 'smooth' });
                
                // Remove highlight after delay
                setTimeout(() => {
                    target.classList.remove('highlighted-clause');
                }, 3000);
            }, 100);
        }
    }
}

/**
 * Sets up the back-to-top button
 */
function setupBackToTop() {
    // Create button if it doesn't exist
    let button = document.getElementById('backToTopBtn');
    if (!button) {
        button = document.createElement('button');
        button.id = 'backToTopBtn';
        button.innerHTML = '&uarr;';
        button.title = 'Kembali ke atas';
        button.classList.add('back-to-top');
        button.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(button);
    }

    // Show/hide button based on scroll position
    const toggleButtonVisibility = () => {
        button.style.display = window.scrollY > 300 ? 'block' : 'none';
    };

    window.addEventListener('scroll', toggleButtonVisibility);
    toggleButtonVisibility(); // Initial check

    // Smooth scroll to top
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Sets up print functionality
 */
function setupPrintButtons() {
    document.querySelectorAll('.print-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Add print-specific styles
            const style = document.createElement('style');
            style.innerHTML = `
                @media print {
                    nav, .nav-select, .back-to-top { display: none !important; }
                    body { padding: 0; margin: 0; }
                    .clause-container { box-shadow: none; border: 1px solid #ddd; }
                }
            `;
            document.head.appendChild(style);
            
            // Print and clean up
            window.print();
            setTimeout(() => style.remove(), 1000);
        });
    });
}

/**
 * Sets up search functionality
 */
function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    if (!input || !results) return;

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const handleSearch = debounce(() => {
        const term = input.value.trim().toLowerCase();
        
        if (term.length > 2) {
            // Simple search implementation - could be enhanced with actual DOM searching
            const bodyText = document.body.innerText.toLowerCase();
            const found = bodyText.includes(term);
            
            results.innerHTML = found 
                ? `<p class="search-success">Hasil ditemukan. Tekan Ctrl+F untuk pencarian lebih detail.</p>`
                : `<p class="search-error">Tidak ditemukan hasil pencarian.</p>`;
            
            if (found) {
                input.classList.add('has-results');
            } else {
                input.classList.remove('has-results');
            }
        } else {
            results.innerHTML = '';
            input.classList.remove('has-results');
        }
    }, 300);

    input.addEventListener('input', handleSearch);
}

/**
 * Sets up accordion functionality for collapsible sections
 */
function setupAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            const content = header.nextElementSibling;
            
            accordion.classList.toggle('active');
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
            
            // Smooth height transition
            if (content.style.display === 'block') {
                content.style.overflow = 'hidden';
                content.style.height = '0';
                const contentHeight = content.scrollHeight;
                content.style.height = `${contentHeight}px`;
                
                setTimeout(() => {
                    content.style.height = 'auto';
                    content.style.overflow = 'visible';
                }, 300);
            }
        });
    });
}

/**
 * Sets up tooltips for elements with data-tooltip attribute
 */
function setupTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = tooltipText;
        element.appendChild(tooltip);
        
        element.addEventListener('mouseenter', () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });
}

/**
 * Sets up copy buttons for code blocks or other elements
 */
function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-copy-target');
            const target = document.querySelector(targetId);
            
            if (target) {
                navigator.clipboard.writeText(target.textContent)
                    .then(() => {
                        button.textContent = 'Tersalin!';
                        setTimeout(() => {
                            button.textContent = 'Salin';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Gagal menyalin:', err);
                        button.textContent = 'Gagal!';
                    });
            }
        });
    });
}

/**
 * Tracks active section in the viewport for TOC highlighting
 */
function trackActiveSection() {
    const sections = document.querySelectorAll('section[id], .clause-section');
    const navLinks = document.querySelectorAll('.toc a');
    
    if (sections.length && navLinks.length) {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${entry.target.id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            },
            { threshold: 0.5, rootMargin: '0px 0px -50% 0px' }
        );
        
        sections.forEach(section => observer.observe(section));
    }
}
