const API_URL = "/api";
// --- PART 1: SEND BOOKING TO SERVER ---
document.getElementById('bookingform').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  
  // Create the object to send to Node.js
  const data = {
    fullname: formData.get('fullname'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    date: formData.get('date'),
    destination: formData.get('destination'),
    notes: formData.get('additional notes') // Matches your 'name' attribute
  };

  try {
    const response = await fetch(`${API_URL}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      // SUCCESS: The server returns result.bookingId (e.g., TBK-12345)
      alert(`Booking Confirmed!\n\nIMPORTANT: Your Booking ID is ${result.bookingId}.\nUse this to check your status below.`);
      
      // Update the UI to show the ID clearly
      document.getElementById('booking').innerHTML = `
        <div style="text-align:center; padding: 50px 20px; background: #fff; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <h2 style="color: #2d7d52;">Booking Successful!</h2>
          <p>Your unique Booking ID is:</p>
          <h1 style="letter-spacing: 2px; color: #333; margin: 20px 0;">${result.bookingId}</h1>
          <p style="color: #666;">Please save this ID to track your travel status.</p>
          <button onclick="location.reload()" class="btn">Make Another Booking</button>
        </div>
      `;
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Could not connect to the server. Make sure your backend is running on port 3000.");
  }
});

// --- PART 2: THE STATUS CHECKER FUNCTION ---
// This runs when the user clicks the "Check Status" button
window.checkMyStatus = async function() {
  const idInput = document.getElementById('statusIdInput');
  const resultDiv = document.getElementById('statusResult');
  const id = idInput.value.trim();

  if (!id) {
    alert("Please enter your Booking ID (e.g., TBK-XXXXX)");
    return;
  }

  resultDiv.innerHTML = "Searching database...";

  try {
    const response = await fetch(`${API_URL}/check-status/${id}`);
    const data = await response.json();

    if (response.ok) {
      // Logic for status colors
      let statusColor = "#9a6b1a"; // Pending (Gold)
      if (data.status === 'accepted') statusColor = "#2d7d52"; // Accepted (Green)
      if (data.status === 'declined') statusColor = "#b03434"; // Declined (Red)

      resultDiv.innerHTML = `
        <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; border-left: 5px solid ${statusColor}; text-align: left;">
          <p><strong>Passenger:</strong> ${data.fullname}</p>
          <p><strong>Destination:</strong> ${data.destination}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${data.status}</span></p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<p style="color: red;">${data.message || "ID not found."}</p>`;
    }
  } catch (err) {
    resultDiv.innerHTML = "<p style='color: red;'>Error connecting to server.</p>";
  }
};
