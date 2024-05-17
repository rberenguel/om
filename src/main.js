import weave from "./weave.js";

import { entries } from "./libs/idb-keyval.js";
import {
  loadAllFromGroup,
  convertNonGroupFileData,
} from "./loadymcloadface.js";
import { createPanel, split } from "./panel.js";
import { iloadIntoBody } from "./loadymcloadface.js";
import { dbdump } from "./save.js";
import { getPropertiesFromFile } from "./parser.js";
import { manipulation } from "./manipulation.js";
import { enableSelectionOnAll, disableSelectionOnAll } from "./internal.js";
import { presentFiles } from "./loadymcloadface.js";
import { showModalAndGet } from "./save.js";
import { toTop } from "./doms.js";

// Globals that are used everywhere
const DEBUG = false;
// Helper for inline code

let $ = {
  cel: (s) => document.createElement(s),
  ctn: (s) => document.createTextNode(s),
  byId: (s) => document.getElementById(s),
  qs: (s) => document.querySelector(s),
};

if (DEBUG) console.log(weave);

weave.root = "content";
weave.canvas = "canvas";

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

// TODO this should be re-run every time we save
entries()
  .then((entries) => {
    let docs = [];
    for (const [k, v] of entries) {
      if (v && v.startsWith("g:")) {
        continue;
      }
      const { key, value } = convertNonGroupFileData(k, v);
      // Don't care about the database title here, only real content title
      try {
        const text = decodeURIComponent(atob(value));
        const properties = getPropertiesFromFile(text);
        if (DEBUG) console.debug(properties);
        const title = properties[manipulation.fields.kTitle];
        console.info(`Adding ${key} (${title}) to index`);
        docs.push({ name: title, filename: key, title: title, text: text });
        weave.internal.fileTitles[key] = title;
      } catch (err) {
        console.error(`Failed loading ${key}, ${value} (${k}, ${v})`);
        console.error(err);
      }
    }
    if (DEBUG) console.log(docs);
    weave.internal.idx = lunr(function () {
      this.ref("filename");
      this.field("name");
      this.field("text");

      docs.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
  })
  .catch((err) => console.error(err));

document.body.addEventListener("touchstart", function (event) {
  if (event.touches.length === 2) {
    document.body.twoFingerStartX = event.touches[0].clientX;
    document.body.twoFingerStartY = event.touches[0].clientY;
    document.body.oneFingerStartX = undefined;
    document.body.oneFingerStartY = undefined;
  } else {
    document.body.twoFingerStartX = undefined;
    document.body.twoFingerStartY = undefined;
  }
});
document.body.addEventListener("touchend", function (event) {
  document.body.endX = event.changedTouches[0].clientX;
  document.body.endY = event.changedTouches[0].clientY;
  // TODO it can collide with pinch-for-zoom, how could I prevent that?
  if (document.body.twoFingerStartX) {
    if (DEBUG) console.log(event);
    const deltaX = document.body.endX - document.body.twoFingerStartX;
    const deltaY = document.body.endY - document.body.twoFingerStartY;
    const nrm = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (DEBUG) console.log(deltaX, deltaY, nrm);
    if (Math.abs(deltaX) < 20 && deltaY > 0 && nrm > 250) {
      if (DEBUG) console.info("dbdumping");
      dbdump.action();
    }
    if (Math.abs(deltaX) < 20 && deltaY < 0 && nrm > 250) {
      // Ideally this would be dbload, but seems like Safari doesn't like this
    }
  }
});

interact(document.body).draggable({
  inertia: true,
  ignoreFrom: ".body-container",
  listeners: {
    start(event) {
      disableSelectionOnAll();
    },
    over(event) {
      console.log("Arrowing");
    },
    move(event) {
      event.preventDefault();
      event.stopPropagation();
      const body = document.body;
      const containers = document.getElementsByClassName("body-container");
      let scale = parseFloat(body.dataset.scale || 1);
      let x = manipulation.get(body, manipulation.fields.kX);
      let y = manipulation.get(body, manipulation.fields.kY);
      let deltaX = (event.dx * 1) / scale;
      let deltaY = (event.dy * 1) / scale;
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

      // Translate all panels according to the current drag of the body
      for (const container of containers) {
        let x = manipulation.get(container, manipulation.fields.kX);
        let y = manipulation.get(container, manipulation.fields.kY);
        x += deltaX;
        y += deltaY;
        manipulation.set(container, manipulation.fields.kX, x);
        manipulation.set(container, manipulation.fields.kY, y);
        manipulation.reposition(container);
      }
      // Translate all arrows likewise
      for (const arrow of weave.internal.arrows) {
        const arr = document.getElementById(arrow);
        let x, y;
        if (arr.dataset.x) {
          x = parseFloat(arr.dataset.x);
        } else {
          x = 0;
        }
        if (arr.dataset.y) {
          y = parseFloat(arr.dataset.y);
        } else {
          y = 0;
        }
        x += deltaX;
        y += deltaY;
        manipulation.set(arr, manipulation.fields.kX, x);
        manipulation.set(arr, manipulation.fields.kY, y);
        manipulation.reposition(arr);
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
      if (ev.target.id != weave.root && event.target.id != weave.canvas) {
        console.info(`Skipping pinch on ${ev.target.id}`);
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
        body.dataset.sticky = 150;
      }
      body.style.transform = `scale(${scale})`;
      body.dataset.scale = scale;
    },
  },
});

document.body.addEventListener(
  "wheel",
  (event) => {
    const body = document.body;
    const content = document.getElementById(weave.root);
    if (DEBUG) {
      console.log("wheel");
      console.log(event);
    }
    if (event.target.id != weave.root && event.target.id != weave.canvas) {
      if (DEBUG) console.log("Skipping wheel");
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
  },
  { passive: false },
);

const metak = () => {
  const showModalHandler = (destination) => {
    console.log(`Destination: ${destination}`);
    if (!destination) {
      console.log("no dest");
      return;
    }
    const body = document.getElementById(destination);
    const elt = body.closest(".body-container");
    toTop(elt)();
    body.focus();
  };
  const modal = document.getElementById("modal");
  const fileContainer = document.createElement("div");
  fileContainer.id = "fileContainer";
  modal.append(fileContainer);
  const containers = weave.containers();
  const files = Array.from(containers).map((c) => {
    const cinfo = {
      key: c.querySelector(".body").id,
      value: "",
      title: manipulation.get(c, manipulation.fields.kTitle),
    };
    console.log(cinfo);
    return cinfo;
  });
  presentFiles(files, fileContainer);

  const hr = document.createElement("hr");
  modal.appendChild(hr);
  modal.originalFileset = files;
  showModalAndGet("where to jump?", fileContainer, "name:", showModalHandler, {
    dbsearching: false,
    filtering: true,
  });
};

document.body.addEventListener("keydown", (ev) => {
  if (ev.key === "n" && ev.ctrlKey) {
    const bodyContainer = split(weave.root).action();
    bodyContainer.querySelector(".body").focus();
    toTop(bodyContainer)();
  }
  if (ev.key === "k" && ev.metaKey) {
    metak();
  }
});

interact(document.body)
  .pointerEvents({ ignoreFrom: ".body-container" })
  .on("hold", (ev) => {
    if (ev.button != 0) {
      // Want to avoid right-click-menu counting as hold, very annoying
      return;
    }
    const body = split(weave.root).action().querySelector(".body");
    body.focus();
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
    if (DEBUG) console.log(iloadParam);
    iloadIntoBody(iloadParam, body);
  } else {
    loadAllFromGroup("weave:last-session")
      .then()
      .catch((err) => {
        console.error("Could not load from previous session", err);

        weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
      });
  }
}
