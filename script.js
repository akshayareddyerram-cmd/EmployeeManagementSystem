const API_URL = "https://dummyjson.com/users";

const STORAGE_KEY = "employeeManagementData";
const THEME_KEY = "employeeManagementTheme";

let allEmployees = [];
let filteredEmployees = [];
let currentPage = 1;
let employeesPerPage = 5;
let editingEmployeeId = null;

const departments = [
    "Engineering",
    "Human Resources",
    "Marketing",
    "Finance",
    "Support",
    "Product Management",
    "Services",
    "Legal",
    "Sales",
    "Accounting",
    "Training"
];

let employeeTableBody;
let totalEmployees;
let searchInput;
let departmentFilter;
let sortSelect;
let itemsPerPageSelect;
let loadingMessage;
let errorMessage;
let addEmployeeBtn;
let refreshBtn;
let exportBtn;
let themeBtn;
let employeeModal;
let closeModalBtn;
let cancelBtn;
let employeeForm;
let modalTitle;
let prevBtn;
let nextBtn;
let pageInfo;
let profileModal;
let closeProfileBtn;
let profileContent;
let toastContainer;

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    loadTheme();
    initializeEvents();
    getEmployees();
});

function initializeElements() {
    employeeTableBody = document.getElementById("employeeTableBody");
    totalEmployees = document.getElementById("totalEmployees");
    searchInput = document.getElementById("searchInput");
    departmentFilter = document.getElementById("departmentFilter");
    sortSelect = document.getElementById("sortSelect");
    itemsPerPageSelect = document.getElementById("itemsPerPage");
    loadingMessage = document.getElementById("loadingMessage");
    errorMessage = document.getElementById("errorMessage");
    addEmployeeBtn = document.getElementById("addEmployeeBtn");
    refreshBtn = document.getElementById("refreshBtn");
    exportBtn = document.getElementById("exportBtn");
    themeBtn = document.getElementById("themeBtn");
    employeeModal = document.getElementById("employeeModal");
    closeModalBtn = document.getElementById("closeModalBtn");
    cancelBtn = document.getElementById("cancelBtn");
    employeeForm = document.getElementById("employeeForm");
    modalTitle = document.getElementById("modalTitle");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    pageInfo = document.getElementById("pageInfo");
    profileModal = document.getElementById("profileModal");
    closeProfileBtn = document.getElementById("closeProfileBtn");
    profileContent = document.getElementById("profileContent");
    toastContainer = document.getElementById("toastContainer");
}

function initializeEvents() {
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (departmentFilter) {
        departmentFilter.addEventListener("change", applyFilters);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", applyFilters);
    }

    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener("change", function () {
            employeesPerPage = Number(itemsPerPageSelect.value);
            currentPage = 1;
            displayEmployees();

            showToast(
                `${employeesPerPage} employees per page`,
                "info"
            );
        });
    }

    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener("click", openAddModal);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", refreshFromAPI);
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", exportCSV);
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", previousPage);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", nextPage);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }

    if (employeeForm) {
        employeeForm.addEventListener("submit", handleFormSubmit);
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener("click", closeProfileModal);
    }

    window.addEventListener("click", function (event) {
        if (event.target === employeeModal) {
            closeModal();
        }

        if (event.target === profileModal) {
            closeProfileModal();
        }
    });

    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModal();
            closeProfileModal();
        }
    });
}

async function getEmployees() {
    try {
        showLoading(true);
        hideError();

        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            allEmployees = JSON.parse(savedData);

            updateDashboard();
            applyFilters();

            showLoading(false);
            return;
        }

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch employees");
        }

        const data = await response.json();

        allEmployees = data.users;

        saveToLocalStorage();
        updateDashboard();
        applyFilters();

    } catch (error) {
        console.error(error);

        showError(
            "Unable to load employees. Please try again."
        );
    } finally {
        showLoading(false);
    }
}

function saveToLocalStorage() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(allEmployees)
    );
}

function updateDashboard() {
    totalEmployees.textContent = allEmployees.length;
}

