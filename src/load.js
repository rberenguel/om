export {
  getClosestBodyContainer,
  wireEverything,
  addGoogFont,
  setConfig,
  loadHash,
};

import weave from "./weave.js";
import { createPanel } from "./doms.js";

const getClosestBodyContainer = (element) => {
  let currentParent = element.parentNode;
  while (currentParent !== document.documentElement) {
    if (
      currentParent.classList.contains("body") &&
      currentParent.id.startsWith("b")
    ) {
      return currentParent;
    }
    currentParent = currentParent.parentNode;
  }

  return null;
};

const wireEverything = (buttons) => {
  // We have loaded stuff. Let's wire the code blocks:
  const codes = document.querySelectorAll(".code.wired");
  let i = 0;
  for (let cod of codes) {
    cod.hover_title = `[${i}] ${cod.hover_title}`;
    i++;
    console.log("data", cod.dataset.eval_string);
    wireEval(cod);
    cod.eval();
  }
  // Now lets wire the buttons
  const aliveButtons = document.querySelectorAll("div>.alive");
  console.log("Wiring all these:");
  console.log(aliveButtons);
  for (let aliveButton of aliveButtons) {
    for (let button of buttons) {
      // This could be sped up by reversing the indexing
      // TODO this is repeated
      if (button.text.includes(aliveButton.dataset.action)) {
        aliveButton.onmousedown = button.action;
        aliveButton.addEventListener("dblclick", (ev) => {
          console.debug("Preventing folding");
          weave.internal.preventFolding = true;
        });
      }
    }
  }
};

const addGoogFont = (fontname) => {
  console.log(`Adding from Google Fonts: ${fontname}`);
  const linkElement = document.createElement("link");
  linkElement.rel = "stylesheet";
  linkElement.href = `https://fonts.googleapis.com/css2?family=${fontname}`;
  document.head.appendChild(linkElement);
  return linkElement.href;
};

const loadHash = (parentId) => {
  let config = weave.config;
  let bodies = weave.bodies();
  console.info("Loading for");
  console.debug(bodies);
  const currentHash = window.location.hash.substring(1);
  const decodedHash = decodeURIComponent(currentHash);
  const splitHash = decodedHash.split("\u2223");
  if (splitHash.length > 1) {
    let bodiesData = JSON.parse(splitHash[1]);
    for (let n = 1; n < bodiesData.length; n++) {
      createPanel(parentId, `b${n}`, weave.buttons(weave.root), weave);
    }
    config = JSON.parse(splitHash[0]);
    setConfig(config);

    for (let id in bodiesData) {
      console.log(id);
      let bodyData = bodiesData[id];
      console.log(bodyData);
      let body = document.querySelector(`#b${id}`);
      body.innerHTML = bodyData["data"];
      console.log(bodyData["data"]);
      body.parentElement.style.width = bodyData["width"];
      body.parentElement.style.height = bodyData["height"];
      body.style.fontSize = bodyData["fontSize"];
      body.style.fontFamily = bodyData["fontFamily"];
      body.dataset.filename = bodyData["filename"];
      if (bodyData["folded"]) {
        body.parentElement.classList.add("folded");
      }
      if (bodyData["gfont"]) {
        addGoogFont(bodyData["gfont"]);
      }
    }
    wireEverything(weave.buttons(weave.root));
  } else {
    setConfig({});
    for (let body of weave.bodies()) {
      body.innerHTML = decodedHash;
    }
    //console.log(document.documentElement.clientHeight / 2);
    //bodies[0].style.height = `${document.documentElement.clientHeight / 2}px`;
  }
};

const setConfig = (config) => {
  console.log("Setting config to ", config);
  if (config.dark === undefined || config.dark) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  if (config.mono) {
    for (let body of weave.bodies()) {
      body.classList.add("mono");
    }
  } else {
    for (let body of weave.bodies()) {
      body.classList.add("serif");
    }
  }
  document.body.style.fontSize = `${config.fontsize}px`;
};
