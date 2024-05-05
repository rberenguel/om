export { graphviz };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { Graphviz } from "./libs/graphviz.js";
import { manipulation } from "./manipulation.js";

const dotExample = `
digraph G {
  layout="dot"
  margin="0.5"
  bgcolor="#ffffffff"
  rankdir="TB"
  fontname="monoidregular"
  overlap="scale"
  node [
    fontname = "monoidregular"
    style="rounded,filled"
    labelloc="c"
    margin="0.3,0.15"
    splines="true"
    shape="rect"
    fontsize="14"
  ];
  edge [
    minlen="2"
    penwidth="1"
    color="#33333333"
    fontname="monoidregular"
    fontsize="7"
    arrowhead="none"
  ];
  
  fontsize="24"
  labelloc="t";
  label="\nKafka\n\n";
  
  Topics
  Topics -> Internal [label="can be"]
  Topics -> User [label="can be"]
  cg [label=" Consumer groups "]
  cg -> Consumers [label="have"]
  User -> cg [label="consumed by"]
  Topics -> Partitions [label="have"]
  {
    rank=same
    Partitions [label=" Partitions "]
    Offset
  }
  Partitions -> Records [label="contain"]
  Partitions -> Consumers [label="read from"]
  Consumers -> Topics [label="can read from several" arrowhead=normal]
  Records -> Ordered [label="are partially"]
  kv [label="Key-value"]
  Records -> kv [label="are"]
  kv -> Tombstone [label="value=null"]
  sk [label="Same key"]
  kv -> sk [label="can have"]
  sk -> sp [label="go to"]
  Compaction -> sk [label="keeps latest with"]
  Time -> Compaction [label="required by"]
  ret [label="Record expiration time" shape="none" style=none fontsize=9]
  Time -> Expiration [label="required by"]
  Expiration -> ret [style=dashed]
  Records -> Time [label="have"]
  Records -> sk [label="can have"]
  Ordered -> Time [label="by"]
  Consumers -> Offset [label="start at"]
  Consumers -> Offset [label="\n\nkeep track of"]
  Offset -> Internal [label="is stored in"]
  Offset -> Ordered [label="requires"]
  sp [label="   Same partition   "]
  sp -> Ordered [label=" is completely" arrowhead=normal]
}
    `;

const graphviz = {
  text: ["graphviz"],
  action: async (ev, body) => {
    if (common(ev)) {
      return;
    }
    if (!body) {
      body = document.getElementById(weave.lastBodyClickId());
    }
    body.style.whiteSpace = "pre-wrap";
    if (!weave.graphviz) {
      weave.graphviz = await Graphviz.load();
    }
    const gvPanel = createNextPanel(weave.root);
    manipulation.set(gvPanel, manipulation.fields.kTitle, "graph output");
    gvPanel.saveable = false;
    gvPanel.querySelector(".body").contentEditable = "false"
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const gvBody = gvPanel.querySelector(".body");
    const container = body.closest(".body-container");
    const render = async () => {
      const dot = body.innerText
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      console.log(dot);
      container.graphvizDestination = gvBody.id;
      try {
        const rendered = weave.graphviz.layout(dot, "svg", "dot");
        container.dot = rendered;
        const div = document.createElement("DIV")
        document.getElementById(container.graphvizDestination).innerHTML = ""
        document.getElementById(container.graphvizDestination).appendChild(div)
        let pan, zoom
        if(gvPanel.panzoom){
          pan = gvPanel.panzoom.getPan()
          zoom = gvPanel.panzoom.getZoom()
          console.log(pan, zoom)
        }
        div.innerHTML =
          container.dot;
        gvPanel.panzoom = svgPanZoom(document.getElementById(container.graphvizDestination, {zoomScaleSensitivity: 1.5}).querySelector("svg"))
        if(pan){
          // Beware of order!
          gvPanel.panzoom.zoom(zoom)
          gvPanel.panzoom.pan(pan)
        }
        div
          .addEventListener("dblclick", (ev) => {
            const svgString = new XMLSerializer().serializeToString(
              document.getElementById(container.graphvizDestination)
            );
            const svgDataUri = "data:image/svg+xml;base64," + btoa(svgString);
            const downloadLink = document.createElement("a");
            downloadLink.href = svgDataUri;
            downloadLink.download = "cmap.svg";
            downloadLink.click();
          });
      } catch (err) {
        const reloadWorthyErrors = [
          "Out of bounds call_indirect",
          "memory access out of bounds",
          "call_indirect to a signature that does not match",
        ];
        const isReloadWorthy = reloadWorthyErrors.some((string) =>
          err.message.includes(string)
        );
        if (err instanceof Error && isReloadWorthy) {
          weave.graphviz = await Graphviz.load();
          return;
        }
        document.getElementById(container.graphvizDestination).innerHTML = err;
      }
    };
    if (!container.dot) {
      container.render = render;
      container.addEventListener("keyup", () => {
        container.render();
      });
    }
    render();
  },
  description: "Graphviz based on gh/hpcc-systems/hpcc-js-wasm",
  el: "u",
};
