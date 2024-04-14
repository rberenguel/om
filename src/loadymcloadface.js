export { loadRow, iload, iloadIntoBody, presentFiles, gload, loadAllFromGroup };

import weave from "./weave.js";
import { set, get, entries } from "./libs/idb-keyval.js";
import { showModalAndGetFilename } from "./save.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { getPropertiesFromFile, parseIntoWrapper } from "./parser.js";
import { manipulation } from "./panel.js";
import { wireEverything } from "./load.js";
import { createPanel } from "./doms.js";

const loadRow = (row) => {
  const splits = row.split(" ");
  const filename = splits[1].slice(0, -1);
  const data = splits[2];
  return set(filename, data)
    .then(() => {
      console.log(`Data for ${filename} stored in IndexedDb`)
      return Promise.resolve(filename)
    })
    .catch((err) =>
      console.log(`Saving in IndexedDb failed for ${filename}`, err),
    );
}


const iloadIntoBody = (filename, body) => {
  get(filename).then((filecontent) => {
    console.info("Loaded from IndexedDb");
    console.info("About to parse")
    parseIntoWrapper(decodeURIComponent(atob(filecontent)), body);
    const paddingDiv = document.createElement("DIV")
    paddingDiv.id = "padding"
    paddingDiv.innerHTML = "&nbsp;" // This preserves the cursor
    body.appendChild(paddingDiv) // To allow a place for the cursor at the end
    console.info("About to wire")
    wireEverything(weave.buttons(weave.root));
  }).catch((err) => {
    console.log("There was an unexpected error in loading")
    console.log(err)
    throw err;
  });
};

const presentFiles = (files, container) => {
  console.log("Presenting")
  console.log(files)
  const modal = document.getElementById("modal");
  container.innerHTML = "";
  for (const file of files) {
    const key = file["key"]
    const value = file["value"]
    let title = key
    if(value && !value.startsWith("g:")){
      const decoded = decodeURIComponent(atob(value))
      const properties =  getPropertiesFromFile(decoded)
      const fileTitle = properties[manipulation.fields.kTitle]
      if(fileTitle){
        title = fileTitle
      }
    } else {
      title = file["title"]
      // And if this fails something broke
    }
    const k = document.createTextNode(title);
    const div = document.createElement("div");
    div.classList.add("hoverable");
    div.appendChild(k);
    container.appendChild(div);
    div.addEventListener("click", (ev) => {
      const inp = document.querySelector("input.filename");
      inp.value = key;
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
        .map(([key, value]) => {return {key: key, value: value}});
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
        .map(([key, value]) => { return {key: key, value: value}});
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
          const paddingDiv = document.createElement("DIV")
          paddingDiv.id = "padding"
          paddingDiv.innerHTML = "&nbsp;" // This preserves the cursor
          body.appendChild(paddingDiv) // To allow a place for the cursor at the end
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
