import { API_KEYS } from "./apikeys.js";

// Contact Us Form
const scriptURL = API_KEYS.CONTACT_US;
var form = document.forms["csb-contact-form"];
var submitButton = document.getElementById("submit-contact");
var spinner = submitButton ? submitButton.querySelector("span") : null;
var contactResult = document.getElementById("contact-result");
var resultMessage = contactResult ? contactResult.querySelector("strong") : null;

if (form && submitButton && spinner && contactResult && resultMessage) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    spinner.className = "spinner-border spinner-border-sm";
    fetch(scriptURL, { method: "POST", body: new FormData(form) })
      .then((response) => response.json())
      .then((response) => {
        if (response.result === "success") {
          contactResult.className = "alert alert-success mt-3";
          resultMessage.textContent = "تم الإرسال بنجاح";
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
} else {
  console.error("One or more form elements not found.");
}