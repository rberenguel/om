export { _gnuplot, _gnuplot_data };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { createNextPanel } from "./panel.js";
import { manipulation } from "./manipulation.js";
import { toTop } from "./doms.js";

const _gnuplot_data = {
  text: ["data"],
  action: (ev, body) => {
    if (!body) {
      body = document.getElementById(weave.lastBodyClickId());
    }
    const title = manipulation.get(body, manipulation.fields.kTitle);
    manipulation.set(body, manipulation.fields.kKind, "literal");
    console.log(title);
    const content = body.innerText
      .split("\n")
      .filter((l) => l.length > 0)
      .join("\n");
    FS.writeFile(title, content);
  },
  description: "Store the data in this panel for plotting in gnuplot",
  el: "u",
};

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
        div.addEventListener("dblclick", (ev) => {
          const svgStrings = new XMLSerializer()
            .serializeToString(
              document
                .getElementById(container.gnuplotDestination)
                .querySelector("svg"),
            )
            .split("\n");
          svgStrings[0] = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" style="background: black;"><g id="viewport-20240922113932012" class="svg-pan-zoom_viewport" transform="scale(2)">`;
          const svgString = svgStrings.join("\n");
          const svgDataUri = "data:image/svg+xml;base64," + btoa(svgString);
          const downloadLink = document.createElement("a");
          downloadLink.href = svgDataUri;
          downloadLink.download = "plot.svg";
          downloadLink.click();
        });
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

/*

Example

# Based on the transparency effect in transparent.dem by Ethan A. Merrit (2006) 
set key textcolor rgb "white"
set border lw 1 lc rgb "white"
set key title "Gaussian Distribution" center textcolor rgb "white"
set key fixed left top vertical Left reverse enhanced autotitle nobox
set key noinvert samplen 1 spacing 1 width 0 height 0
set title "Transparent filled curves" textcolor rgb "white"
set xrange [-5.00000 : 5.00000]
set yrange [0.00000 : 1.00000]
set samples 200
Gauss(x, mu, sigma) = 1./(sigma*sqrt (2*pi)) * exp(-(x-mu)**2 / (2*sigma**2))
d1 (x) = Gauss(x, 0.5, 0.5)
d2(x) = Gauss(x, 2., 1.)
d3 (x) = Gauss(x, -1., 2.)
plot \
  d3(x) lc rgb "dark-violet" title "mu = -1.0 sigma = 2.0" w filledcurves y1=0 fs transparent solid 0.3, \ 
  d3(x) lc rgb "dark-violet" lw 2 title "", \
  d1(x) lc rgb "forest-green" lw 2 with filledcurves y1=0 fs transparent solid 0.5 title "mu = 0.5 sigma = 0.5", \
  d1(x) lc rgb "forest-green" lw 2 title "",\
  d2(x) lc rgb "gold" lw 2 with filledcurves y1=0 fs transparent solid 0.5 title "mu 2.0 sigma = 1.0", \
  d2(x) lc rgb "gold" lw 2 title ""
*/

/*

set key textcolor rgb "white"
set border lw 1 lc rgb "white"
set key title "Project Counts by Month" center textcolor rgb "white"
set key fixed left top vertical Left reverse enhanced autotitle nobox
set key noinvert samplen 1 spacing 1 width 0 height 0

set xrange [2023*12 : 2024*12+12]
set yrange [0.00000 : 6.00000]
set boxwidth 
set samples 200
set xtics rotate by -45
set datafile separator whitespace
array month_names[12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

orderer(year, month) = year * 12 + (month - 1)

set arrow from (2024*12+1),6 to (2024*12+1),0, graph 1 nohead lt 8 lw 3 lc rgb "#cc6600" dashtype 2


plot \
'data' using (tmp=month_names[int($2)] . " '" . substr(strcol(1), 3, 4), orderer(int($1), int($2))):3:xtic(tmp) title '' lc rgb "#66ccff" lw 2 smooth bezier with filledcurves y1=0 fs transparent solid 0.2, \
'data' using (tmp=month_names[int($2)] . " '" . substr(strcol(1), 3, 4), orderer(int($1), int($2))):3:xtic(tmp) title '' lc rgb "dark-violet" lw 2 smooth mcsplines with filledcurves y1=0 fs transparent solid 0.5, \
'data' using (tmp=month_names[int($2)] . " '" . substr(strcol(1), 3, 4), orderer(int($1), int($2))):3:xtic(tmp) title '' lc rgb "dark-violet" lw 2 smooth mcsplines, \
'data' using (tmp=month_names[int($2)] . " '" . substr(strcol(1), 3, 4), orderer(int($1), int($2))):3:xtic(tmp) title '' lc rgb "#66ccff" lw 2 smooth bezier y1=0 fs transparent solid 0.5, \
1/0 t "Got Gemini advanced" lt 8 lw 3 dashtype 1 lc rgb "#cc6600"




*/
