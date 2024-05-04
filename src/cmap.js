// From my github.com/rberenguel/cmap-helper

export { cmap };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";

import { graphviz } from "./graphviz.js";

const cmap = {
  text: ["cmap"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    body.style.whiteSpace = "pre-wrap";
    const cmapPanel = createNextPanel(weave.root);
    manipulation.set(cmapPanel, manipulation.fields.kTitle, "generated-graphviz")
    cmapPanel.saveable = false;
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const cmapBody = cmapPanel.querySelector(".body");
    const container = body.closest(".body-container");


    cmapBody.classList.toggle("folded");
    // TODO All these should be part of a method that is then reused when loading the folded state
    cmapPanel.classList.toggle("folded-bc");
    cmapPanel.classList.toggle("unfit");


    console.log(cmapBody.id)
    container.cmapDestination = cmapBody.id;
    const render = () => {
      const cmap = body.innerText
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      console.log(cmap);
      const normalize = (str) => str.normalize("NFKD");
      const gv = headerT + "\n" + convert(normalize(cmap)) + "\n}";
      document.getElementById(container.cmapDestination).innerText =
        gv;
    };
    if (!container.cmap) {
      container.addEventListener("keyup", (ev) => {
        render();
        cmapPanel.render();
      });
    }
    render();
    graphviz.action(null, cmapBody);
  },
  description: "Graphviz based on gh/hpcc-systems/hpcc-js-wasm",
  el: "u",
};

const headerT = `
  digraph G {
    layout="dot"
    margin="0.5"
    bgcolor="#ffffffff"
    rankdir="TB"
    fontname="Roboto"
    nodesep="0.5"
    overlap="scale"
    compound="true"
    node [
      fontname = "Roboto"
      style="rounded,filled"
      labelloc="c"
      margin="0.3,0.15"
      splines="true"
      shape="rect"
      fontsize="15"
    ];
    edge [
      minlen="3"
      penwidth="2"
      color="#33333388"
      fontname="Roboto"
      fontsize="14"
      arrowhead="normal" // Latest papers about cmaps have recovered heads
    ];
    graph [
      margin="8"
      style="rounded,dotted"
    ];
    fontsize="24"
    labelloc="t";
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
const hasURL = (text) => text.includes("URL=");
const isComment = (text) => /^\s*\/\/.*/.test(text);
const onlyBraces = (text) => /^\s*{\s*$/.test(text) || /^\s*}\s*$/.test(text);
const onlyAttrs = (text) => /^\s*\w+=\w+\s*$/.test(text);
const getAttrsArrow = (text) => /^\s*\w+\s*->\s*\w+\s+(.*)$/.exec(text);
const getAttrsNode = (text) => /^\s*\w+\s+(.*)$/.exec(text);
const getCluster = (text) => /^\s*subgraph cluster_(\w+).*{.*$/.exec(text);
const isRGBAHex = (text) => /^#[0-9a-f]{8}$/.test(text.trim());

const labelBreaker = (text) => {
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
    return lines.join("\\l");
  } else {
    return text;
  }
};

const convert = (text) => {
  let result = [];
  const lines = text.split("\n");
  const tab = "  ";
  const ttab = tab + tab;
  let clusters = [];
  result.push(tab + `label="\\n${lines[0].replace("# ", "")}\\n\\n";`);
  for (let line of lines.slice(1)) {
    if (onlyBraces(line) || onlyAttrs(line) || isComment(line)) {
      result.push(tab + line);
      continue;
    }
    if (hasSubgraph(line)) {
      const cluster = getCluster(line)[1];
      clusters.push(cluster);
      // Add standard formatting
      let fill;
      for (let word of line.split(" ")) {
        if (isRGBAHex(word)) {
          fill = ttab + `fillcolor="${word.trim()}"`;
          line = line.replace(word.trim(), "");
        }
      }
      result.push(tab + line);
      result.push(ttab + `style="filled, rounded, dotted"`);
      if (fill !== undefined) {
        result.push(fill);
      }
      // Add invisible cluster name node and label
      result.push(ttab + `label="${cluster}"`);
      result.push(
        ttab + `${cluster} [style="invis",width="0",label="",fixedsize="true"]`
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
    const linkUTF = hasURL(attrs[1]) ? " &#128279;" : "";
    let [label, props] = attrs[1].split(";");
    if (hasArrow(line) && label.trim() == "!") {
      label = "";
      props = props ? props : "" + `style="invis"`;
    }
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
  return result.join("\n");
};
