// =====================================================
// MAMAKANANA'S SHISANYAMA
// MENU.JS
// =====================================================


// =====================================================
// SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL = "https://fzydikkscegqecdepxyl.supabase.co";

const SUPABASE_KEY = "sb_publishable_33Vwwv5EjoY41AyBW4a4kQ_dLXYm5LW";


const { createClient } = window.supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let cart =
    JSON.parse(
        localStorage.getItem("mamakananasCart")
    ) || [];


// =====================================================
// PAGE ELEMENTS
// =====================================================

const menuContainer =
    document.getElementById("menuContainer");

const cartCount =
    document.getElementById("cartCount");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartSidebar =
    document.getElementById("cartSidebar");

const cartOverlay =
    document.getElementById("cartOverlay");

const openCartButton =
    document.getElementById("openCart");

const closeCartButton =
    document.getElementById("closeCart");

const checkoutButton =
    document.getElementById("checkoutButton");

const mobileButton =
    document.getElementById("mobileButton");

const navLinks =
    document.getElementById("navLinks");


// =====================================================
// LOAD MENU FROM SUPABASE
// =====================================================

async function loadMenu() {

    try {

        const {
            data,
            error
        } = await db

            .from("menu_items")

            .select(`
                id,
                name,
                description,
                category,
                price,
                image_url,
                is_available
            `)

            .eq("is_available", true)

            .order("category", {
                ascending: true
            })

            .order("name", {
                ascending: true
            });


        if (error) {

            console.error(
                "Supabase menu error:",
                error
            );

            menuContainer.innerHTML = `
                <div class="error-message">

                    <h2>
                        Unable to load the menu
                    </h2>

                    <p>
                        Please try again later.
                    </p>

                </div>
            `;

            return;
        }


        if (!data || data.length === 0) {

            menuContainer.innerHTML = `
                <div class="error-message">

                    <h2>
                        Menu Coming Soon
                    </h2>

                    <p>
                        We are currently updating our menu.
                    </p>

                </div>
            `;

            return;
        }


        displayMenu(data);


    } catch (error) {

        console.error(error);

        menuContainer.innerHTML = `
            <div class="error-message">

                <h2>
                    Something went wrong
                </h2>

                <p>
                    Please refresh the page.
                </p>

            </div>
        `;

    }

}


// =====================================================
// DISPLAY MENU
// =====================================================

function displayMenu(items) {

    menuContainer.innerHTML = "";


    // Group products by category

    const categories = {};


    items.forEach(function(item) {

        if (!categories[item.category]) {

            categories[item.category] = [];

        }

        categories[item.category].push(item);

    });


    // Create category sections

    Object.keys(categories).forEach(function(category) {

        const categorySection =
            document.createElement("section");

        categorySection.className =
            "category";


        categorySection.innerHTML = `

            <h2 class="category-title">
                ${getCategoryIcon(category)}
                ${escapeHTML(category)}
            </h2>

            <div class="red-line"></div>

            <div class="food-grid"></div>

        `;


        const foodGrid =
            categorySection.querySelector(
                ".food-grid"
            );


        categories[category].forEach(function(item) {

            const card =
                createFoodCard(item);

            foodGrid.appendChild(card);

        });


        menuContainer.appendChild(
            categorySection
        );

    });


    // Attach Add To Cart buttons

    document
        .querySelectorAll(".add-cart")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const itemId =
                        button.dataset.id;

                    const item =
                        items.find(function(product) {

                            return product.id === itemId;

                        });


                    if (item) {

                        addToCart(item);

                    }

                }
            );

        });

}


// =====================================================
// CREATE FOOD CARD
// =====================================================

function createFoodCard(item) {

    const card =
        document.createElement("div");

    card.className =
        "food-card";


    let imageHTML;


    if (item.image_url) {

        imageHTML = `

            <img
                src="${escapeAttribute(item.image_url)}"
                alt="${escapeAttribute(item.name)}"
            >

        `;

    } else {

        imageHTML = `

            <span class="food-emoji">
                ${getFoodEmoji(item.category)}
            </span>

        `;

    }


    card.innerHTML = `

        <div class="food-image">

            ${imageHTML}

        </div>


        <div class="food-content">

            <h3>
                ${escapeHTML(item.name)}
            </h3>


            <p class="food-description">

                ${
                    item.description
                    ? escapeHTML(item.description)
                    : "Freshly prepared at Mamakanana's Shisanyama."
                }

            </p>


            <div class="food-bottom">

                <span class="price">

                    R${Number(item.price).toFixed(2)}

                </span>


                <button
                    class="add-cart"
                    data-id="${item.id}"
                >

                    Add to Cart

                </button>

            </div>

        </div>

    `;


    return card;

}


// =====================================================
// CATEGORY ICON
// =====================================================

