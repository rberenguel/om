import { createPanel } from "./doms.js";

const weave = {
  bodies: () => document.getElementsByClassName("body"),
  containers: () => document.getElementsByClassName("body-container"),
  buttons: () => [],
  // Base config
  config: {
    dark: true,
    mono: false,
    fontsize: getComputedStyle(document.body).fontSize,
  },
  internal: {
    preventFolding: false,
    cancelShifting: false,
    // TODO(me): API on top of this "click history"
    bodyClicks: ["b0", "b0"],
    clickedId: ["b0", "b0"],
    held: false,
    arrows: [],
  },
  lastBodyClickId: function () {
    console.log(this);
    console.log(this.internal);
    return this.internal.bodyClicks[0];
  },
  lastClickId: () => {
    return this.internal.clickedId[0];
  },
  createPanel: createPanel,
  root: null,
  /*constructor() {
    // Bind `this` for methods that need it
    this.lastBodyClickId = this.lastBodyClickId.bind(this); 
  }*/
};

export default weave;
