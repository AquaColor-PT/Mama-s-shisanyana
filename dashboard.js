
const SUPABASE_URL = "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
    "YOUR_SUPABASE_ANON_KEY";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// =====================================================
// VARIABLES
// =====================================================

let allOrders = [];


// =====================================================
// ELEMENTS
// =====================================================

const ordersTable =
    document.getElementById("ordersTable");

const loading =
    document.getElementById("loading");

const tableWrapper =
    document.getElementById("tableWrapper");

const emptyState =
    document.getElementById("emptyState");

const statusFilter =
    document.getElementById("statusFilter");

const searchInput =
    document.getElementById("searchInput");

const refreshBtn =
    document.getElementById("refreshBtn");

const orderModal =
    document.getElementById("orderModal");

const closeModal =
    document.getElementById("closeModal");


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    loading.style.display = "block";

    tableWrapper.style.display = "none";

    emptyState.style.display = "none";


    const {
        data,
        error
    } = await supabaseClient

        .from("orders")

        .select(`
            *,
            order_items (
                id,
                item_name,
                quantity,
                unit_price,
                subtotal
            )
        `)

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error loading orders:",
            error
        );

        loading.innerHTML = `
            <div style="color:#c41219;">
                Failed to load orders.
                <br><br>
                ${escapeHTML(error.message)}
            </div>
        `;

        return;
    }


    allOrders = data || [];


    updateStatistics();


    loading.style.display = "none";


    document.getElementById(
        "lastUpdated"
    ).textContent =
        "Updated " +
        new Date().toLocaleTimeString();


    applyFilters();

}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics() {

    const total =
        allOrders.length;


    const newCount =
        allOrders.filter(
            order =>
                order.status === "new"
        ).length;


    const processingCount =
        allOrders.filter(
            order =>
                order.status === "processing"
        ).length;


    const readyCount =
        allOrders.filter(
            order =>
                order.status === "ready"
        ).length;


    const cancelledCount =
        allOrders.filter(
            order =>
                order.status === "cancelled"
        ).length;


    document.getElementById(
        "totalOrders"
    ).textContent = total;


    document.getElementById(
        "newOrders"
    ).textContent = newCount;


    document.getElementById(
        "processingOrders"
    ).textContent = processingCount;


    document.getElementById(
        "readyOrders"
    ).textContent = readyCount;


    document.getElementById(
        "cancelledOrders"
    ).textContent = cancelledCount;

}


// =====================================================
// FILTER ORDERS
// =====================================================

