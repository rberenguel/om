export {
  enableSelectionOnAll,
  disableSelectionOnAll,
  constructCurrentGroupAsMarkdown,
  constructCurrentGroup,
  parseGroupFromMarkdown,
};
import weave from "./weave.js";

import { iloadIntoBody } from "./loadymcloadface.js";
import { createPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";

const enableSelectionOnAll = () => {
  const containers = document.getElementsByClassName("body-container");
  for (const container of containers) {
    container.classList.remove("no-select");
  }
};

const disableSelectionOnAll = () => {
  const containers = document.getElementsByClassName("body-container");
  for (const container of containers) {
    container.classList.add("no-select");
  }
};

const constructCurrentGroupAsMarkdown = () => {
  const current = weave.containers();
  let lines = [];
  for (const container of current) {
    console.log(container);
    if (container.saveable === false) {
      continue;
    }
    const filename = manipulation.get(container, manipulation.fields.kFilename);
    const title = manipulation.get(container, manipulation.fields.kTitle);
    lines.push(`# ${filename} (${title})`);
    const x = manipulation.get(container, manipulation.fields.kX);
    lines.push(`${manipulation.fields.kX}: ${x}`);
    const y = manipulation.get(container, manipulation.fields.kY);
    lines.push(`${manipulation.fields.kY}: ${y}`);
    const height = manipulation.get(container, manipulation.fields.kHeight);
    lines.push(`${manipulation.fields.kHeight}: ${height}`);
    const width = manipulation.get(container, manipulation.fields.kWidth);
    lines.push(`${manipulation.fields.kWidth}: ${width}`);
    lines.push("\n");
  }
  if (weave.internal.arrows.length > 0) {
    lines.push("# Arrows");
  }
  for (const arrow of weave.internal.arrows) {
    const [srcbid, dstbid] = arrow.split("-");
    const srcCt = document.getElementById(srcbid).closest(".body-container");
    const dstCt = document.getElementById(dstbid).closest(".body-container");
    const srcFn = manipulation.get(srcCt, manipulation.fields.kFilename);
    const dstFn = manipulation.get(dstCt, manipulation.fields.kFilename);
    lines.push(`${srcFn}-${dstFn}`);
  }
  return lines.join("\n");
};

const parseGroupFromMarkdown = (text) => {
  let n = 0;
  let fileBodyMap = {};
  let arrowMode = false;
  console.log(text);
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  for (const line of lines) {
    if (!(line === "# Arrows") && line.startsWith("# ") && !arrowMode) {
      // TODO so bad
      // Parsing a file, matches the above
      console.log("File");
      const filename = line.split(" ")[1];
      console.info(`Block for file ${filename}`);
      const bodyId = `b${n}`; // TODO NO, this is not good enough
      createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
      const body = document.getElementById(bodyId);
      console.info(`Loading ${filename}`);
      iloadIntoBody(filename, body);
      fileBodyMap[filename] = bodyId;
      n += 1;
      // TODO this should start file details state, doesn't yet
      // TODO why is there an extra panel being created?
    }
    if (arrowMode) {
      const [srcFn, dstFn] = line.split("-");
      const srcB = fileBodyMap[srcFn];
      const dstB = fileBodyMap[dstFn];
      const arrowId = `${srcB}-${dstB}`;
      console.log(arrowId);
      weave.internal.arrows.push(arrowId);
    }
    if (line === "# Arrows") {
      arrowMode = true;
    }
  }
};

const constructCurrentGroup = () => {
  const md = constructCurrentGroupAsMarkdown();
  console.info(md);
  const groupData = btoa(encodeURIComponent(md));
  return `g:${groupData}`;
};
