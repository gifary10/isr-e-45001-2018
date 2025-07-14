document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const clauseSelector = document.getElementById('clauseSelector');
    const defaultMessage = document.getElementById('defaultMessage');
    const clauseContents = document.querySelectorAll('.clause-content');
    const clausesContainer = document.getElementById('clausesContainer');

    // Initialize page based on current URL
    function initializePage() {
        const path = window.location.pathname.split('/').pop();
        if (clauseSelector && path) {
            clauseSelector.value = path;
            updateClauseDisplay(path);
        }
    }

    // Update clause display based on selection
    function updateClauseDisplay(selectedClause) {
        // Hide all content and default message
        clauseContents.forEach(content => {
            content.classList.remove('active');
        });
        defaultMessage.style.display = 'none';
        
        // Show selected content or default message
        if (selectedClause) {
            const targetElement = document.getElementById(selectedClause);
            if (targetElement) {
                targetElement.classList.add('active');
                scrollToClausesContainer();
            }
        } else {
            defaultMessage.style.display = 'block';
        }
    }

    // Smooth scroll to clauses container
    function scrollToClausesContainer() {
        if (clausesContainer) {
            clausesContainer.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    // Navigation function
    function navigateToClause() {
        const selectedValue = clauseSelector.value;
        if (selectedValue) {
            window.location.href = selectedValue;
        }
    }

    // Event listeners
    if (clauseSelector) {
        clauseSelector.addEventListener('change', function() {
            updateClauseDisplay(this.value);
        });
    }

    // Initialize the page
    initializePage();
});

// Note: The navigateToClause function has been incorporated into the main structure
// If you need it as a global function, you can either:
// 1. Attach it to window object inside the DOMContentLoaded handler, or
// 2. Keep it separate but ensure it doesn't duplicate functionality