function applyFilters() {

    const status =
        statusFilter.value;

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    let filtered =
        [...allOrders];


    // Status filter

    if (status !== "all") {

        filtered =
            filtered.filter(
                order =>
                    order.status === status
            );

    }


    // Search

    if (search) {

        filtered =
            filtered.filter(
                order => {

                    const orderNumber =
                        String(
                            order.order_number || ""
                        );

                    const name =
                        String(
                            order.customer_name || ""
                        ).toLowerCase();

                    const phone =
                        String(
                            order.customer_phone || ""
                        ).toLowerCase();


                    return (
                        orderNumber.includes(search) ||
                        name.includes(search) ||
                        phone.includes(search)
                    );

                }
            );

    }


    renderOrders(filtered);

}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders(orders) {

    ordersTable.innerHTML = "";


    if (!orders.length) {

        tableWrapper.style.display =
            "none";

        emptyState.style.display =
            "block";

        return;
    }


    emptyState.style.display =
        "none";

    tableWrapper.style.display =
        "block";


    orders.forEach(order => {

        const row =
            document.createElement("tr");


        const statusClass =
            getStatusClass(
                order.status
            );


        const payment =
            order.payment_status || "unpaid";


        row.innerHTML = `

            <td>

                <div class="order-number">
                    #${escapeHTML(
                        order.order_number
                    )}
                </div>

            </td>


            <td>

                <div class="customer-name">
                    ${escapeHTML(
                        order.customer_name
                    )}
                </div>

                <div class="customer-phone">
                    ${escapeHTML(
                        order.customer_phone
                    )}
                </div>

            </td>


            <td>

                ${formatOrderType(
                    order.order_type
                )}

            </td>


            <td>

                <strong>
                    R${Number(
                        order.total_amount || 0
                    ).toFixed(2)}
                </strong>

            </td>


            <td>

                <span
                    class="status ${statusClass}"
                >
                    ${formatStatus(
                        order.status
                    )}
                </span>

            </td>


            <td>

                ${formatStatus(
                    payment
                )}

            </td>


            <td>

                ${formatDate(
                    order.created_at
                )}

            </td>


            <td>

                <div class="actions">

                    <button
                        class="action-btn view-btn"
                        onclick="viewOrder('${order.id}')"
                    >
                        View
                    </button>


                    ${
                        order.status === "new"
                        ?
                        `
                        <button
                            class="action-btn process-btn"
                            onclick="changeStatus(
                                '${order.id}',
                                'processing'
                            )"
                        >
                            Process
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        order.status === "processing"
                        ?
                        `
                        <button
                            class="action-btn ready-btn"
                            onclick="changeStatus(
                                '${order.id}',
                                'ready'
                            )"
                        >
                            Ready
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        order.status === "ready"
                        ?
                        `
                        <button
                            class="action-btn complete-btn"
                            onclick="changeStatus(
                                '${order.id}',
                                'completed'
                            )"
                        >
                            Complete
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        order.status !== "cancelled" &&
                        order.status !== "completed"
                        ?
                        `
                        <button
                            class="action-btn cancel-btn"
                            onclick="cancelOrder(
                                '${order.id}'
                            )"
                        >
                            Cancel
                        </button>
                        `
                        :
                        ""
                    }

                </div>

            </td>

        `;


        ordersTable.appendChild(row);

    });

}


// =====================================================
// CHANGE ORDER STATUS
// =====================================================

async function changeStatus(
    orderId,
    newStatus
) {

    const order =
        allOrders.find(
            item =>
                item.id === orderId
        );


    if (!order) {
        return;
    }


    const confirmation =
        confirm(
            `Change order #${order.order_number} to ${formatStatus(newStatus)}?`
        );


    if (!confirmation) {
        return;
    }


    const {
        error
    } = await supabaseClient

        .from("orders")

        .update({
            status: newStatus
        })

        .eq(
            "id",
            orderId
        );


    if (error) {

        alert(
            "Could not update order:\n\n" +
            error.message
        );

        console.error(error);

        return;
    }


    await loadOrders();

}


// =====================================================
// CANCEL ORDER
// =====================================================

