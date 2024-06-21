// Opacity for the navbar
// window.addEventListener("scroll", function () {
//   var navbar = document.querySelector(".navbar");
//   if (window.scrollY > 0) {
//     navbar.style.opacity = "0.95";
//   } else {
//     navbar.style.opacity = "1";
//   }
// });

// ---- Back to top button ----
let mybutton = document.getElementById("btn-back-to-top");
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.classList.add("show");
  } else {
    mybutton.classList.remove("show");
  }
}
mybutton.addEventListener("click", backToTop);

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// ---- Form Submition ----

// Contact Us Form
const scriptURL =
  "https://script.google.com/macros/s/AKfycbxzKTlh8C8QI9gbVmAI1smNS5dAi7ODB_z0phqQg92464uTvlYFuSkS5BtsE68-BuxhcQ/exec";
var form = document.forms["csb-contact-form"];
var submitButton = document.getElementById("submit-contact");
var spinner = submitButton.querySelector("span");
var contactResult = document.getElementById("contact-result");
var resultMessage = contactResult.querySelector("strong");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitButton.disabled = true;
  spinner.className = "spinner-border spinner-border-sm";
  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => response.json())
    .then((response) => {
      if (response.result === "success") {
        contactResult.className = "alert alert-success mt-3";
        resultMessage.textContent = "شكرا لك تم الإرسال بنجاح";
        form.reset();
      } else {
        throw new Error(response.error);
      }
    })
    .catch((error) => {
      console.error("خطأ في الإرسال!", error.message);
      contactResult.className = "alert alert-danger mt-3";
      resultMessage.textContent = "خطأ في الإرسال!";
    })
    .finally(() => {
      submitButton.disabled = false;
      spinner.className = "";
    });
});

// Upload files form
document.getElementById("uploadfile").addEventListener("change", function () {
  var file = this.files[0];
  var fr = new FileReader();
  fr.fileName = file.name;
  fr.onload = function (e) {
    var html =
      '<input type="hidden" name="data" value="' +
      e.target.result.replace(/^.*,/, "") +
      '" >';
    html += '<input type="hidden" name="mimetype" value="' + file.type + '" >';
    html += '<input type="hidden" name="filename" value="' + file.name + '" >';
    document.getElementById("data").innerHTML = html;
  };
  fr.readAsDataURL(file);
});

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  var formData = new FormData(document.getElementById("form"));
  var submitButton = document.getElementById("submit-upload");
  var spinner = submitButton.querySelector("span");
  submitButton.disabled = true;
  spinner.className = "spinner-border spinner-border-sm";

  var xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    "https://script.google.com/macros/s/AKfycbzJ7Imj-Oh7yu3pQk46UchrmRYtdINJ_-IArcwVjFgxQPG0d0sLcyx_HZiNhHyp7byalQ/exec",
  );

  xhr.onload = function () {
    var responseDiv = document.getElementById("response");
    responseDiv.innerHTML = "";
    responseDiv.className = "";

    if (xhr.status === 200) {
      try {
        var response = JSON.parse(xhr.responseText);
        if (response.result === "success") {
          responseDiv.classList.add("alert", "alert-success", "mt-3");
          responseDiv.innerHTML = "<strong>تم رفع الملف بنجاح</strong>";
        } else {
          responseDiv.classList.add("alert", "alert-danger", "mt-3");
          responseDiv.innerHTML = "<strong>خطأ في رفع الملف</strong>";
        }
      } catch (e) {
        responseDiv.classList.add("alert", "alert-danger", "mt-3");
        responseDiv.innerHTML =
          "<strong>خطأ في رفع الملف! يرجى مراسلتنا إن تكرر الخطأ</strong>";
      }
    } else {
      responseDiv.classList.add("alert", "alert-danger", "mt-3");
      responseDiv.innerHTML =
        "<strong>خطأ في رفع الملف! يرجى مراسلتنا إن تكرر الخطأ</strong>";
    }
    submitButton.disabled = false;
    spinner.className = "";
  };

  xhr.onerror = function () {
    var responseDiv = document.getElementById("response");
    responseDiv.classList.add("alert", "alert-danger", "mt-3");
    responseDiv.innerHTML =
      "<strong>خطأ في رفع الملف! يرجى مراسلتنا إن تكرر الخطأ</strong>";
    submitButton.disabled = false;
    spinner.className = "";
  };

  xhr.send(formData);
});

// ----- File Count id cards -----
fetch(
  "https://script.google.com/macros/s/AKfycbwrueSpr6LcL75-HFz6PozkJOE1nWNetrX6nAipnuMLupOfB33pdah5AF1NLNns6-mz/exec",
)
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("licence1").textContent = data.Licence1;
    document.getElementById("licence2").textContent = data.Licence2;
    document.getElementById("licence3").textContent = data.Licence3;
    document.getElementById("master1").textContent = data.Master1;
    document.getElementById("master2").textContent = data.Master2;
  })
  .catch((error) => console.error("Error:", error));
