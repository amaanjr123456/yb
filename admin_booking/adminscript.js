const API_URL = "http://localhost:3000";
let bookings = [];
let currentFilter = 'all';
let activeId = null;

/**
 * 1. DATA LOADING
 * Fetches all bookings from your Express/MySQL backend
 */
async function loadBookings() {
  try {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) throw new Error("Failed to fetch");
    
    const data = await response.json();
    
    // Map backend names to frontend names if they differ
    bookings = data.map(b => ({
      id: b.id,
      name: b.fullname || b.name, // Handles 'fullname' from your SQL
      phone: b.phone,
      gender: b.gender,
      place: b.destination || b.place, // Handles 'destination' from your SQL
      travel: b.travel_date || b.travel,
      status: b.status || 'pending',
      notes: b.notes || ''
    }));

    renderList();
    updateStats();
  } catch (err) {
    console.error("Fetch error:", err);
    showToast("Server connection failed");
  }
}

/**
 * 2. LIST RENDERING
 * Updates the UI list based on search and filters
 */
function renderList() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('bookingList');
  
  const filtered = bookings.filter(b => {
    const matchFilter = currentFilter === 'all' || b.status === currentFilter;
    const matchSearch = !q || b.name.toLowerCase().includes(q) || String(b.id).includes(q);
    return matchFilter && matchSearch;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">No bookings found</div>`;
    return;
  }

  // Notice the single quotes '' inside the parentheses ()
container.innerHTML = filtered.map(b => `
    <div class="booking-card" onclick="openDrawer('${b.id}')"> 
      <div class="guest-avatar">${b.name.charAt(0)}</div>
      <div class="card-main">
        <div class="card-name">${b.name}</div>
        <div class="card-meta">
            <span>${b.phone}</span>
            <span class="meta-dot"></span>
            <span class="card-id">${b.id}</span>
        </div>
      </div>
      <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
      <span class="card-arrow">›</span>
    </div>
`).join('');
}

/**
 * 3. STATUS UPDATES
 * Sends a PATCH request to update MySQL status
 */

async function setStatus(newStatus) {
  if (!activeId) return;
  
  try {
    // We are now using PATCH for ALL status changes, including 'declined'
    const response = await fetch(`${API_URL}/bookings/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      // Find the booking in our local array and update its status
      const index = bookings.findIndex(b => b.id === activeId);
      if (index !== -1) {
        bookings[index].status = newStatus;
      }
      
      // Update the UI
      refreshStatusUI(newStatus);
      renderList();
      updateStats();
      showToast(`Booking #${activeId} is now ${newStatus}`);
    } else {
      showToast("Server failed to update status");
    }
  } catch (err) {
    console.error("Error updating status:", err);
    showToast("Action failed. Check server connection.");
  }
}
/*async function setStatus(newStatus) {
  if (!activeId) return;
  
  try {
    // Check if we should delete or just update
    if (newStatus === 'declined') {
      const response = await fetch(`${API_URL}/bookings/${activeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local array
        bookings = bookings.filter(b => b.id !== activeId);
        
        closeDrawer(); // Close the side panel since the data is gone
        renderList();
        updateStats();
        showToast(`Booking #${activeId} has been removed from database`);
      }
    } else {
      // Normal PATCH logic for 'accepted' or 'pending'
      const response = await fetch(`${API_URL}/bookings/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const index = bookings.findIndex(b => b.id === activeId);
        if (index !== -1) bookings[index].status = newStatus;
        
        refreshStatusUI(newStatus);
        renderList();
        updateStats();
        showToast(`Booking #${activeId} marked as ${newStatus}`);
      }
    }
  } catch (err) {
    showToast("Action failed. Check server connection.");
  }
}
*/


/**
 * 4. DRAWER LOGIC
 * Opens the side panel with details
 */
window.openDrawer = function(id) {
  const b = bookings.find(b => b.id === id);
  if (!b) return;
  activeId = id;

  document.getElementById('dName').textContent = b.name;
  document.getElementById('dId').textContent = `Booking ID: #${b.id}`;
  
  // Format the date for the UI
  const travelDate = new Date(b.travel).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  document.getElementById('dGrid').innerHTML = `
    <div class="detail-field full">
        <div class="detail-field-label">Destination</div>
        <div class="detail-field-value">${b.place}</div>
    </div>
    <div class="detail-field">
        <div class="detail-field-label">Travel Date</div>
        <div class="detail-field-value">${travelDate}</div>
    </div>
    <div class="detail-field">
        <div class="detail-field-label">Gender</div>
        <div class="detail-field-value">${b.gender}</div>
    </div>
    <div class="detail-field full">
        <div class="detail-field-label">Phone Number</div>
        <div class="detail-field-value">${b.phone}</div>
    </div>
  `;
  
  const notesWrap = document.getElementById('dNotesWrap');
  if (b.notes) {
      notesWrap.style.display = 'block';
      document.getElementById('dNotes').textContent = b.notes;
  } else {
      notesWrap.style.display = 'none';
  }

  refreshStatusUI(b.status);
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
};

window.closeDrawer = () => {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  activeId = null;
};

function refreshStatusUI(status) {
  document.getElementById('dBadge').innerHTML = `<span class="badge badge-${status}">${status.toUpperCase()}</span>`;
  
  // Highlighting active button in drawer
  document.getElementById('btnAccept').classList.toggle('active', status === 'accepted');
  document.getElementById('btnPending').classList.toggle('active', status === 'pending');
  document.getElementById('btnDecline').classList.toggle('active', status === 'declined');
}

/**
 * 5. UTILITIES
 */
function updateStats() {
  document.getElementById('countAll').textContent = bookings.length;
  document.getElementById('countAccepted').textContent = bookings.filter(b=>b.status==='accepted').length;
  document.getElementById('countPending').textContent  = bookings.filter(b=>b.status==='pending').length;
  document.getElementById('countDeclined').textContent = bookings.filter(b=>b.status==='declined').length;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Global filter function for HTML buttons
window.setFilter = (f, btn) => {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderList();
};

/**
 * 6. INITIALIZATION & EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
    loadBookings();

    // Search input listener
    document.getElementById('searchInput').addEventListener('input', renderList);

    // Status button listeners in the drawer
    document.getElementById('btnAccept').addEventListener('click', () => setStatus('accepted'));
    document.getElementById('btnPending').addEventListener('click', () => setStatus('pending'));
    document.getElementById('btnDecline').addEventListener('click', () => setStatus('declined'));
    
    // Close button and overlay
    document.querySelector('.drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
});
async function deleteBooking() {
    if (!activeId) return;

    // Safety First: Always confirm before deleting
    if (!confirm(`Are you sure you want to delete Booking #${activeId}? This cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/${activeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // 1. Remove from local array so the UI updates immediately
            bookings = bookings.filter(b => String(b.id) !== String(activeId));
            
            // 2. Close the drawer and refresh the screen
            closeDrawer();
            renderList();
            updateStats();
            showToast(`Booking #${activeId} deleted.`);
        } else {
            showToast("Error: Could not delete from database.");
        }
    } catch (err) {
        console.error(err);
        showToast("Server error during deletion.");
    }
}

// Add this to your DOMContentLoaded or at the bottom of script.js
document.getElementById('btnDelete').addEventListener('click', deleteBooking);