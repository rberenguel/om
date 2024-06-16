export { gsave, isave, save, saveAll_, showModalAndGet, exportCurrent, dbdump };

import weave from "./weave.js";
import { common, enterKeyDownEvent } from "./commands_base.js";
import { set, entries } from "./libs/idb-keyval.js";
import { toMarkdown } from "./parser.js";
import { presentFiles } from "./loadymcloadface.js";
import { manipulation } from "./manipulation.js";
import { convertNonGroupFileData } from "./loadymcloadface.js";

const dbdump = {
  text: ["dbdump", "dumpdb"],
  action: (ev) => {
    entries().then((entries) => {
      let lines = [];
      for (const [key, value] of entries) {
        lines.push(`- ${key}: ${value}`);
      }
      const fileBlob = new Blob([lines.join("\n")], {
        type: "application/octet-stream;charset=utf-8",
      });
      const url = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "weave.db";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  },
  description: "Copy whole database to clipboard",
  el: "u",
};

const exportCurrent = {
  text: ["export"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    const saveString = btoa(encodeURIComponent(toMarkdown(body)));
    const filename = manipulation.get(container, manipulation.fields.kFilename);
    const title = manipulation.get(container, manipulation.fields.kTitle);
    const exportLine = `- ${filename}: ${title} ${saveString}`;
    const text = new ClipboardItem({
      "text/plain": Promise.resolve(exportLine).then(
        (text) => new Blob([text], { type: "text/plain" }),
      ),
    });
    console.log(text);
    navigator.clipboard
      .write([text])
      .then(() => console.info("Copied successfully"))
      .catch((err) => console.error(err));
  },
  description: "Copy current document as an export line",
  el: "u",
};

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

// TODO: the modal should be showable without searching for
// stuff in the files (should be optional)
function showModalAndGet(
  placeholder,
  fileContainer,
  prefix,
  callback,
  options = {},
) {
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
  inp.addEventListener("blur", (ev) => {
    console.log("blurred");
    setTimeout(() => {
      modal.innerHTML = "";
      modal.style.display = "none";
      modal.showing = false;
      callback(null);
    }, 150);
  });

  const getPresented = () => {
    const divs = modal.querySelectorAll(".hoverable");
    const infos = Array.from(divs).map((d) => {
      return {
        key: d.dataset.filekey,
        title: d.dataset.filetitle,
      };
    });
    return infos;
  };

  inp.addEventListener("keyup", function (ev) {
    console.log("keyed up");
    const searchString = inp.value;
    let results = [];
    console.log("Refreshing presentation");
    if (modal.originalFileset && ev.key === "Backspace") {
      presentFiles(modal.originalFileset, fileContainer);
    }
    if (options.dbsearching) {
      console.log(`dbsearching, searchstring: "${searchString}"`);
      try {
        // Dirtiest hack I have ever done: bypass includes if there is no search term
        let keys = [];
        keys.includes = (a) => true;
        if (searchString !== "") {
          const search = weave.internal.idx.search(prefix + searchString);
          console.log(search);
          keys = search.map((r) => r.ref);
        }

        entries().then((entries) => {
          const filterOut = options.filterOutKeys || "";
          const files = entries
            .filter(
              ([key, value]) =>
                value &&
                !value.startsWith("g:") &&
                !key.startsWith("d") &&
                !filterOut.includes(key[0]) &&
                keys.includes(key),
            )
            .map(([key, value]) => convertNonGroupFileData(key, value));
          console.log(keys, files);
          presentFiles(files, fileContainer);
        });
        //results = search.map((r) => {
        //return { key: r.ref, title: weave.internal.fileTitles[r.ref] };
        //});
      } catch (err) {
        console.error("Lunar issue:");
        console.error(err);
        presentFiles([], fileContainer);
      }
    }
    if (options.filtering) {
      console.log("filtering");
      const regex = new RegExp(`.*?${searchString}.*?`, "i");
      const infos = getPresented();
      const results = infos.filter((d) => regex.test(d.title));
      presentFiles(results, fileContainer);
    }
    if (ev.key === "Enter") {
      const infos = getPresented();
      if (infos.length === 1) {
        loadInput.value = infos[0].key;
      } else {
        loadInput.value = searchString;
      }
      modal.innerHTML = "";
      loadInput.dispatchEvent(enterKeyDownEvent);
    }
    if (ev.key === "Escape") {
      modal.innerHTML = "";
      modal.style.display = "none";
      modal.showing = false;
      callback(null);
    }
  });
  loadInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();

      const filename = loadInput.value;
      console.log(filename);
      callback(filename);
      // TODO The following likely never runs
      modal.style.display = "none";
      modal.showing = false;
      modal.innerHTML = "";
    }
  });
}

// This is for saving

const setFilenameInBodyDataset = (body, fileContainer) => {
  const container = body.closest(".body-container");
  if (manipulation.get(container, manipulation.fields.kFilename)) {
    const filename = manipulation.get(container, manipulation.fields.kFilename);
    return Promise.resolve([filename, body]);
  }

  // Need filename from modal
  return new Promise((resolve) => {
    showModalAndGet(
      "filename?",
      fileContainer,
      "name:",
      function (filenameFromModal) {
        if (!filenameFromModal) {
          return;
        }
        manipulation.set(
          container,
          manipulation.fields.kFilename,
          filenameFromModal,
        );
        resolve([filenameFromModal, body]);
      },
      { dbsearching: true },
    );
  });
};

// TODO combine all these

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
      { dbsearching: true },
    );
  });
};

const filenameToSelectedBodyFromSelection = () => {
  const selection = window.getSelection() + "";

  if (selection.length > 0) {
    // Selection exists, proceed (synchronous)
    const filename = selection;
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    manipulation.set(container, manipulation.fields.kFilename, filename);
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
    if (common(ev)) {
      return;
    }
    ev.preventDefault(); // To allow focusing on input
    ev.stopPropagation();
    filenameToSelectedBodyFromSelection()
      .then(([filename, body]) => {
        const content = btoa(encodeURIComponent(toMarkdown(body)));
        const title = manipulation.get(body, manipulation.fields.kTitle);
        const saveString = `${title} ${content}`;
        console.log(`Saving with a title`);
        set(filename, saveString)
          .then(() => console.info("Data saved in IndexedDb"))
          .catch((err) => console.info("Saving in IndexedDb failed", err));
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
        const container = body.closest(".body-container");
        container.classList.add("highlighted");
        return setFilenameInBodyDataset(body).then(([filename, _]) => {
          const saveString = btoa(encodeURIComponent(toMarkdown(body)));
          allFiles.push(filename);
          body.closest(".body-container").classList.remove("highlighted");
          return set(filename, saveString);
        });
      })
      .then(() => {
        console.info("Data saved in IndexedDb");
      })
      .catch((err) => {
        console.error("Saving in IndexedDb failed", err);
      });
  }

  return promiseChain.then(() => {
    if (!weave.internal.group) {
      set("weave:last-session", "g:" + allFiles.join("|"))
        .then(() => console.info("Last session data saved in IndexedDB"))
        .catch((err) =>
          console.info("Last session data saving in IndexedDB failed", err),
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
      showModalAndGet(
        "group name?",
        fileContainer,
        "name:",
        (groupname) => {
          if (!groupname) {
            return;
          }
          set(groupname, "g:" + allFiles.join("|"))
            .then(() => console.info("Group data saved in IndexedDb"))
            .catch((err) => console.info("Saving in IndexedDb failed", err));
          info.innerHTML = "&#x1F4BE;";
          info.classList.add("fades");
        },
        { dbsearching: true },
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
