export { graphviz };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { Graphviz } from "./libs/graphviz.js";
import { manipulation } from "./manipulation.js";
import { toTop } from "./doms.js";
import { toRight } from "./panel.js";
import { createPanel } from "./panel.js";
import { iloadIntoBody } from "./loadymcloadface.js";

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
  action: async (ev, body, source) => {
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
    const errPanel = createNextPanel(weave.root);
    const gvPanel = createNextPanel(weave.root, { noGestures: true });
    gvPanel.addEventListener("click", () => {
      // A hack to prevent pan-zoom to prevent keyboard commands on the panel
      gvPanel.focus();
    });
    manipulation.set(gvPanel, manipulation.fields.kTitle, "graphviz output");
    manipulation.set(errPanel, manipulation.fields.kTitle, "graphviz errors");
    gvPanel.saveable = false;
    errPanel.saveable = false;
    gvPanel.querySelector(".body").contentEditable = "false";
    errPanel.querySelector(".body").contentEditable = "false";
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const gvBody = gvPanel.querySelector(".body");
    const errBody = errPanel.querySelector(".body");
    const container = body.closest(".body-container");
    const render = async () => {
      toTop(gvPanel)();
      const dot = body.innerText
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      console.log(dot);
      container.graphvizDestination = gvBody.id;
      container.errorDestination = errBody.id;
      try {
        const rendered = weave.graphviz.layout(dot, "svg", "dot");
        console.log(rendered);
        if (rendered.includes("<svg")) {
          container.dot = rendered;
          const div = document.createElement("DIV");
          document.getElementById(container.graphvizDestination).innerHTML = "";
          document
            .getElementById(container.graphvizDestination)
            .appendChild(div);
          let pan, zoom;
          if (gvPanel.panzoom) {
            pan = gvPanel.panzoom.getPan();
            zoom = gvPanel.panzoom.getZoom();
            console.log(pan, zoom);
          }
          div.innerHTML = container.dot;
          const cmap = document.getElementById(source);
          div.mark = new Mark(cmap);
          cmap.mark = div.mark;
          const links = Array.from(div.querySelectorAll("a")); //
          links.forEach((a) => a.setAttribute("target", "_blank"));
          links.forEach((a) => {
            a.addEventListener("click", (ev) => {
              // hrefs are visited on click, not mouseup or down
              const node = a.closest(".node");
              if (node && node.held) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                node.held = false;
              } else {
                const href = a.href.baseVal;
                if (!href.startsWith("http")) {
                  // this is something weird from SVG
                  console.log("Opening");
                  ev.preventDefault();
                  ev.stopPropagation();
                  ev.stopImmediatePropagation();
                  // TODO this comes from formatters.js as is
                  const n = weave.bodies().length;
                  const bodyId = `b${n}`; // TODO NO, this is not good enough
                  createPanel(
                    weave.root,
                    bodyId,
                    weave.buttons(weave.root),
                    weave,
                  );
                  console.log(href);
                  const body = document.getElementById(bodyId);
                  iloadIntoBody(href, body);
                  toTop(body)(); // This is not working well
                }
              }
            });
          });

          const nodes = Array.from(div.querySelectorAll(".node"));
          // This is not a particularly elegant solution, but searches the corresponding node.
          // _Very_ convenient
          nodes.forEach((n) => {
            const title = n.querySelector("text").textContent;
            console.log(title);
            interact(n).on("hold", (ev) => {
              n.held = true;
              console.log("Marking held");
              ev.preventDefault();
              ev.stopPropagation();
              ev.stopImmediatePropagation();
              if (ev.button != 0) {
                // Want to avoid right-click-menu counting as hold, very annoying
                return;
              }

              console.log(`Marking on ${source} for ${title}`);
              ev.preventDefault();
              ev.stopPropagation();
              ev.stopImmediatePropagation();
              div.mark.unmark();
              div.mark.mark(title, { accuracy: "exactly" });
            });
            if (title.startsWith("[")) {
              const id = n.closest("g").id;
              const xmlns = "http://www.w3.org/2000/svg"; // SVG namespace URI
              const tspan = document.createElementNS(xmlns, "tspan");
              tspan.classList.add("fawesome");
              if (title.startsWith("[]") || title.startsWith("[ ]")) {
                // Open checkbox case
                tspan.innerHTML = ""; // fontawesome glyph for open checkbox. For some reason unicode was not working
                tspan.checked = false;
                n.querySelector("text").textContent = title
                  .replace("[]", "")
                  .replace("[ ]", "");
                n.querySelector("text").prepend(tspan);
                n.classList.remove("crossed");
              }
              if (title.toLowerCase().startsWith("[x]")) {
                // Closed checkbox case
                tspan.innerHTML = ""; // fontawesome glyph for open checkbox. For some reason unicode was not working
                tspan.checked = true;
                n.querySelector("text").textContent = title
                  .replace("[X]", "")
                  .replace("[x]", "");
                n.querySelector("text").prepend(tspan);
                n.classList.add("crossed");
              }
              tspan.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                if (!tspan.checked) {
                  console.log(cmap.childNodes);
                  tspan.innerHTML = ""; // fontawesome glyph for closed checkbox
                  n.classList.add("crossed");
                  for (let node of cmap.childNodes) {
                    if (node.textContent.includes(`id="${id}"`)) {
                      node.textContent = node.textContent
                        .replace("[]", "[X]")
                        .replace("[ ]", "[X]");
                    }
                  }
                } else {
                  tspan.innerHTML = ""; // fontawesome glyph for open checkbox
                  n.classList.remove("crossed");
                  for (let node of cmap.childNodes) {
                    if (node.textContent.includes(`id="${id}"`)) {
                      node.textContent = node.textContent
                        .replace("[x]", "[ ]")
                        .replace("[X]", "[ ]");
                    }
                  }
                }
                tspan.checked = !tspan.checked;
              });
            }
          });

          gvPanel.panzoom = svgPanZoom(
            document
              .getElementById(container.graphvizDestination, {
                zoomScaleSensitivity: 1.5,
              })
              .querySelector("svg"),
            { controlIconsEnabled: true },
          );
          if (pan) {
            // Beware of order!
            gvPanel.panzoom.zoom(zoom);
            gvPanel.panzoom.pan(pan);
          }
          div.addEventListener("dblclick", (ev) => {
            const svgString = new XMLSerializer().serializeToString(
              document.getElementById(container.graphvizDestination),
            );
            const svgDataUri = "data:image/svg+xml;base64," + btoa(svgString);
            const downloadLink = document.createElement("a");
            downloadLink.href = svgDataUri;
            downloadLink.download = "cmap.svg";
            downloadLink.click();
          });
        } else {
          container.err = rendered;
        }
      } catch (err) {
        const reloadWorthyErrors = [
          "Out of bounds call_indirect",
          "memory access out of bounds",
          "call_indirect to a signature that does not match",
          "table index is out of bounds",
        ];
        const isReloadWorthy = reloadWorthyErrors.some((string) =>
          err.message.includes(string),
        );
        if (err instanceof Error && isReloadWorthy) {
          weave.graphviz = await Graphviz.load();
          return;
        }
        document.getElementById(container.errorDestination).innerHTML = err;
      }
    };
    if (!container.dot) {
      container.render = render;
      container.addEventListener("keydown", () => {
        container.render();
      });
    }
    render();
    toRight(gvPanel);
  },
  description: "Graphviz based on gh/hpcc-systems/hpcc-js-wasm",
  el: "u",
};
