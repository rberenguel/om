export { raw, unrawPane };

import { parseIntoWrapper, toMarkdown } from "./parser.js";
import { wireEverything } from "./load.js";

const unrawPane = (body, container) => {
  parseIntoWrapper(body.innerText, body);
  container.raw = false;
  wireEverything(weave.buttons(weave.root));
  container.style.minHeight = "";
};

const rawPane = (body, container) => {
  const md = toMarkdown(container.querySelector(".body"));
  body.innerText = md;
  container.raw = true;
  container.style.minHeight = "fit-content";
  container.style.height = "";
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
