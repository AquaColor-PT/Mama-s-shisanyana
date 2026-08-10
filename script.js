// ==========================================
// MOBILE NAVIGATION
// ==========================================

const mobileButton = document.getElementById("mobileButton");
const navLinks = document.getElementById("navLinks");

if (mobileButton && navLinks) {

    mobileButton.addEventListener("click", function () {

        navLinks.classList.toggle("active");

    });

}


// ==========================================
// CLOSE MOBILE MENU WHEN LINK IS CLICKED
// ==========================================

const links = document.querySelectorAll(".nav-links a");

links.forEach(function(link) {

    link.addEventListener("click", function() {

        if (navLinks) {
            navLinks.classList.remove("active");
        }

    });

});