function displayEmployees() {
    employeeTableBody.innerHTML = "";

    const totalPages = Math.ceil(
        filteredEmployees.length / employeesPerPage
    );

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const startIndex =
        (currentPage - 1) * employeesPerPage;

    const endIndex =
        startIndex + employeesPerPage;

    const employeesToDisplay =
        filteredEmployees.slice(
            startIndex,
            endIndex
        );

    if (employeesToDisplay.length === 0) {
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No employees found
                </td>
            </tr>
        `;

        updatePagination();
        return;
    }

    employeesToDisplay.forEach(employee => {
        const row = document.createElement("tr");

        const department =
            employee.company?.department || "N/A";

        row.innerHTML = `
            <td>
                ${employee.id}
            </td>

            <td>
                <span
                    class="employee-name"
                    onclick="openProfile(${employee.id})"
                >
                    ${employee.firstName}
                    ${employee.lastName}
                </span>
            </td>

            <td>
                ${employee.email}
            </td>

            <td>
                ${employee.phone}
            </td>

            <td>
                ${department}
            </td>

            <td class="actions">
                <button
                    class="edit-btn"
                    onclick="openEditModal(${employee.id})"
                >
                    ✏️ Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteEmployee(${employee.id})"
                >
                    🗑️ Delete
                </button>
            </td>
        `;

        employeeTableBody.appendChild(row);
    });

    updatePagination();
}

function applyFilters() {
    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedDepartment =
        departmentFilter.value;

    filteredEmployees = allEmployees.filter(employee => {
        const name =
            `${employee.firstName} ${employee.lastName}`
                .toLowerCase();

        const email =
            employee.email.toLowerCase();

        const department =
            employee.company?.department
                ?.toLowerCase() || "";

        const searchMatch =
            name.includes(searchText) ||
            email.includes(searchText) ||
            department.includes(searchText);

        const departmentMatch =
            selectedDepartment === "all" ||
            employee.company?.department ===
                selectedDepartment;

        return searchMatch && departmentMatch;
    });

    applySorting();

    currentPage = 1;

    displayEmployees();
}

function applySorting() {
    const value = sortSelect.value;

    if (value === "nameAsc") {
        filteredEmployees.sort((a, b) => {
            const nameA =
                `${a.firstName} ${a.lastName}`;

            const nameB =
                `${b.firstName} ${b.lastName}`;

            return nameA.localeCompare(nameB);
        });
    }

    else if (value === "nameDesc") {
        filteredEmployees.sort((a, b) => {
            const nameA =
                `${a.firstName} ${a.lastName}`;

            const nameB =
                `${b.firstName} ${b.lastName}`;

            return nameB.localeCompare(nameA);
        });
    }

    else if (value === "idAsc") {
        filteredEmployees.sort(
            (a, b) => a.id - b.id
        );
    }

    else if (value === "idDesc") {
        filteredEmployees.sort(
            (a, b) => b.id - a.id
        );
    }
}

function updatePagination() {
    const totalPages = Math.ceil(
        filteredEmployees.length /
        employeesPerPage
    );

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages || 1}`;

    prevBtn.disabled =
        currentPage <= 1;

    nextBtn.disabled =
        currentPage >= totalPages;

    prevBtn.style.opacity =
        currentPage <= 1 ? "0.5" : "1";

    nextBtn.style.opacity =
        currentPage >= totalPages ||
        totalPages === 0
            ? "0.5"
            : "1";
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayEmployees();
    }
}

function nextPage() {
    const totalPages = Math.ceil(
        filteredEmployees.length /
        employeesPerPage
    );

    if (currentPage < totalPages) {
        currentPage++;
        displayEmployees();
    }
}

function openAddModal() {
    editingEmployeeId = null;

    modalTitle.textContent =
        "Add Employee";

    employeeForm.reset();

    clearValidation();

    employeeModal.style.display =
        "flex";
}

function closeModal() {
    employeeModal.style.display =
        "none";

    employeeForm.reset();

    clearValidation();

    editingEmployeeId = null;
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        showToast(
            "Please correct the form errors.",
            "error"
        );

        return;
    }

    const employeeData = {
        firstName:
            document
                .getElementById("firstName")
                .value
                .trim(),

        lastName:
            document
                .getElementById("lastName")
                .value
                .trim(),

        email:
            document
                .getElementById("email")
                .value
                .trim(),

        phone:
            document
                .getElementById("phone")
                .value
                .trim(),

        company: {
            department:
                document
                    .getElementById("department")
                    .value
        }
    };

    if (editingEmployeeId !== null) {
        await updateEmployee(
            editingEmployeeId,
            employeeData
        );
    } else {
        await addEmployee(employeeData);
    }
}

