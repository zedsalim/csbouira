// Opacity for the navbar
window.addEventListener("scroll", function () {
  var navbar = document.querySelector(".navbar");
  if (window.scrollY > 0) {
    navbar.style.opacity = "0.9";
  } else {
    navbar.style.opacity = "1";
  }
});
