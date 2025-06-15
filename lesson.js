// lesson.js

function initializeLessonPage() {
    // --- State Management ---
    let currentPage = 1, currentSearch = '', currentSubjectId = '', debounceTimer;
    const limit = 10;

    // --- Element Selectors ---
    const addEditModal = document.getElementById('addLessonModal');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const addLessonBtn = document.querySelector('.add-lesson-btn');
    const addEditCloseBtn = addEditModal ? addEditModal.querySelector('.close-btn') : null;
    const deleteCloseBtn = deleteModal ? deleteModal.querySelector('.close-delete-btn') : null;
    const addLessonForm = document.getElementById('addLessonForm');
    const lessonsTableBody = document.getElementById('lessonsTableBody');
    const modalTitle = addEditModal ? addEditModal.querySelector('.modal-header h2') : null;
    const lessonIdInput = document.getElementById('lessonId');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const subjectFilter = document.getElementById('subjectFilter');
    const subjectSelectInModal = document.getElementById('subjectSelect');
    const searchInput = document.getElementById('searchLessons');
    const paginationControls = document.getElementById('pagination-controls');

    // --- Toast Function ---
    const showToast = (message, isSuccess = true) => {
        Toastify({
            text: message, duration: 3000, close: true, gravity: "top", position: "right",
            backgroundColor: isSuccess ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    };

    // --- Debounce function ---
    const debounce = (func, delay) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    };
    
    // --- Modal Handling ---
    const openModalForCreate = () => {
        if (!addEditModal) return;
        addLessonForm.reset();
        lessonIdInput.value = '';
        modalTitle.textContent = 'Add New Lesson';
        addEditModal.style.display = 'block';
    };
    
    const openModalForEdit = (lesson) => {
        if (!addEditModal) return;
        addLessonForm.reset();
        lessonIdInput.value = lesson.id;
        modalTitle.textContent = 'Edit Lesson';
        document.getElementById('subjectSelect').value = lesson.subject_id;
        document.getElementById('lessonName').value = lesson.lesson_name;
        document.getElementById('lessonNumber').value = lesson.lesson_number;
        document.getElementById('startPage').value = lesson.start_page;
        document.getElementById('endPage').value = lesson.end_page;
        document.getElementById('totalPastQuestions').value = lesson.total_past_questions;
        document.getElementById('totalTopics').value = lesson.total_topics;
        addEditModal.style.display = 'block';
    };

    const closeAddEditModal = () => { if (addEditModal) addEditModal.style.display = 'none'; };
    const closeDeleteModal = () => { if (deleteModal) deleteModal.style.display = 'none'; };

    // --- API Calls & Logic ---
    const populateSubjectDropdowns = async () => {
        try {
            const response = await fetch('api/lesson_api.php?fetchSubjects=true');
            const result = await response.json();
            if (result.status === 'success') {
                if(subjectFilter) {
                    subjectFilter.innerHTML = '<option value="">All Subjects</option>';
                    result.data.forEach(subject => subjectFilter.innerHTML += `<option value="${subject.id}">${subject.subject_name}</option>`);
                }
                if(subjectSelectInModal) {
                    subjectSelectInModal.innerHTML = '<option value="" disabled selected>Select a subject</option>';
                    result.data.forEach(subject => subjectSelectInModal.innerHTML += `<option value="${subject.id}">${subject.subject_name}</option>`);
                }
            } else { showToast('Could not load subjects.', false); }
        } catch (error) { console.error("Dropdown fetch error:", error); showToast('Could not load subjects.', false); }
    };

    const fetchLessons = async () => {
        const url = `api/lesson_api.php?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&subject_id=${currentSubjectId}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                renderTable(result.data);
                renderPagination(result.pagination);
            } else { showToast(result.message, false); }
        } catch (error) { console.error("Fetch Error:", error); showToast('Failed to fetch lessons.', false); }
    };
    
    const promptForDelete = (id) => {
        if (!deleteModal) return;
        confirmDeleteBtn.dataset.lessonId = id;
        deleteModal.style.display = 'block';
    };

    const executeDelete = async () => {
        const id = confirmDeleteBtn.dataset.lessonId;
        if (!id) return;
        try {
            const response = await fetch('api/lesson_api.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
            const result = await response.json();
            showToast(result.message, result.status === 'success');
            if (result.status === 'success') {
                fetchLessons();
            }
        } catch (error) { showToast('Failed to delete lesson.', false); }
        finally { closeDeleteModal(); }
    };
    
    // --- Rendering ---
    const renderTable = (lessons) => {
        if (!lessonsTableBody) return;
        lessonsTableBody.innerHTML = '';
        if (lessons.length === 0) {
            lessonsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No lessons match your criteria.</td></tr>';
            return;
        }
        lessons.forEach(lesson => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Lesson Name"><span>${lesson.lesson_name}</span></td>
                <td data-label="Lesson No."><span>${lesson.lesson_number}</span></td>
                <td data-label="Subject"><span>${lesson.subject_name}</span></td>
                <td data-label="Page Range"><span>${lesson.start_page} - ${lesson.end_page}</span></td>
                <td data-label="Past Questions"><span>${lesson.total_past_questions}</span></td>
                <td data-label="Total Topics"><span>${lesson.total_topics}</span></td>
                <td data-label="Actions">
                    <div class="action-btn-wrapper">
                        <button class="action-btn edit-btn">Edit</button>
                        <button class="action-btn delete-btn">Delete</button>
                    </div>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(lesson));
            row.querySelector('.delete-btn').addEventListener('click', () => promptForDelete(lesson.id));
            lessonsTableBody.appendChild(row);
        });
    };

    const renderPagination = (pagination) => {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (pagination.totalPages <= 1) return;
        const createPageBtn = (text, pageNum, isDisabled = false, isActive = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            btn.className = 'page-btn';
            if (isDisabled) btn.classList.add('disabled');
            if (isActive) btn.classList.add('active');
            btn.addEventListener('click', () => { if (!isDisabled) { currentPage = pageNum; fetchLessons(); } });
            return btn;
        };
        paginationControls.appendChild(createPageBtn('&laquo; Prev', pagination.currentPage - 1, pagination.currentPage === 1));
        for (let i = 1; i <= pagination.totalPages; i++) {
            paginationControls.appendChild(createPageBtn(i, i, false, i === pagination.currentPage));
        }
        paginationControls.appendChild(createPageBtn('Next &raquo;', pagination.currentPage + 1, pagination.currentPage === pagination.totalPages));
    };

    // --- Event Listeners ---
    if(addLessonBtn) addLessonBtn.addEventListener('click', openModalForCreate);
    if(addEditCloseBtn) addEditCloseBtn.addEventListener('click', closeAddEditModal);
    if(deleteCloseBtn) deleteCloseBtn.addEventListener('click', closeDeleteModal);
    if(cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if(confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDelete);
    
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            debounce(() => {
                currentSearch = e.target.value;
                currentPage = 1;
                fetchLessons();
            }, 300);
        });
    }

    if(subjectFilter) {
        subjectFilter.addEventListener('change', (e) => {
            currentSubjectId = e.target.value;
            currentPage = 1;
            fetchLessons();
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == addEditModal) closeAddEditModal();
        if (event.target == deleteModal) closeDeleteModal();
    });

    if(addLessonForm) {
        addLessonForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = {
                lessonId: lessonIdInput.value,
                subjectId: document.getElementById('subjectSelect').value,
                lessonName: document.getElementById('lessonName').value,
                lessonNumber: document.getElementById('lessonNumber').value,
                startPage: document.getElementById('startPage').value,
                endPage: document.getElementById('endPage').value,
                totalPastQuestions: document.getElementById('totalPastQuestions').value,
                totalTopics: document.getElementById('totalTopics').value,
            };
            try {
                const response = await fetch('api/lesson_api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                const result = await response.json();
                showToast(result.message, result.status === 'success');
                if (result.status === 'success') {
                    closeAddEditModal();
                    fetchLessons();
                }
            } catch (error) { showToast('An error occurred while saving the lesson.', false); }
        });
    }

    // --- Initial Load ---
    populateSubjectDropdowns();
    fetchLessons();
}

initializeLessonPage();