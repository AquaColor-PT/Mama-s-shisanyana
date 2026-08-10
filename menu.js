// ==========================================
// MAMAKANANA'S SHISANYAMA
// MENU / SHOPPING CART JAVASCRIPT
// ==========================================


// ==========================================
// CART DATA
// ==========================================

let cart = JSON.parse(localStorage.getItem("mamakananasCart")) || [];


// ==========================================
// PAGE ELEMENTS
// ==========================================

const cartCount = document.getElementById("cartCount");

const cartItems = document.getElementById("cartItems");

const cartTotal = document.getElementById("cartTotal");

const cartSidebar = document.getElementById("cartSidebar");

const cartOverlay = document.getElementById("cartOverlay");

const openCartButton = document.getElementById("openCart");

const closeCartButton = document.getElementById("closeCart");

const checkoutButton = document.getElementById("checkoutButton");

const mobileButton = document.getElementById("mobileButton");

const navLinks = document.getElementById("navLinks");


// ==========================================
// ADD TO CART BUTTONS
// ==========================================

const addButtons = document.querySelectorAll(".add-cart");


addButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const name = button.dataset.name;

        const price = Number(button.dataset.price);


        addToCart(name, price);

    });

});


// ==========================================
// ADD ITEM TO CART
// ==========================================

function addToCart(name, price) {

    const existingItem = cart.find(function(item) {

        return item.name === name;

    });


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

        });

    }


    saveCart();

    updateCart();

    openCart();

}


// ==========================================
// SAVE CART
// ==========================================

function saveCart() {

    localStorage.setItem(
        "mamakananasCart",
        JSON.stringify(cart)
    );

}


// ==========================================
// UPDATE CART
// ==========================================

function updateCart() {

    renderCart();

    updateCartCount();

}


// ==========================================
// UPDATE CART COUNTER
// ==========================================

function updateCartCount() {

    let totalItems = 0;


    cart.forEach(function(item) {

        totalItems += item.quantity;

    });


    cartCount.textContent = totalItems;

}


// ==========================================
// DISPLAY CART
// ==========================================

function renderCart() {

    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

        cartTotal.textContent = "R0";

        return;

    }


    let total = 0;


    cart.forEach(function(item, index) {

        const itemTotal =
            item.price * item.quantity;


        total += itemTotal;


        const cartItem = document.createElement("div");

        cartItem.classList.add("cart-item");


        cartItem.innerHTML = `

            <div class="cart-item-top">

                <h3>
                    ${item.name}
                </h3>

                <button
                    class="remove-item"
                    data-index="${index}">

                    Remove

                </button>

            </div>


            <div class="cart-item-bottom">

                <div class="quantity-controls">

                    <button
                        class="decrease"
                        data-index="${index}">

                        −

                    </button>


                    <span>
                        ${item.quantity}
                    </span>


                    <button
                        class="increase"
                        data-index="${index}">

                        +

                    </button>

                </div>


                <span class="cart-price">

                    R${itemTotal}

                </span>

            </div>

        `;


        cartItems.appendChild(cartItem);

    });


    cartTotal.textContent = "R" + total;


    attachCartEvents();

}


// ==========================================
// CART BUTTON EVENTS
// ==========================================

function attachCartEvents() {


    // INCREASE QUANTITY

    const increaseButtons =
        document.querySelectorAll(".increase");


    increaseButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            const index =
                Number(button.dataset.index);


            cart[index].quantity++;


            saveCart();

            updateCart();

        });

    });


    // DECREASE QUANTITY

    const decreaseButtons =
        document.querySelectorAll(".decrease");


    decreaseButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            const index =
                Number(button.dataset.index);


            if (cart[index].quantity > 1) {

                cart[index].quantity--;

            } else {

                cart.splice(index, 1);

            }


            saveCart();

            updateCart();

        });

    });


    // REMOVE ITEM

    const removeButtons =
        document.querySelectorAll(".remove-item");


    removeButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            const index =
                Number(button.dataset.index);


            cart.splice(index, 1);


            saveCart();

            updateCart();

        });

    });

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

    cartSidebar.classList.add("active");

    cartOverlay.classList.add("active");

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

    cartSidebar.classList.remove("active");

    cartOverlay.classList.remove("active");

}


// ==========================================
// CART BUTTON
// ==========================================

openCartButton.addEventListener(
    "click",
    openCart
);


// ==========================================
// CLOSE BUTTON
// ==========================================

closeCartButton.addEventListener(
    "click",
    closeCart
);


// ==========================================
// CLICK OUTSIDE CART
// ==========================================

cartOverlay.addEventListener(
    "click",
    closeCart
);


// ==========================================
// MOBILE NAVIGATION
// ==========================================

mobileButton.addEventListener(
    "click",
    function() {

        navLinks.classList.toggle("active");

    }
);


// ==========================================
// CHECKOUT
// ==========================================

checkoutButton.addEventListener(
    "click",
    function() {

        if (cart.length === 0) {

            alert(
                "Your cart is empty. Please add some food first."
            );

            return;

        }


        window.location.href = "checkout.html";

    }
);


// ==========================================
// INITIAL LOAD
// ==========================================

updateCart();
