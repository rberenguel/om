export { iload, iloadIntoBody, presentFiles, gload, loadAllFromGroup };

import weave from "./weave.js";
import { get, entries } from "./libs/idb-keyval.js";
import { showModalAndGetFilename } from "./save.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { parseIntoWrapper } from "./parser.js";
import { wireEverything } from "./load.js";
import { createPanel } from "./doms.js";

const iloadIntoBody = (filename, body) => {
  console.log(filename);
  get(filename).then((filecontent) => {
    console.info("Loaded from IndexedDb");
    console.log(filecontent);
    console.log(atob(filecontent));
    console.log(decodeURIComponent(atob(filecontent)));
    parseIntoWrapper(decodeURIComponent(atob(filecontent)), body);
    wireEverything(weave.buttons(weave.root));
  });
};

const presentFiles = (files, container) => {
  const modal = document.getElementById("modal");
  container.innerHTML = "";
  for (const file of files) {
    const k = document.createTextNode(file);
    const div = document.createElement("div");
    div.classList.add("hoverable");
    div.appendChild(k);
    container.appendChild(div);
    div.addEventListener("click", (ev) => {
      const inp = document.querySelector("input.filename");
      inp.value = file;
      modal.innerHTML = "";
      inp.dispatchEvent(enterKeyDownEvent);
    });
  }
};

const iload = {
  text: ["iload"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const files = entries
        .filter(([key, value]) => !value.startsWith("g:"))
        .map(([key, value]) => key);
      console.log(files);
      presentFiles(files, fileContainer);
      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGetFilename("filename?", fileContainer, "", (filename) => {
        if (!filename) {
          return;
        }
        console.info(`Loading ${filename} from IndexedDB`);
        iloadIntoBody(filename, body);
      });
    });
  },
  description: "???",
  el: "u",
};

const gload = {
  text: ["gload"],
  action: (ev) => {
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const files = entries
        .filter(([key, value]) => value.startsWith("g:"))
        .map(([key, value]) => key);
      console.log(files);
      presentFiles(files, fileContainer);
      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGetFilename(
        "group name?",
        fileContainer,
        "name:",
        (groupname) => {
          if (!groupname) {
            return;
          }
          loadAllFromGroup(groupname);
        },
      );
    });
    ev.target.closest(".body-container").remove();
  },
  description: "Load a group of panes",
  el: "u",
};

const loadAllFromGroup = (groupname) => {
  let throwing;
  return get(groupname)
    .then((groupcontent) => {
      console.log(groupcontent);
      const files = groupcontent.substring(2).split("|");
      let n = weave.bodies().length;
      for (const filename of files) {
        const bodyId = `b${n}`; // TODO NO, this is not good enough
        createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
        const body = document.getElementById(bodyId);
        n += 1;
        console.info(`Loading ${filename} from IndexedDB`);
        get(filename).then((filecontent) => {
          console.info("Loaded from IndexedDb");
          //loadFromContent(atob(filecontent), filename, body);
          parseIntoWrapper(decodeURIComponent(atob(filecontent)), body);
          wireEverything(weave.buttons(weave.root));
        });
        //const container = body.closest(".body-container")

        wireEverything(weave.buttons(weave.root));
      }
    })
    .catch((err) => {
      console.log("Loading group from IndexedDb failed", err);
      throwing = err;
      console.log(throwing);
      throw err;
    });
};