function validateForm() {
    let valid = true;

    clearValidation();

    const firstName =
        document
            .getElementById("firstName")
            .value
            .trim();

    const lastName =
        document
            .getElementById("lastName")
            .value
            .trim();

    const email =
        document
            .getElementById("email")
            .value
            .trim();

    const phone =
        document
            .getElementById("phone")
            .value
            .trim();

    const department =
        document
            .getElementById("department")
            .value;

    if (firstName.length < 2) {
        showFieldError(
            "firstName",
            "Enter a valid first name."
        );

        valid = false;
    }

    if (lastName.length < 2) {
        showFieldError(
            "lastName",
            "Enter a valid last name."
        );

        valid = false;
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showFieldError(
            "email",
            "Enter a valid email."
        );

        valid = false;
    }

    const digits =
        phone.replace(/\D/g, "");

    if (digits.length < 7) {
        showFieldError(
            "phone",
            "Enter a valid phone number."
        );

        valid = false;
    }

    if (!departments.includes(department)) {
        showFieldError(
            "department",
            "Select a department."
        );

        valid = false;
    }

    return valid;
}

function showFieldError(
    field,
    message
) {
    const error =
        document.getElementById(
            `${field}Error`
        );

    const input =
        document.getElementById(field);

    if (error) {
        error.textContent = message;
    }

    if (input) {
        input.style.borderColor =
            "#dc2626";
    }
}

function clearValidation() {
    const fields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "department"
    ];

    fields.forEach(field => {
        const error =
            document.getElementById(
                `${field}Error`
            );

        const input =
            document.getElementById(field);

        if (error) {
            error.textContent = "";
        }

        if (input) {
            input.style.borderColor = "";
        }
    });
}

async function addEmployee(
    employeeData
) {
    try {
        const response =
            await fetch(
                `${API_URL}/add`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            employeeData
                        )
                }
            );

        if (!response.ok) {
            throw new Error("Add failed");
        }

        const newEmployee =
            await response.json();

        newEmployee.id =
            Math.max(
                0,
                ...allEmployees.map(
                    employee =>
                        Number(employee.id)
                )
            ) + 1;

        allEmployees.push(
            newEmployee
        );

        saveToLocalStorage();

        updateDashboard();

        applyFilters();

        closeModal();

        showToast(
            "Employee added successfully!",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to add employee.",
            "error"
        );
    }
}

function openEditModal(id) {
    const employee =
        allEmployees.find(
            employee =>
                employee.id === id
        );

    if (!employee) {
        showToast(
            "Employee not found.",
            "error"
        );

        return;
    }

    editingEmployeeId = id;

    modalTitle.textContent =
        "Edit Employee";

    document.getElementById(
        "firstName"
    ).value =
        employee.firstName;

    document.getElementById(
        "lastName"
    ).value =
        employee.lastName;

    document.getElementById(
        "email"
    ).value =
        employee.email;

    document.getElementById(
        "phone"
    ).value =
        employee.phone;

    document.getElementById(
        "department"
    ).value =
        employee.company
            ?.department || "";

    clearValidation();

    employeeModal.style.display =
        "flex";
}

async function updateEmployee(
    id,
    employeeData
) {
    try {
        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            employeeData
                        )
                }
            );

        if (!response.ok) {
            throw new Error(
                "Update failed"
            );
        }

        await response.json();

        const index =
            allEmployees.findIndex(
                employee =>
                    employee.id === id
            );

        if (index !== -1) {
            allEmployees[index] = {
                ...allEmployees[index],

                firstName:
                    employeeData.firstName,

                lastName:
                    employeeData.lastName,

                email:
                    employeeData.email,

                phone:
                    employeeData.phone,

                company: {
                    ...allEmployees[index].company,

                    department:
                        employeeData
                            .company
                            .department
                }
            };
        }

        saveToLocalStorage();

        updateDashboard();

        applyFilters();

        closeModal();

        showToast(
            "Employee updated successfully!",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to update employee.",
            "error"
        );
    }
}

