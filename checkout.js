// =====================================================
// MAMAKANANA'S SHISANYAMA
// CHECKOUT.JS
// =====================================================


// =====================================================
// SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL =
    "https://fzydikkscegqecdepxyl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_33Vwwv5EjoY41AyBW4a4kQ_dLXYm5LW";


const { createClient } =
    window.supabase;

const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// GET CART
// =====================================================

let cart =
    JSON.parse(
        localStorage.getItem(
            "mamakananasCart"
        )
    ) || [];


// =====================================================
// PAGE ELEMENTS
// =====================================================

const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );

const orderItemsContainer =
    document.getElementById(
        "orderItems"
    );

const orderTotalElement =
    document.getElementById(
        "orderTotal"
    );

const orderType =
    document.getElementById(
        "orderType"
    );

const deliveryAddressContainer =
    document.getElementById(
        "deliveryAddressContainer"
    );

const deliveryAddress =
    document.getElementById(
        "deliveryAddress"
    );

const placeOrderButton =
    document.getElementById(
        "placeOrderButton"
    );

const checkoutPage =
    document.getElementById(
        "checkoutPage"
    );

const confirmation =
    document.getElementById(
        "confirmation"
    );

const confirmedOrderNumber =
    document.getElementById(
        "confirmedOrderNumber"
    );


// =====================================================
// CHECK IF CART IS EMPTY
// =====================================================

if (cart.length === 0) {

    checkoutPage.innerHTML = `

        <div class="empty">

            <h2>
                Your cart is empty
            </h2>

            <p>
                Please add some delicious food
                before checking out.
            </p>

            <a href="menu.html">
                Go To Menu
            </a>

        </div>

    `;

} else {

    renderOrder();

}


// =====================================================
// DISPLAY ORDER
// =====================================================

function renderOrder() {

    orderItemsContainer.innerHTML = "";

    let total = 0;


    cart.forEach(function(item) {

        const itemTotal =
            Number(item.price) *
            Number(item.quantity);


        total += itemTotal;


        const element =
            document.createElement("div");

        element.className =
            "order-item";


        element.innerHTML = `

            <div>

                <div class="item-name">
                    ${escapeHTML(item.name)}
                </div>

                <div class="item-quantity">
                    Quantity: ${item.quantity}
                </div>

            </div>


            <div class="item-price">

                R${itemTotal.toFixed(2)}

            </div>

        `;


        orderItemsContainer.appendChild(
            element
        );

    });


    orderTotalElement.textContent =
        "R" + total.toFixed(2);

}


// =====================================================
// DELIVERY / COLLECTION
// =====================================================

orderType.addEventListener(
    "change",
    function() {

        if (
            orderType.value === "delivery"
        ) {

            deliveryAddressContainer
                .classList.add("show");

            deliveryAddress.required =
                true;

        } else {

            deliveryAddressContainer
                .classList.remove("show");

            deliveryAddress.required =
                false;

            deliveryAddress.value =
                "";

        }

    }
);


// =====================================================
// SUBMIT ORDER
// =====================================================

checkoutForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        if (cart.length === 0) {

            alert(
                "Your cart is empty."
            );

            return;

        }


        // Prevent double-click orders

        placeOrderButton.disabled =
            true;

        placeOrderButton.textContent =
            "PLACING ORDER...";


        try {

            // =========================================
            // CUSTOMER INFORMATION
            // =========================================

            const customerName =
                document
                    .getElementById(
                        "customerName"
                    )
                    .value
                    .trim();


            const customerPhone =
                document
                    .getElementById(
                        "customerPhone"
                    )
                    .value
                    .trim();


            const customerEmail =
                document
                    .getElementById(
                        "customerEmail"
                    )
                    .value
                    .trim();


            const selectedOrderType =
                orderType.value;


            const selectedAddress =
                deliveryAddress
                    .value
                    .trim();


            const notes =
                document
                    .getElementById(
                        "notes"
                    )
                    .value
                    .trim();


            // =========================================
            // CALCULATE TOTAL
            // =========================================

            let total = 0;


            cart.forEach(function(item) {

                total +=
                    Number(item.price) *
                    Number(item.quantity);

            });


            // =========================================
            // CREATE ORDER
            // =========================================

            const {
                data: order,
                error: orderError
            } = await db

                .from("orders")

                .insert({

                    customer_name:
                        customerName,

                    customer_phone:
                        customerPhone,

                    customer_email:
                        customerEmail,

                    order_type:
                        selectedOrderType,

                    delivery_address:
                        selectedOrderType ===
                        "delivery"
                            ? selectedAddress
                            : null,

                    notes:
                        notes || null,

                    total_amount:
                        total,

                    status:
                        "new",

                    payment_status:
                        "unpaid"

                })

                .select(
                    "id, order_number"
                )

                .single();


            // =========================================
            // CHECK ORDER ERROR
            // =========================================

            if (orderError) {

                console.error(
                    "Order error:",
                    orderError
                );

                throw orderError;

            }


            console.log(
                "Order created:",
                order
            );


            // =========================================
            // CREATE ORDER ITEMS
            // =========================================

            const orderItems =
                cart.map(function(item) {

                    return {

                        order_id:
                            order.id,

                        menu_item_id:
                            item.id,

                        item_name:
                            item.name,

                        quantity:
                            Number(item.quantity),

                        unit_price:
                            Number(item.price)

                    };

                });


            const {
                error: itemsError
            } = await db

                .from("order_items")

                .insert(
                    orderItems
                );


            // =========================================
            // CHECK ITEMS ERROR
            // =========================================

            if (itemsError) {

                console.error(
                    "Order items error:",
                    itemsError
                );


                /*
                 * The order itself was created,
                 * but the items failed.
                 *
                 * We do NOT show a fake success
                 * message to the customer.
                 */

                throw itemsError;

            }


            // =========================================
            // SUCCESS
            // =========================================

            console.log(
                "Order successfully created:",
                order.order_number
            );


            // =========================================
            // CLEAR CART
            // =========================================

            localStorage.removeItem(
                "mamakananasCart"
            );

            cart = [];


            // =========================================
            // SHOW ORDER NUMBER
            // =========================================

            confirmedOrderNumber.textContent =
                "#" + order.order_number;


            checkoutPage.style.display =
                "none";


            confirmation.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Checkout error:",
                error
            );


            alert(
                "We could not place your order. Please try again."
            );


            placeOrderButton.disabled =
                false;

            placeOrderButton.textContent =
                "PLACE ORDER";

        }

    }
);


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}
