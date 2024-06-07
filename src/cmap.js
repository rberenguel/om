// From my github.com/rberenguel/cmap-helper

export { cmap };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";

import { graphviz } from "./graphviz.js";
import { toRight } from "./panel.js";

// TODO: ctrl-k searches for internal URLs and introduces a URL=f-name tooltip=title at cursor location
// TODO: same functionality is added to the "link" button, when the target panel is a cmap (with kind: literal)

const cmap = {
  text: ["cmap"],
  action: async (ev, body) => {
    if (common(ev)) {
      return;
    }
    if (!body) {
      body = document.getElementById(weave.lastBodyClickId());
    }
    const bodyId = body.id; // TODO this should come from manipulation too
    body.style.whiteSpace = "pre-wrap";
    const cmapPanel = createNextPanel(weave.root);
    manipulation.set(
      cmapPanel,
      manipulation.fields.kTitle,
      "generated-graphviz",
    );
    cmapPanel.saveable = false;
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const cmapBody = cmapPanel.querySelector(".body");
    const container = body.closest(".body-container");

    //cmapBody.classList.toggle("folded");
    // TODO All these should be part of a method that is then reused when loading the folded state
    //cmapPanel.classList.toggle("folded-bc");
    //cmapPanel.classList.toggle("unfit");

    console.log(cmapBody.id);
    container.cmapDestination = cmapBody.id;
    const render = () => {
      const cmap = body.innerText
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      console.log(cmap);
      const normalize = (str) => str.normalize("NFKD");
      const gv = convert(normalize(cmap)) + "\n}";
      document.getElementById(container.cmapDestination).innerText = gv;
    };

    const fullRender = () => {
      render();
      cmapPanel.render();
    };
    container.render = fullRender;
    if (!container.cmap) {
      container.addEventListener("keydown", (ev) => {
        fullRender();
      });
    }
    //render();
    await graphviz.action(null, cmapBody, bodyId);
  },
  description: "Graphviz based on gh/hpcc-systems/hpcc-js-wasm",
  el: "u",
};

const headerT = `
digraph G {
  layout="dot"
  margin="0.5"
  bgcolor="$BACKGROUNDCOLOR"
  rankdir="TB"
  fontname="roboto"
  fontcolor="$FONTCOLOR"
  nodesep="0.6"
  overlap="scale"
  compound="true"
  node [
    fontname = "roboto"
    style="rounded,filled"
    labelloc="c"
    margin="0.5,0.3"
    splines="true"
    shape="rect"
    fontsize="26"
    fillcolor="$NODEFILLCOLOR"
    color="$NODECOLOR"
    fontcolor="$FONTCOLOR"
  ];
  edge [
    minlen="3"
    penwidth="2"
    color="$EDGECOLOR"
    fontcolor="$FONTCOLOR"
    fontname="roboto"
      fontsize="22"
      arrowhead="normal" // Latest papers about cmaps have recovered heads
  ];
  graph [
    margin="8"
    style="rounded,dotted"
    fillcolor="$NODEFILLCOLOR"
    color="$NODECOLOR"
  ];
  fontsize="38"
  labelloc="t";
  `;

const solarizedColors = `
$YELLOW=#b58900FF
$ORANGE=#cb4b16FF
$RED=#dc322fFF
$MAGENTA=#d33682FF
$VIOLET=#6c71c4FF
$BLUE=#268bd2FF
$CYAN=#2aa198FF
$GREEN=#859900FF
$LIGHTBACKGROUND=#fdf6e3FF
`;

const darkColors = `
$BASE03=#002B36FF
$BASE02=#073642FF
$BASE01=#586E75FF
$BASE0=#657B83FF
$EDGECOLOR=$ORANGE
$NODECOLOR=$BASE0
$BACKGROUNDCOLOR=$BASE03
$NODEFILLCOLOR=$BACKGROUNDCOLOR
$FONTCOLOR=$CYAN
`;

const lightColors = `
$BASE03=#fdf6e3FF
$BASE02=#eee8d5FF
$BASE01=#93a1a1FF
$BASE0=#839496FF
$EDGECOLOR=#33333388
$NODECOLOR=#000000FF
$BACKGROUNDCOLOR=#FFFFFFFF
$NODEFILLCOLOR=$BACKGROUNDCOLOR
$FONTCOLOR=#000000FF
`;

// Spec

// Node definition
// Node Blah blah node; styledefs

// Arrow? Then it's an edge
// Node1 -> Node2 Blah blah edge; styledefs

// To allow positioning commands and subgraph settings
// foo=bar // With no spaces, has no conversion
// { } are ignored if they are the only character aside from spaces
// Handles compound and subgraphs, automatically creates an invisible
// node in the cluster.

// This runs one single pass, so clusters need to be defined before the
// compound nodes are used

const hasArrow = (text) => {
  const flag = text.includes("->");
  return flag;
};

