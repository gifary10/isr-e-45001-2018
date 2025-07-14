/**
 * script.js - ISO 45001:2018 Documentation System
 * Fungsi utama untuk navigasi dan interaksi halaman
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi komponen saat halaman dimuat
    initNavigation();
    initBackToTop();
    highlightCurrentClause();
    setupPrintButtons();
    setupSearchFunctionality();
});

/**
 * Fungsi untuk inisialisasi navigasi dropdown
 */
function initNavigation() {
    const clauseSelector = document.getElementById('clauseSelector');
    if (clauseSelector) {
        // Set dropdown ke halaman saat ini
        const currentPage = window.location.pathname.split('/').pop();
        clauseSelector.value = currentPage;
        
        // Tambahkan event listener untuk navigasi
        clauseSelector.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue) {
                window.location.href = selectedValue;
            }
        });
    }
}

/**
 * Fungsi untuk menyorot klausul/sub-klausul saat ini di URL hash
 */
function highlightCurrentClause() {
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            targetElement.classList.add('highlighted-clause');
            
            // Scroll ke elemen dengan offset untuk header
            setTimeout(() => {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
}

/**
 * Fungsi untuk inisialisasi tombol "Back to Top"
 */
function initBackToTop() {
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '&uarr;';
    backToTopButton.id = 'backToTopBtn';
    backToTopButton.title = 'Kembali ke atas';
    backToTopButton.classList.add('back-to-top');
    document.body.appendChild(backToTopButton);
    
    // Tampilkan/sembunyikan tombol saat scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // Fungsi untuk kembali ke atas
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Fungsi untuk setup tombol cetak
 */
function setupPrintButtons() {
    const printButtons = document.querySelectorAll('.print-btn');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.print();
        });
    });
}

/**
 * Fungsi untuk setup pencarian (jika ada)
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            if (searchTerm.length > 2) {
                // Implementasi pencarian bisa ditambahkan di sini
                // Contoh sederhana:
                const allContent = document.body.innerText.toLowerCase();
                const matches = allContent.includes(searchTerm);
                
                if (matches) {
                    searchResults.innerHTML = '<p>Hasil ditemukan. Scroll untuk melihat.</p>';
                } else {
                    searchResults.innerHTML = '<p>Tidak ditemukan hasil pencarian.</p>';
                }
            } else {
                searchResults.innerHTML = '';
            }
        });
    }
}

/**
 * Fungsi untuk navigasi antar klausul
 */
function navigateToClause() {
    const selector = document.getElementById('clauseSelector');
    if (selector) {
        const selectedValue = selector.value;
        if (selectedValue) {
            window.location.href = selectedValue;
        }
    }
}

/**
 * Fungsi untuk menyalin teks ke clipboard
 */
function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(function() {
        // Tampilkan feedback
        const originalText = element.innerHTML;
        element.innerHTML = 'Tersalin!';
        
        setTimeout(function() {
            element.innerHTML = originalText;
        }, 2000);
    }).catch(function(err) {
        console.error('Gagal menyalin: ', err);
    });
}

/**
 * Fungsi untuk toggle visibilitas konten
 */
function toggleContent(contentId, toggleButton) {
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.toggle('hidden-content');
        
        // Update teks tombol
        if (content.classList.contains('hidden-content')) {
            toggleButton.innerHTML = 'Tampilkan <i class="bi bi-chevron-down"></i>';
        } else {
            toggleButton.innerHTML = 'Sembunyikan <i class="bi bi-chevron-up"></i>';
        }
    }
}

/**
 * Fungsi untuk menangani keyboard navigation
 */
document.addEventListener('keydown', function(e) {
    // Ctrl + F untuk fokus ke search input
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Esc untuk keluar dari search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.blur();
        }
    }
});

// Export fungsi untuk pengujian (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        highlightCurrentClause,
        navigateToClause,
        copyToClipboard,
        toggleContent
    };
}
