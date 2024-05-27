export { toggleTitling, placeTitle, ititle };

import weave from "../src/weave.js";
import { manipulation } from "./manipulation.js";
import { showModalAndGet } from "./save.js";

const ititle = {
  text: ["ititle"],
  action: (ev) => {
    ev.preventDefault(); // To allow focusing on input
    ev.stopPropagation();
    const modal = document.getElementById("modal");
    if (modal.showing) {
      return;
    }
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    const currentTitle = manipulation.get(body, manipulation.fields.kTitle);
    titleToSelectedBodyFromSelection(currentTitle)
      .then(([title, body]) => {})
      .catch((error) => {
        console.error("Error resolving the title promise", error);
      });
  },
  description: "Add title to panel",
  el: "u",
};

const titleToSelectedBodyFromSelection = (currentTitle) => {
  const selection = window.getSelection() + "";
  if (selection.length > 0) {
    // Selection exists, proceed (synchronous)
    const title = selection;
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    manipulation.set(container, manipulation.fields.kTitle, title);
    return Promise.resolve([title, body]); // Wrap in a resolved promise
  }

  // No selection - asynchronous part
  const body = document.getElementById(weave.internal.bodyClicks[0]);
  const modal = document.getElementById("modal");
  modal.showing = true;
  const fileContainer = document.createElement("div");
  fileContainer.id = "fileContainer";
  modal.append(fileContainer);
  modal.value = currentTitle;
  // This block will be reused…
  return setTitleInBodyDataset(body, fileContainer);
};

const setTitleInBodyDataset = (body, fileContainer) => {
  const container = body.closest(".body-container");
  // Need filename from modal
  return new Promise((resolve) => {
    showModalAndGet(
      "title?",
      fileContainer,
      "name:",
      function (titleFromModal) {
        if (!titleFromModal) {
          return;
        }
        manipulation.set(container, manipulation.fields.kTitle, titleFromModal);
        resolve([titleFromModal, body]);
      },
      {
        dbsearching: false,
        filtering: true,
      }
    );
  });
};

const placeTitle = (container) => {
  const title = container.titleDiv;
  const tr = title.getBoundingClientRect();
  const x = manipulation.get(container, manipulation.fields.kX);
  const y = manipulation.get(container, manipulation.fields.kY);
  const w = manipulation.get(container, manipulation.fields.kWidth);
  manipulation.set(title, manipulation.fields.kWidth, w);
  manipulation.set(title, manipulation.fields.kX, x);
  manipulation.set(title, manipulation.fields.kY, y - 1.1 * tr.height);
  manipulation.reposition(title);
  manipulation.resize(title);
};

const toggleTitling = (container) => {
  Array.from(weave.containers()).forEach((c) => {
    c.titleDiv.classList.remove("show");
  });
  const title = manipulation.get(container, manipulation.fields.kTitle);
  if (title) {
    placeTitle(container);
    container.titleDiv.textContent = title;
    container.titleDiv.classList.add("show");
    setTimeout(function () {
      container.titleDiv.classList.remove("show");
    }, 2000);
  }
};
