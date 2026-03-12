const API_BASE = "http://localhost:3000/api"; // Adjust this to your friend's URL

// 1. Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    if(sectionId === 'employees') loadEmployees();
    if(sectionId === 'org') loadOrgData();
}

// 2. Fetch Employees (GET /api/employees)
async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/employees`);
        const data = await res.json();
        let rows = "";
        data.forEach(emp => {
            rows += `<tr><td>${emp.EmpID}</td><td>${emp.Name}</td><td>${emp.DeptName}</td><td>${emp.DesigName}</td>
            <td><button onclick="deleteEmp(${emp.EmpID})" style="color:red">Delete</button></td></tr>`;
        });
        document.getElementById('emp-table-body').innerHTML = rows;
    } catch (e) { console.log("Backend offline - using dummy data"); }
}

// 3. Add Employee (POST /api/employees)
document.getElementById('emp-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = {
        EmpID: document.getElementById('emp-id').value,
        Name: document.getElementById('emp-name').value,
        DeptID: document.getElementById('emp-dept').value,
        DesigID: document.getElementById('emp-desig').value
    };
    await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
    });
    closeModal();
    loadEmployees();
};

// 4. Modal Controls
function openModal() { document.getElementById('modal-overlay').style.display = 'block'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

// 5. Delete Employee (DELETE /api/employees/:id)
async function deleteEmp(id) {
    if(confirm("Are you sure?")) {
        await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
        loadEmployees();
    }
}
async function fetchPayrollData() {
    const empId = document.getElementById('search-id').value;
    if (!empId) return alert("Please enter an ID");

    try {
        // Fetch Salary records
        const salaryRes = await fetch(`${API_BASE}/salary/${empId}`);
        const salaryData = await salaryRes.json();

        // Fetch Attendance records
        const attendRes = await fetch(`${API_BASE}/attendance/${empId}`);
        const attendData = await attendRes.json();

        let html = `<h4>Results for ID: ${empId}</h4>`;
        
        // Displaying Salary Info
        html += "<h5>Salary History</h5><ul>";
        salaryData.forEach(s => {
            html += `<li>Amount: $${s.Amount} - Date: ${s.PayDate}</li>`;
        });
        html += "</ul>";

        // Displaying Attendance Info
        html += "<h5>Attendance Log</h5><ul>";
        attendData.forEach(a => {
            html += `<li>Date: ${a.Date} - Status: <strong>${a.Status}</strong></li>`;
        });
        html += "</ul>";

        document.getElementById('payroll-results').innerHTML = html;
    } catch (e) {
        document.getElementById('payroll-results').innerHTML = "<p>No records found or backend offline.</p>";
    }
}
// Add this to your script.js
function logout() {
    if(confirm("Are you sure you want to logout?")) {
        // Later, we will call DELETE /api/auth/logout here
        window.location.href = "login.html";
    }
}

// Initial Load
window.onload = () => loadEmployees();