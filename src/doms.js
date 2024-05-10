export { zwsr, pad, wrap, prefix, postfix, toTop };
import weave from "../src/weave.js";

const DEBUG = true;

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

const toTop = (b) => () => {
  if (DEBUG) {
    console.debug("Pushing up");
    console.debug(b);
  }
  if (b.classList.contains(".body")) {
    b = b.closest(".body-container");
  }
  if (b.style.zIndex >= 10000) {
    return;
  }
  const arr = Array.from(weave.containers()).map((o) =>
    parseFloat(o.style.zIndex || 0),
  );
  // Skip the special > 10000 "on tops"
  const withZ = arr.filter((z) => z >= 0 && z < 10000);
  const maxZ = Math.max(...withZ, 1);
  const minZ = Math.min(...withZ, maxZ);
  if (DEBUG) console.log(minZ, maxZ);
  b.style.zIndex = maxZ + 1;
  b.titleDiv.style.zIndex = maxZ + 1;
  Array.from(weave.containers()).forEach((bc) => {
    if (bc.style.zIndex >= 10000) {
      return;
    }
    bc.titleDiv.style.zIndex = (bc.style.zIndex || minZ) - minZ;
    bc.style.zIndex = (bc.style.zIndex || minZ) - minZ;
  });
};
