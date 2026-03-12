const API_BASE = "http://localhost:3000/api";

// ── Org helpers ───────────────────────────────────────────────────────────────

const getDepartments = async () => {
  const res = await fetch(`${API_BASE}/org/departments`);
  if (!res.ok) throw new Error('Failed to load departments');
  return res.json();
};

const getDesignations = async () => {
  const res = await fetch(`${API_BASE}/org/designations`);
  if (!res.ok) throw new Error('Failed to load designations');
  return res.json();
};

async function populateOrgSelects() {
  const deptSelect  = document.getElementById('emp-dept');
  const desigSelect = document.getElementById('emp-desig');
  if (!deptSelect || !desigSelect) return;

  try {
    const [depts, desigs] = await Promise.all([getDepartments(), getDesignations()]);

    deptSelect.innerHTML  = '<option value="">Select department</option>';
    desigSelect.innerHTML = '<option value="">Select designation</option>';

    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value       = d.DeptID ?? d.deptID ?? d.id;
      opt.textContent = d.DeptName ?? d.deptName ?? d.name;
      deptSelect.appendChild(opt);
    });

    desigs.forEach(s => {
      const opt = document.createElement('option');
      opt.value       = s.DesigID ?? s.desigID ?? s.id;
      opt.textContent = s.DesigName ?? s.desigName ?? s.name;
      desigSelect.appendChild(opt);
    });

  } catch (err) {
    console.error('Error loading org selects:', err);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

async function showSection(sectionId, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  if (el) el.classList.add('active');

  if (sectionId === 'employees') await loadEmployees();
  if (sectionId === 'org')       await loadOrgData();
}

// ── Employee list ─────────────────────────────────────────────────────────────

function initials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const deptBadge = {
  Engineering: 'badge-eng',
  Marketing:   'badge-mkt',
  HR:          'badge-hr',
  Finance:     'badge-fin',
};

async function loadEmployees() {
  try {
    const res  = await fetch(`${API_BASE}/employees`);
    const data = await res.json();
    renderEmployees(data);
  } catch (e) {
    console.warn('Backend offline — using dummy data');
    renderEmployees([
      { EmpID: 1001, Name: 'Anjali Mehta', DeptName: 'Engineering', DesigName: 'Senior Engineer' },
      { EmpID: 1002, Name: 'Rohan Iyer',   DeptName: 'Marketing',   DesigName: 'Coordinator'    },
      { EmpID: 1003, Name: 'Priya Nair',   DeptName: 'HR',          DesigName: 'Manager'        },
    ]);
  }
}

function renderEmployees(data) {
  const tbody = document.getElementById('emp-table-body');
  tbody.innerHTML = data.map(emp => `
    <tr>
      <td style="color:#aaa;font-size:12px;">#${emp.EmpID}</td>
      <td><span class="avatar">${initials(emp.Name)}</span>${emp.Name}</td>
      <td><span class="badge ${deptBadge[emp.DeptName] || 'badge-eng'}">${emp.DeptName}</span></td>
      <td style="color:#666;">${emp.DesigName}</td>
      <td>
        <button class="action-btn del" onclick="deleteEmp(${emp.EmpID})">Remove</button>
      </td>
    </tr>
  `).join('');
}

// ── Add employee ──────────────────────────────────────────────────────────────

document.getElementById('emp-form').onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    EmpID:   document.getElementById('emp-id').value,
    Name:    document.getElementById('emp-name').value,
    DeptID:  document.getElementById('emp-dept').value,
    DesigID: document.getElementById('emp-desig').value,
  };

  try {
    await fetch(`${API_BASE}/employees`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('POST failed — backend offline');
  }

  closeModal();
  await loadEmployees();
};

// ── Delete employee ───────────────────────────────────────────────────────────

async function deleteEmp(id) {
  if (!confirm('Remove this employee?')) return;
  try {
    await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('DELETE failed — backend offline');
  }
  await loadEmployees();
}

// ── Modal ─────────────────────────────────────────────────────────────────────

async function openModal() {
  await populateOrgSelects();
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('emp-form').reset();
}

// ── Organisation tab ──────────────────────────────────────────────────────────

