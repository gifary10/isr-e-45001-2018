document.addEventListener('DOMContentLoaded', () => {
    handleClauseNavigation();
    highlightCurrentClause();
    setupBackToTop();
    setupPrintButtons();
    setupSearch();
});

function handleClauseNavigation() {
    const clauseSelector = document.getElementById('clauseSelector');
    if (!clauseSelector) return;

    const currentFile = window.location.pathname.split('/').pop();
    const optionToSelect = Array.from(clauseSelector.options).find(
        option => option.value === currentFile
    );

    if (optionToSelect) {
        clauseSelector.value = currentFile;
    }

    clauseSelector.addEventListener('change', () => {
        const selected = clauseSelector.value;
        if (selected) {
            window.location.href = selected;
        }
    });
}

function highlightCurrentClause() {
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            target.classList.add('highlighted-clause');

            setTimeout(() => {
                const offset = 100;
                const position = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: position, behavior: 'smooth' });
            }, 100);
        }
    }
}

function setupBackToTop() {
    const button = document.createElement('button');
    button.id = 'backToTopBtn';
    button.innerHTML = '&uarr;';
    button.title = 'Kembali ke atas';
    button.classList.add('back-to-top');
    document.body.appendChild(button);

    window.addEventListener('scroll', () => {
        button.style.display = window.scrollY > 300 ? 'block' : 'none';
    });

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupPrintButtons() {
    document.querySelectorAll('.print-btn').forEach(btn => {
        btn.addEventListener('click', () => window.print());
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    if (!input || !results) return;

    input.addEventListener('input', () => {
        const term = input.value.toLowerCase();
        if (term.length > 2) {
            const bodyText = document.body.innerText.toLowerCase();
            results.innerHTML = bodyText.includes(term)
                ? '<p>Hasil ditemukan. Scroll untuk melihat.</p>'
                : '<p>Tidak ditemukan hasil pencarian.</p>';
        } else {
            results.innerHTML = '';
        }
    });
}