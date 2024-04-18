export {
  zwsr,
  pad,
  wrap,
  prefix,
  postfix,
  toTop,
};
import weave from "../src/weave.js";

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
  // TODO this seems to not preserve ordering
  const arr = Array.from(weave.containers()).map((o) =>
    parseFloat(o.style.zIndex || 0),
  );
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


