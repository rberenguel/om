export {
  gsave,
  isave,
  ititle,
  save,
  saveAll_,
  showModalAndGetFilename,
};

import weave from "./weave.js";
import { common, enterKeyDownEvent } from "./commands_base.js";
import { set } from "./libs/idb-keyval.js";
import { toMarkdown } from "./parser.js";
import { presentFiles } from "./loadymcloadface.js";
import { manipulation } from "./panel.js";

const saveAll_ = {
  text: ["saveall"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    processFiles();
  },
  description:
    "Save the current changes and config in the URL, so it survives browser crashes",
  el: "u",
};

// TODO: this is now preventing save!
// TODO: the modal should be showable without searching for
// stuff in the files (should be optional)
function showModalAndGetFilename(placeholder, fileContainer, prefix, callback) {
  // prefix is for search field for lunr
  const inp = document.createElement("input");
  inp.classList.add("dark");
  inp.classList.add("search");
  inp.placeholder = placeholder;
  const loadInput = document.createElement("input");
  loadInput.classList.add("filename");
  const modal = document.getElementById("modal");
  modal.appendChild(inp);
  modal.appendChild(loadInput);
  modal.style.display = "block";
  inp.focus();
  inp.addEventListener("keydown", function (ev) {
    //ev.preventDefault();
    const searchString = inp.value;
    let results;
    try {
      results = weave.internal.idx
        .search(prefix + searchString)
        .map((r) => r.ref);
    } catch (err) {
      console.log("Lunar issue", err);
      results = [];
    }
    console.log(results);
    presentFiles(results, fileContainer);
    if (ev.key === "Enter") {
      loadInput.value = searchString;
      modal.innerHTML = "";
      loadInput.dispatchEvent(enterKeyDownEvent);
    }
    if (ev.key === "Escape") {
      modal.innerHTML = "";
      modal.style.display = "none";
      callback(null);
    }
  });
  loadInput.addEventListener("keydown", function (ev) {
    console.log(ev);
    if (ev.key === "Enter") {
      ev.preventDefault();
      const filename = loadInput.value;
      callback(filename);
      modal.style.display = "none";
      modal.innerHTML = "";
    }
  });
}

// This is for saving

const setFilenameInBodyDataset = (body, fileContainer) => {
  const container = body.closest(".body-container")
  if (manipulation.get(container, manipulation.fields.kFilename)) {
    const filename = manipulation.get(container, manipulation.fields.kFilename)
    return Promise.resolve([filename, body]);
  }

  // Need filename from modal
  return new Promise((resolve) => {
    showModalAndGetFilename(
      "filename?",
      fileContainer,
      "name:",
      function (filenameFromModal) {
        if (!filenameFromModal) {
          return;
        }
        manipulation.set(container, manipulation.fields.kFilename, filenameFromModal)
        resolve([filenameFromModal, body]);
      },
    );
  });
};

// TODO combine all these

const setTitleInBodyDataset = (body, fileContainer) => {
  const container = body.closest(".body-container")
  if (manipulation.get(container, manipulation.fields.kTitle)) {
    const title = manipulation.get(container, manipulation.fields.kTitle)
    return Promise.resolve([title, body]);
  }

  // Need filename from modal
  return new Promise((resolve) => {
    showModalAndGetFilename(
      "title?",
      fileContainer,
      "name:",
      function (titleFromModal) {
        if (!titleFromModal) {
          return;
        }
        manipulation.set(container, manipulation.fields.kTitle, titleFromModal)
        resolve([titleFromModal, body]);
      },
    );
  });
};


const titleToSelectedBodyFromSelection = () => {
  const selection = window.getSelection() + "";

  if (selection.length > 0) {
    // Selection exists, proceed (synchronous)
    const title = selection;
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    manipulation.set(container, manipulation.fields.kTitle, title)
    return Promise.resolve([title, body]); // Wrap in a resolved promise
  }

  // No selection - asynchronous part
  const body = document.getElementById(weave.internal.bodyClicks[0]);
  const modal = document.getElementById("modal");
  const fileContainer = document.createElement("div");
  fileContainer.id = "fileContainer";
  modal.append(fileContainer);
  // This block will be reused…
  return setTitleInBodyDataset(body, fileContainer);
};


