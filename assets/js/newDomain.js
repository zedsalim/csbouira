document.addEventListener("DOMContentLoaded", function () {
  if (window.location.hostname === "csbouira.netlify.app") {
    var modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "domainModal";
    modalDiv.tabIndex = "-1";
    modalDiv.setAttribute("aria-labelledby", "domainModalLabel");
    modalDiv.setAttribute("aria-hidden", "true");

    modalDiv.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title ms-auto" dir="rtl" id="domainModalLabel">تحديث !</h4>
            </div>
            <div dir="rtl" class="modal-body fs-3 text-center">
              تم نقل الموقع إلى نطاق جديد <a class="link-offset-2 link-offset-3-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover" href="https://csbouira.xyz">csbouira.xyz</a>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>`;

    document.body.appendChild(modalDiv);

    var domainModal = new bootstrap.Modal(
      document.getElementById("domainModal"),
      {
        backdrop: "static",
        keyboard: false,
      }
    );

    domainModal.show();
  }
});
