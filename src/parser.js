export { parseIntoWrapper, iterateDOM, toMarkdown };

import { manipulation, panelFields } from "./panel.js";


import { dynamicDiv } from "./dynamicdiv.js";



const parseIntoWrapper = (text, body) => {
  console.info("Parsing: ");
  console.info(text);
  body.innerHTML = "";
  const container = body.closest(".body-container");
  const lines = text.split("\n");
  let processingProperties = true;
  let rest = [];
  for (const line of lines) {
    if (processingProperties) {
      // Processing properties
      if (line.startsWith("<!--")) {
        continue;
      }
      if (line.startsWith("-->")) {
        processingProperties = false;
        continue;
      }
      const split = line.split(" ");
      const property = split[1].replace(":", "");
      const value = split[2];
      manipulation.set(container, property, value);
      continue;
    }
    manipulation.reposition(container);
    manipulation.resize(container);
    rest.push(line);
  }
  parseInto(rest.join("\n"), body);
};

const parseInto = (text, body) => {
  const lines = text.split("\n");
  for (const line of lines) {
    if (line == "<br/>") {
      body.appendChild(document.createElement("div"));
      continue;
    }
    if (line == "---") {
      body.appendChild(document.createElement("hr"));
      continue;
    }
    // Ignoring code blocks for now, this can go in parsediv
    const [simple, hasDiv] = parseTillTick(line);

    if (!hasDiv) {
      if (simple === null) {
        const tn = document.createTextNode(line);
        body.appendChild(tn);
      } else {
      }
    }
    if (hasDiv) {
      const tn = document.createTextNode(simple);
      body.appendChild(tn);
      const [div, rest] = parseTillTick(hasDiv);
      const divNode = parseDiv(div, body);
      body.appendChild(divNode);
      parseInto(rest, body);
    }
  }
};

const parseTillTick = (text) => {
  const regex = /^(.*?)`(.*)$/s;
  const match = text.match(regex);
  if (!match) {
    return [null, null];
  }
  if (match.length == 0) {
    return [null, null];
  }
  if (match.length == 1) {
    return [match[1], null];
  }
  return [match[1], match[2]];
};

const toMarkdown = (container) => {
  const content = iterateDOM(container.querySelector(".body"));
  let saveable = ["<!--\n"];
  for (const prop of Object.values(panelFields)) {
    const value = manipulation.get(container, prop);
    saveable.push(`- ${prop}: ${value}\n`);
  }
  saveable.push("-->\n");
  const markdown = saveable.concat(content).join("")
  console.info("Generated as markdown:")
  console.info(markdown)
  return markdown;
};

function iterateDOM(node) {
  // The generated structures are never more than 2 levels deep, seems, for now
  let generated = [];
  for (const child of node.childNodes) {
    //iterateDOM(child);
    if (child.nodeName === "#text") {
      const text = child.textContent;
      //if(text.trim() === ""){
      //  continue
      //} else {
      generated.push(text);
      //}
      continue;
    }
    if (child.classList.contains("wrap")) {
      const button = child.children[0];
      const node = button.nodeName;
      const action = button.dataset.action;
      const text = button.innerText;
      const md = `\`[div] .wrap ${node} .alive ${action} ${text}\``;
      generated.push(md);
      continue;
    }
    if (child.nodeName === "BR") {
      continue;
      generated.push("\n"); // This might be a stretch
      generated.push("<br/>");
      generated.push("\n"); // This might be a stretch
    }
    if (child.nodeName === "HR") {
      generated.push("\n"); // This might be a stretch
      generated.push("---");
      generated.push("\n"); // This might be a stretch
    }
    if (child.nodeName === "DIV" && child.classList.length === 0) {
      generated.push("\n");
      generated.push("<br/>");
      generated.push("\n");
      const md = iterateDOM(child);
      generated.push(md);
    }
    if (child.nodeName === "SPAN" && child.classList.length === 0) {
      const md = iterateDOM(child);
      generated.push(md);
    }
    if (child.classList.contains("dynamic-div")) {
      const text = child.innerText;
      const allClasses = Array.from(child.classList).filter(c => c != "dynamic-div").map(c => `.${c}`).join(" ")
      const md = `\`[div] .dynamic-div ${allClasses} ${text}\``;
      generated.push(md);
      generated.push("\n");
    }
    //<div class="wired code" data-eval_string="12+3" id="c1711130846912" data-kind="javascript">15</div>
    if (child.classList.contains("wired") && child.classList.contains("code")) {
      const kind = child.dataset.kind;
      const id = child.id;
      const evalString = child.dataset.eval_string;
      const value = child.innerText;
      const md = `\`[div] .wired .code id=${id} kind=${kind} evalString={${evalString}} value={${value}}\``;
      generated.push(md);
      continue;
    }
  }
  return generated.flat(Infinity);
}

const divBlock = "[div]";

const parseDiv = (divData) => {
  if (!divData.startsWith(divBlock)) {
    return divData; // This eventually should create a textNode for code blocks in Markdown
  }
  const splits = divData
    .replace(divBlock, "")
    .split(" ")
    .filter((n) => n.length > 0);
  const klass = splits[0];
  if (klass === ".wrap") {
    const div = document.createElement("div");
    div.contentEditable = false;
    div.classList.add("wrap");
    const nodeType = splits[1];
    const node = document.createElement(nodeType);
    node.classList.add("alive"); // TODO Why do I keep alive?
    node.dataset.action = splits[3];
    node.innerText = splits[4];
    div.appendChild(node);
    return div;
  }
  if (klass === ".dynamic-div") {
    const text = splits.slice(1).join(" ")
    return dynamicDiv(text)
  }
  // [div] .wired .code id=c1711131479729 kind=javascript evalString={{44 + 12}} value={56}`
  if (klass === ".wired") {
    const veq = "value={";
    const esq = "evalString={";
    const noHeader = divData.replace("[div] .wired .code id=", "");
    const noHeaderSplits = noHeader.split(" ");
    const id = noHeaderSplits[0];
    const kind = noHeaderSplits[1].replace("kind=", "");
    const rest = noHeaderSplits.slice(2).join(" ");
    // The rest need more work.
    const value = rest.slice(rest.lastIndexOf(veq) + veq.length, -1);
    const evalString = rest
      .replace(" " + veq + value + "}", "")
      .replace(esq, "")
      .slice(0, -1);
    const div = document.createElement("div");
    div.classList.add("wired");
    div.classList.add("code");
    div.id = id;
    div.dataset.eval_string = evalString;
    div.innerText = value;
    div.dataset.kind = kind;
    return div;
  }
  return;
};
