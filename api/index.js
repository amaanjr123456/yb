const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Connection Pool Logic
const db = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("MySQL Pool Created for TiDB Cloud");

// 2. ROOT ROUTE (Good for checking if the server is alive)
app.get("/api", (req, res) => {
  res.send("Server is running! API routes are active.");
});

function generateBookingId() {
  const digits = Math.floor(10000 + Math.random() * 90000); 
  return `TBK-${digits}`;
}

// 3. UPDATED ROUTES (Added /api prefix to match Vercel rewrites)

app.post("/api/book", (req, res) => {
  const { fullname, email, phone, gender, date, destination, notes } = req.body;
  const customId = generateBookingId(); 

  const sql = `
    INSERT INTO travel_bookings 
    (id, fullname, email, phone, gender, travel_date, destination, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    sql,
    [customId, fullname, email, phone, gender, date, destination, notes],
    (err, result) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json({ message: "Database error", detail: err.message });
      }
      res.json({ message: "Booking stored successfully", bookingId: customId });
    }
  );
});

app.get("/api/bookings", (req, res) => {
  const sql = `SELECT id, fullname AS name, phone, gender, destination AS place, 
               travel_date AS travel, status, notes FROM travel_bookings ORDER BY id DESC`;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.patch("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = "UPDATE travel_bookings SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Update failed" });
    }
    res.json({ message: "Status updated successfully" });
  });
});

app.get("/api/check-status/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT fullname, destination, status FROM travel_bookings WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: "Booking ID not found" });
    }
  });
});

app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM travel_bookings WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ message: "Booking deleted successfully" });
  });
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Local server on port ${PORT}`));
}

module.exports = app;
