export { raw, unrawPane };

import weave from "../src/weave.js";

import { parseIntoWrapper, toMarkdown } from "./parser.js";
import { wireEverything } from "./load.js";

const unrawPane = (body, container) => {
  parseIntoWrapper(body.innerText, body);
  container.raw = false;
  wireEverything(weave.buttons(weave.root));
};

const rawPane = (body, container) => {
  const md = toMarkdown(container.querySelector(".body"));
  body.innerText = md;
  container.raw = true;
};

const raw = {
  text: ["raw"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    if (container.raw) {
      unrawPane(body, container);
    } else {
      rawPane(body, container);
    }
  },
  description: "HERE BE DRAGONS!1!",
  el: "u",
};