async function loadOrgData() {
  try {
    const [depts, desigs] = await Promise.all([getDepartments(), getDesignations()]);

    const deptList  = document.getElementById('dept-list');
    const desigList = document.getElementById('desig-list');

    deptList.innerHTML = depts.map(d => {
      const name = d.DeptName ?? d.deptName ?? d.name ?? 'Unnamed';
      const mgr  = d.ManagerName ? ` — ${d.ManagerName}` : '';
      return `<li>${name}${mgr}</li>`;
    }).join('');

    desigList.innerHTML = desigs.map(s => {
      const name = s.DesigName ?? s.desigName ?? s.name ?? 'Unnamed';
      return `<li>${name}</li>`;
    }).join('');

  } catch (err) {
    console.error('Failed to load org data:', err);
  }
}

// ── Payroll ───────────────────────────────────────────────────────────────────

async function fetchPayrollData() {
  const empId = document.getElementById('search-id').value.trim();
  const el    = document.getElementById('payroll-results');
  if (!empId) { alert('Please enter an employee ID'); return; }

  try {
    const [salaryRes, attendRes] = await Promise.all([
      fetch(`${API_BASE}/payroll/salary/${empId}`),
      fetch(`${API_BASE}/payroll/attendance/${empId}`),
    ]);

    const salaryData = await salaryRes.json();
    const attendData = await attendRes.json();

    const salaryRows = salaryData.length
      ? salaryData.map(s => `
          <div class="pay-row">
            <span class="pay-label">${s.PayDate}</span>
            <span>Rs: ${Number(s.Amount).toLocaleString()}</span>
          </div>`).join('')
      : '<p class="pay-empty">No salary records found.</p>';

    const attendRows = attendData.length
      ? attendData.map(a => `
          <div class="pay-row">
            <span class="pay-label">${a.Date}</span>
            <span class="attend-status ${a.Status === 'Present' ? 'present' : 'absent'}">${a.Status}</span>
          </div>`).join('')
      : '<p class="pay-empty">No attendance records found.</p>';

    el.innerHTML = `
      <div class="card" style="margin-top:14px;">
        <h4>Salary history — ID #${empId}</h4>
        <div style="margin-top:10px;">#${salaryRows}</div>
      </div>
      <div class="card" style="margin-top:14px;">
        <h4>Attendance log — ID #${empId}</h4>
        <div style="margin-top:10px;">${attendRows}</div>
      </div>`;

  } catch (e) {
    el.innerHTML = '<p class="pay-empty">No records found or backend offline.</p>';
  }
}

// ── Payroll actions: mark attendance and post salary ─────────────────────────

async function markAttendance() {
  const empId = document.getElementById('search-id').value.trim();
  const el = document.getElementById('payroll-results');
  if (!empId) { alert('Please enter an employee ID'); return; }

  try {
    const res = await fetch(`${API_BASE}/payroll/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ EmpID: empId })
    });

    const data = await res.json();
    if (res.ok) {
      const note = `<div class="card" style="margin-top:12px;"><p class="pay-empty">${data.message} — ID #${data.EmpID} on ${data.Date}</p></div>`;
      el.insertAdjacentHTML('afterbegin', note);
      await fetchPayrollData();
    } else {
      alert(data.message || 'Failed to mark attendance');
    }
  } catch (err) {
    console.error('Attendance error', err);
    alert('Error marking attendance');
  }
}

async function postSalary() {
  const empId = document.getElementById('search-id').value.trim();
  const amount = document.getElementById('salary-amount').value.trim();
  const el = document.getElementById('payroll-results');
  if (!empId) { alert('Please enter an employee ID'); return; }
  if (!amount || isNaN(Number(amount))) { alert('Please enter a valid salary amount'); return; }

  try {
    const res = await fetch(`${API_BASE}/payroll/salary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ EmpID: empId, Amount: Number(amount) })
    });

    const data = await res.json();
    if (res.ok) {
      const details = data.details || {};
      const note = `<div class="card" style="margin-top:12px;"><p class="pay-empty">${data.message} — Amount: $${details.Amount} on ${details.Date}</p></div>`;
      el.insertAdjacentHTML('afterbegin', note);
      document.getElementById('salary-amount').value = '';
      await fetchPayrollData();
    } else {
      alert(data.message || 'Failed to post salary');
    }
  } catch (err) {
    console.error('Salary post error', err);
    alert('Error posting salary');
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // fetch(`${API_BASE}/auth/logout`, { method: 'DELETE' });
    window.location.href = 'login.html';
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.onload = () => loadEmployees();