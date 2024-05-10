export { _gnuplot };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";
import { toTop } from "./doms.js";
const _gnuplot = {
  text: ["gnuplot"],
  action: (ev, body) => {
    if (common(ev)) {
      return;
    }
    if (!body) {
      body = document.getElementById(weave.lastBodyClickId());
    }
    const gpPanel = createNextPanel(weave.root);
    const errPanel = createNextPanel(weave.root);
    gpPanel.addEventListener("click", () => {
      // A hack to prevent pan-zoom to prevent keyboard commands on the panel
      gpPanel.focus();
    });
    manipulation.set(gpPanel, manipulation.fields.kTitle, "gnuplot output");
    manipulation.set(errPanel, manipulation.fields.kTitle, "gnuplot errors");
    gpPanel.saveable = false;
    errPanel.saveable = false;
    gpPanel.querySelector(".body").contentEditable = "false";
    errPanel.querySelector(".body").contentEditable = "false";
    const gpBody = gpPanel.querySelector(".body");
    const errBody = errPanel.querySelector(".body");
    manipulation.set(body, manipulation.fields.kKind, "literal");
    const container = body.closest(".body-container");
    const render = () => {
      toTop(gpPanel)();
      container.errDestination = errBody.id;
      container.gnuplotDestination = gpBody.id;
      const plot = body.innerText;
      run_gnuplot(plot, []);
      console.log(STDOUT);
      document.getElementById(container.errDestination).innerHTML = "";
      document.getElementById(container.errDestination).innerHTML =
        STDOUT.join("\n");
      const rendered = FS.readFile("plot", { encoding: "utf8" });
      if (rendered.includes("<svg")) {
        container.gnuplot = rendered;
        const div = document.createElement("DIV");
        document.getElementById(container.gnuplotDestination).innerHTML = "";
        document.getElementById(container.gnuplotDestination).appendChild(div);
        let pan, zoom;
        if (gpPanel.panzoom) {
          pan = gpPanel.panzoom.getPan();
          zoom = gpPanel.panzoom.getZoom();
        }
        div.innerHTML = container.gnuplot;
        gpPanel.panzoom = svgPanZoom(
          document
            .getElementById(container.gnuplotDestination, {
              zoomScaleSensitivity: 1.5,
            })
            .querySelector("svg"),
        );
        if (pan) {
          // Beware of order!
          gpPanel.panzoom.zoom(zoom);
          gpPanel.panzoom.pan(pan);
        }
      }
    };
    if (!container.gnuplot) {
      container.render = render;
      container.addEventListener("keyup", () => {
        container.render();
      });
    }
    render();
  },
  description: "wasm gnuplot based on github.com/CD3/gnuplot-in-the-browser",
  el: "u",
};

function run_gnuplot(script, options) {
  // Create file from object
  const header = `
set term svg
set output 'plot'
set datafile separator "|"
set key textcolor rgb "white"
set border lw 1 lc rgb "white"
set title textcolor rgb "white"
`;
  //"set term canvas name 'draw_plot_on_canvas' size 500,400;set output 'plot.js'\n" +
  script = header + "\n" + script;
  script = script
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
  console.log(script);
  FS.writeFile(SCRIPT_FILE, script);

  // Clear previous stdout/stderr before launching gnuplot
  STDOUT = [];

  // Launch gnuplot's main() function
  let args = [SCRIPT_FILE];
  args = args.concat(options);
  // HACK: gnuplot does not clean up memory when it exits.
  // this is OK under normal circumstances because the OS will
  // reclaim the memory. But the emscripten runtime does not
  // do this, so we create a snapshot of the memory before calling
  // main and restore it after calling main.
  const mem_snapshot = Uint8Array.from(HEAPU8);
  callMain(args);
  HEAPU8.set(mem_snapshot);

  return {
    stdout: STDOUT.join("\n"),
  };
}
