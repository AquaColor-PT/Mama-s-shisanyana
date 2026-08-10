// =====================================================
// MAMAKANANA'S SHISANYAMA
// SECURE CHECKOUT + EMAIL
// =====================================================


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://fzydikkscegqecdepxyl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_33Vwwv5EjoY41AyBW4a4kQ_dLXYm5LW";

const { createClient } = window.supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// CART
// =====================================================

let cart =
    JSON.parse(
        localStorage.getItem("mamakananasCart")
    ) || [];


// =====================================================
// ELEMENTS
// =====================================================

const checkoutForm =
    document.getElementById("checkoutForm");

const orderItemsContainer =
    document.getElementById("orderItems");

const orderTotalElement =
    document.getElementById("orderTotal");

const orderType =
    document.getElementById("orderType");

const deliveryAddressContainer =
    document.getElementById(
        "deliveryAddressContainer"
    );

const deliveryAddress =
    document.getElementById("deliveryAddress");

const placeOrderButton =
    document.getElementById("placeOrderButton");

const checkoutPage =
    document.getElementById("checkoutPage");

const confirmation =
    document.getElementById("confirmation");

const confirmedOrderNumber =
    document.getElementById(
        "confirmedOrderNumber"
    );


// =====================================================
// CHECK CART
// =====================================================

if (cart.length === 0) {

    checkoutPage.innerHTML = `

        <div class="empty">

            <h2>Your cart is empty</h2>

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
// DISPLAY CART
// =====================================================

function renderOrder() {

    orderItemsContainer.innerHTML = "";

    let total = 0;


    cart.forEach(function(item) {

        const price =
            Number(item.price);

        const quantity =
            Number(item.quantity);

        const itemTotal =
            price * quantity;

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
                    Quantity: ${quantity}
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

            deliveryAddress.value = "";

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


        // Prevent double submission

        placeOrderButton.disabled =
            true;

        placeOrderButton.textContent =
            "PLACING ORDER...";


        try {

            // =========================================
            // CUSTOMER DETAILS
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
            // CALCULATE DISPLAY TOTAL
            // =========================================

            const orderTotal =
                cart.reduce(
                    function(total, item) {

                        return total +
                            (
                                Number(item.price) *
                                Number(item.quantity)
                            );

                    },
                    0
                );


            // =========================================
            // PREPARE ITEMS
            // =========================================

            const itemsForDatabase =
                cart.map(function(item) {

                    return {

                        menu_item_id:
                            item.id,

                        quantity:
                            Number(item.quantity)

                    };

                });


            // =========================================
            // CREATE ORDER
            // =========================================

            const {
                data: orderNumber,
                error: orderError
            } = await db.rpc(
                "create_customer_order",
                {

                    p_customer_name:
                        customerName,

                    p_customer_phone:
                        customerPhone,

                    p_customer_email:
                        customerEmail || null,

                    p_order_type:
                        selectedOrderType,

                    p_delivery_address:
                        selectedOrderType ===
                        "delivery"
                            ? selectedAddress
                            : null,

                    p_notes:
                        notes || null,

                    p_items:
                        itemsForDatabase

                }
            );


            // =========================================
            // CHECK ORDER ERROR
            // =========================================

            if (orderError) {

                console.error(
                    "Order creation error:",
                    orderError
                );

                throw orderError;

            }


            if (!orderNumber) {

                throw new Error(
                    "No order number was returned."
                );

            }


            console.log(
                "Order successfully created:",
                orderNumber
            );


            // =========================================
            // SEND CUSTOMER EMAIL
            // =========================================

            if (customerEmail) {

                try {

                    const {
                        data: emailData,
                        error: emailError
                    } = await db.functions.invoke(
                        "send-order-email",
                        {

                            body: {

                                customer_email:
                                    customerEmail,

                                customer_name:
                                    customerName,

                                order_number:
                                    orderNumber,

                                total_amount:
                                    orderTotal

                            }

                        }
                    );


                    if (emailError) {

                        console.error(
                            "Email error:",
                            emailError
                        );

                    } else {

                        console.log(
                            "Order email sent:",
                            emailData
                        );

                    }

                } catch (emailError) {

                    console.error(
                        "Could not send order email:",
                        emailError
                    );

                }

            }


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
                "#" + orderNumber;


            checkoutPage.style.display =
                "none";


            confirmation.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "CHECKOUT ERROR:",
                error
            );


            let message =
                "We could not place your order.";


            if (error.message) {

                message +=
                    "\n\n" +
                    error.message;

            }


            alert(message);


            placeOrderButton.disabled =
                false;

            placeOrderButton.textContent =
                "PLACE ORDER";

        }

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}
