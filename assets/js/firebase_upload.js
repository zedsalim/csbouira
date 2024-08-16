import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import firebaseConfig from "./apikeys.js";

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

document.getElementById("form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const fileInput = form.querySelector("#uploadfile");
  const files = fileInput.files;
  const fileLinksDiv = document.getElementById("response");
  const submitButton = document.getElementById("submit-upload");
  const spinner = document.getElementById("spinner-upload");
  const alertsDiv = document.getElementById("alerts");

  fileLinksDiv.innerHTML = "";
  alertsDiv.innerHTML = "";
  submitButton.disabled = true;
  spinner.style.display = "inline-block";

  if (files.length > 0) {
    let completedUploads = 0;
    let fileURLs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(storage, `CSB_Uploaded_Files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const progressDiv = document.createElement("div");
      progressDiv.className = "progress";
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";
      progressBar.setAttribute("role", "progressbar");
      progressBar.setAttribute("aria-valuenow", "0");
      progressBar.setAttribute("aria-valuemin", "0");
      progressBar.setAttribute("aria-valuemax", "100");
      progressBar.style.width = "0%";
      progressDiv.appendChild(progressBar);
      fileLinksDiv.appendChild(progressDiv);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute("aria-valuenow", progress.toFixed(0));
          },
          (error) => {
            alertsDiv.innerHTML = `<div class="alert alert-danger" role="alert">
                      خطأ في رفع هذا الملف "${file.name}". حاول مرة أخرى.
                    </div>`;
            reject(error);
          },
          async () => {
            try {
              const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
              fileURLs.push({ name: file.name, url: fileURL });

              alertsDiv.innerHTML = `<div class="alert alert-success" role="alert">
                        تم رفع الملف "${file.name}" بنجاح!
                      </div>`;
              resolve();
            } catch (error) {
              alertsDiv.innerHTML = `<div class="alert alert-danger" role="alert">
                        خطأ عند إسخراج الرابط الخاص بالملف "${file.name}". حاول مرة أخرى.
                      </div>`;
              reject(error);
            }
          }
        );
      });

      completedUploads++;
    }

    // Clear all progress bars
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

      fetch(
        "https://script.google.com/macros/s/AKfycbx6i-f_pqWu9zpY3kYfDSyP0JT9Dhve19yAr6O5quBTIClvh3hswYsEvflhLIJVMXqCpQ/exec",
        {
          method: "POST",
          body: submissionData,
        }
      )
        .then((response) => response.text())
        // .then((text) => {
        .then(() => {
          alertsDiv.innerHTML = `<div class="alert alert-success" role="alert">
        تم رفع الملفات بنجاح! ستصلكم رسالة شكر في الإيميل الخاص بكم.
      </div>`;
        })
        .catch((error) => {
          const alertsDiv = document.getElementById("alertsDiv");
          alertsDiv.innerHTML = `<div class="alert alert-danger" role="alert">
      Error: ${error.message}
      يرجى مراسلتنا عند ظهور هذا الخطأ.
    </div>`;
        });
    }
  } else {
    alertsDiv.innerHTML = `<div class="alert alert-warning" role="alert">
    لم تختر الملفات التي تريد رفعها
            </div>`;
  }

  submitButton.disabled = false;
  spinner.style.display = "none";
});
