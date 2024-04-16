export { draggy };

let draggedElement;

const DEBUG = false;

function dragMoveListener(event) {
  event.preventDefault();
  var target = event.target;
  // TODO tweak manipulation to handle this too
  if (DEBUG) console.log("dragMoveListener fired");
  var x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
  var y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;
  target.style.transform = "translate(" + x + "px, " + y + "px)";
  target.setAttribute("data-x", x);
  target.setAttribute("data-y", y);
}

const draggy = (div) => {
  interact(div).draggable({
    inertia: false,
    modifiers: [],
    autoScroll: false,
    cursorChecker(action, interactable, element, interacting) {
      if (action.name === "drag") {
        return "auto";
      }
    },
    listeners: {
      start: (event) => {
        document.isDragging = true;
        event.preventDefault();
        draggedElement = event.target;
        const rect = draggedElement.getBoundingClientRect();
        draggedElement.dataset.x = rect.x;
        draggedElement.dataset.y = rect.y;
        if (DEBUG) {
          console.log("Doing stuff with");
          console.log(draggedElement);
        }
        draggedElement.parentNode.removeChild(draggedElement);
        draggedElement.classList.add("dragging");
        document.getElementById(weave.root).appendChild(draggedElement);
      },
      enter: (ev) => {
        ev.preventDefault();
        if (DEBUG) console.log("ev entered");
        if (DEBUG) console.log(ev.target);
      },
      move: dragMoveListener,
      end: (ev) => {
        if (DEBUG) console.log("ev end");
        if (DEBUG) console.log(ev.target);
      },
    },
  });
};
