import { loadAllFromGroup } from "./loadymcloadface.js";

// Can't import from dom due to circular dependency?
import weave from "./weave.js";
import { createPanel } from "./doms.js";
import { iloadIntoBody } from "./loadymcloadface.js";
import { entries } from "./libs/idb-keyval.js";
import { manipulation } from "./panel.js";
import { enableSelectionOnAll, disableSelectionOnAll } from "./internal.js";
// Globals that are used everywhere

// Helper for inline code

let $ = {
  cel: (s) => document.createElement(s),
  ctn: (s) => document.createTextNode(s),
  byId: (s) => document.getElementById(s),
  qs: (s) => document.querySelector(s),
};

weave.root = "content";

document.isDragging = false;

document.addEventListener("mousemove", (event) => {
  if (document.isDragging) {
    event.preventDefault();
  }
});

document.addEventListener("mouseup", () => {
  document.isDragging = false;
});

window.weave = weave;
window.w = window.weave;

const urlParams = new URLSearchParams(window.location.search);
const gloadParam = urlParams.get("gload");
const iloadParam = urlParams.get("iload");


entries().then((entries) => {
  let docs = [];
  for (const [filename, value] of entries) {
    if (value.startsWith("g:")) {
      continue;
    }
    const text = decodeURIComponent(atob(value));
    docs.push({ name: filename, filename: filename, text: text });
  }
  weave.internal.idx = lunr(function () {
    this.ref("filename");
    this.field("name");
    this.field("text");

    docs.forEach(function (doc) {
      this.add(doc);
    }, this);
  });
});

interact(document.body).draggable({
  inertia: true,
  ignoreFrom: ".body-container",
  listeners: {
    start(event){
      disableSelectionOnAll()
    },
    move(event) {
      event.preventDefault()
      event.stopPropagation()
      const body = document.body;
      const containers = document.getElementsByClassName("body-container")
      let scale = parseFloat(body.dataset.scale || 1);
      for(const container of containers){
        let x = manipulation.get(container, manipulation.fields.kX)
        let y = manipulation.get(container, manipulation.fields.kY)
        x += Math.floor(event.dx*scale*2);
        y += Math.floor(event.dy*scale*2);
        manipulation.set(container, manipulation.fields.kX, x)
        manipulation.set(container, manipulation.fields.kY, y)
        manipulation.reposition(container)
      }
    },
    end(event){
      enableSelectionOnAll()
    },
  },
});

document.body.addEventListener("wheel", (event) => {
  const body = document.getElementById(weave.root);
  if (event.target.classList.contains("body")) {
    return;
  }
  event.preventDefault()
  let x = parseFloat(body.dataset.x || 0);
  let y = parseFloat(body.dataset.y || 0);
  const sign = Math.sign(event.deltaY);
  
  let scale = parseFloat(body.dataset.scale || 1);
  const zoomDelta = scale/50;
  const transformed = Math.log(Math.abs(event.deltaY)) * zoomDelta;
  if (sign < 1) {
    scale = Math.abs(scale + transformed);
    body.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  } else {
    scale = Math.abs(scale - transformed);
    body.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
  body.dataset.scale = scale;
});

if (gloadParam) {
  try {
    loadAllFromGroup(gloadParam)
      .then()
      .catch((err) => {
        console.log("Could not load from url", err);
        weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
      });
  } catch (err) {}
} else {
  if (iloadParam) {
    createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
    const n = weave.bodies().length;
    const bodyId = `b${n}`; // TODO NO, this is not good enough
    createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
    const body = document.getElementById(bodyId);
    console.log(iloadParam);
    iloadIntoBody(iloadParam, body);
  } else {
    loadAllFromGroup("weave:last-session")
      .then()
      .catch((err) => {
        console.log("Could not load from previous session", err);

        weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
      });
  }
}
