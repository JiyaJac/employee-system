import express from 'express';
import pool from '../db.js';

const orgRouter = express.Router();


// GET: All departments
orgRouter.get("/departments", async (req, res) => {
    try {
        console.log("Loading department list...");

        const [rows] = await pool.query(
           `SELECT 
    D.DeptID, 
    D.DeptName, 
    COALESCE(E.Name, 'No Manager Assigned') AS ManagerName
    FROM Department D
    LEFT JOIN Employee E ON D.DeptID = E.DeptID AND E.DesigID = 1;`
        );

        res.json(rows);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error loading departments" });
    }
});


// POST: Add new department
orgRouter.post("/departments", async (req, res) => {
    try {
        const { DeptID, DeptName } = req.body;

        console.log("Creating new department:", DeptName);

        await pool.query(
            "INSERT INTO Department (DeptID, DeptName) VALUES (?, ?)",
            [DeptID, DeptName]
        );

        res.json({ message: "Department created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating department" });
    }
});


// GET: All designations
orgRouter.get("/designations", async (req, res) => {
    try {
        console.log("Loading designation list...");

        const [rows] = await pool.query(
            "SELECT DesigID, DesigName FROM Designation"
        );

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error loading designations" });
    }
});


// POST: Add new designation
orgRouter.post("/designations", async (req, res) => {
    try {
        const { DesigID, DesigName } = req.body;
        
        console.log("Creating new designation:", DesigName);
        
        await pool.query(
            "INSERT INTO Designation (DesigID, DesigName) VALUES (?, ?)",
            [DesigID, DesigName]
        );
        
        res.json({ message: "Designation created successfully" });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating designation" });
    }
});

orgRouter.get("/designations", async (req,res)=>{
    try {
        console.log("Fetching Designations...")
        const [rows] = await pool.query(
            "SELECT * from Designation "
        )
        res.json(rows);
        
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error Fetching Designations", error:error.message });
    }
})


export default orgRouter;