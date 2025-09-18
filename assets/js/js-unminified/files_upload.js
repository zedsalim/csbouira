import { API_KEYS } from "./apikeys.js";

const cloudinaryConfig = {
  cloudName: "deoltrk6v",
  uploadPreset: "csb_upload",
};

document.getElementById("form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const fileInput = form.querySelector("#uploadfile");
  const files = fileInput.files;

  const fileLinksDiv = document.getElementById("response");
  const submitButton = document.getElementById("submit-upload");
  const spinner = document.getElementById("spinnerHidden");
  const alertsDiv = document.getElementById("alerts");

  fileLinksDiv.innerHTML = "";
  alertsDiv.innerHTML = "";
  submitButton.disabled = true;
  spinner.style.display = "inline-block";

  if (files.length === 0) {
    alertsDiv.innerHTML = `<div class="alert alert-warning" role="alert">
      لم تختر الملفات التي تريد رفعها
    </div>`;
    submitButton.disabled = false;
    spinner.style.display = "none";
    return;
  }

  let completedUploads = 0;
  const fileURLs = [];

  for (const file of files) {
    let resourceType = "raw";
    if (file.type.startsWith("image/")) resourceType = "image";
    else if (file.type.startsWith("video/")) resourceType = "video";

    const progressDiv = document.createElement("div");
    progressDiv.className = "progress my-1";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.style.width = "0%";
    progressDiv.appendChild(progressBar);
    fileLinksDiv.appendChild(progressDiv);

    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          progressBar.style.width = `${percent}%`;
          progressBar.setAttribute("aria-valuenow", percent.toFixed(0));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            fileURLs.push({ name: file.name, url: data.secure_url });
            alertsDiv.innerHTML = `<div class="alert alert-success" role="alert">
              تم رفع الملف "${file.name}" بنجاح!
            </div>`;
          } else {
            alertsDiv.innerHTML += `<div class="alert alert-danger">فشل رفع ${file.name}: ${
              data.error?.message || "خطأ غير معروف"
            }</div>`;
          }
        } else {
          alertsDiv.innerHTML += `<div class="alert alert-danger">فشل رفع ${file.name}</div>`;
        }
        resolve();
      };

      xhr.onerror = () => {
        alertsDiv.innerHTML += `<div class="alert alert-danger">خطأ في رفع ${file.name}</div>`;
        resolve();
      };

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", cloudinaryConfig.uploadPreset);
      xhr.send(uploadData);
    });

    completedUploads++;
  }

  if (completedUploads === files.length) {
    fileLinksDiv.innerHTML = "";
  }

  if (completedUploads === files.length) {
    const submissionData = new FormData();
    submissionData.append("name", formData.get("name"));
    submissionData.append("email", formData.get("email"));
    submissionData.append("module", formData.get("module"));
    submissionData.append("filetype", formData.get("filetype"));
    submissionData.append("grade", formData.get("grade"));
    submissionData.append("semestre", formData.get("semestre"));
    submissionData.append("fileLinks", JSON.stringify(fileURLs));

    try {
      const response = await fetch(API_KEYS.FILE_UPLOAD, {
        method: "POST",
        body: submissionData,
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      alertsDiv.innerHTML = `<div class="alert alert-success" role="alert">
        تم رفع جميع الملفات بنجاح! شكرا.
      </div>`;
      fileInput.value = "";
    } catch (error) {
      alertsDiv.innerHTML = `<div class="alert alert-danger" role="alert">
        خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى. ${error.message}
      </div>`;
    }
  }

  submitButton.disabled = false;
  spinner.style.display = "none";
});
