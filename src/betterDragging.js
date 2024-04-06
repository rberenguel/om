export { draggy };

let draggedElement;

function dragMoveListener(event) {
  event.preventDefault();
  var target = event.target;
  // keep the dragged position in the data-x/data-y attributes
  console.log("dragMoveListener fired")
  var x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
  var y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

  // translate the element
  target.style.transform = "translate(" + x + "px, " + y + "px)";

  // update the position attributes
  target.setAttribute("data-x", x);
  target.setAttribute("data-y", y);

}

const draggy = (div) => {
  interact(div).draggable({
    //allowFrom: handle,
    inertia: false,
    //startAxis: "xy",
    //lockAxis: "start",
    modifiers: [
      /*interact.modifiers.restrictRect({
        endOnly: true,
      }),*/
    ],
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
        console.log("Doing stuff with");
        console.log(draggedElement);
        draggedElement.parentNode.removeChild(draggedElement);
        draggedElement.classList.add("dragging");
        document.getElementById(weave.root).appendChild(draggedElement);
      },
      enter: (ev) => {
        ev.preventDefault();
        console.log("ev entered");
        console.log(ev.target);
      },
      move: dragMoveListener,
      end: (ev) => {
        console.log("ev end");
        console.log(ev.target);
      },
    },
  });
};
