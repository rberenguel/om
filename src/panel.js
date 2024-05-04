export { createPanel, createNextPanel, split, close_ };

import weave from "./weave.js";

import { constructCurrentGroup } from "./internal.js";
import { set } from "./libs/idb-keyval.js";
import { manipulation } from "./manipulation.js";
import { wireBodies } from "./wires.js";
import { placeTitle, ititle, toggleTitling } from "./title.js";
import { exportCurrent } from "./save.js";
import { toTop } from "./doms.js";
import { iload } from "./loadymcloadface.js";
import { raw } from "./raw.js";
import { toMarkdown } from "./parser.js";
import { common, reset } from "./commands_base.js";
import { createOrMoveArrowBetweenDivs } from "./arrow.js";
import { dndDynamicDiv } from "./dynamicdiv.js";

const DEBUG = true;

const createNextPanel = (parentId) => {
  const n =
    Math.max(...Array.from(weave.bodies()).map((b) => +b.id.replace("b", ""))) +
    1;
  const id = `b${n}`; // TODO: This will work _badly_ with closings?
  // This is now repeated!
  return createPanel(parentId, id, weave.buttons(weave.root), weave); // I might as well send everything once?
};

const split = (parentId) => {
  return {
    text: ["split"],
    action: (ev) => {
      console.info(`Splitting for parentId: ${parentId}`);
      if (common(ev)) {
        return;
      }
      return createNextPanel(parentId);
    },
    description: "Add a new editing buffer",
    el: "u",
  };
};

const close_ = {
  text: ["close", "❌"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    // TODO(me) I'm pretty sure closing-saving-loading would fail
    // if I delete an intermediate panel, needs some test
    // TODO: replace weave.internal.bodyClicks[0] with a (proper) function call
    const bid = weave.internal.bodyClicks[0];
    // TODO this should be wrapped
    const tid = `title-${bid}`;
    const titleToRemove = document.getElementById(tid);
    const bodyToRemove = document.getElementById(bid);
    const container = bodyToRemove.closest(".body-container");
    const parent = container.parentNode;
    parent.removeChild(container);
    parent.removeChild(titleToRemove);
  },
  description: "Eliminate a panel",
  el: "u",
};

