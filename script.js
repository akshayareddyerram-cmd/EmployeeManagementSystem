const API_URL = "https://dummyjson.com/users";

let employees = [];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();
    
    $("searchInput").addEventListener("input", renderTable);
    $("departmentFilter").addEventListener("change", renderTable);
    $("employeeForm").addEventListener("submit", handleSave);
    $("addEmployeeBtn").addEventListener("click", () => showModal());
    $("closeModalBtn").addEventListener("click", hideModal);
});

async function loadEmployees() {
    const localData = localStorage.getItem("employees");
    
    if (localData) {
        employees = JSON.parse(localData);
    } else {
        const res = await fetch(API_URL);
        const data = await res.json();
        employees = data.users;
        saveData();
    }
    
    renderTable();
}

function saveData() {
    localStorage.setItem("employees", JSON.stringify(employees));
    $("totalEmployees").textContent = employees.length;
}

function renderTable() {
    const search = $("searchInput").value.toLowerCase();
    const dept = $("departmentFilter").value;
    const tbody = $("employeeTableBody");

    tbody.innerHTML = "";

    const filtered = employees.filter(emp => {
        const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const empDept = emp.company?.department || "";
        
        return name.includes(search) && (dept === "all" || empDept === dept);
    });

    filtered.forEach(emp => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.firstName} ${emp.lastName}</td>
            <td>${emp.email}</td>
            <td>${emp.phone}</td>
            <td>${emp.company?.department || "N/A"}</td>
            <td>
                <button onclick="editEmployee(${emp.id})">Edit</button>
                <button onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showModal(emp = null) {
    $("employeeModal").style.display = "flex";
    
    if (emp) {
        $("modalTitle").textContent = "Edit Employee";
        $("employeeId").value = emp.id;
        $("firstName").value = emp.firstName;
        $("lastName").value = emp.lastName;
        $("email").value = emp.email;
        $("phone").value = emp.phone;
        $("department").value = emp.company?.department || "";
    } else {
        $("modalTitle").textContent = "Add Employee";
        $("employeeForm").reset();
        $("employeeId").value = "";
    }
}

function hideModal() {
    $("employeeModal").style.display = "none";
}

function handleSave(e) {
    e.preventDefault();
    
    const id = $("employeeId").value;
    const empData = {
        firstName: $("firstName").value.trim(),
        lastName: $("lastName").value.trim(),
        email: $("email").value.trim(),
        phone: $("phone").value.trim(),
        company: { department: $("department").value }
    };

    if (id) {
        const index = employees.findIndex(e => e.id == id);
        employees[index] = { ...employees[index], ...empData };
    } else {
        empData.id = Date.now();
        employees.push(empData);
    }

    saveData();
    renderTable();
    hideModal();
}

function editEmployee(id) {
    const emp = employees.find(e => e.id == id);
    if (emp) showModal(emp);
}

function deleteEmployee(id) {
    if (confirm("Delete this employee?")) {
        employees = employees.filter(e => e.id != id);
        saveData();
        renderTable();
    }
}
