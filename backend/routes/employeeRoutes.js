import express from 'express';
import pool from '../db.js';   

const employeeRoutes = express.Router();

// ── GET /employees ──
employeeRoutes.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        e.EmpID,
        e.Name,
        e.Age,
        e.Phone,
        d.DeptName,
        dg.DesigName
      FROM Employee e
      JOIN Department  d  ON e.DeptID  = d.DeptID
      JOIN Designation dg ON e.DesigID = dg.DesigID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /employees/:id ──
employeeRoutes.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        e.EmpID,
        e.Name,
        e.Age,
        e.Phone,
        d.DeptName,
        dg.DesigName,
        s.Amount    AS Salary,
        s.PayDate,
        a.Date      AS AttendDate,
        a.Status    AS AttendStatus
      FROM Employee e
      JOIN  Department  d  ON e.DeptID  = d.DeptID
      JOIN  Designation dg ON e.DesigID = dg.DesigID
      LEFT JOIN Salary     s ON e.EmpID = s.EmpID
      LEFT JOIN Attendance a ON e.EmpID = a.EmpID
      WHERE e.EmpID = ?
    `, [req.params.id]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /employees ──
employeeRoutes.post("/", async (req, res) => {
  const { EmpID, Name, Age, Phone, DeptID, DesigID } = req.body;

  if (!EmpID || !Name || !DeptID || !DesigID)
    return res.status(400).json({ error: "EmpID, Name, DeptID, DesigID are required" });

  try {
    await pool.execute(
      'INSERT INTO Employee (EmpID, Name, Age, Phone, DeptID, DesigID) VALUES (?, ?, ?, ?, ?, ?)',
      [EmpID, Name, Age || null, Phone || null, DeptID, DesigID]
    );
    res.status(201).json({ message: `Employee ${Name} added successfully`, EmpID });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: "EmpID or Phone already exists" });
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /employees/:id ──
employeeRoutes.put("/:id", async (req, res) => {
  const { Name, Age, Phone, DeptID, DesigID } = req.body;

  const fields = [];
  const values = [];

  if (Name)    { fields.push('Name = ?');    values.push(Name);    }
  if (Age)     { fields.push('Age = ?');     values.push(Age);     }
  if (Phone)   { fields.push('Phone = ?');   values.push(Phone);   }
  if (DeptID)  { fields.push('DeptID = ?');  values.push(DeptID);  }
  if (DesigID) { fields.push('DesigID = ?'); values.push(DesigID); }

  if (fields.length === 0)
    return res.status(400).json({ error: "No fields provided to update" });

  values.push(req.params.id);

  try {
    const [result] = await pool.execute(
      `UPDATE Employee SET ${fields.join(', ')} WHERE EmpID = ?`,
      values
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json({ message: `Employee ${req.params.id} updated successfully` });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: "Phone number already in use" });
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /employees/:id ──
employeeRoutes.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute('DELETE FROM Attendance WHERE EmpID = ?', [id]);
    await pool.execute('DELETE FROM Salary     WHERE EmpID = ?', [id]);

    const [result] = await pool.execute(
      'DELETE FROM Employee WHERE EmpID = ?', [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json({ message: `Employee ${id} and related records deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default employeeRoutes;