Of course. Here is the complete code for `index.html` and `script.js`, reflecting all the updates, including the new "Total Subjects" card and the logic to fetch its data.

---

### **1. `index.html` (Complete)**
This is the main application shell, now including the new card for displaying the total number of subjects.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Taking Management Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
</head>
<body>
    <div class="dashboard-container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Admin Panel</h2>
            </div>
            <nav class="sidebar-nav">
                <ul>
                    <li class="active" id="nav-dashboard"><a href="#"><span class="material-icons">dashboard</span> Dashboard</a></li>
                    <li id="nav-subject"><a href="#"><span class="material-icons">subject</span> Subject</a></li>
                    <li><a href="#"><span class="material-icons">library_books</span> Lesson</a></li>
                    <li><a href="#"><span class="material-icons">topic</span> Topics</a></li>
                    <li><a href="#"><span class="material-icons">school</span> Exams</a></li>
                    <li><a href="#"><span class="material-icons">people</span> Students</a></li>
                    <li><a href="#"><span class="material-icons">bar_chart</span> Results</a></li>
                    <li><a href="#"><span class="material-icons">settings</span> Settings</a></li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            <header class="header">
                <div class="header-menu-toggle">
                    <span class="material-icons">menu</span>
                </div>
                <div class="header-user">
                    <span class="material-icons">notifications</span>
                </div>
            </header>

            <section class="content" id="main-content-area">
                <div class="content-header">
                    <div class="header-search">
                        <span class="material-icons search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="Search..." class="search-input">
                        <span class="material-icons clear-icon" id="clearSearch">close</span>
                        <kbd class="shortcut-hint">/</kbd>
                    </div>
                </div>
                <div class="cards-container">
                    <div class="card">
                        <div class="card-icon"><span class="material-icons">class</span></div>
                        <div class="card-info">
                            <h3 id="total-subjects">0</h3>
                            <p>Total Subjects</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-icon"><span class="material-icons">visibility</span></div>
                        <div class="card-info">
                            <h3 id="total-exams">0</h3>
                            <p>Total Exams</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-icon"><span class="material-icons">check_circle</span></div>
                        <div class="card-info">
                            <h3 id="active-exams">0</h3>
                            <p>Active Exams</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-icon"><span class="material-icons">group_add</span></div>
                        <div class="card-info">
                            <h3 id="students-enrolled">0</h3>
                            <p>Students Enrolled</p>
                        </div>
                    </div>
                </div>
                <div class="recent-activity">
                    <h3>Recent Activity</h3>
                    <table id="activity-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Exam Name</th>
                                <th>Status</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>
    
    <script src="script.js"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
</body>
</html>
```

---

### **2. `script.js` (Complete)**
This is the main JavaScript file, now with the added `fetchDashboardStats` function to dynamically update the dashboard cards.

```javascript
document.addEventListener('DOMContentLoaded', function() {

    // --- Mobile Sidebar Toggle Logic ---
    const menuToggle = document.querySelector('.header-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-visible');
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
                // Update the text content of the card elements
                const totalSubjectsEl = document.getElementById('total-subjects');
                const totalExamsEl = document.getElementById('total-exams');
                const activeExamsEl = document.getElementById('active-exams');
                const studentsEnrolledEl = document.getElementById('students-enrolled');

                if (totalSubjectsEl) totalSubjectsEl.textContent = result.data.total_subjects;
                if (totalExamsEl) totalExamsEl.textContent = result.data.total_exams;
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            mainContentArea.innerHTML = content;

            // Execute scripts from the loaded content
            const scripts = mainContentArea.querySelectorAll('script');
            for (const script of scripts) {
                const newScript = document.createElement('script');
                if (script.src) {
                    // For external scripts, we need to wait for them to load
                    await new Promise((resolve, reject) => {
                        newScript.src = script.src;
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                        document.body.appendChild(newScript).parentNode.removeChild(newScript);
                    });
                } else {
                    // For inline scripts
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
                fetchDashboardStats(); // Fetch stats when returning to dashboard
            } else if (navId === 'nav-subject') {
                loadPage('subject.html');
            }
            
            setActiveLink(this);
        });
    });
});
```
