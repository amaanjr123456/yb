let allBookings = [];
let filteredBookings = [];
let currentBookingId = null;
let currentFilter = 'all';

// --- INITIAL LOAD ---
async function fetchBookings() {
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error("Failed to fetch");
        allBookings = await response.json();
        updateStats();
        applyFilterAndSearch();
    } catch (err) {
        showToast("Error connecting to database", "error");
    }
}

// --- STATS LOGIC ---
function updateStats() {
    document.getElementById('countAll').innerText = allBookings.length;
    document.getElementById('countAccepted').innerText = allBookings.filter(b => b.status === 'accepted').length;
    document.getElementById('countPending').innerText = allBookings.filter(b => b.status === 'pending').length;
    document.getElementById('countDeclined').innerText = allBookings.filter(b => b.status === 'declined').length;
}

// --- FILTER & SEARCH ---
window.setFilter = function(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filter}`).classList.add('active');
    applyFilterAndSearch();
};

window.handleSearch = function() {
    applyFilterAndSearch();
};

function applyFilterAndSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredBookings = allBookings.filter(book => {
        const matchesFilter = currentFilter === 'all' || book.status === currentFilter;
        const matchesSearch = book.name.toLowerCase().includes(searchTerm) || book.id.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    renderList();
}

// --- RENDER CARDS ---
function renderList() {
    const list = document.getElementById('bookingList');
    if (filteredBookings.length === 0) {
        list.innerHTML = `<div style="padding: 20px; color: #666;">No bookings found.</div>`;
        return;
    }

    list.innerHTML = filteredBookings.map(book => `
        <div class="booking-card" onclick="openDrawer('${book.id}')">
            <div class="card-info">
                <strong>${book.name}</strong>
                <span>${book.id} • ${book.place}</span>
            </div>
            <div class="card-status status-${book.status}">${book.status}</div>
        </div>
    `).join('');
}

// --- DRAWER LOGIC ---
window.openDrawer = function(id) {
    const book = allBookings.find(b => b.id === id);
    if (!book) return;
    currentBookingId = id;

    document.getElementById('dName').innerText = book.name;
    document.getElementById('dId').innerText = book.id;
    document.getElementById('dAvatar').innerText = book.name.charAt(0).toUpperCase();
    
    // Status Badge
    const badge = document.getElementById('dBadge');
    badge.innerText = book.status;
    badge.className = `status-badge status-${book.status}`;

    // Detail Grid
    document.getElementById('dGrid').innerHTML = `
        <div class="detail-item"><label>Phone</label><div>${book.phone}</div></div>
        <div class="detail-item"><label>Gender</label><div>${book.gender}</div></div>
        <div class="detail-item"><label>Destination</label><div>${book.place}</div></div>
        <div class="detail-item"><label>Travel Date</label><div>${book.travel}</div></div>
    `;

    // Notes
    const notesWrap = document.getElementById('dNotesWrap');
    if (book.notes && book.notes.trim() !== "") {
        notesWrap.style.display = "block";
        document.getElementById('dNotes').innerText = book.notes;
    } else {
        notesWrap.style.display = "none";
    }

    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('active');
};

window.closeDrawer = function() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('active');
};

// --- DATABASE ACTIONS ---
window.updateStatus = async function(newStatus) {
    try {
        const res = await fetch(`/api/bookings/${currentBookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast(`Status updated to ${newStatus}`);
            fetchBookings(); // Refresh data
            closeDrawer();
        }
    } catch (err) {
        showToast("Update failed", "error");
    }
};

window.deleteBooking = async function() {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
        const res = await fetch(`/api/bookings/${currentBookingId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast("Booking deleted");
            fetchBookings();
            closeDrawer();
        }
    } catch (err) {
        showToast("Delete failed", "error");
    }
};

function showToast(msg, type = "success") {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.background = type === "error" ? "#b03434" : "#2d7d52";
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initial Fetch
fetchBookings();
