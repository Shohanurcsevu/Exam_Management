// subject.js (Complete with Pagination and Filtering)

function initializeSubjectPage() {
    // --- State Management ---
    let currentPage = 1;
    let currentSearch = '';
    let currentCategory = '';
    const limit = 10; // Records per page
    let debounceTimer;

    // --- Element Selectors ---
    const addEditModal = document.getElementById('addSubjectModal');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const addSubjectBtn = document.querySelector('.add-subject-btn');
    const addEditCloseBtn = addEditModal.querySelector('.close-btn');
    const deleteCloseBtn = deleteModal.querySelector('.close-delete-btn');
    const addSubjectForm = document.getElementById('addSubjectForm');
    const subjectsTableBody = document.getElementById('subjectsTableBody');
    const modalTitle = addEditModal.querySelector('.modal-header h2');
    const subjectIdInput = document.getElementById('subjectId');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchSubjects');
    const paginationControls = document.getElementById('pagination-controls');

    // --- Toast Function ---
    const showToast = (message, isSuccess = true) => {
        Toastify({
            text: message, duration: 3000, close: true, gravity: "top", position: "right",
            backgroundColor: isSuccess ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    };

    // --- Debounce function for search input ---
    const debounce = (func, delay) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    };
    
    // --- Modal Handling ---
    const openModalForCreate = () => {
        addSubjectForm.reset();
        subjectIdInput.value = '';
        modalTitle.textContent = 'Add New Subject';
        addEditModal.style.display = 'block';
    };
    
    const openModalForEdit = (subject) => {
        addSubjectForm.reset();
        subjectIdInput.value = subject.id;
        document.getElementById('subjectName').value = subject.subject_name;
        document.getElementById('bookName').value = subject.book_name;
        document.getElementById('totalPages').value = subject.total_pages;
        document.getElementById('totalLessons').value = subject.total_lessons;
        document.getElementById('category').value = subject.category;
        modalTitle.textContent = 'Edit Subject';
        addEditModal.style.display = 'block';
    };

    const closeAddEditModal = () => addEditModal.style.display = 'none';
    const closeDeleteModal = () => deleteModal.style.display = 'none';

    // --- API Calls & Logic ---
    const fetchSubjects = async () => {
        const url = `api/subject_api.php?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                renderTable(result.data);
                renderPagination(result.pagination);
            } else {
                showToast(result.message, false);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            showToast('Failed to fetch subjects.', false);
        }
    };
    
    const promptForDelete = (id) => {
        confirmDeleteBtn.dataset.subjectId = id;
        deleteModal.style.display = 'block';
    };

    const executeDelete = async () => {
        const id = confirmDeleteBtn.dataset.subjectId;
        if (!id) return;
        try {
            const response = await fetch('api/subject_api.php', {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            showToast(result.message, result.status === 'success');
            if (result.status === 'success') {
                fetchSubjects();
            }
        } catch (error) {
            showToast('Failed to delete subject.', false);
        } finally {
            closeDeleteModal();
        }
    };
    
    // --- Rendering ---
    const renderTable = (subjects) => {
        subjectsTableBody.innerHTML = '';
        if (subjects.length === 0) {
            subjectsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No subjects match your criteria.</td></tr>';
            return;
        }
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject.subject_name}</td>
                <td>${subject.book_name}</td>
                <td>${subject.total_pages}</td>
                <td>${subject.total_lessons}</td>
                <td>${subject.category}</td>
                <td>
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn delete-btn">Delete</button>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(subject));
            row.querySelector('.delete-btn').addEventListener('click', () => promptForDelete(subject.id));
            subjectsTableBody.appendChild(row);
        });
    };

    const renderPagination = (pagination) => {
        paginationControls.innerHTML = '';
        if (pagination.totalPages <= 1) return;

        const createPageBtn = (text, pageNum, isDisabled = false, isActive = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            btn.className = 'page-btn';
            if (isDisabled) btn.classList.add('disabled');
            if (isActive) btn.classList.add('active');
            btn.addEventListener('click', () => {
                if (!isDisabled) {
                    currentPage = pageNum;
                    fetchSubjects();
                }
            });
            return btn;
        };
        
        paginationControls.appendChild(createPageBtn('&laquo; Prev', pagination.currentPage - 1, pagination.currentPage === 1));

        for (let i = 1; i <= pagination.totalPages; i++) {
            paginationControls.appendChild(createPageBtn(i, i, false, i === pagination.currentPage));
        }

        paginationControls.appendChild(createPageBtn('Next &raquo;', pagination.currentPage + 1, pagination.currentPage === pagination.totalPages));
    };

    // --- Event Listeners ---
    addSubjectBtn.addEventListener('click', openModalForCreate);
    addEditCloseBtn.addEventListener('click', closeAddEditModal);
    deleteCloseBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', executeDelete);
    
    searchInput.addEventListener('input', (e) => {
        debounce(() => {
            currentSearch = e.target.value;
            currentPage = 1;
            fetchSubjects();
        }, 300);
    });

    categoryFilter.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        currentPage = 1;
        fetchSubjects();
    });

    window.addEventListener('click', (event) => {
        if (event.target == addEditModal) closeAddEditModal();
        if (event.target == deleteModal) closeDeleteModal();
    });

    addSubjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            subjectId: subjectIdInput.value,
            subjectName: document.getElementById('subjectName').value,
            bookName: document.getElementById('bookName').value,
            totalPages: document.getElementById('totalPages').value,
            totalLessons: document.getElementById('totalLessons').value,
            category: document.getElementById('category').value,
        };

        try {
            const response = await fetch('api/subject_api.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            showToast(result.message, result.status === 'success');
            if (result.status === 'success') {
                closeAddEditModal();
                fetchSubjects();
            }
        } catch (error) {
            showToast('An error occurred while saving the subject.', false);
        }
    });

    // --- Initial Load ---
    fetchSubjects();
}

initializeSubjectPage();