function getCategoryIcon(category) {

    const name =
        category.toLowerCase();


    if (
        name.includes("meat") ||
        name.includes("grill")
    ) {

        return "🍖";

    }


    if (
        name.includes("side")
    ) {

        return "🍟";

    }


    if (
        name.includes("drink")
    ) {

        return "🥤";

    }


    if (
        name.includes("dessert")
    ) {

        return "🍰";

    }


    return "🍽️";

}


// =====================================================
// FOOD EMOJI
// =====================================================

function getFoodEmoji(category) {

    const name =
        category.toLowerCase();


    if (
        name.includes("meat") ||
        name.includes("grill")
    ) {

        return "🥩";

    }


    if (
        name.includes("side")
    ) {

        return "🍟";

    }


    if (
        name.includes("drink")
    ) {

        return "🥤";

    }


    return "🍽️";

}


// =====================================================
// ADD TO CART
// =====================================================

function addToCart(item) {

    const existingItem =
        cart.find(function(cartItem) {

            return cartItem.id === item.id;

        });


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({

            id: item.id,

            name: item.name,

            price: Number(item.price),

            quantity: 1

        });

    }


    saveCart();

    updateCart();

    openCart();

}


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

    localStorage.setItem(
        "mamakananasCart",
        JSON.stringify(cart)
    );

}


// =====================================================
// UPDATE CART
// =====================================================

function updateCart() {

    renderCart();

    updateCartCount();

}


// =====================================================
// UPDATE CART COUNT
// =====================================================

function updateCartCount() {

    let totalItems = 0;


    cart.forEach(function(item) {

        totalItems += item.quantity;

    });


    cartCount.textContent =
        totalItems;

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <p class="empty-cart">
                Your cart is empty.
            </p>

        `;

        cartTotal.textContent =
            "R0.00";

        return;

    }


    let total = 0;


    cart.forEach(function(item, index) {

        const itemTotal =
            item.price * item.quantity;


        total += itemTotal;


        const cartItem =
            document.createElement("div");

        cartItem.className =
            "cart-item";


        cartItem.innerHTML = `

            <div class="cart-item-top">

                <h3>
                    ${escapeHTML(item.name)}
                </h3>


                <button
                    class="remove-item"
                    data-index="${index}"
                >

                    Remove

                </button>

            </div>


            <div class="cart-item-bottom">

                <div class="quantity-controls">

                    <button
                        class="decrease"
                        data-index="${index}"
                    >

                        −

                    </button>


                    <span>
                        ${item.quantity}
                    </span>


                    <button
                        class="increase"
                        data-index="${index}"
                    >

                        +

                    </button>

                </div>


                <span class="cart-price">

                    R${itemTotal.toFixed(2)}

                </span>

            </div>

        `;


        cartItems.appendChild(cartItem);

    });


    cartTotal.textContent =
        "R" + total.toFixed(2);


    attachCartEvents();

}


// =====================================================
// CART EVENTS
// =====================================================

function attachCartEvents() {


    // INCREASE

    document
        .querySelectorAll(".increase")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        Number(button.dataset.index);


                    cart[index].quantity++;


                    saveCart();

                    updateCart();

                }
            );

        });


    // DECREASE

    document
        .querySelectorAll(".decrease")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        Number(button.dataset.index);


                    if (
                        cart[index].quantity > 1
                    ) {

                        cart[index].quantity--;

                    } else {

                        cart.splice(index, 1);

                    }


                    saveCart();

                    updateCart();

                }
            );

        });


    // REMOVE

    document
        .querySelectorAll(".remove-item")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        Number(button.dataset.index);


                    cart.splice(index, 1);


                    saveCart();

                    updateCart();

                }
            );

        });

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

    cartSidebar.classList.add(
        "active"
    );

    cartOverlay.classList.add(
        "active"
    );

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

    cartSidebar.classList.remove(
        "active"
    );

    cartOverlay.classList.remove(
        "active"
    );

}


// =====================================================
// CART BUTTON
// =====================================================

openCartButton.addEventListener(
    "click",
    openCart
);


// =====================================================
// CLOSE CART
// =====================================================

closeCartButton.addEventListener(
    "click",
    closeCart
);


// =====================================================
// CLICK OUTSIDE CART
// =====================================================

cartOverlay.addEventListener(
    "click",
    closeCart
);


// =====================================================
// MOBILE MENU
// =====================================================

mobileButton.addEventListener(
    "click",
    function() {

        navLinks.classList.toggle(
            "active"
        );

    }
);


// =====================================================
// CHECKOUT
// =====================================================

checkoutButton.addEventListener(
    "click",
    function() {

        if (cart.length === 0) {

            alert(
                "Your cart is empty. Please add something first."
            );

            return;

        }


        window.location.href =
            "checkout.html";

    }
);


// =====================================================
// HTML SECURITY HELPERS
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


// =====================================================
// START
// =====================================================

loadMenu();

updateCart();
