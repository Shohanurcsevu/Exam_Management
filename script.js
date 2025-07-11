document.addEventListener('DOMContentLoaded', function() {

    // --- Mobile Sidebar Toggle Logic ---
    const menuToggle = document.querySelector('.header-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarCloseBtn = document.querySelector('.sidebar-close-btn');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-visible');
        });
    }

    if (sidebarCloseBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', function() {
            sidebar.classList.remove('sidebar-visible');
        });
    }

    // --- Advanced Search Bar Logic ---
    function initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearSearchIcon = document.getElementById('clearSearch');
        const shortcutHint = document.querySelector('.shortcut-hint');

        if (searchInput && clearSearchIcon) {
            searchInput.addEventListener('input', function() {
                const hasValue = searchInput.value.length > 0;
                clearSearchIcon.style.display = hasValue ? 'inline-block' : 'none';
                if (shortcutHint) {
                    shortcutHint.style.display = hasValue ? 'none' : 'inline-block';
                }
            });
            clearSearchIcon.addEventListener('click', function() {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
            });
        }
    }

    // --- Function to fetch and update dashboard stats ---
    async function fetchDashboardStats() {
        try {
            const response = await fetch('api/dashboard_api.php');
            const result = await response.json();
            if (result.status === 'success' && result.data) {
                const totalSubjectsEl = document.getElementById('total-subjects');
                const totalLessonsEl = document.getElementById('total-lessons');
                const activeExamsEl = document.getElementById('active-exams');
                const studentsEnrolledEl = document.getElementById('students-enrolled');
                if (totalSubjectsEl) totalSubjectsEl.textContent = result.data.total_subjects;
                if (totalLessonsEl) totalLessonsEl.textContent = result.data.total_lessons;
                if (activeExamsEl) activeExamsEl.textContent = result.data.active_exams;
                if (studentsEnrolledEl) studentsEnrolledEl.textContent = result.data.students_enrolled;
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    }

    // Initial setup for the default loaded page
    initializeSearch();
    fetchDashboardStats();

    // Keyboard shortcut for search ('/')
    window.addEventListener('keydown', function(event) {
        const isTyping = document.activeElement.tagName.toLowerCase() === 'input' || document.activeElement.tagName.toLowerCase() === 'textarea';
        if (event.key === '/' && !isTyping) {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                 searchInput.focus();
            }
        }
    });

    // --- Page Loading Logic ---
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const mainContentArea = document.getElementById('main-content-area');
    const defaultPageContent = mainContentArea.innerHTML; 

    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const content = await response.text();
            mainContentArea.innerHTML = content;
            const scripts = mainContentArea.querySelectorAll('script');
            for (const script of scripts) {
                const newScript = document.createElement('script');
                if (script.src) {
                    await new Promise((resolve, reject) => {
                        newScript.src = script.src;
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                        document.body.appendChild(newScript).parentNode.removeChild(newScript);
                    });
                } else {
                    eval(script.innerHTML);
                }
            }
            initializeSearch();
        } catch (error) {
            mainContentArea.innerHTML = `<p>Error loading page: ${error.message}.</p>`;
            console.error('Failed to load page:', error);
        }
    }
    
    function setActiveLink(link) {
        navLinks.forEach(l => l.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const navId = this.parentElement.id; 
            if (navId === 'nav-dashboard') {
                mainContentArea.innerHTML = defaultPageContent;
                initializeSearch(); 
                fetchDashboardStats(); 
            } else if (navId === 'nav-subject') {
                loadPage('subject.html');
            } else if (navId === 'nav-lesson') {
                loadPage('lesson.html');
            }else if (navId === 'nav-topics') { // <<< ADD THIS BLOCK
                loadPage('topics.html');
            }
            setActiveLink(this);
        });
    });
});