export { _gnuplot };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";

const _gnuplot = {
  text: ["gnuplot"],
  action:  (ev, body) => {
    if (common(ev)) {
      return;
    }
    const script = `
set title 'Function Plot'
set xlabel 'time [s]'
set ylabel 'voltage [V]'
set xrange[0:5]
set yrange[-1.5:1.5]
plot exp(-x)*sin(4*x) title 'signal', exp(-x) title 'amplitude' lt 0, -exp(-x) title '' lt 0
    `;
    // Write data file
    //FS.writeFile("data.txt", );
    // Call gnuplot
    // Display output
    //editorOutput.setValue(out.stdout, 1);
    if (!body) {
      body = document.getElementById(weave.lastBodyClickId());
    }
    const plot = body.innerText
    let out = run_gnuplot(plot, []);
    const gpPanel = createNextPanel(weave.root);
    gpPanel.addEventListener("click", () => {
      // A hack to prevent pan-zoom to prevent keyboard commands on the panel
      gpPanel.focus();
    });
    manipulation.set(gpPanel, manipulation.fields.kTitle, "gnuplot output");
    gpPanel.saveable = false;
    gpPanel.querySelector(".body").contentEditable = "false";
    const gpBody = gpPanel.querySelector(".body");
    manipulation.set(body, manipulation.fields.kKind, "literal");
    // Display plot image
    gpBody.innerHTML =
      "<canvas id='draw_plot_on_canvas' width=500 height=400> <div id='err_msg'>No support for HTML 5 canvas element</div> </canvas>";
    let draw_script = FS.readFile("plot.js", { encoding: "utf8" });
    console.log(draw_script);
    eval?.(draw_script);
    console.log("evaluated");
    if (typeof draw_plot_on_canvas == "function") {
      draw_plot_on_canvas();
    }
  },
  description: "wasm gnuplot based on github.com/CD3/gnuplot-in-the-browser",
  el: "u",
};

function run_gnuplot(script, options) {
  // Create file from object
  script =
    "set term canvas name 'draw_plot_on_canvas' size 500,400;set output 'plot.js'\n" +
    script;
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