async function cancelOrder(
    orderId
) {

    const order =
        allOrders.find(
            item =>
                item.id === orderId
        );


    if (!order) {
        return;
    }


    const reason =
        prompt(
            `Why are you cancelling order #${order.order_number}?`
        );


    if (reason === null) {
        return;
    }


    if (!reason.trim()) {

        alert(
            "Please enter a cancellation reason."
        );

        return;
    }


    const {
        error
    } = await supabaseClient

        .from("orders")

        .update({

            status: "cancelled",

            cancellation_reason:
                reason.trim(),

            cancelled_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            orderId
        );


    if (error) {

        alert(
            "Could not cancel order:\n\n" +
            error.message
        );

        console.error(error);

        return;
    }


    await loadOrders();

}


// =====================================================
// VIEW ORDER
// =====================================================

function viewOrder(
    orderId
) {

    const order =
        allOrders.find(
            item =>
                item.id === orderId
        );


    if (!order) {
        return;
    }


    const items =
        order.order_items || [];


    let itemsHTML = "";


    items.forEach(item => {

        itemsHTML += `

            <div class="item-row">

                <div>

                    <strong>
                        ${escapeHTML(
                            item.item_name
                        )}
                    </strong>

                    <br>

                    <small>
                        ${item.quantity}
                        ×
                        R${Number(
                            item.unit_price
                        ).toFixed(2)}
                    </small>

                </div>


                <strong>
                    R${Number(
                        item.subtotal
                    ).toFixed(2)}
                </strong>

            </div>

        `;

    });


    document.getElementById(
        "modalTitle"
    ).textContent =
        `Order #${order.order_number}`;


    document.getElementById(
        "orderDetails"
    ).innerHTML = `

        <div class="detail-row">

            <span class="detail-label">
                Customer
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.customer_name
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Phone
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.customer_phone
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Email
            </span>

            <span class="detail-value">
                ${escapeHTML(
                    order.customer_email ||
                    "Not provided"
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Order Type
            </span>

            <span class="detail-value">
                ${formatOrderType(
                    order.order_type
                )}
            </span>

        </div>


        ${
            order.delivery_address
            ?
            `
            <div class="detail-row">

                <span class="detail-label">
                    Delivery Address
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.delivery_address
                    )}
                </span>

            </div>
            `
            :
            ""
        }


        <div class="detail-row">

            <span class="detail-label">
                Status
            </span>

            <span class="detail-value">
                ${formatStatus(
                    order.status
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Payment
            </span>

            <span class="detail-value">
                ${formatStatus(
                    order.payment_status
                )}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Date
            </span>

            <span class="detail-value">
                ${formatDate(
                    order.created_at
                )}
            </span>

        </div>


        <h3 class="items-title">
            Ordered Items
        </h3>


        ${itemsHTML}


        <div class="modal-total">

            <span>
                TOTAL
            </span>

            <span>
                R${Number(
                    order.total_amount || 0
                ).toFixed(2)}
            </span>

        </div>


        ${
            order.notes
            ?
            `
            <div style="
                margin-top:20px;
                padding:15px;
                background:#fff8e5;
                border-radius:6px;
            ">

                <strong>
                    Customer Notes
                </strong>

                <p style="
                    margin-top:8px;
                    color:#555;
                ">
                    ${escapeHTML(
                        order.notes
                    )}
                </p>

            </div>
            `
            :
            ""
        }


        ${
            order.cancellation_reason
            ?
            `
            <div style="
                margin-top:20px;
                padding:15px;
                background:#ffe5e5;
                border-radius:6px;
                color:#a00000;
            ">

                <strong>
                    Cancellation Reason
                </strong>

                <p style="
                    margin-top:8px;
                ">
                    ${escapeHTML(
                        order.cancellation_reason
                    )}
                </p>

            </div>
            `
            :
            ""
        }

    `;


    orderModal.classList.add(
        "active"
    );

}


// =====================================================
// CLOSE MODAL
// =====================================================

closeModal.addEventListener(
    "click",
    () => {

        orderModal.classList.remove(
            "active"
        );

    }
);


orderModal.addEventListener(
    "click",
    event => {

        if (
            event.target === orderModal
        ) {

            orderModal.classList.remove(
                "active"
            );

        }

    }
);


// =====================================================
// FILTER EVENTS
// =====================================================

statusFilter.addEventListener(
    "change",
    applyFilters
);


searchInput.addEventListener(
    "input",
    applyFilters
);


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    loadOrders
);


// =====================================================
// LOGOUT
// =====================================================

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    () => {

        alert(
            "Admin login will be connected here."
        );

    }
);


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(
    status
) {

    switch (status) {

        case "new":
            return "status-new";

        case "processing":
            return "status-processing";

        case "ready":
            return "status-ready";

        case "completed":
            return "status-completed";

        case "cancelled":
            return "status-cancelled";

        default:
            return "status-new";

    }

}


// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
    status
) {

    if (!status) {
        return "UNKNOWN";
    }


    return String(status)
        .replace(
            /_/g,
            " "
        )
        .toUpperCase();

}


// =====================================================
// FORMAT ORDER TYPE
// =====================================================

function formatOrderType(
    type
) {

    if (
        type === "delivery"
    ) {

        return "🚚 Delivery";

    }


    return "🏪 Collection";

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }


    return new Date(
        date
    ).toLocaleString(
        "en-ZA",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadOrders();


// =====================================================
// AUTO REFRESH EVERY 30 SECONDS
// =====================================================

setInterval(
    loadOrders,
    30000
);
