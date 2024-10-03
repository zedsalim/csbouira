async function loadModules(year) {
  try {
    const response = await fetch("drive_hierarchy.json");
    const data = await response.json();

    const container = document.querySelector(".modules-container");
    const yearData = data[year];

    container.innerHTML = "";

    if (!yearData) {
      container.innerHTML = `
      <div class="container pt-5" dir="rtl">
      <div class="alert alert-warning fs-4" role="alert">${year} غير متاح حاليا</div>
      </div>`;
      return;
    }

    const section = document.createElement("section");
    section.classList.add("container", "pt-5");

    const heading = document.createElement("h2");
    heading.classList.add("text-center", "mb-5");
    heading.innerHTML = `
      <span class="text-primary"><i class="fa-solid fa-graduation-cap"></i></span>
      ${year}
    `;
    section.appendChild(heading);

    const semesterContainer = document.createElement("div");
    semesterContainer.classList.add("d-lg-flex", "gap-5");

    for (const semester in yearData) {
      const semesterData = yearData[semester];
      const semesterId = semester.replace(/\s+/g, "-");
      const semesterCard = document.createElement("div");
      semesterCard.classList.add(
        "card",
        "border-0",
        "shadow-lg",
        "rounded-4",
        "w-100",
        "mb-5"
      );
      semesterCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title text-center h3 text-primary pt-3 pb-2">
            <a class="link-offset-2 link-offset-3-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover" href="${
              semesterData.link
            }" target="_blank">${semester}</a>
            <div class="custom-hr"></div>
          </h5>
          <div class="card-text">
            <div class="accordion accordion-flush" id="accordionFlush-${semesterId}">
              ${generateModules(semesterData.subfolders, semesterId)}
            </div>
          </div>
        </div>
      `;
      semesterContainer.appendChild(semesterCard);
    }

    section.appendChild(semesterContainer);
    container.appendChild(section);
  } catch (error) {
    // console.error("Error loading JSON data:", error);
  }
}

function generateModules(modules, semesterId) {
  return Object.entries(modules)
    .map(
      ([moduleName, moduleData], index) => `
    <div class="accordion-item">
      <h2 class="accordion-header" id="flush-heading-${semesterId}-${index}">
        <button class="fs-5 accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse-${semesterId}-${index}" aria-expanded="false" aria-controls="flush-collapse-${semesterId}-${index}">
          ${moduleName}
        </button>
      </h2>
      <div id="flush-collapse-${semesterId}-${index}" class="accordion-collapse collapse" aria-labelledby="flush-heading-${semesterId}-${index}" data-bs-parent="#accordionFlush-${semesterId}">
        <div class="accordion-body">
          <ul class="list-group list-group-flush">
            ${generateSubModules(moduleData.subfolders)}
          </ul>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function generateSubModules(submodules) {
  return Object.entries(submodules)
    .map(
      ([subName, subData]) => `
    <li class="list-group-item">
      <a class="fs-5 link-offset-2 link-underline link-underline-opacity-0" href="${subData.link}" target="_blank">
        <i class="bi bi-file-earmark-text-fill me-2"></i>
        ${subName}
      </a>
    </li>
  `
    )
    .join("");
}

const year = document.getElementById("pageName").textContent;

loadModules(year);
