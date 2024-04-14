export {
  createPanel,
  zwsr,
  pad,
  wrap,
  prefix,
  postfix,
  divWithDraggableHandle,
  toTop,
  placeTitle
};
import { hookBodies, constructCurrentGroup } from "./internal.js";
import { reset } from "./commands_base.js";
import { manipulation } from "./panel.js";
import { dndDynamicDiv } from "./dynamicdiv.js";
import { createOrMoveArrowBetweenDivs } from "./arrow.js";
import { toMarkdown } from "./parser.js";
import { set } from "./libs/idb-keyval.js";
import { iload } from "./loadymcloadface.js"
import {exportCurrent} from "./save.js"
// TODO: I think I want to be able to move panels instead of drag-and-drop.

// I use this separator in many places
const zwsr = () => document.createTextNode("\u200b");

// HTML elements of interest
//const bodies = () => document.getElementsByClassName("body");

const pad = (node) => {
  node.insertAdjacentHTML("afterbegin", "&thinsp;");
  node.insertAdjacentHTML("beforeend", "&thinsp;");
};

const wrap = (node) => {
  postfix(node);
};
const prefix = (node) => {
  node.insertAdjacentHTML("beforebegin", "&thinsp;");
};

const postfix = (node) => {
  node.insertAdjacentHTML("afterend", "&thinsp;");
};

const divWithDraggableHandle = () => {
  const div = document.createElement("div");
  const handle = document.createElement("div");
  handle.classList.add("handle");
  handle.draggable = true;
  div.appendChild(handle);
  return [div, handle];
};

const toTop = (b) => () => {
  const arr = Array.from(weave.containers()).map((o) =>
    parseFloat(o.style.zIndex || 0),
  );
  console.log("To top array")
  console.log(arr)
  const withZ = arr.filter((z) => z > 0);
  const maxZ = Math.max(...withZ, 1);
  const minZ = Math.min(...withZ, maxZ);
  b.style.zIndex = maxZ + 1;
  b.titleDiv.style.zIndex = maxZ + 1;
  Array.from(weave.containers()).forEach(
    (b) => {
      b.style.zIndex = Math.max(0, (b.style.zIndex || minZ) - minZ)
      b.titleDiv.style.zIndex = Math.max(0, (b.style.zIndex || minZ) - minZ)
    },
  );
};

const toggleTitling = (container) => {
  Array.from(weave.containers()).forEach(c => {
    c.titleDiv.classList.remove("show")
  })
  const title = manipulation.get(container, manipulation.fields.kTitle)
  if(title){
    placeTitle(container);
    container.titleDiv.textContent = title
    container.titleDiv.classList.add("show")
    setTimeout(function() {
      container.titleDiv.classList.remove('show');
    }, 2000)
  }
}

const placeTitle = (container) => {
  const title = container.titleDiv
  const tr = title.getBoundingClientRect()
  const x = manipulation.get(container, manipulation.fields.kX);
  const y = manipulation.get(container, manipulation.fields.kY);
  const w = manipulation.get(container, manipulation.fields.kWidth)
  manipulation.set(
    title,
    manipulation.fields.kWidth,
    w,
  );
  manipulation.set(title, manipulation.fields.kX, x);
  manipulation.set(title, manipulation.fields.kY, y-1.1*tr.height);
  manipulation.reposition(title);
  manipulation.resize(title);
}

