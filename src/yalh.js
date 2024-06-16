// Yet Another Load Helper

// Ideally this will be created once

export { loadHelper };

import { get } from "./libs/idb-keyval.js";

const loadHelper = () => {
  let helper = {};
  let decodedCache = {};
  const load = async (id, options = {}) => {
    if (decodedCache[id] && !options.skipCache) {
      return decodedCache[id];
    }
    return get(id)
      .then((content) => {
        const value = content.split(" ").slice(-1);
        const decoded = decodeURIComponent(atob(value));
        decodedCache[id] = decoded;
        return decoded;
      })
      .catch((err) => {
        console.error(err);
      });
  };
  const markdownLines = async (id, options = {}) => {
    return load(id, options).then((decoded) => {
      const lines = decoded.split("\n");
      let markdownOnly = [];
      let emit = false;
      for (const line of lines) {
        if (emit) {
          markdownOnly.push(line);
        }
        if (line.trim() === "-->") {
          emit = true;
        }
      }
      return markdownOnly;
    });
  };
  helper.load = load;
  helper.markdownLines = markdownLines;
  return helper;
};
