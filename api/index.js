const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Serve the static HTML/CSS/JS files from a folder (e.g., "public")
// OR just add a simple message:
app.get("/", (req, res) => {
  res.send("Server is running! Use /bookings to see data.");
});

// MySQL Connection
// Replace your current connection logic with this:
const db = mysql.createPool(process.env.DATABASE_URL);

// With a pool, you don't need db.connect(). 
// It will connect automatically when a query is run.
console.log("MySQL Pool Created");
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL Database");
  }
});

// 1. Function to create the random ID (TBK-12345)
function generateBookingId() {
  const digits = Math.floor(10000 + Math.random() * 90000); 
  return `TBK-${digits}`;
}

app.post("/book", (req, res) => {
  const { fullname, email, phone, gender, date, destination, notes } = req.body;
  
  // 2. CREATE THE ID STRING
  const customId = generateBookingId(); 

  // 3. UPDATE SQL: You MUST include 'id' in the columns list
  const sql = `
    INSERT INTO bookings 
    (id, fullname, email, phone, gender, travel_date, destination, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  // 4. ADD 'customId' as the first parameter in the array
  db.query(
    sql,
    [customId, fullname, email, phone, gender, date, destination, notes],
    (err, result) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      
      // Success! Send the new ID back to the user
      res.json({ 
        message: "Booking stored successfully", 
        bookingId: customId 
      });
    }
  );
});
// 1. GET all bookings for the Admin Panel
app.get("/bookings", (req, res) => {
  // We select 'id' as 'id', 'fullname' as 'name', etc., to match the frontend JS keys
  const sql = `SELECT id, fullname AS name, phone, gender, destination AS place, 
               travel_date AS travel, status, notes FROM bookings ORDER BY id DESC`;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// 2. PATCH status of a booking
app.patch("/bookings/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., 'accepted', 'declined'

  const sql = "UPDATE bookings SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Update failed" });
    }
    res.json({ message: "Status updated successfully" });
  });
});

//status checker

app.get("/check-status/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT fullname, destination, status FROM bookings WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: "Booking ID not found" });
    }
  });
});
// DELETE a booking by ID
app.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM bookings WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ message: "Booking deleted successfully" });
  });
});
//decline to remove from db
/*app.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM bookings WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ message: "Booking deleted successfully" });
  });
});*/
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
module.exports = app