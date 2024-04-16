export {
  getClosestBodyContainer,
  wireEverything,
  addGoogFont,
  setConfig,
  decodeSerializedData,
};

import weave from "./weave.js";
import { createPanel } from "./panel.js";
import { wireEval } from "./code.js";

const DEBUG = false;

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
  if (DEBUG) console.info("Wiring");
  const codes = document.querySelectorAll(".code.wired");
  let i = 0;
  for (let cod of codes) {
    cod.hover_title = `[${i}] ${cod.hover_title}`;
    i++;
    if (DEBUG) console.log("data", cod.dataset.eval_string);
    wireEval(cod);
    cod.eval();
  }
  // Now lets wire the buttons
  const aliveButtons = document.querySelectorAll("div>.alive");
  if (DEBUG) {
    console.log("Wiring all these:");
    console.log(aliveButtons);
  }
  for (let aliveButton of aliveButtons) {
    for (let button of buttons) {
      // This could be sped up by reversing the indexing
      // TODO this is repeated with wiring buttons. Needs isolation
      if (
        button.text &&
        button.text.includes(aliveButton.dataset.action) &&
        !aliveButton.alive
      ) {
        aliveButton.onmousedown = button.action;
        if (DEBUG)
          console.info(`Setting click on ${aliveButton.dataset.action}`);
        aliveButton.alive = true;
        aliveButton.addEventListener("dblclick", (ev) => {
          if (DEBUG) console.debug("Preventing folding");
          weave.internal.preventFolding = true;
        });
      }
      if (
        button.matcher &&
        button.matcher.test(aliveButton.dataset.action) &&
        !aliveButton.alive
      ) {
        aliveButton.onmousedown = button.action(aliveButton.dataset.action);
        if (DEBUG)
          console.info(`Setting click on ${aliveButton.dataset.action}`);
        aliveButton.alive = true;
        aliveButton.addEventListener("dblclick", (ev) => {
          if (DEBUG) console.debug("Preventing folding");
          weave.internal.preventFolding = true;
        });
      }
    }
  }
};

const addGoogFont = (fontname) => {
  if (DEBUG) console.log(`Adding from Google Fonts: ${fontname}`);
  const linkElement = document.createElement("link");
  linkElement.rel = "stylesheet";
  linkElement.href = `https://fonts.googleapis.com/css2?family=${fontname}`;
  document.head.appendChild(linkElement);
  return linkElement.href;
};

const decodeSerializedData = (data) => {
  const decodedHash = decodeURIComponent(data);
  let [configData, bodiesData] = decodedHash.split("\u2223");
  const parsedConfig = JSON.parse(configData);
  if (bodies) {
    let parsedDodiesData = JSON.parse(splitHash[1]);
    return [parsedConfig, parsedDodiesData];
  }
  return [parsedConfig];
};

const setConfig = (config) => {
  if (DEBUG) console.log("Setting config to ", config);
  if (config.dark === undefined || config.dark) {
    //document.body.classList.add("dark");
  } else {
    //document.body.classList.remove("dark");
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
};