const hasSubgraph = (text) => text.includes("subgraph cluster_"); // Only supporting clusters, no other
const hasCluster = (text) => text.trim().startsWith("cluster ");
const hasReplacement = (text) => /^\s*\$\S+\s*=\s*.*$/.test(text);
const getReplacement = (text) => /^\s*(\$\S+)\s*=\s*(\S+)\s*$/.exec(text);
const hasURL = (text) => text.includes("URL=");
const isComment = (text) => /^\s*\/\/.*/.test(text);
const onlyBraces = (text) => /^\s*{\s*$/.test(text) || /^\s*}\s*$/.test(text);
const onlyAttrs = (text) => /^\s*\w+=.*\s*$/.test(text);
const getAttrsArrow = (text) => /^\s*\S+\s*->\s*\S+\s+(.*)$/.exec(text);
const getAttrsNode = (text) => /^\s*\S+\s+(.*)$/.exec(text);
const getSubgraphCluster = (text) =>
  /^\s*subgraph cluster_(\w+).*{.*$/.exec(text);
const getLoneCluster = (text) => /^\s*cluster\s+(\S+).*{.*$/.exec(text);
const isRGBAHex = (text) => /^#[0-9a-f]{8}$/.test(text.trim());

const labelBreaker = (text) => {
  const leftAlign = "\\l";
  if (text.length > 30 && !text.includes("\\n")) {
    const words = text.split(" ");
    let lines = [];
    let line = "";
    for (let word of words) {
      line += `${word} `;
      if (line.length > 30) {
        lines.push(line);
        line = "";
      }
    }
    lines.push(line);
    lines.push("");
    return lines.join(leftAlign);
  } else {
    return text;
  }
};

const convert = (text) => {
  console.log(text);
  const tab = "  ";
  const ttab = tab + tab;
  let result = [];
  let replacements = [];
  let header = headerT;
  let lines = text.split("\n");
  result.push(tab + `label="\\n${lines[0].replace("# ", "")}\\n\\n";`);
  const sliced = solarizedColors.split("\n").concat(lines.slice(1));
  if (lines.map((l) => l.trim()).includes("$DARK")) {
    lines = darkColors.split("\n").concat(sliced);
  } else {
    lines = lightColors.split("\n").concat(sliced);
  }
  console.log(lines);
  let clusters = [];
  for (let line of lines) {
    if (line.trim() === "$DARK") {
      continue;
    }
    for (let replacement of replacements) {
      let [key, value] = replacement;
      //console.info(`(line) Replacing ${key} by ${value}`);
      line = line.replaceAll(key, value);
    }
    if (onlyBraces(line) || onlyAttrs(line) || isComment(line)) {
      result.push(tab + line + " // only");
      continue;
    }
    if (hasReplacement(line)) {
      const key = getReplacement(line)[1];
      const value = getReplacement(line)[2];
      console.log(`Replacement found ${key} ${value}`);
      replacements.push([key, value]);
      continue;
    }
    if (hasSubgraph(line) || hasCluster(line)) {
      let cluster;
      if (hasSubgraph(line)) {
        cluster = getSubgraphCluster(line)[1];
      } else {
        cluster = getLoneCluster(line)[1];
      }
      clusters.push(cluster);
      // Add standard formatting
      let fill;
      for (let word of line.split(" ")) {
        if (isRGBAHex(word)) {
          fill = ttab + `fillcolor="${word.trim()}"`;
          line = line.replaceAll(word.trim(), "");
        }
      }
      result.push(tab + `subgraph cluster_${cluster} {`);
      result.push(ttab + `style="filled, rounded, dotted"`);
      if (fill !== undefined) {
        result.push(fill);
      }
      // Add invisible cluster name node and label
      result.push(ttab + `label="${cluster}"`);
      result.push(
        ttab + `${cluster} [style=invis,width=0,label="",fixedsize=true]`,
      );
      continue;
    }
    let attrs, src, dst;
    if (hasArrow(line)) {
      attrs = getAttrsArrow(line);
      const match = /^\s*(\w+)\s*->\s*(\w+).*$/.exec(line);
      src = match[1];
      dst = match[2];
      src = src.trim();
      dst = dst.trim();
    } else {
      attrs = getAttrsNode(line);
    }
    let addendum = "";
    if (src && clusters.includes(src)) {
      addendum = ` ltail="cluster_${src}"`;
    }
    if (dst && clusters.includes(dst)) {
      addendum = ` lhead="cluster_${dst}"`;
    }
    if (!attrs || attrs.length == 1) {
      const compoundEdge = addendum != "" ? ` [${addendum}]` : "";
      result.push(tab + line + compoundEdge);
      continue;
    }
    const linkUTF = hasURL(attrs[1]) ? " 🔗" : "";
    let [label, props] = attrs[1].split(";");
    if (hasArrow(line) && label.trim() == "!") {
      label = "";
      props = props ? props : "" + "style=invis";
    }
    label = label.trim();
    label = label.replace(/^\[\]/, "🟨").replace(/^\[ \]/, "🟨");
    label = label.replace(/^\[X\]/, "✅").replace(/^\[x\]/, "✅");
    const labelPropper = (label, props) =>
      `[label="${labelBreaker(label)}${linkUTF}"${
        props ? " " + props : ""
      }${addendum}]`;
    const operation = line.replace(" " + attrs[1], " ");
    let converted = `${operation} ${labelPropper(label, props)}`;
    if (!hasArrow(line) && label.trim() == "=") {
      converted = `${operation} ${labelPropper(operation.trim(), props)}`;
    }
    result.push(tab + converted);
  }
  for (let replacement of replacements) {
    const [key, value] = replacement;
    console.info(`(header) Replacing ${key} by ${value}`);
    header = header.replaceAll(key, value);
  }
  let joined = header + "\n" + result.join("\n");
  return joined;
};
