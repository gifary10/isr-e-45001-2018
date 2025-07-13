document.addEventListener('DOMContentLoaded', function() {
    const clauseSelector = document.getElementById('clauseSelector');
    const defaultMessage = document.getElementById('defaultMessage');
    const clauseContents = document.querySelectorAll('.clause-content');
    
    clauseSelector.addEventListener('change', function() {
        const selectedClause = this.value;
        
        // Hide all content and default message
        clauseContents.forEach(content => {
            content.classList.remove('active');
        });
        defaultMessage.style.display = 'none';
        
        // Show selected content
        if (selectedClause) {
            document.getElementById(selectedClause).classList.add('active');
        } else {
            defaultMessage.style.display = 'block';
        }
        
        // Scroll to selected content
        if (selectedClause) {
            document.getElementById('clausesContainer').scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});