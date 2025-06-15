// subject.js

function initializeSubjectPage() {
    // --- State Management, Selectors, Toast, Debounce, Modals ---
    let currentPage = 1, currentSearch = '', currentCategory = '', debounceTimer;
    const limit = 10;
    const addEditModal = document.getElementById('addSubjectModal'), deleteModal = document.getElementById('deleteConfirmModal'),
          addSubjectBtn = document.querySelector('.add-subject-btn'), addEditCloseBtn = addEditModal.querySelector('.close-btn'),
          deleteCloseBtn = deleteModal.querySelector('.close-delete-btn'), addSubjectForm = document.getElementById('addSubjectForm'),
          subjectsTableBody = document.getElementById('subjectsTableBody'), modalTitle = addEditModal.querySelector('.modal-header h2'),
          subjectIdInput = document.getElementById('subjectId'), confirmDeleteBtn = document.getElementById('confirmDeleteBtn'),
          cancelDeleteBtn = document.getElementById('cancelDeleteBtn'), categoryFilter = document.getElementById('categoryFilter'),
          searchInput = document.getElementById('searchSubjects'), paginationControls = document.getElementById('pagination-controls');

    const showToast = (message, isSuccess = true) => {
        Toastify({
            text: message, duration: 3000, close: true, gravity: "top", position: "right",
            backgroundColor: isSuccess ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    };
    const debounce = (func, delay) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    };
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
        document.getElementById('previousBcsQuestion').value = subject.previous_bcs_question;
        document.getElementById('category').value = subject.category;
        modalTitle.textContent = 'Edit Subject';
        addEditModal.style.display = 'block';
    };
    const closeAddEditModal = () => addEditModal.style.display = 'none';
    const closeDeleteModal = () => deleteModal.style.display = 'none';
    const fetchSubjects = async () => {
        const url = `api/subject_api.php?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                renderTable(result.data);
                renderPagination(result.pagination);
            } else { showToast(result.message, false); }
        } catch (error) { console.error("Fetch Error:", error); showToast('Failed to fetch subjects.', false); }
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
        } catch (error) { showToast('Failed to delete subject.', false); }
        finally { closeDeleteModal(); }
    };
    
    // --- Table Rendering (with new progress bar) ---
    const renderTable = (subjects) => {
        subjectsTableBody.innerHTML = '';
        if (subjects.length === 0) {
            subjectsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No subjects match your criteria.</td></tr>';
            return;
        }
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            
            const totalLessons = parseInt(subject.total_lessons, 10);
            const lessonsCreated = parseInt(subject.lessons_created, 10);
            let progressPercent = 0;
            if (totalLessons > 0) {
                progressPercent = Math.round((lessonsCreated / totalLessons) * 100);
            }

            let colorClass = 'color-red';
            if (progressPercent > 80) { colorClass = 'color-green'; } 
            else if (progressPercent > 60) { colorClass = 'color-light-green'; } 
            else if (progressPercent > 40) { colorClass = 'color-yellow'; } 
            else if (progressPercent > 20) { colorClass = 'color-orange'; }

            const progressHtml = `
                <div class="minimal-progress-container">
                    <div class="minimal-progress-fill ${colorClass}" style="width: ${progressPercent}%;"></div>
                </div>
            `;

            row.innerHTML = `
                <td>${subject.subject_name}</td>
                <td>${subject.book_name}</td>
                <td>${subject.total_pages}</td>
                <td>${subject.total_lessons}</td>
                <td>${subject.previous_bcs_question}</td>
                <td>${subject.category}</td>
                <td>${progressHtml}</td>
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
            btn.addEventListener('click', () => { if (!isDisabled) { currentPage = pageNum; fetchSubjects(); } });
            return btn;
        };
        paginationControls.appendChild(createPageBtn('&laquo; Prev', pagination.currentPage - 1, pagination.currentPage === 1));
        for (let i = 1; i <= pagination.totalPages; i++) {
            paginationControls.appendChild(createPageBtn(i, i, false, i === pagination.currentPage));
        }
        paginationControls.appendChild(createPageBtn('Next &raquo;', pagination.currentPage + 1, pagination.currentPage === pagination.totalPages));
    };

    // --- Event Listeners and Form Submission ---
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
            previousBcsQuestion: document.getElementById('previousBcsQuestion').value,
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
        } catch (error) { showToast('An error occurred while saving the subject.', false); }
    });

    // --- Initial Load ---
    fetchSubjects();
}

initializeSubjectPage();