const createPanel = (parentId, id, buttons, weave) => {
  const bodyContainer = document.createElement("div");
  const title = document.createElement("div")
  bodyContainer.classList.add("body-container");
  bodyContainer.classList.add("unfit");
  title.textContent = "foo"
  title.classList.add("panel-title")
  title.id = `title-$id`
  bodyContainer.titleDiv = title
  bodyContainer.parentId = parentId;
  const d = new Date();
  const seconds = d.getTime()
  bodyContainer.spaceCounter = 10
  const save = () => {
    const body = bodyContainer.querySelector(".body")
    const filename = manipulation.get(bodyContainer, manipulation.fields.kFilename)
    const saveString = btoa(encodeURIComponent(toMarkdown(body)));
    set(filename, saveString)
      .then(() => {
        console.log("Data saved in IndexedDb")
        body.saved = true
      })
      .catch((err) => console.log("Saving in IndexedDb failed", err));
  }
  bodyContainer.addEventListener("keydown", (ev) => {
    // This auto-fits height as we type
    bodyContainer.classList.add("unfit");
    console.log(ev)
    body.saved = false
    if(ev.code === "Space"){
      bodyContainer.spaceCounter -= 1;
      reset()
    }
    if(ev.code === "Space" && bodyContainer.spaceCounter == 0){
      bodyContainer.spaceCounter = 10
      save()
      console.info("Autosaving")
    }
    if(ev.key === "l" && ev.ctrlKey){
      iload.action()
    }
    if(ev.code === "KeyC" && ev.ctrlKey){
      // Note: this is not weird-layout safe, C just happens to be the same in QWERTY and Colemak
      exportCurrent.action()
      info.innerHTML = "Exported current panel";
      info.classList.add("fades");    }
    if(ev.key === "s" && ev.ctrlKey){
      save()
      info.innerHTML = "Saved";
      info.classList.add("fades");
      const session = constructCurrentGroup()
      set("weave:last-session", session)
        .then(() => console.log("Session data saved in IndexedDB"))
        .catch((err) =>
          console.log("Session data saving in IndexedDB failed", err),
        );
    }
  });
  interact(bodyContainer).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    // TODO There is something failing in resize
    listeners: {
      move(event) {
        const f = 1 / (document.body.dataset.scale || 1);
        const bx = document.body.dataset.x;
        const by = document.body.dataset.y;
        // TODO Uhm, strange I don't need to use these
        // TODO use accessors also for body moves
        bodyContainer.classList.remove("unfit"); // This allows full resizability
        let target = event.target;
        toTop(target)();
        let x = manipulation.get(target, manipulation.fields.kX);
        let y = manipulation.get(target, manipulation.fields.kY);
        manipulation.set(
          target,
          manipulation.fields.kWidth,
          f * event.rect.width,
        );
        manipulation.set(
          target,
          manipulation.fields.kHeight,
          f * event.rect.height,
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
  manipulation.set(bodyContainer, manipulation.fields.kFilename, `f${seconds}`)
  if (id != "b0") {
    const prevContainer = document
      .getElementById("b" + (weave.bodies().length - 1))
      .closest(".body-container");
    // TODO with datasets
    let x = manipulation.get(prevContainer, manipulation.fields.kX)+10;
    let y = manipulation.get(prevContainer, manipulation.fields.kY)+10;
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
        console.info("Dropping a magical div");
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
        console.log(ev.scale)
        const body = ev.target.querySelector(".body")
        body.click()
        if(ev.scale < 0.8){
          // TODO this is now repeated with ctrl-s
          save()
          info.innerHTML = "Saved";
          info.classList.add("fades");
          const session = constructCurrentGroup()
          set("weave:last-session", session)
            .then(() => console.log("Session data saved in IndexedDB"))
            .catch((err) =>
              console.log("Session data saving in IndexedDB failed", err),
            );
        }
        if(ev.scale > 1.2) {
          console.log("Scale went wrong?")
          console.log(ev.scale)
          const modal = document.getElementById("modal");
          if(!modal.showing){
            iload.action()
          }
        }
      },
    },
  });


  interact(bodyContainer).draggable({
    allowFrom: betterHandle,
    ignoreFrom: body,
    inertia: true,
    autoscroll: true,
    listeners: {
      leave: (ev) => {},
      start(event) {
        toTop(bodyContainer)
      },
      move(event) {
        let x = manipulation.get(bodyContainer, manipulation.fields.kX);
        let y = manipulation.get(bodyContainer, manipulation.fields.kY);
        x += event.dx;
        y += event.dy;
        manipulation.set(bodyContainer, manipulation.fields.kX, x);
        manipulation.set(bodyContainer, manipulation.fields.kY, y);
        manipulation.reposition(bodyContainer);
        placeTitle(bodyContainer);
        for(const arrow of weave.internal.arrows){
          createOrMoveArrowBetweenDivs(arrow)
        }
      },
    },
  });
  // TODO: this might be better in weave directly
  betterHandle.addEventListener("click", () => {
    toggleTitling(bodyContainer)
    toTop(bodyContainer)()
  });
  bodyContainer.addEventListener("click", () => {
    toggleTitling(bodyContainer)
    toTop(bodyContainer)()
  });
  document.getElementById(parentId).appendChild(bodyContainer);
  document.getElementById(parentId).appendChild(title);
  hookBodies(buttons); // TODO fix this This wires all buttons
  manipulation.forcePositionToReality(bodyContainer);
  placeTitle(bodyContainer);
};

// Uh, this may screw moving divs, actually… Let's try to disable it
//document.getElementById("content").addEventListener('drop', drop("body-container"));
