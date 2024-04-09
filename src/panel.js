export { manipulation, panelFields };
import { addGoogFont } from "./load.js";

const panelFields = Object.freeze({
  kWidth: "width",
  kHeight: "height",
  kFontSize: "fontSize",
  kFontFamily: "fontFamily",
  kMono: "mono",
  kFilename: "filename",
  kFolded: "folded",
  kGFont: "gfont",
  kX: "x",
  kY: "y",
  kKind: "kind"
});

const manipulation = {
  fields: panelFields,
  get(container, prop) {
    const body = container.querySelector(".body");
    const currentRect = container.getBoundingClientRect();
    switch (prop) {
      case panelFields.kKind:
        return container.dataset.kind || "text"
      case panelFields.kWidth:
        return (
          parseFloat(container.dataset.width) || Math.floor(currentRect.width)
        );
      case panelFields.kHeight:
        return (
          parseFloat(container.dataset.height) || Math.floor(currentRect.height)
        );
      case panelFields.kFontSize:
        return body.style.fontSize; // TODO a default
      case panelFields.kFontFamily:
        return body.style.fontFamily; // TODO a better getter
      case panelFields.kFilename:
        return body.dataset.filename || ""; // TODO :shrug:
      case panelFields.kFolded:
        return (
          body.classList.contains("folded") &&
          container.classList.contains("folded-bc")
        );
      case panelFields.kMono:
        return (
          body.classList.contains("mono")
        );
      case panelFields.kGFont:
        return body.dataset.gfont;
      case panelFields.kX:
        if(container.dataset.x){
          return parseFloat(container.dataset.x)
        } else {
          return Math.floor(currentRect.x);
        }

      case panelFields.kY:
        if(container.dataset.y){
          return parseFloat(container.dataset.y)
        } else {
          return Math.floor(currentRect.y);
        }
    }
  },
  set(container, prop, value) {
    const body = container.querySelector(".body");
    switch (prop) {
      case panelFields.kKind:
        container.dataset.kind = value
        break;
      case panelFields.kWidth:
        container.dataset.width = parseFloat(value);
        break;
      case panelFields.kHeight:
        container.dataset.height = parseFloat(value);
        break;
      case panelFields.kFontSize:
        if (value == "") {
          return;
        }
        body.style.fontSize = value;
        break;
      case panelFields.kFontFamily:
        if (value == "") {
          return;
        }
        body.style.fontFamily = value;
        break;
      case panelFields.kFilename:
        body.dataset.filename = value;
        break;
      case panelFields.kFolded:
        // Toggle classes based on the desired 'folded' state
        if (JSON.parse(value)) {
          body.classList.add("folded");
          container.classList.add("folded-bc");
        } else {
          body.classList.remove("folded");
          container.classList.remove("folded-bc");
        }
        break;
      case panelFields.kMono:
        if(JSON.parse(value)){
          body.classList.add("mono")
          body.classList.remove("serif")
        }
        break;
      case panelFields.kGFont:
        if (value == "" || value == "undefined") {
          return;
        }
        body.dataset.gfont = value;
        addGoogFont(value);
        break;
      case panelFields.kX:
        container.dataset.x = Math.floor(parseFloat(value));
        break;
      case panelFields.kY:
        container.dataset.y = Math.floor(parseFloat(value));
        break;
    }
  },
  reposition(container) {
    let x = this.get(container, panelFields.kX)
    let y = this.get(container, panelFields.kY)
    container.dataset.x = x;
    container.dataset.y = y;
    const transform = `translate(${x}px, ${y}px)`;
    container.style.transform = transform;  
  },
  resize(container) {
    const current = container.getBoundingClientRect();
    let w = Math.floor(parseFloat(container.dataset.width) || current.width);
    let h = Math.floor(parseFloat(container.dataset.height) || current.height);
    container.dataset.width = w;
    container.dataset.height = h;
    container.style.width = w + "px";
    container.style.height = h + "px";
  },
  forceSizeToReality(container) {
    const current = container.getBoundingClientRect();
    let w = current.width;
    let h = current.height;
    container.dataset.w = w;
    container.dataset.h = h;
    container.style.width = w + "px";
    container.style.height = h + "px";
  },
  forcePositionToReality(container) {
    console.log("Forcing to reality!")
    const body = container.querySelector(".body");
    const current = container.getBoundingClientRect();
    let x = current.x;
    let y = current.y;
    this.set(body, panelFields.kX, current.x);
    this.set(body, panelFields.kY, current.y);
    this.reposition(container);
  },
};

const extractPanelInformation = (body) => {};