const createPanel = (parentId, id, buttons, weave) => {
  const bodyContainer = document.createElement("div");
  bodyContainer.dragMethod = "dragmove"; // TODO convert to constants
  const title = document.createElement("div");
  bodyContainer.classList.add("body-container");
  bodyContainer.classList.add("unfit");
  title.textContent = "foo";
  title.classList.add("panel-title");
  title.id = `title-${id}`;
  bodyContainer.titleDiv = title;
  bodyContainer.parentId = parentId;
  const d = new Date();
  const seconds = d.getTime();
  bodyContainer.spaceCounter = 10;

  const save = () => {
    const body = bodyContainer.querySelector(".body");
    // TODO this is very repeated with isave
    const filename = manipulation.get(
      bodyContainer,
      manipulation.fields.kFilename
    );

    const content = btoa(encodeURIComponent(toMarkdown(body)));

    const title = manipulation.get(body, manipulation.fields.kTitle);
    const saveString = `${title} ${content}`;
    console.log(`Saving with a title of ${title}`);
    set(filename, saveString)
      .then(() => {
        console.info("Data saved in IndexedDb");
        body.saved = true;
      })
      .catch((err) => console.info("Saving in IndexedDb failed", err));
  };
  bodyContainer.addEventListener("keydown", (ev) => {
    // This auto-fits height as we type
    bodyContainer.classList.add("unfit");
    body.saved = false;
    console.info(ev);
    if (ev.code === "Space") {
      bodyContainer.spaceCounter -= 1;
      reset();
    }
    if (ev.code === "Space" && bodyContainer.spaceCounter == 0) {
      bodyContainer.spaceCounter = 10;
      save();
      console.info("Autosaving");
    }
    // All the key commands need tests
    if (ev.key === "w" && ev.ctrlKey) {
      close_.action();
    }
    if (ev.key === "l" && ev.ctrlKey) {
      iload.action();
    }
    if (ev.key === "r" && ev.ctrlKey) {
      raw.action();
    }
    if (ev.key === "t" && ev.ctrlKey) {
      ititle.action(ev);
    }
    if (ev.code === "KeyC" && ev.ctrlKey) {
      // Note: this is not weird-layout safe, C just happens to be the same in QWERTY and Colemak
      exportCurrent.action();
      info.innerHTML = "Exported current panel";
      info.classList.add("fades");
    }
    if (ev.key === "s" && ev.ctrlKey) {
      save();
      info.innerHTML = "Saved";
      info.classList.add("fades");
      const session = constructCurrentGroup();
      set("weave:last-session", session)
        .then(() => console.info("Session data saved in IndexedDB"))
        .catch((err) =>
          console.info("Session data saving in IndexedDB failed", err)
        );
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const hgap = viewportWidth / 50;
    const vgap = viewportHeight / 40;
    if (ev.ctrlKey && ev.metaKey && ev.key === "e") {
      console.log("doing");
      manipulation.set(
        bodyContainer,
        manipulation.fields.kWidth,
        viewportWidth / 2 - hgap
      );
      manipulation.set(
        bodyContainer,
        manipulation.fields.kHeight,
        viewportHeight - vgap
      );
      manipulation.set(bodyContainer, manipulation.fields.kX, 0);
      manipulation.set(bodyContainer, manipulation.fields.kY, vgap / 2);
      manipulation.reposition(bodyContainer);
      manipulation.resize(bodyContainer);
    }
    if (ev.ctrlKey && ev.metaKey && ev.key === "i") {
      console.log("doing");
      manipulation.set(
        bodyContainer,
        manipulation.fields.kWidth,
        viewportWidth / 2 - hgap
      );
      manipulation.set(
        bodyContainer,
        manipulation.fields.kHeight,
        viewportHeight - vgap
      );
      manipulation.set(
        bodyContainer,
        manipulation.fields.kX,
        viewportWidth / 2 - hgap / 2
      );
      manipulation.set(bodyContainer, manipulation.fields.kY, vgap / 2);
      manipulation.reposition(bodyContainer);
      manipulation.resize(bodyContainer);
    }
    // Special paste processing nothing
    if (ev.metaKey && ev.shiftKey && ev.key === "v") {
      ev.preventDefault();
      navigator.clipboard
        .readText()
        .then((text) => {
          let sel = window.getSelection();
          if (sel.getRangeAt && sel.rangeCount) {
            let range = sel.getRangeAt(0);
            range.deleteContents();
            let div = document.createElement("div");
            div.style.whiteSpace = "pre-wrap";
            div.innerText = text;
            range.insertNode(div);
          }
        })
        .catch((err) => {
          console.error("Failed to read clipboard: ", err);
        });
    }
  });
  interact(bodyContainer).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    // TODO There is something failing in resize
    listeners: {
      start(ev) {
        for (const container of weave.containers()) {
          container.classList.add("no-select");
        }
      },
      end(ev) {
        for (const container of weave.containers()) {
          container.classList.remove("no-select");
        }
      },
      move(event) {
        const scale = document.body.dataset.scale;
        if (scale > 1.2 || scale < 0.8) {
          return;
        }
        const f = 1 / (scale || 1);
        bodyContainer.classList.remove("unfit"); // This allows full resizability
        let target = event.target;
        toTop(target)();
        let x = manipulation.get(target, manipulation.fields.kX);
        let y = manipulation.get(target, manipulation.fields.kY);
        manipulation.set(
          target,
          manipulation.fields.kWidth,
          f * event.rect.width
        );
        manipulation.set(
          target,
          manipulation.fields.kHeight,
          f * event.rect.height
        );
        manipulation.resize(target);
        // translate when resizing from top or left edges
        x += event.deltaRect.left;
        y += event.deltaRect.top;
        manipulation.set(target, manipulation.fields.kX, x);
        manipulation.set(target, manipulation.fields.kY, y);
        manipulation.reposition(target);
        placeTitle(target);
      },
    },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { width: 100, height: 50 },
      }),
    ],
    inertia: false,
  });
  manipulation.set(bodyContainer, manipulation.fields.kFilename, `f${seconds}`);
  if (id != "b0") {
    // This is not working well: should just use timestamps
    const prevContainer = document
      .getElementById(
        "b" + weave.bodies()[weave.bodies().length - 1].id.replace("b", "")
      )
      .closest(".body-container");
    // TODO with datasets
    let x = manipulation.get(prevContainer, manipulation.fields.kX) + 10;
    let y = manipulation.get(prevContainer, manipulation.fields.kY) + 10;
    manipulation.set(bodyContainer, manipulation.fields.kX, x);
    manipulation.set(bodyContainer, manipulation.fields.kY, y);
    manipulation.reposition(bodyContainer);
    placeTitle(bodyContainer);
  } else {
  }
  const betterHandle = document.createElement("div");
  betterHandle.classList.add("better-handle");
  const body = document.createElement("div");
  body.classList.add("body");

  if (weave.config.dark) {
    body.classList.add("dark");
    bodyContainer.classList.add("dark");
  } else {
    body.classList.add("light");
    bodyContainer.classList.add("light");
  }
  body.classList.add("serif");
  body.classList.add("on-top");
  body.contentEditable = true;
  body.id = id;
  betterHandle.appendChild(body);
  bodyContainer.appendChild(betterHandle);
  body.addEventListener("touchstart", function (event) {
    // TODO wtf
    console.log(event.touches.length);
    if (event.touches.length < 2) {
      body.oneFingerStartX = event.touches[0].clientX;
      body.oneFingerStartY = event.touches[0].clientY;
      body.twoFingerStartX = undefined;
      body.twoFingerStartY = undefined;
    }
  });

  body.addEventListener("touchend", function (event) {
    body.endX = event.changedTouches[0].clientX;
    body.endY = event.changedTouches[0].clientY;

    if (body.oneFingerStartX) {
      const deltaX = body.endX - body.oneFingerStartX;
      const deltaY = body.endY - body.oneFingerStartY;
      const nrm = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (deltaX > 0 && deltaY < 0 && nrm > 250) {
        // Sadly, this can't work on mobile safari because
        // copy needs direct user interaction
        // TODO instead, this could create a panel (or just load it) with just an export button :shrug:
      }
    }
    if (body.twoFingerStartX) {
    }
  });

  interact(bodyContainer).dropzone({
    ondropmove: (ev) => {
      let placeholder = document.querySelector(".div-dnd-placeholder");
      const draggedElement = document.querySelector(".dragging");
      if (!draggedElement) {
        return;
      }
      if (!placeholder && draggedElement) {
        placeholder = document.createElement("div");
        placeholder.classList.add("div-dnd-placeholder");
        const bcr = draggedElement.getBoundingClientRect();
        if (bcr.height > bcr.width) {
          placeholder.style.height = bcr.height;
          placeholder.style.width = "1em";
        } else {
          placeholder.style.width = bcr.width;
          placeholder.style.height = "1em";
        }
      }
      // here
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      const dropX = ev.dragEvent.client.x;
      const dropY = ev.dragEvent.client.y;
      dndDynamicDiv(placeholder, ev.target.querySelector(".body"), dropY);
    },
    // TODO all this d-n-d shenanigans needs tests
    ondrop: (ev) => {
      // TODO this code should be more equivalent to the placeholder drop, otherwise it behaves weirdly
      // Dropping for divs
      let placeholder = document.querySelector(".div-dnd-placeholder");
      if (placeholder) {
        placeholder.remove();
      }
      // TODO use the accept option of interact.js
      if (ev.relatedTarget.classList.contains("dynamic-div")) {
        const dropX = ev.dragEvent.client.x;
        const dropY = ev.dragEvent.client.y;
        const targetBody = ev.target.querySelector(".body");
        const target = ev.relatedTarget;
        dndDynamicDiv(target, targetBody, dropY);
      }
    },
  });

  interact(bodyContainer).gesturable({
    listeners: {
      move(ev) {
        // Pinch to load and save
        // Scale > 1 is opening up, load
        // Scale < 1 is closing, save
        const body = ev.target.querySelector(".body");
        body.click();
        if (ev.scale < 0.8) {
          // TODO this is now repeated with ctrl-s
          save();
          info.innerHTML = "Saved";
          info.classList.add("fades");
          const session = constructCurrentGroup();
          set("weave:last-session", session)
            .then(() => console.info("Session data saved in IndexedDB"))
            .catch((err) =>
              console.info("Session data saving in IndexedDB failed", err)
            );
        }
        if (ev.scale > 1.2) {
          const modal = document.getElementById("modal");
          if (!modal.showing) {
            iload.action();
          }
        }
      },
    },
  });
  bodyContainer.dragMethod = "dragmove";
  bodyContainer.dragMethods = {};
  bodyContainer.dragMethods["dragmove"] = {};
  bodyContainer.dragMethods["dragmove"].enter = (ev) => {};
  bodyContainer.dragMethods["dragmove"].leave = (ev) => {};
  bodyContainer.dragMethods["dragmove"].start = (ev) => {
    toTop(bodyContainer);
    for (const container of weave.containers()) {
      container.classList.add("no-select");
    }
  };
  bodyContainer.dragMethods["dragmove"].end = (ev) => {
    for (const container of weave.containers()) {
      container.classList.remove("no-select");
    }
  };
  bodyContainer.dragMethods["dragmove"].move = (ev) => {
    const f = 1 / (document.body.dataset.scale || 1);
    let x = manipulation.get(bodyContainer, manipulation.fields.kX);
    let y = manipulation.get(bodyContainer, manipulation.fields.kY);
    x += f * ev.dx;
    y += f * ev.dy;
    manipulation.set(bodyContainer, manipulation.fields.kX, x);
    manipulation.set(bodyContainer, manipulation.fields.kY, y);
    manipulation.reposition(bodyContainer);
    placeTitle(bodyContainer);
    for (const arrow of weave.internal.arrows) {
      createOrMoveArrowBetweenDivs(arrow);
    }
  };

  interact(bodyContainer).draggable({
    allowFrom: betterHandle,
    ignoreFrom: body,
    inertia: true,
    autoscroll: true,
    listeners: {
      leave: (ev) => {},
      start(ev) {
        if (DEBUG)
          console.debug(
            `dragstart: ${bodyContainer.querySelector(".body").id}`
          );
        bodyContainer.dragMethods[bodyContainer.dragMethod].start(ev);
      },
      end(ev) {
        if (DEBUG)
          console.debug(`dragend: ${bodyContainer.querySelector(".body").id}`);
        bodyContainer.dragMethods[bodyContainer.dragMethod].end(ev);
      },
      move(ev) {
        bodyContainer.dragMethods[bodyContainer.dragMethod].move(ev);
      },
      enter(ev) {
        if (DEBUG)
          console.debug(
            `dragenter: ${bodyContainer.querySelector(".body").id}`
          );
        const m = bodyContainer.dragMethods[bodyContainer.dragMethod].enter;
        if (m) {
          m(ev);
        }
      },
      leave(ev) {
        if (DEBUG)
          console.debug(
            `dragleave: ${bodyContainer.querySelector(".body").id}`
          );
        bodyContainer.dragMethods[bodyContainer.dragMethod].leave(ev);
      },
    },
  });
  // TODO: this might be better in weave directly
  betterHandle.addEventListener("click", () => {
    toggleTitling(bodyContainer);
    toTop(bodyContainer)();
  });
  interact(bodyContainer).on("hold", (ev) => {
    const selection = window.getSelection() + "";
    if (selection === "") {
      const targetBody = ev.target.querySelector(".body");
      if (targetBody) {
        targetBody.click();
        ititle.action(ev);
        ev.stopPropagation();
      }
    }
  });
  bodyContainer.addEventListener("click", () => {
    toggleTitling(bodyContainer);
    toTop(bodyContainer)();
    for (const container of weave.containers()) {
      container.classList.remove("unfit");
    }
  });
  document.getElementById(parentId).appendChild(bodyContainer);
  document.getElementById(parentId).appendChild(title);
  wireBodies(buttons);
  manipulation.forcePositionToReality(bodyContainer);
  placeTitle(bodyContainer);
  return bodyContainer;
};
