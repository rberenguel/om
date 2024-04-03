export { manipulation, panelFields };
import { addGoogFont } from "./load.js";

const panelFields = Object.freeze({
  kWidth: "width",
  kHeight: "height",
  kFontSize: "fontSize",
  kFontFamily: "fontFamily",
  kFilename: "filename",
  kFolded: "folded",
  kGFont: "gfont",
  kX: "x",
  kY: "y",
});

const manipulation = {
  fields: panelFields,
  get(container, prop) {
    const body = container.querySelector(".body");
    const currentRect = container.getBoundingClientRect();
    switch (prop) {
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
      case panelFields.kGFont:
        return body.dataset.gfont;
      case panelFields.kX:
        return parseFloat(container.dataset.x) || Math.floor(currentRect.x);
      case panelFields.kY:
        return parseFloat(container.dataset.y) || Math.floor(currentRect.y);
    }
  },
  set(container, prop, value) {
    const body = container.querySelector(".body");
    switch (prop) {
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
      case panelFields.kGFont:
        if (value == "" || value == "undefined") {
          return;
        }
        body.dataset.gfont = value;
        addGoogFont(value);
        break;
      case panelFields.kX:
        container.dataset.x = parseFloat(value);
        break;
      case panelFields.kY:
        container.dataset.y = parseFloat(value);
        break;
    }
  },
  reposition(container) {
    const current = container.getBoundingClientRect();
    let x = Math.floor(parseFloat(container.dataset.x) || current.x);
    let y = Math.floor(parseFloat(container.dataset.y) || current.y);
    container.dataset.x = x;
    container.dataset.y = y;
    container.style.transform = `translate(${x}px, ${y}px)`;  
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
    container.dataset.x = w;
    container.dataset.y = h;
    container.style.width = w + "px";
    container.style.height = h + "px";
  },
  forcePositionToReality(container) {
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
