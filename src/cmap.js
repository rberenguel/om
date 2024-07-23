// From my github.com/rberenguel/cmap-helper

export { cmap };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";

import { graphviz } from "./graphviz.js";

const DEBUG = true;

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
    // TODO I likely want to handle related containers in a more uniform way
    body.closest(".body-container").relatedContainers = [
      cmapPanel.querySelector(".body").id,
    ];
    manipulation.set(
      cmapPanel,
      manipulation.fields.kTitle,
      "generated-graphviz",
    );
    const nums = document.createElement("div");
    nums.classList.add("line-numbers");
    const handle = cmapPanel.querySelector(".better-handle");
    handle.prepend(nums);
    handle.style = "display: flex;";

    cmapPanel.saveable = false;
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const cmapBody = cmapPanel.querySelector(".body");
    const container = body.closest(".body-container");

    container.cmapDestination = cmapBody.id;
    const render = async () => {
      const cmap = body.innerText
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      const normalize = (str) => str.normalize("NFKD");
      // Analysis and regeneration of operators is best _before_ conversion, because then I can use all the properties
      let gv;
      if (cmap.split("\n")[0].endsWith(" [calc]")) {
        gv = convert(normalize(processOperators(cmap))) + "\n}";
        console.log(gv);
      } else {
        gv = convert(normalize(cmap)) + "\n}";
      }

      document.getElementById(container.cmapDestination).innerText = gv;
    };

    const fullRender = () => {
      render();
      cmapPanel.render();
      const lineNumbers = cmapPanel.querySelector(".line-numbers");
      const lines = cmapPanel
        .querySelector(".body")
        .innerText.split("\n")
        .filter(Boolean);
      lineNumbers.innerHTML = lines
        .concat(lines)
        .map((_, i) => `<div>${i + 1}</div>`)
        .join("");
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

const opFuzzyOr = (...args) => {
  // For now each function will handle its own input
  return Math.max(...args.map((f) => parseFloat(f)));
};

const opFuzzyAnd = (...args) => {
  // For now each function will handle its own input
  return Math.min(...args.map((f) => parseFloat(f)));
};

const opSum = (...args) => {
  // For now each function will handle its own input
  const values = args.map((f) => parseFloat(f));
  const sum = values.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  return sum;
};

const opCarryMul = (...args) => {
  // For now each function will handle its own input
  const values = args.map((f) => parseFloat(f));
  const mul = values.reduce(
    (accumulator, currentValue) => accumulator * currentValue,
    1,
  );
  return mul;
};

const getArrowSrcDst = (line) => {
  const match = /^\s*(\S+)\s*->\s*(\S+).*$/.exec(line);
  let src = match[1]; // TODO this is failing
  let dst = match[2];
  src = src.trim();
  dst = dst.trim();
  return [src, dst];
};

const operators = {
  "||_": { op: opFuzzyOr, name: "op_fuzzy_or_" },
  "&&_": { op: opFuzzyAnd, name: "op_fuzzy_and_" },
  "!_": { op: (v) => 1.0 - parseFloat(v), name: "op_fuzzy_not_" },
  "+_": { op: opSum, name: "op_sum_" },
  "*=_": { op: opCarryMul, name: "op_carry_mul_" },
  ":=_": { op: (v) => parseFloat(v), name: "op_carry_id_" },
  //":=_": { op: (v) => parseFloat(v), name: "op_id_" },
};

const isOp = (thing) => {
  for (const opName in operators) {
    if (thing.startsWith(opName)) {
      return opName;
    }
  }
  return false;
};

const edgeKey = (src, dst) => `e-${src}-${dst}`;
const isNumber = (str) => {
  const num = parseFloat(str); // Or Number(str)
  return !isNaN(num);
};

const isPercent = (str) => {
  if (str.endsWith("%")) {
    return isNumber(str.replace("%", ""));
  }
  return false;
};

const formatVal = (val) => {
  if (val === undefined) {
    return `???`;
  }
  if (val.kind == "pct") {
    return `${(100 * val.value).toFixed(0)}%`;
  }
  if (val.kind == "num") {
    return `${val.value.toFixed(2)}`;
  }
  throw {
    name: "WeaveValueError",
    message: `Kind ${val.kind} is not valid for a value`,
  };
};

const splitArrow = (text) => /^\s*(\S+\s*->\s*\S+)\s*(.*)$/.exec(text);

// TODO: This can be moved to a separate file and tested in isolation

const processOperators = (cmapText, max_steps = 5) => {
  let lines = cmapText.split("\n");
  // Rewrite
  let edgeValues = {};
  let nodeValues = {};
  let bySrc = {};
  let byDst = {};
  for (const line of lines) {
    // Get values out of edges. This likely only is done once
    if (hasArrow(line)) {
      let [src, dst] = getArrowSrcDst(line);
      const key = edgeKey(src, dst);
      if (isOp(src) || isOp(dst)) {
        if (key in edgeValues) {
          // If this edge already has a value, we don't need to touch it anymore,
          // any updates are done at the evaluation level
          continue;
        }
        const attrs = getAttrsArrow(line);
        let argument;
        if (!attrs || attrs.length <= 1) {
          // Could be a forward (non computed) argument, non-typed yet, who knows. We need to populate it though, as empty
          edgeValues[key] = [];
          argument = undefined;
        } else {
          argument = attrs[1].split(" ")[0];
        }
        // Make the graph easier to access by properties
        if (!(src in bySrc)) {
          bySrc[src] = [dst];
        } else {
          bySrc[src].push(dst);
        }
        if (!(dst in byDst)) {
          byDst[dst] = [src];
        } else {
          byDst[dst].push(src);
        }
        // The _extracted_ argument is always the first one

        if (isNumber(argument)) {
          if (isPercent(argument)) {
            edgeValues[key] = [
              {
                value: parseFloat(argument) / 100.0,
                kind: "pct",
              },
            ];
          } else {
            edgeValues[key] = [
              {
                value: parseFloat(argument),
                kind: "num",
              },
            ];
          }
        }
      }
    }
  }
  // Evaluation
  // It starts for nodes by destination:
  // - Carry-over nodes (those that affect their outgoing edges)
  // - Non-carry-over nodes (those that just take arguments and emit a result)
  for (let step = 0; step < max_steps; step++) {
    for (const dst in byDst) {
      const op = isOp(dst);
      if (op) {
        // Then we need to evaluate all incoming edges and modify the corresponding out edge
        // We use the last value in the edge values, edge values is holding a history for that edge
        const srcs = byDst[dst];
        const values = srcs
          .map((src) => edgeValues[edgeKey(src, dst)].slice(-1)[0])
          .filter((v) => v !== undefined);
        const dsts = bySrc[dst] || [];
        if (!operators[op].name.includes("carry")) {
          let evaluation = {
            value: operators[op].op(...values.map((v) => v.value)),
          };
          if (values.every((e) => e.kind == "pct")) {
            evaluation.kind = "pct";
          } else {
            evaluation.kind = "num";
          }
          // Now modify the outgoing edges of this operator with this value
          for (const _dst of dsts) {
            const key = edgeKey(dst, _dst); // so, we are going from what already was a destination operator
            if (edgeValues[key]) {
              if (edgeValues[key].length >= 2) {
                // Do not evaluate an edge more than once
                continue;
              }
              edgeValues[key].push(evaluation);
            } else {
              edgeValues[key] = [evaluation];
            }
          }
          nodeValues[dst] = evaluation;
        } else {
          // If it contains carry, the evaluation is against the _outer edge value_
          for (const _dst of dsts) {
            const key = edgeKey(dst, _dst); // so, we are going from what already was a destination operator
            let _values = values;
            if (edgeValues[key]) {
              if (edgeValues[key].length >= 2) {
                // Do not evaluate an edge more than once
                continue;
              }
              // We have a destination value to add and change
              _values = values.concat(edgeValues[key]);
            }
            let evaluation = {
              value: operators[op].op(..._values.map((v) => v.value)),
            };
            if (_values.every((e) => e.kind == "pct")) {
              evaluation.kind = "pct";
            } else {
              evaluation.kind = "num";
            }
            if (edgeValues[key]) {
              if (edgeValues[key].length >= 2) {
                // Do not evaluate an edge more than once
                continue;
              }
              edgeValues[key].push(evaluation);
            } else {
              edgeValues[key] = [evaluation];
            }
          }
        }
      }
    }
  }
  // Once all the evaluations have stabilised or whatever, update the edge texts with the changes
  let updatedLines = [];
  for (let line of lines) {
    if (hasArrow(line)) {
      let [src, dst] = getArrowSrcDst(line);
      const key = edgeKey(src, dst);
      const values = edgeValues[key];
      if (values) {
        // This needs to update only the first part of the attributes section, i.e. the label
        const split = splitArrow(line);
        const arrow = split[1].trim();
        let attrs = split[2].trim().split(" ");
        let text;
        if (values.length > 1) {
          text = `<<font color="$GREEN">${formatVal(
            values.slice(-1)[0],
          )}</font>   (${formatVal(values[0])})`;
        } else {
          text = `<${formatVal(values[0])}`;
        }
        attrs[0] = text;
        const _attrs = attrs.join(" ");
        line = `${arrow} ${_attrs}`; // The closing > is added by the cmap converter when it is in the opening
      }
    } else {
      const node = line.trim().split(" ")[0];
      if (node in nodeValues) {
        let splits = line.split(";");
        splits[0] = splits[0] + ` (${formatVal(nodeValues[node])})`;
        line = splits.join(";");
      }
    }
    updatedLines.push(line);
  }
  return updatedLines.join("\n");
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
const getReplacement = (text) => {
  // If a replacement is available it is easier to _not_ use regexes
  const split = text.split("=");
  const key = split[0].trim();
  const replacement = split.slice(1).join("=").trim();
  return [key, replacement];
};
const hasURL = (text) => text.includes("URL=") || text.includes("URL = "); // To also cover the post-formatted case
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
  const tab = "  ";
  const ttab = tab + tab;
  let result = [];
  let replacements = [];
  let header = headerT;
  let lines = text.split("\n");
  result.push(
    tab +
      `label="\\n${lines[0].replace("# ", "").replace("[calc]", "")}\\n\\n";`,
  );
  const sliced = solarizedColors.split("\n").concat(lines.slice(1));
  if (lines.map((l) => l.trim()).includes("$DARK")) {
    lines = darkColors.split("\n").concat(sliced);
  } else {
    lines = lightColors.split("\n").concat(sliced);
  }
  let clusters = [];
  for (let line of lines) {
    if (line.trim() === "$DARK") {
      continue;
    }
    for (let replacement of replacements) {
      let [key, value] = replacement;
      line = line.replaceAll(key, value);
    }
    if (
      onlyBraces(line) ||
      onlyAttrs(line) ||
      isComment(line) ||
      line.startsWith("/*")
    ) {
      result.push(tab + line + " // only");
      continue;
    }
    if (hasReplacement(line)) {
      if (DEBUG) console.log(`Replacement found on line '${line}'`);
      const key = getReplacement(line)[0];
      const value = getReplacement(line)[1];
      if (DEBUG) console.log(`Replacement found ${key} ${value}`);
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
    for (const op in operators) {
      const name = operators[op].name;
      line = line.replaceAll(op, name);
    }
    if (hasArrow(line)) {
      attrs = getAttrsArrow(line);
      const match = /^\s*(\S+)\s*->\s*(\S+).*$/.exec(line);
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
    const labelHTMLPropper = (label, props) =>
      `[label=${label}${linkUTF}>${props ? " " + props : ""}${addendum}]`
        .replace("\\n", "<br/>")
        .replace("\\l", "<br/>");
    const operation = line.replace(" " + attrs[1], " ");
    let converted;
    if (label.startsWith("<")) {
      converted = `${operation} ${labelHTMLPropper(label, props)}`;
    } else {
      converted = `${operation} ${labelPropper(label, props)}`;
    }
    if (!hasArrow(line) && label.trim() == "=") {
      converted = `${operation} ${labelPropper(operation.trim(), props)}`;
    }
    result.push(tab + converted);
  }
  for (let replacement of replacements) {
    const [key, value] = replacement;
    if (DEBUG) console.info(`(header) Replacing ${key} by ${value}`);
    header = header.replaceAll(key, value);
  }
  let joined = header + "\n" + result.join("\n");
  return joined;
};
