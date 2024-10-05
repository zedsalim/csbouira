function createModal() {
  const closeCount =
    parseInt(localStorage.getItem("announcementCloseCount")) || 0;
  if (closeCount >= 2) {
    return;
  }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop fade show";

  const modal = document.createElement("div");
  modal.id = "announcementModal";
  modal.className = "modal fade";
  modal.tabIndex = -1;
  modal.setAttribute("aria-labelledby", "announcementModalLabel");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("data-bs-backdrop", "static");
  modal.setAttribute("data-bs-keyboard", "false");

  const modalDialog = document.createElement("div");
  modalDialog.className = "modal-dialog";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";
  const closeButton = document.createElement("button");
  closeButton.className = "btn-close";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.onclick = closeModal;

  modalHeader.appendChild(closeButton);

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";
  const bodyText = document.createElement("p");
  bodyText.setAttribute("dir", "rtl");
  bodyText.className = "fs-4";
  bodyText.textContent =
    "نبحث عن طلبة L1 للمساعدة في رفع ملفاتهم الدراسية. إذا كنت مهتمًا تواصل معنا.";
  modalBody.appendChild(bodyText);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";
  const closeBtnFooter = document.createElement("button");
  closeBtnFooter.className = "btn btn-danger text-white";
  closeBtnFooter.textContent = "Close";
  closeBtnFooter.onclick = closeModal;

  modalFooter.appendChild(closeBtnFooter);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modalDialog.appendChild(modalContent);
  modal.appendChild(modalDialog);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

function closeModal() {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("announcementModal")
  );
  modal.hide();
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.remove();
  }
  const modalElement = document.getElementById("announcementModal");
  if (modalElement) {
    modalElement.remove();
  }

  const closeCount =
    parseInt(localStorage.getItem("announcementCloseCount")) || 0;
  localStorage.setItem("announcementCloseCount", closeCount + 1);
}

document.addEventListener("DOMContentLoaded", createModal);
