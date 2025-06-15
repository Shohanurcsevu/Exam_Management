// subject.js

function initializeSubjectPage() {
    // --- Element Selectors ---
    const addEditModal = document.getElementById('addSubjectModal');
    const deleteModal = document.getElementById('deleteConfirmModal'); // New delete modal
    const addSubjectBtn = document.querySelector('.add-subject-btn');
    const addEditCloseBtn = addEditModal.querySelector('.close-btn');
    const deleteCloseBtn = deleteModal.querySelector('.close-delete-btn'); // New close button
    const addSubjectForm = document.getElementById('addSubjectForm');
    const subjectsTableBody = document.getElementById('subjectsTableBody');
    const modalTitle = addEditModal.querySelector('.modal-header h2');
    const subjectIdInput = document.getElementById('subjectId');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // --- Toast Function ---
    const showToast = (message, isSuccess = true) => {
        Toastify({
            text: message, duration: 3000, close: true, gravity: "top", position: "right",
            backgroundColor: isSuccess ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
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
        document.getElementById('category').value = subject.category;
        modalTitle.textContent = 'Edit Subject';
        addEditModal.style.display = 'block';
    };

    const closeAddEditModal = () => addEditModal.style.display = 'none';
    const closeDeleteModal = () => deleteModal.style.display = 'none';

    // --- API Calls & Logic ---
    const fetchSubjects = async () => {
        try {
            const response = await fetch('api/subject_api.php');
            const result = await response.json();
            if (result.status === 'success') {
                renderTable(result.data);
            } else { showToast(result.message, false); }
        } catch (error) { showToast('Failed to fetch subjects.', false); }
    };

    // This function just opens the modal and sets the ID
    const promptForDelete = (id) => {
        // Store the id on the confirm button's dataset for later use
        confirmDeleteBtn.dataset.subjectId = id;
        deleteModal.style.display = 'block';
    };

    // This function executes the actual deletion
    const executeDelete = async () => {
        const id = confirmDeleteBtn.dataset.subjectId;
        if (!id) return;

        try {
            const response = await fetch('api/subject_api.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            showToast(result.message, result.status === 'success');
            if (result.status === 'success') {
                fetchSubjects(); // Refresh the table
            }
        } catch (error) {
            showToast('Failed to delete subject.', false);
        } finally {
            closeDeleteModal(); // Close the modal regardless of outcome
        }
    };
    
    // --- Table Rendering ---
    const renderTable = (subjects) => {
        subjectsTableBody.innerHTML = '';
        if (subjects.length === 0) {
            subjectsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No subjects found.</td></tr>';
            return;
        }
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject.subject_name}</td>
                <td>${subject.book_name}</td>
                <td>${subject.total_pages}</td>
                <td>${subject.category}</td>
                <td>
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn delete-btn">Delete</button>
                </td>
            `;
            // The delete button now calls promptForDelete instead of deleting directly
            row.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(subject));
            row.querySelector('.delete-btn').addEventListener('click', () => promptForDelete(subject.id));
            subjectsTableBody.appendChild(row);
        });
    };

    // --- Event Listeners ---
    addSubjectBtn.addEventListener('click', openModalForCreate);
    addEditCloseBtn.addEventListener('click', closeAddEditModal);
    deleteCloseBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', executeDelete); // New listener

    window.addEventListener('click', (event) => {
        if (event.target == addEditModal) closeAddEditModal();
        if (event.target == deleteModal) closeDeleteModal();
    });

    addSubjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            subjectId: subjectIdInput.value, subjectName: document.getElementById('subjectName').value,
            bookName: document.getElementById('bookName').value, totalPages: document.getElementById('totalPages').value,
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