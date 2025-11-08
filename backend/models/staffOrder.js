// ====== API Base ======
const API_BASE = "http://localhost:5002/api/staff";

// ====== DOM Elements ======
const addForm = document.getElementById("addOrderForm");
const ordersTable = document.getElementById("ordersTable");
const summaryBox = document.getElementById("summaryBox");
const backLink = document.getElementById("backToDashboard");

// ====== Register New Garment ======
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerId = document.getElementById("customerId").value;
  const garmentType = document.getElementById("garmentType").value;
  const quantity = document.getElementById("quantity").value;

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, garmentType, quantity })
    });
    const data = await res.json();

    if (res.status === 201) {
      alert("✅ Garment registered successfully!");
      addForm.reset();
      loadOrders();
    } else {
      alert("❌ " + (data.message || "Failed to register garment"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error registering garment");
  }
});

// ====== Load Orders ======
async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    const orders = await res.json();

    // Clear table
    ordersTable.innerHTML = "";

    if (!orders.length) {
      ordersTable.innerHTML = `<tr><td colspan="6" class="no-data">No orders yet</td></tr>`;
      return;
    }

    // Populate table
    orders.forEach(order => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>${order.customerId}</td>
        <td>${order.garmentType}</td>
        <td>${order.quantity}</td>
        <td>
          <select data-id="${order._id}" class="statusSelect">
            <option ${order.status==='Received'?'selected':''}>Received</option>
            <option ${order.status==='In Progress'?'selected':''}>In Progress</option>
            <option ${order.status==='Completed'?'selected':''}>Completed</option>
            <option ${order.status==='Ready for Pickup'?'selected':''}>Ready for Pickup</option>
            <option ${order.status==='Picked Up'?'selected':''}>Picked Up</option>
          </select>
        </td>
        <td>
          <select data-id="${order._id}" class="paymentSelect">
            <option ${order.paymentStatus==='Pending'?'selected':''}>Pending</option>
            <option ${order.paymentStatus==='Paid'?'selected':''}>Paid</option>
          </select>
        </td>
        <td>
          <button data-id="${order._id}" class="updateBtn">Update</button>
        </td>
      `;

      ordersTable.appendChild(tr);
    });

    // Add event listeners for update buttons
    document.querySelectorAll(".updateBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const status = document.querySelector(`.statusSelect[data-id="${id}"]`).value;
        const paymentStatus = document.querySelector(`.paymentSelect[data-id="${id}"]`).value;

        try {
          const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, paymentStatus })
          });
          const data = await res.json();
          if (res.status === 200) {
            alert("✅ Order updated successfully");
            loadOrders();
          } else {
            alert("❌ " + (data.message || "Failed to update order"));
          }
        } catch (err) {
          console.error(err);
          alert("❌ Error updating order");
        }
      });
    });

  } catch (err) {
    console.error(err);
    ordersTable.innerHTML = `<tr><td colspan="6" class="no-data">Error loading orders</td></tr>`;
  }
}

// ====== Back to Dashboard ======
backLink.addEventListener("click", () => {
  window.location.href = "staff-Dashboard.html";
});

// ====== Initial Load ======
loadOrders();

// Optional: refresh orders every 10 seconds
setInterval(loadOrders, 10000);
