const SUPABASE_URL =
    "https://fzydikkscegqecdepxyl.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_33Vwwv5EjoY41AyBW4a4kQ_dLXYm5LW";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allOrders = [];

let isAuthenticatedStaff = false;


// =====================================================
// DOM ELEMENTS
// =====================================================

const loginScreen =
    document.getElementById("loginScreen");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const logoutBtn =
    document.getElementById("logoutBtn");

const ordersTable =
    document.getElementById("ordersTable");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const orderModal =
    document.getElementById("orderModal");

const closeModal =
    document.getElementById("closeModal");

const orderDetails =
    document.getElementById("orderDetails");


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin(message = "") {

    loginScreen.style.display = "flex";

    loginError.textContent = message;

    isAuthenticatedStaff = false;
}


// =====================================================
// HIDE LOGIN
// =====================================================

function hideLogin() {

    loginScreen.style.display = "none";
}


// =====================================================
// CHECK STAFF ACCESS
// =====================================================

async function checkStaffAccess() {

    try {

        const {
            data: {
                session
            },
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (sessionError) {

            console.error(
                "Session error:",
                sessionError
            );

            showLogin(
                "Unable to check your login session."
            );

            return false;
        }


        if (!session) {

            showLogin();

            return false;
        }


        // =============================================
        // CHECK PROFILE
        // =============================================

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, role"
                )
                .eq(
                    "id",
                    session.user.id
                )
                .single();


        if (profileError) {

            console.error(
                "Profile error:",
                profileError
            );

            await supabaseClient.auth.signOut();

            showLogin(
                "Your staff profile could not be found."
            );

            return false;
        }


        // =============================================
        // CHECK ROLE
        // =============================================

        const allowedRoles = [
            "admin",
            "manager",
            "staff"
        ];


        if (
            !allowedRoles.includes(
                profile.role
            )
        ) {

            await supabaseClient.auth.signOut();

            showLogin(
                "You do not have permission to access this dashboard."
            );

            return false;
        }


        // =============================================
        // SUCCESS
        // =============================================

        isAuthenticatedStaff = true;

        hideLogin();

        console.log(
            "Authenticated staff:",
            profile.full_name,
            profile.role
        );

        return true;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showLogin(
            "An unexpected authentication error occurred."
        );

        return false;
    }
}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        loginError.textContent = "";

        loginButton.disabled = true;

        loginButton.textContent =
            "LOGGING IN...";


        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        if (!email || !password) {

            loginError.textContent =
                "Please enter your email and password.";

            loginButton.disabled = false;

            loginButton.textContent =
                "LOGIN";

            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                loginError.textContent =
                    "Invalid email or password.";

                loginButton.disabled = false;

                loginButton.textContent =
                    "LOGIN";

                return;
            }


            console.log(
                "Supabase login successful:",
                data.user
            );


            const allowed =
                await checkStaffAccess();


            if (!allowed) {

                loginButton.disabled = false;

                loginButton.textContent =
                    "LOGIN";

                return;
            }


            loginForm.reset();

            loginButton.disabled = false;

            loginButton.textContent =
                "LOGIN";


            await loadOrders();


        } catch (error) {

            console.error(
                "Login exception:",
                error
            );

            loginError.textContent =
                "Something went wrong while logging in.";

            loginButton.disabled = false;

            loginButton.textContent =
                "LOGIN";
        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async function () {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Logout failed:\n\n" +
                error.message
            );

            return;
        }


        allOrders = [];

        ordersTable.innerHTML = "";

        updateStatistics([]);

        showLogin();

        loginEmail.value = "";

        loginPassword.value = "";

    }
);


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    if (!isAuthenticatedStaff){

        console.warn(
            "Not authenticated. Orders will not be loaded."
        );

        return;
    }


    console.log(
        "Loading orders..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
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
            "Orders error:",
            error
        );

        alert(
            "Could not load orders:\n\n" +
            error.message
        );

        return;
    }


    console.log(
        "Orders loaded:",
        data
    );


    allOrders = data || [];


    updateStatistics(
        allOrders
    );


    renderOrders(
        allOrders
    );

}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics(
    orders
) {

    document.getElementById(
        "totalOrders"
    ).textContent =
        orders.length;


    document.getElementById(
        "newOrders"
    ).textContent =
        orders.filter(
            order =>
                order.status === "new"
        ).length;


    document.getElementById(
        "processingOrders"
    ).textContent =
        orders.filter(
            order =>
                order.status === "processing"
        ).length;


    document.getElementById(
        "completedOrders"
    ).textContent =
        orders.filter(
            order =>
                order.status === "completed"
        ).length;

}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders(
    orders
) {

    ordersTable.innerHTML = "";


    if (!orders || orders.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    orders.forEach(
        order => {

            const row =
                document.createElement(
                    "tr"
                );


            const statusClass =
                getStatusClass(
                    order.status
                );


            const date =
                order.created_at
                    ? new Date(
                        order.created_at
                    ).toLocaleString(
                        "en-ZA"
                    )
                    : "-";


            const total =
                Number(
                    order.total_amount || 0
                ).toFixed(2);


            row.innerHTML = `

                <td>
                    <strong>
                        #${escapeHtml(
                            String(
                                order.order_number
                            )
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        order.customer_name || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        order.customer_phone || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        capitalize(
                            order.order_type || "-"
                        )
                    )}
                </td>

                <td>
                    R${total}
                </td>

          <td>
    <select
        class="status-select ${statusClass}"
        onchange="updateOrderStatus('${order.id}', this.value)"
    >
        <option value="new" ${order.status === "new" ? "selected" : ""}>
            New
        </option>

        <option value="processing" ${order.status === "processing" ? "selected" : ""}>
            Processing
        </option>

        <option value="ready" ${order.status === "ready" ? "selected" : ""}>
            Ready
        </option>

        <option value="completed" ${order.status === "completed" ? "selected" : ""}>
            Completed
        </option>

        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>
            Cancelled
        </option>
    </select>
</td>

                <td>
                    ${escapeHtml(
                        capitalize(
                            order.payment_status || "-"
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(date)}
                </td>

                <td>

                    <button
                        class="action-btn view-btn"
                        onclick="viewOrder('${order.id}')"
                    >
                        View
                    </button>

                </td>

            `;


            ordersTable.appendChild(
                row
            );

        }
    );

}
// =====================================================
// UPDATE ORDER STATUS
// =====================================================

window.updateOrderStatus = async function(orderId, newStatus) {

    if (!isAuthenticatedStaff) {
        alert("You are not logged in.");
        return;
    }

    const order = allOrders.find(
        item => item.id === orderId
    );

    if (!order) {
        return;
    }

    const oldStatus = order.status;

    // Don't do anything if unchanged
    if (oldStatus === newStatus) {
        return;
    }

    // Ask confirmation before cancelling
    if (newStatus === "cancelled") {

        const confirmed = confirm(
            `Are you sure you want to cancel Order #${order.order_number}?`
        );

        if (!confirmed) {
            renderOrders(allOrders);
            return;
        }
    }

    try {

        const updateData = {
            status: newStatus
        };

        // Record cancellation information
        if (newStatus === "cancelled") {

            updateData.cancelled_at =
                new Date().toISOString();

            const {
                data: {
                    user
                }
            } = await supabaseClient.auth.getUser();

            updateData.cancelled_by =
                user ? user.id : null;

            const reason = prompt(
                "Enter cancellation reason:"
            );

            if (!reason || !reason.trim()) {

                alert(
                    "Cancellation reason is required."
                );

                renderOrders(allOrders);

                return;
            }

            updateData.cancellation_reason =
                reason.trim();
        }

        // If moving away from cancelled,
        // clear cancellation information
        if (
            oldStatus === "cancelled" &&
            newStatus !== "cancelled"
        ) {

            updateData.cancelled_at = null;
            updateData.cancelled_by = null;
            updateData.cancellation_reason = null;
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("orders")
            .update(updateData)
            .eq("id", orderId)
            .select()
            .single();

        if (error) {

            console.error(
                "Status update error:",
                error
            );

            alert(
                "Could not update the order:\n\n" +
                error.message
            );

            renderOrders(allOrders);

            return;
        }

        console.log(
            "Order status updated:",
            data
        );

        // Update local order
        const index =
            allOrders.findIndex(
                item => item.id === orderId
            );

        if (index !== -1) {

            allOrders[index] = {
                ...allOrders[index],
                ...data
            };
        }

        updateStatistics(allOrders);

        applyFilters();

    } catch (error) {

        console.error(
            "Unexpected status error:",
            error
        );

        alert(
            "Something went wrong while updating the order."
        );

        renderOrders(allOrders);
    }
};

// =====================================================
// VIEW ORDER
// =====================================================

window.viewOrder =
    function (orderId) {

        const order =
            allOrders.find(
                item =>
                    item.id === orderId
            );


        if (!order) {
            return;
        }


        document.getElementById(
            "modalTitle"
        ).textContent =
            `Order #${order.order_number}`;


        const items =
            order.order_items || [];


        let itemsHtml = "";


        if (items.length > 0) {

            itemsHtml =
                items.map(
                    item => `

                        <div class="item-row">

                            <div>
                                <strong>
                                    ${escapeHtml(
                                        item.item_name
                                    )}
                                </strong>

                                <br>

                                <small>
                                    ${item.quantity}
                                    × R${Number(
                                        item.unit_price || 0
                                    ).toFixed(2)}
                                </small>

                            </div>

                            <strong>
                                R${Number(
                                    item.subtotal || 0
                                ).toFixed(2)}
                            </strong>

                        </div>

                    `
                ).join("");

        } else {

            itemsHtml =
                "<p>No order items found.</p>";

        }


        orderDetails.innerHTML = `

            <div class="detail-row">

                <span class="detail-label">
                    Customer
                </span>

                <span>
                    ${escapeHtml(
                        order.customer_name || "-"
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Phone
                </span>

                <span>
                    ${escapeHtml(
                        order.customer_phone || "-"
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Email
                </span>

                <span>
                    ${escapeHtml(
                        order.customer_email || "-"
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Order Type
                </span>

                <span>
                    ${escapeHtml(
                        capitalize(
                            order.order_type || "-"
                        )
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Delivery Address
                </span>

                <span>
                    ${escapeHtml(
                        order.delivery_address || "-"
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Notes
                </span>

                <span>
                    ${escapeHtml(
                        order.notes || "-"
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Status
                </span>

                <span>
                    ${escapeHtml(
                        capitalize(
                            order.status || "-"
                        )
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Payment
                </span>

                <span>
                    ${escapeHtml(
                        capitalize(
                            order.payment_status || "-"
                        )
                    )}
                </span>

            </div>


            <div class="items-list">

                <h3>
                    Order Items
                </h3>

                ${itemsHtml}

            </div>


            <div
                class="detail-row"
                style="margin-top:20px;font-size:18px;"
            >

                <span class="detail-label">
                    Total
                </span>

                <strong>
                    R${Number(
                        order.total_amount || 0
                    ).toFixed(2)}
                </strong>

            </div>

        `;


        orderModal.style.display =
            "block";

    };


// =====================================================
// CLOSE MODAL
// =====================================================

closeModal.addEventListener(
    "click",
    function () {

        orderModal.style.display =
            "none";

    }
);


orderModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            orderModal
        ) {

            orderModal.style.display =
                "none";

        }

    }
);


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener(
    "input",
    applyFilters
);


// =====================================================
// STATUS FILTER
// =====================================================

statusFilter.addEventListener(
    "change",
    applyFilters
);


// =====================================================
// APPLY FILTERS
// =====================================================

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value;


    const filtered =
        allOrders.filter(
            order => {

                const matchesSearch =
                    !search ||
                    String(
                        order.order_number
                    )
                        .toLowerCase()
                        .includes(search) ||

                    (
                        order.customer_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    (
                        order.customer_phone ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesStatus =
                    status === "all" ||
                    order.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderOrders(
        filtered
    );

}


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    async function () {

        if (!isAuthenticatedStaff) {
            return;
        }


        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "Refreshing...";


        await loadOrders();


        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "Refresh";

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
            return "";

    }

}


// =====================================================
// CAPITALIZE
// =====================================================

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1);

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(value ?? "")
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
// INITIALIZE
// =====================================================

(async function initDashboard() {

    const allowed =
        await checkStaffAccess();


    if (allowed) {

        await loadOrders();

    }

})();


// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(
    async function () {

        if (
            isAuthenticatedStaff
        ) {

            await loadOrders();

        }

    },
    30000
);