async function deleteEmployee(id) {
    const employee =
        allEmployees.find(
            employee =>
                employee.id === id
        );

    if (!employee) {
        return;
    }

    const confirmed =
        confirm(
            `Delete ${employee.firstName} ${employee.lastName}?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Delete failed"
            );
        }

        allEmployees =
            allEmployees.filter(
                employee =>
                    employee.id !== id
            );

        saveToLocalStorage();

        updateDashboard();

        applyFilters();

        showToast(
            "Employee deleted successfully!",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to delete employee.",
            "error"
        );
    }
}

function openProfile(id) {
    const employee =
        allEmployees.find(
            employee =>
                employee.id === id
        );

    if (!employee) {
        return;
    }

    const fullName =
        `${employee.firstName}
        ${employee.lastName}`;

    const initials =
        `${employee.firstName.charAt(0)}
        ${employee.lastName.charAt(0)}`;

    const department =
        employee.company?.department ||
        "N/A";

    const company =
        employee.company?.name ||
        "N/A";

    profileContent.innerHTML = `
        <div class="profile-avatar">
            ${initials}
        </div>

        <h2>
            ${fullName}
        </h2>

        <p class="profile-email">
            ${employee.email}
        </p>

        <div class="profile-details">

            <div class="profile-row">
                <span class="profile-label">
                    Employee ID
                </span>

                <span class="profile-value">
                    ${employee.id}
                </span>
            </div>

            <div class="profile-row">
                <span class="profile-label">
                    Phone
                </span>

                <span class="profile-value">
                    ${employee.phone}
                </span>
            </div>

            <div class="profile-row">
                <span class="profile-label">
                    Department
                </span>

                <span class="profile-value">
                    ${department}
                </span>
            </div>

            <div class="profile-row">
                <span class="profile-label">
                    Company
                </span>

                <span class="profile-value">
                    ${company}
                </span>
            </div>

        </div>
    `;

    profileModal.style.display =
        "flex";
}

function closeProfileModal() {
    profileModal.style.display =
        "none";
}

function toggleTheme() {
    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        THEME_KEY,
        isDark
            ? "dark"
            : "light"
    );

    updateThemeButton();

    showToast(
        isDark
            ? "Dark mode enabled"
            : "Light mode enabled",
        "info"
    );
}

function updateThemeButton() {
    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    themeBtn.textContent =
        isDark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}

function loadTheme() {
    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    if (savedTheme === "dark") {
        document.body.classList.add(
            "dark-mode"
        );
    }

    updateThemeButton();
}

function exportCSV() {
    if (
        filteredEmployees.length === 0
    ) {
        showToast(
            "No employees available to export.",
            "error"
        );

        return;
    }

    const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Department",
        "Company"
    ];

    const rows =
        filteredEmployees.map(
            employee => [
                employee.id,
                employee.firstName,
                employee.lastName,
                employee.email,
                employee.phone,
                employee.company
                    ?.department || "",
                employee.company
                    ?.name || ""
            ]
        );

    const csvRows = [
        headers,
        ...rows
    ].map(
        row =>
            row
                .map(
                    value =>
                        `"${String(value)
                            .replace(
                                /"/g,
                                '""'
                            )}"`
                )
                .join(",")
    );

    const csvContent =
        csvRows.join("\n");

    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "employees.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast(
        "CSV exported successfully!",
        "success"
    );
}

async function refreshFromAPI() {
    const confirmed =
        confirm(
            "Refresh from the API?\n\nYour locally saved changes will be replaced by the API data."
        );

    if (!confirmed) {
        return;
    }

    try {
        showLoading(true);

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Refresh failed"
            );
        }

        const data =
            await response.json();

        allEmployees =
            data.users;

        saveToLocalStorage();

        updateDashboard();

        applyFilters();

        showToast(
            "Employee data refreshed successfully!",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to refresh employee data.",
            "error"
        );

    } finally {
        showLoading(false);
    }
}

function showToast(
    message,
    type = "success"
) {
    if (!toastContainer) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(
        toast
    );

    setTimeout(
        () => {
            toast.remove();
        },
        3000
    );
}

function showLoading(show) {
    if (!loadingMessage) {
        return;
    }

    loadingMessage.style.display =
        show
            ? "block"
            : "none";
}

function showError(message) {
    errorMessage.textContent =
        message;

    errorMessage.style.display =
        "block";
}

function hideError() {
    errorMessage.textContent =
        "";

    errorMessage.style.display =
        "none";
}