const filenameToSelectedBodyFromSelection = () => {
  const selection = window.getSelection() + "";

  if (selection.length > 0) {
    // Selection exists, proceed (synchronous)
    const filename = selection;
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    manipulation.set(container, manipulation.fields.kFilename, filename)
    return Promise.resolve([filename, body]); // Wrap in a resolved promise
  }

  // No selection - asynchronous part
  const body = document.getElementById(weave.internal.bodyClicks[0]);
  const modal = document.getElementById("modal");
  const fileContainer = document.createElement("div");
  fileContainer.id = "fileContainer";
  modal.append(fileContainer);
  // This block will be reused…
  return setFilenameInBodyDataset(body, fileContainer);
};

const isave = {
  text: ["isave"],
  action: (ev) => {
    /*if (common(ev)) {
      return;
    }*/
    ev.preventDefault(); // To allow focusing on input
    ev.stopPropagation();
    filenameToSelectedBodyFromSelection()
      .then(([filename, body]) => {
        const saveString = btoa(encodeURIComponent(toMarkdown(body)));
        set(filename, saveString)
          .then(() => console.log("Data saved in IndexedDb"))
          .catch((err) => console.log("Saving in IndexedDb failed", err));
        info.innerHTML = "Saved";
        info.classList.add("fades");
      })
      .catch((error) => {
        console.error("Error resolving the filename promise", error);
      });
  },
  description: "Save a pane to IndexedDB",
  el: "u",
};

const ititle = {
  text: ["ititle"],
  action: (ev) => {
    /*if (common(ev)) {
      return;
    }*/
    ev.preventDefault(); // To allow focusing on input
    ev.stopPropagation();
    titleToSelectedBodyFromSelection()
      .then(([title, body]) => {})
      .catch((error) => {
        console.error("Error resolving the title promise", error);
      });
  },
  description: "Save a pane to IndexedDB",
  el: "u",
};


function processFiles() {
  let allFiles = [];
  let promiseChain = Promise.resolve(); // Start with a resolved promise
  const targets =
    weave.internal.group || Array.from(weave.bodies()).map((b) => b.id);
  for (const bodyId of targets) {
    const body = document.getElementById(bodyId);
    // Chain promises sequentially
    promiseChain = promiseChain
      .then(() => {
        const container = body.closest(".body-container")
        container.classList.add("highlighted");
        return setFilenameInBodyDataset(body).then(([filename, _]) => {
          const saveString = btoa(encodeURIComponent(toMarkdown(body)));
          allFiles.push(filename);
          body.closest(".body-container").classList.remove("highlighted");
          return set(filename, saveString);
        });
      })
      .then(() => {
        console.log("Data saved in IndexedDb");
      })
      .catch((err) => {
        console.error("Saving in IndexedDb failed", err);
      });
  }

  return promiseChain.then(() => {
    if (!weave.internal.group) {
      set("weave:last-session", "g:" + allFiles.join("|"))
        .then(() => console.log("Last session data saved in IndexedDB"))
        .catch((err) =>
          console.log("Last session data saving in IndexedDB failed", err),
        );
    }
    return allFiles;
  });
}

const gsave = {
  text: ["gsave"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    ev.preventDefault(); // To allow focusing on input
    if (!weave.internal.group || weave.internal.group.size == 0) {
      return;
    }
    // First make sure all panes are saved properly in processFiles
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    processFiles().then((allFiles) => {
      showModalAndGetFilename(
        "group name?",
        fileContainer,
        "name:",
        (groupname) => {
          if (!groupname) {
            return;
          }
          set(groupname, "g:" + allFiles.join("|"))
            .then(() => console.log("Group data saved in IndexedDb"))
            .catch((err) => console.log("Saving in IndexedDb failed", err));
          info.innerHTML = "&#x1F4BE;";
          info.classList.add("fades");
        },
      );
    });
  },
  description:
    "Save a group of panes to IndexedDB. There is no equivalent for file though",
  el: "u",
};

const save = {
  text: ["save", "💾"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    ev.preventDefault(); // To allow focusing on input
    filenameToSelectedBodyFromSelection()
      .then(([filename, body]) => {
        const saveString = btoa(encodeURIComponent(toMarkdown(body)));
        const downloadLink = document.createElement("a");
        const fileData = "data:application/json;base64," + saveString;
        console.log(saveString);
        downloadLink.href = fileData;
        downloadLink.download = filename;
        downloadLink.click();
      })
      .catch((error) => {
        console.error("Error resolving the filename promise", error);
      });
  },
  description: "Save a pane to disk, you won't be choosing where though",
  el: "u",
};

