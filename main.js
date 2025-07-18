// DOM Utility Functions
const $ = (selector, element = document) => element.querySelector(selector);
const $$ = (selector, element = document) => Array.from(element.querySelectorAll(selector));

// Accordion with Animation
function initAccordions() {
    $$('.accordion-header').forEach(header => {
        header.addEventListener('click', function () {
            const item = this.parentElement;
            const content = $('.accordion-content', item);
            const isActive = item.classList.contains('active');

            // Close other accordions (if in card)
            if (!isActive && item.closest('.card')) {
                $$('.accordion-item', item.parentElement).forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherContent = $('.accordion-content', otherItem);
                        if (otherContent) otherContent.style.opacity = '0';
                    }
                });
            }

            if (isActive) {
                content.style.opacity = '0';
                setTimeout(() => item.classList.remove('active'), 300);
            } else {
                item.classList.add('active');
                setTimeout(() => content.style.opacity = '1', 10);
            }
        });
    });
}

// Ripple Effect for Buttons
function initRippleEffects() {
    $$('.product-btn, .tab, .clause-card').forEach(btn => {
        btn.classList.add('ripple');
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
            setTimeout(() => {
                if (this.href) window.location.href = this.href;
            }, 300);
        });
    });
}

// Document Interactions
function initDocumentInteractions() {
    $$('.document-item').forEach(item => {
        item.addEventListener('mouseenter', () => item.style.transform = 'translateX(5px)');
        item.addEventListener('mouseleave', () => item.style.transform = '');
    });
}

// Smooth Scroll
function initSmoothNavigation() {
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Progress Tracker
function initProgressTracking() {
    const updateProgress = () => {
        const checkboxes = $$('.document-checkbox:checked');
        const total = $$('.document-checkbox').length;
        const completed = checkboxes.length;
        const percentage = Math.round((completed / total) * 100);

        $('#totalProgress').style.width = percentage + '%';
        $('#completedCount').textContent = completed;
        $('#totalCount').textContent = total;
        $('#progressPercentage').textContent = percentage + '%';

        const progressFill = $('#totalProgress');
        if (percentage < 30) progressFill.style.backgroundColor = '#ff6b6b';
        else if (percentage < 70) progressFill.style.backgroundColor = '#ffa502';
        else progressFill.style.backgroundColor = 'var(--orange-primary)';
    };

    $$('.document-checkbox').forEach(checkbox => {
        const key = `doc-${checkbox.dataset.clause}-${$('.document-name', checkbox.closest('.document-item')).textContent.trim()}`;
        const saved = localStorage.getItem(key);
        if (saved === 'true') checkbox.checked = true;

        checkbox.addEventListener('change', function () {
            const key = `doc-${this.dataset.clause}-${$('.document-name', this.closest('.document-item')).textContent.trim()}`;
            localStorage.setItem(key, this.checked);
            updateProgress();
        });
    });

    updateProgress();
}

// Deadline Calculator
function initDeadlineCalculator() {
    const updateTimeRemaining = () => {
        const auditDate = new Date($('#auditDeadline').value);
        const today = new Date();

        if (auditDate < today) {
            $('#timeRemainingText').textContent = "Deadline audit telah lewat";
            return;
        }

        const diffTime = auditDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;

        $('#timeRemainingText').textContent = `Waktu tersisa: ${months} bulan ${days} hari`;
    };

    $('#auditDeadline').addEventListener('change', updateTimeRemaining);
    updateTimeRemaining();
}

// Slider
function initSlider() {
    const docSlider = $('#docSlider');
    const docValue = $('#docValue');

    if (docSlider && docValue) {
        docSlider.addEventListener('input', function () {
            docValue.textContent = this.value + '%';
        });
    }
}

// Touch Feedback
function initTouchFeedback() {
    $$('.card, .clause-card').forEach(card => {
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.98)';
            card.style.opacity = '0.9';
        });
        card.addEventListener('touchend', () => {
            card.style.transform = '';
            card.style.opacity = '';
        });
    });

    $$('.product-btn, .tab').forEach(btn => {
        btn.addEventListener('touchstart', () => btn.style.opacity = '0.8');
        btn.addEventListener('touchend', () => btn.style.opacity = '');
    });
}

// Iframe Height Adjuster
function initIframeHeight() {
    const frame = $('#productFrame');
    if (!frame) return;

    let lastHeight = 0;
    let resizeTimeout;

    function checkHeight() {
        try {
            frame.contentWindow.postMessage({ type: 'requestHeight' }, 'https://gifary10.github.io');
        } catch (e) {
            const newHeight = frame.contentDocument?.body?.scrollHeight || 0;
            if (newHeight !== lastHeight && newHeight > 100) {
                lastHeight = newHeight;
                frame.style.height = newHeight + 'px';
            }
        }
    }

    window.addEventListener('message', function (e) {
        if (e.origin !== 'https://gifary10.github.io') return;
        if (e.data?.type === 'iframeHeight') {
            clearTimeout(resizeTimeout);
            const newHeight = e.data.height;
            if (newHeight !== lastHeight) {
                lastHeight = newHeight;
                frame.style.height = newHeight + 'px';
            }
        }
    });

    frame.onload = function () {
        checkHeight();
        resizeTimeout = setInterval(checkHeight, 1000);
    };

    window.addEventListener('beforeunload', () => clearInterval(resizeTimeout));
}

// Main Initialization
document.addEventListener('DOMContentLoaded', function () {
    initAccordions();
    initRippleEffects();
    initDocumentInteractions();
    initSmoothNavigation();
    initTouchFeedback();

    // Page specific
    if ($('#productFrame')) initIframeHeight();
    if ($('#docSlider')) initSlider();
    if ($('#auditDeadline')) {
        initProgressTracking();
        initDeadlineCalculator();
    }

    // Default audit deadline if empty
    const auditInput = $('#auditDeadline');
    if (auditInput && !auditInput.value) {
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 6);
        auditInput.value = defaultDate.toISOString().split('T')[0];
    }

    // Card fade-in animation
    $$('.card, .clause-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.1}s`;
        card.classList.add('fade-in-up');
    });
});