import express from 'express';
import pool from '../db.js';
const payRollRouter = express.Router();

// POST: Mark daily attendance
payRollRouter.post("/attendance", async (req, res) => {
    const EmpID = req.body.EmpID
    if (!EmpID){
            return res.status(500).json({message:'Emp id is required'})
    }
    console.log("Logging attendance for EmpID:", req.body.EmpID);
    const today = new Date().toISOString().split('T')[0];
   try {
     const [result] = await pool.execute(
        "INSERT INTO Attendance (EmpID, Date, Status) VALUES (?, ?, ?) ",
        [req.body.EmpID, today, "Present"]
     ) 
     if (result.affectedRows > 0) {
        console.log(`Attendance marked for Employee id: ${req.body.EmpID}`)
        return res.status(201).json({message:`Attendance marked`, EmpID:req.body.EmpID, Date:today})
     }
   } catch   (error) {
        console.log("error: "+ error.message)
        return res.status(500).json({message:'Server Error' , error: error.message})
   }
    // Logic: INSERT INTO Attendance...
});

// GET: Attendance history for an employee
payRollRouter.get("/attendance/:id", async (req, res) => {
    const id = req.params.id 

    console.log("Fetching attendance history for EmpID:", req.params.id);
    try {
        const [rows] = await pool.execute(`
            SELECT 
            E.Name AS Name,
            DATE_FORMAT(A.Date, '%d %b %Y') AS Date,
            A.Status AS Status
            FROM Employee E
            JOIN Attendance A on A.EmpID = E.EmpID where E.EmpID = ${id} order by A.date desc`)
            if (rows){
                console.log(rows)
               return res.status(200).json(rows) 
            }
        }
     catch (error){
        console.log(`error: ${error.message}`)
        return res.status(500).json({message:'Server Error', error:error.message})
        
     }
    // Logic: SELECT * FROM Attendance WHERE EmpID = ?
});

// POST: Generate a salary record
payRollRouter.post("/salary", async (req, res) => {
    const { EmpID, Amount } = req.body;
    
    // Auto-generate today's date for the payment record
    const payDate = new Date().toISOString().split('T')[0];
    
    console.log(` Generating salary slip for EmpID: ${EmpID}`);
    
    
    if (!EmpID || !Amount) {
        return res.status(400).json({ message: "EmpID and Amount are required" });
    }
    

    try {
        const [result] = await pool.execute(
            "INSERT INTO Salary (EmpID, Amount, PayDate) VALUES (?, ?, ?)",
            [EmpID, Amount, payDate]
        );

        if (result.insertId) {
            return res.status(201).json({
                message: "Salary record created successfully",
                salaryId: result.insertId,
                details: {
                    EmpID,
                    Amount,
                    Date: payDate
                }
            });
        }
    } catch (error) {
        console.error("❌ Salary Error:", error.message);
        
        // Check for Foreign Key failure (e.g., EmpID doesn't exist)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ message: "Employee ID not found in database" });
        }

        return res.status(500).json({ message: "Server Error", error: error.message });
    }
});
    // Logic: INSERT INTO Salary...

// GET: Salary history for an employee
payRollRouter.get("/salary/:id", async (req, res) => {
    const { id } = req.params;

    console.log(` Fetching salary history for EmpID: ${id}`);

    try {
        // We join with Employee to confirm the name of the person we're looking at
        const [rows] = await pool.execute(`
            SELECT 
                S.SalaryID,
                E.Name,
                S.Amount,
                DATE_FORMAT(S.PayDate, '%d %b %Y') AS PayDate
            FROM Salary S
            JOIN Employee E ON S.EmpID = E.EmpID
            WHERE S.EmpID = ?
            ORDER BY S.PayDate DESC`, 
            [id]
        );

        // Check if the employee has any records
        if (rows.length === 0) {
            return res.status(404).json({ message: "No salary history found for this employee" });
        }

        return res.status(200).json(rows);

    } catch (error) {
        console.error("❌ Database Error:", error.message);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
});
export default payRollRouter;