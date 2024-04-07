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

console.log("wtf");
console.log(weave);

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
    start(event) {
      disableSelectionOnAll();
    },
    move(event) {
      event.preventDefault();
      event.stopPropagation();
      const body = document.body;
      const containers = document.getElementsByClassName("body-container");
      let scale = parseFloat(body.dataset.scale || 1);
      let x = manipulation.get(body, manipulation.fields.kX);
      let y = manipulation.get(body, manipulation.fields.kY);
      let deltaX = ((event.dx * 1) / scale);
      let deltaY = ((event.dy * 1) / scale);
      if (body.dataset.stickyX > 0) {
        deltaX = 0;
        body.dataset.stickyX -= 1;
        const vl = document.getElementById("vertical-line");
        vl.style.display = "block";
        vl.style.width = 2 / scale;
        vl.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        const vl = document.getElementById("vertical-line");
        vl.style.display = "none";
      }
      if (body.dataset.stickyY > 0) {
        deltaY = 0;
        body.dataset.stickyY -= 1;
        const hl = document.getElementById("horizontal-line");
        hl.style.display = "block";
        hl.style.height = 2 / scale;
        hl.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        const hl = document.getElementById("horizontal-line");
        hl.style.display = "none";
      }
      const nx = x + deltaX;
      const ny = y + deltaY;
      if ((1 - x) * (1 - nx) < 0) {
        deltaX = 0;
        body.dataset.stickyX = 20;
      }
      if ((1 - y) * (1 - ny) < 0) {
        deltaY = 0;
        body.dataset.stickyY = 20;
      }

      manipulation.set(body, manipulation.fields.kX, nx);
      manipulation.set(body, manipulation.fields.kY, ny);

      for (const container of containers) {
        let x = manipulation.get(container, manipulation.fields.kX);
        let y = manipulation.get(container, manipulation.fields.kY);
        x += deltaX;
        y += deltaY;
        manipulation.set(container, manipulation.fields.kX, x);
        manipulation.set(container, manipulation.fields.kY, y);
        manipulation.reposition(container);
      }
    },
    end(event) {
      enableSelectionOnAll();
    },
  },
});

interact(document.body).gesturable({
  listeners: {
    move(ev) {
      const body = document.getElementById(weave.root);
      if (ev.target.classList.contains("body")) {
        return;
      }
      if (body.dataset.sticky > 0) {
        body.dataset.sticky -= 1;
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();

      let scale = parseFloat(body.dataset.scale || 1);
      if (Math.abs(scale - 1) < 1e-8 && Math.abs(ev.distance) < 150) {
        return;
      }
      const zoomDelta = scale / 80;
      const transformed = Math.log(Math.abs(ev.scale)) * zoomDelta;
      const prev = scale;
      scale = Math.abs(scale + transformed);
      if ((1 - scale) * (1 - prev) < 0) {
        console.log("Fixing");
        scale = 1;
        body.dataset.sticky = 80;
      }
      body.style.transform = `scale(${scale})`;
      body.dataset.scale = scale;
    },
  },
});

document.body.addEventListener("wheel", (event) => {
  const body = document.body;
  const content = document.getElementById(weave.root);
  console.log("wheel");
  console.log(event);
  if (event.target.id != weave.root) {
    console.log("Skipping wheel");
    return;
  }
  event.preventDefault();
  if (body.dataset.sticky > 0) {
    body.dataset.sticky -= 1;
    return;
  }
  let x = parseFloat(body.dataset.x || 0);
  let y = parseFloat(body.dataset.y || 0);
  const sign = Math.sign(event.deltaY);

  let scale = parseFloat(body.dataset.scale || 1);
  const zoomDelta = scale / 50;
  const transformed = Math.log(Math.abs(event.deltaY)) * zoomDelta;
  const prev = scale;
  if (sign < 1) {
    scale = Math.abs(scale + transformed);
    if ((1 - scale) * (1 - prev) < 0) {
      scale = 1;
      body.dataset.sticky = 10;
    }
    content.style.transform = `scale(${scale})`;
  } else {
    scale = Math.abs(scale - transformed);
    if ((1 - scale) * (1 - prev) < 0) {
      scale = 1;
      body.dataset.sticky = 10;
    }
    content.style.transform = `scale(${scale})`;
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
