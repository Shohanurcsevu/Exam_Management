// topics.js

function initializeTopicsPage() {
    // --- State Management ---
    let currentPage = 1, currentSearch = '', currentSubjectId = '', currentLessonId = '', debounceTimer;
    const limit = 10;

    // --- Element Selectors ---
    const addEditModal = document.getElementById('addTopicModal');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const addTopicBtn = document.querySelector('.add-topic-btn');
    const addEditCloseBtn = addEditModal ? addEditModal.querySelector('.close-btn') : null;
    const deleteCloseBtn = deleteModal ? deleteModal.querySelector('.close-delete-btn') : null;
    const addTopicForm = document.getElementById('addTopicForm');
    const topicsTableBody = document.getElementById('topicsTableBody');
    const modalTitle = addEditModal ? addEditModal.querySelector('.modal-header h2') : null;
    const topicIdInput = document.getElementById('topicId');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const subjectFilter = document.getElementById('subjectFilter');
    const lessonFilter = document.getElementById('lessonFilter');
    const subjectSelectInModal = document.getElementById('subjectSelect');
    const lessonSelectInModal = document.getElementById('lessonSelect');
    const searchInput = document.getElementById('searchTopics');
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
        addTopicForm.reset();
        topicIdInput.value = '';
        modalTitle.textContent = 'Add New Topic';
        lessonSelectInModal.innerHTML = '<option value="" disabled selected>Select a subject first</option>';
        lessonSelectInModal.disabled = true;
        addEditModal.style.display = 'block';
    };
    
    const openModalForEdit = async (topic) => {
        if (!addEditModal) return;
        addTopicForm.reset();
        topicIdInput.value = topic.id;
        modalTitle.textContent = 'Edit Topic';
        
        subjectSelectInModal.value = topic.subject_id;
        await populateLessons(topic.subject_id, lessonSelectInModal, false);
        
        lessonSelectInModal.value = topic.lesson_id;
        
        document.getElementById('topicName').value = topic.topic_name;
        document.getElementById('startPage').value = topic.start_page;
        document.getElementById('endPage').value = topic.end_page;
        document.getElementById('totalExams').value = topic.total_exams;
        document.getElementById('pastQuestions').value = topic.past_questions;
        addEditModal.style.display = 'block';
    };

    const closeAddEditModal = () => { if (addEditModal) addEditModal.style.display = 'none'; };
    const closeDeleteModal = () => { if (deleteModal) deleteModal.style.display = 'none'; };

    // --- API Calls & Logic ---
    const populateSubjects = async () => {
        try {
            const response = await fetch('api/topics_api.php?fetchSubjects=true');
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
    
    const populateLessons = async (subjectId, lessonDropdown, showAllOption = false) => {
        if (!lessonDropdown) return;
        lessonDropdown.innerHTML = showAllOption ? '<option value="">All Lessons</option>' : '<option value="" disabled selected>Select a lesson</option>';
        lessonDropdown.disabled = true;
        if (!subjectId) return;

        try {
            const response = await fetch(`api/topics_api.php?getLessonsForSubject=${subjectId}`);
            const result = await response.json();
            if (result.status === 'success') {
                result.data.forEach(lesson => {
                    lessonDropdown.innerHTML += `<option value="${lesson.id}">${lesson.lesson_name}</option>`;
                });
                lessonDropdown.disabled = false;
            }
        } catch (error) { showToast('Could not load lessons.', false); }
    };

    const fetchTopics = async () => {
        const url = `api/topics_api.php?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&subject_id=${currentSubjectId}&lesson_id=${currentLessonId}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                renderTable(result.data);
                renderPagination(result.pagination);
            } else { showToast(result.message, false); }
        } catch (error) { console.error("Fetch Error:", error); showToast('Failed to fetch topics.', false); }
    };
    
    const promptForDelete = (id) => {
        if (!deleteModal || !confirmDeleteBtn) return;
        confirmDeleteBtn.dataset.topicId = id;
        deleteModal.style.display = 'block';
    };

    const executeDelete = async () => {
        const id = confirmDeleteBtn.dataset.topicId;
        if (!id) return;
        try {
            const response = await fetch('api/topics_api.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
            const result = await response.json();
            showToast(result.message, result.status === 'success');
            if (result.status === 'success') {
                fetchTopics();
            }
        } catch (error) { showToast('Failed to delete topic.', false); }
        finally { closeDeleteModal(); }
    };
    
    // --- Rendering ---
    const renderTable = (topics) => {
        if (!topicsTableBody) return;
        topicsTableBody.innerHTML = '';
        if (topics.length === 0) {
            topicsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No topics match your criteria.</td></tr>';
            return;
        }
        topics.forEach(topic => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Topic Name"><span>${topic.topic_name}</span></td>
                <td data-label="Lesson"><span>${topic.lesson_name}</span></td>
                <td data-label="Subject"><span>${topic.subject_name}</span></td>
                <td data-label="Page Range"><span>${topic.start_page} - ${topic.end_page}</span></td>
                <td data-label="Exams"><span>${topic.total_exams}</span></td>
                <td data-label="Past Qs"><span>${topic.past_questions}</span></td>
                <td data-label="Actions">
                    <div class="action-btn-wrapper">
                        <button class="action-btn edit-btn">Edit</button>
                        <button class="action-btn delete-btn">Delete</button>
                    </div>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(topic));
            row.querySelector('.delete-btn').addEventListener('click', () => promptForDelete(topic.id));
            topicsTableBody.appendChild(row);
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
            btn.addEventListener('click', () => { if (!isDisabled) { currentPage = pageNum; fetchTopics(); } });
            return btn;
        };
        paginationControls.appendChild(createPageBtn('&laquo; Prev', pagination.currentPage - 1, pagination.currentPage === 1));
        for (let i = 1; i <= pagination.totalPages; i++) {
            paginationControls.appendChild(createPageBtn(i, i, false, i === pagination.currentPage));
        }
        paginationControls.appendChild(createPageBtn('Next &raquo;', pagination.currentPage + 1, pagination.currentPage === pagination.totalPages));
    };

    // --- Event Listeners ---
    if(addTopicBtn) addTopicBtn.addEventListener('click', openModalForCreate);
    if(addEditCloseBtn) addEditCloseBtn.addEventListener('click', closeAddEditModal);
    if(deleteCloseBtn) deleteCloseBtn.addEventListener('click', closeDeleteModal);
    if(cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if(confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDelete);
    
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            debounce(() => {
                currentSearch = e.target.value;
                currentPage = 1;
                fetchTopics();
            }, 300);
        });
    }

    if(subjectFilter) {
        subjectFilter.addEventListener('change', (e) => {
            currentSubjectId = e.target.value;
            currentLessonId = ''; // Reset lesson filter
            currentPage = 1;
            populateLessons(currentSubjectId, lessonFilter, true);
            fetchTopics();
        });
    }
    
    if(lessonFilter) {
        lessonFilter.addEventListener('change', (e) => {
            currentLessonId = e.target.value;
            currentPage = 1;
            fetchTopics();
        });
    }

    if(subjectSelectInModal) {
        subjectSelectInModal.addEventListener('change', (e) => {
            populateLessons(e.target.value, lessonSelectInModal, false);
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == addEditModal) closeAddEditModal();
        if (event.target == deleteModal) closeDeleteModal();
    });

    if(addTopicForm) {
        addTopicForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = {
                topicId: topicIdInput.value,
                subjectId: document.getElementById('subjectSelect').value,
                lessonId: document.getElementById('lessonSelect').value,
                topicName: document.getElementById('topicName').value,
                startPage: document.getElementById('startPage').value,
                endPage: document.getElementById('endPage').value,
                totalExams: document.getElementById('totalExams').value,
                pastQuestions: document.getElementById('pastQuestions').value,
            };
            try {
                const response = await fetch('api/topics_api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                const result = await response.json();
                showToast(result.message, result.status === 'success');
                if (result.status === 'success') {
                    closeAddEditModal();
                    fetchTopics();
                }
            } catch (error) { showToast('An error occurred while saving the topic.', false); }
        });
    }

    // --- Initial Load ---
    populateSubjects();
    fetchTopics();
}

initializeTopicsPage();