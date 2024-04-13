export { getPropertiesFromFile, parseIntoWrapper, parseInto, iterateDOM, toMarkdown };

import { manipulation, panelFields } from "./panel.js";
import weave from "./weave.js";
import { createPanel, placeTitle } from "./doms.js";
import { iloadIntoBody } from "./loadymcloadface.js";
import { toTop } from "./doms.js";
import { dynamicDiv } from "./dynamicdiv.js";

const parseProperties = (lines) => {
  let properties = {}
  for(const line of lines){
    const split = line.split(" ");
    const property = split[1].replace(":", "");
    const value = split.slice(2).join(" ");
    properties[property] = value

  }
  return properties
}

const getPropertiesFromFile = (text) => {
  const lines = text.split("\n");
  let processingProperties = true;
  let propertiesLines = []
  // TODO can I have this just once?
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
      propertiesLines.push(line)
    }else {
      break
    }
  }
  const properties = parseProperties(propertiesLines) 
  return properties
}

const parseIntoWrapper = (text, body) => {
  console.debug("Parsing: ");
  console.debug(text);
  body.innerHTML = "";
  const container = body.closest(".body-container");
  const lines = text.split("\n");
  let processingProperties = true;
  let rest = [];
  let propertiesLines = []
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
      propertiesLines.push(line)
    }else {
      rest.push(line);
    }
  }
  const properties = parseProperties(propertiesLines) 
  for(const property in properties){
    const value = properties[property]
    manipulation.set(container, property, value);
  }
  manipulation.reposition(container);
  manipulation.resize(container);
  placeTitle(container);

  parseInto(rest.join("\n"), body);
};

const linkStateMachine = (line, body, longerLine) => {
  let accum = [],
    linkText = [],
    linkHref = [],
    reference = [];
  let inLinkText = false,
    inLinkHref = false,
    inReference = false,
    closedReference = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c == "[") {
      if (inLinkText) {
        // We started a link, but actually got a reference. Correct and continue
        inReference = true;
        inLinkText = false;
      } else {
        // We are starting a link: emit whatever text we had up until now.
        // TODO Yes, this is preventing having naked brackets.
        inLinkText = true;
        console.debug("The accumulator at the middle is");
        console.debug(`"${accum}"`);
        if(accum.length > 0){
          const tn = document.createTextNode(accum.join(""));
          accum = [];
          body.appendChild(tn);
        }
      }
      continue;
    }
    if (c == "]") {
      if (inLinkText && linkText.length > 0) {
        inLinkText = false;
        // We have finished the link text. We still don't emit
        // anything though, we need to finish the link.
      } else {
        closedReference += 1;
        if (closedReference == 2) {
          inReference = false; // Reference finished, emit it
          closedReference = 0;
          const link = document.createElement("a");
          const href = reference.join("");
          link.href = href;
          const title = weave.internal.fileTitles[href]
          link.innerText = title;
          link.dataset.internal = true;
          reference = [];
          console.info(`Appending link for ${link}`)
          console.log(line)
          console.log(reference)
          if(line === `[[${href}]]` && !longerLine){
            // The link is alone in a full line
            const div = document.createElement("DIV")
            div.appendChild(link)
            body.appendChild(div)
          } else {
            body.appendChild(link);
          }
          // TODO repetition between internal and external links
          link.addEventListener("click", (ev) => {
            ev.preventDefault(); // Prevent default navigation
            ev.stopPropagation();
            const href = ev.target.getAttribute("href"); // To avoid issues with no-protocol
            if (JSON.parse(link.dataset.internal)) {
              const n = weave.bodies().length;
              const bodyId = `b${n}`; // TODO NO, this is not good enough
              createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
              const body = document.getElementById(bodyId);
              console.debug(link);
              iloadIntoBody(href, body);
              toTop(body);
            } else {
              window.open(href, "_blank");
            }
          });
        }
      }
      continue;
    }
    if (c == "(" && linkText.length > 0) {
      inLinkHref = true;
      continue;
    }
    if (c == ")" && linkText.length > 0) {
      inLinkHref = false;
      // We finished a link, emit it
      const link = document.createElement("a");
      const href = linkHref.join("");
      link.href = href;
      const text = linkText.join("");
      link.textContent = text;
      link.dataset.internal = false;
      linkText = [];
      linkHref = [];
      if(line === `[${text}](${href})` && !longerLine){
        // The link is alone in a full line
        const div = document.createElement("DIV")
        div.appendChild(link)
        body.appendChild(div)
      } else {

        body.appendChild(link);
      }
      console.info(`Appending link for ${link}`)
      // TODO repetition
      link.addEventListener("click", (ev) => {
        ev.preventDefault(); // Prevent default navigation
        ev.stopPropagation();
        const href = ev.target.getAttribute("href"); // To avoid issues with no-protocol
        if (JSON.parse(link.dataset.internal)) {
          const n = weave.bodies().length;
          const bodyId = `b${n}`; // TODO NO, this is not good enough
          createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
          const body = document.getElementById(bodyId);
          console.debug(link);
          iloadIntoBody(href, body);
          toTop(body);
        } else {
          window.open(href, "_blank");
        }
      });
      continue;
    }
    if (inLinkText) {
      linkText.push(c);
      continue;
    }
    if (inLinkHref) {
      linkHref.push(c);
      continue;
    }
    if (inReference) {
      reference.push(c);
      continue;
    }
    accum.push(c);
  }
  console.debug("The accumulator at the end is");
  console.debug(`"${accum.join("").trim()}"`);
  const accumed = accum.join("")
  if(accum.length > 0){
    const tn = document.createTextNode(accumed);
    accum = [];
    if(longerLine){
      body.appendChild(tn);
      return
    }
    if(accumed == line && accumed.trim().length > 0){
      console.debug(`Adding accumulator div with "${accumed}"`);
      const div = document.createElement("div")
      div.appendChild(tn)
      body.appendChild(div)
      //body.appendChild(tn)
    } else {
      body.appendChild(tn);
    }
  }
};

const parseInto = (text, body, mode) => {
  if(text.length == 0){
    return
  }
  console.debug(`parseInto`);
  console.debug(`"${text}"`);
  const lines = text.split("\n");
  let codeBlock = false;
  for (const line of lines) {
    console.debug(`Parsing line: ${line}`);
    if (line.startsWith("<br")) {
      const br = document.createElement("br")
      //const div = document.createElement("div");
      //div.appendChild(document.createElement("br"));
      body.appendChild(br);
      continue;
    }
    if (codeBlock && !line.startsWith("```")) {
      const tn = document.createTextNode(line);
      codeBlock.appendChild(tn);
      codeBlock.appendChild(document.createElement("br"));
      continue;
    }
    if (line == "---") {
      body.appendChild(document.createElement("hr"));
      continue;
    }
    if (line.startsWith("```")) {
      if (codeBlock) {
        body.appendChild(codeBlock);
        codeBlock = false;
      } else {
        codeBlock = document.createElement("pre");
      }
      continue;
    }
    if (line.startsWith("- ")) {
      const li = document.createElement("li");
      const rest = line.slice(2);
      parseInto(rest, li, "preserve");
      body.appendChild(li);
      continue;
    }
    if (line.startsWith("# ")) {
      // Ugly, but this forces out weird cases like lines of hashes
      const h = document.createElement("h1");
      const rest = line.slice(2);
      parseInto(rest, h, "preserve");
      body.appendChild(h);
      continue;
    }
    if (line.startsWith("## ")) {
      // Ugly, but this forces out weird cases like lines of hashes
      const h = document.createElement("h2");
      const rest = line.slice(3);
      parseInto(rest, h, "preserve");
      body.appendChild(h);
      continue;
    }
    if (line.startsWith("### ")) {
      // Ugly, but this forces out weird cases like lines of hashes
      const h = document.createElement("h3");
      const rest = line.slice(4);
      parseInto(rest, h, "preserve");
      body.appendChild(h);
      continue;
    }
    if (line.startsWith("#### ")) {
      // Ugly, but this forces out weird cases like lines of hashes
      const h = document.createElement("h4");
      const rest = line.slice(5);
      parseInto(rest, h, "preserve");
      body.appendChild(h);
      continue;
    }
    // Ignoring code blocks for now, this can go in parsediv
    const [simple, hasDiv] = parseTillTick(line);
    console.debug(`simple: ${simple}, hasDiv: ${hasDiv}`);
    let wd = body
    if(mode != "preserve"){
      // "preserve" means stay in the same context we have been provided instead of creating a new one.
      // I use this to keep a div-per-line structure
      wd = document.createElement("DIV")
    }
    if (!hasDiv) {
      if (simple === null) {
        console.debug(`No div: ${line}`);
        // Here now I need to process links. Let's just inject a small state machine
        linkStateMachine(line, wd);
      } else {
      }
    }
    if (hasDiv) {
      console.debug(`hasDiv: ${hasDiv}`);
      linkStateMachine(simple, wd, "longer");
      //const tn = document.createTextNode(simple);
      //body.appendChild(tn);
      const [div, rest] = parseTillTick(hasDiv);
      console.debug(`div: ${div}, rest: ${rest}`);
      const divNode = parseDiv(div);
      wd.appendChild(divNode);
      console.log("Appended")
      parseInto(rest, wd, "preserve");
    }
    console.log(wd)
    if(mode != "preserve"){
      body.appendChild(wd)
    }
  }
};

const parseTillTick = (text) => {
  console.debug(`parseTillTick: ${text}`);
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

const toMarkdown = (element) => {
  console.debug("Parsing markdown on element");
  console.debug(element);
  const content = iterateDOM(element);
  let saveable = [];
  if (element.classList.contains("body")) {
    const container = element.closest(".body-container");
    saveable = ["<!--\n"];
    for (const prop of Object.values(panelFields)) {
      const value = manipulation.get(container, prop);
      saveable.push(`- ${prop}: ${value}\n`);
    }
    saveable.push("-->\n");
  }
  let fixedContent = []
  fixedContent.push(content[0])
  console.log("Purging of new lines")
  for(let i = 0;i< content.length-1;i++){
    const prev = content[i]
    const curr = content[i+1]
    console.log(`curr: ${curr}`)
    if(prev == "\n" && curr == "\n"){
      console.log("Purging a new line (skips curr)")
      continue
    }
    fixedContent.push(curr)
  }

  fixedContent = fixedContent.join("").trim();
  const fixedSaveable = saveable.join("");
  const markdown = fixedSaveable + fixedContent;
  console.info("Generated as markdown:");
  console.info(markdown);
  return markdown + "\n"; // Always add a new line at the end
};

function iterateDOM(node, mode) {
  // If mode == foldNL it will convert new lines into \n
  // If mode == noNL no new lines will be added to naked divs
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
      //generated.push("\n")
      //}
      continue;
    }
    if (child.classList.contains("wrap")) {
      const button = child.children[0];
      const node = button.nodeName.toLowerCase();
      const action = button.dataset.action;
      const text = button.innerText;
      const md = `\`[div] .wrap ${node} .alive ${action} ${text}\``;
      generated.push(md);
      continue;
    }
    if (child.nodeName === "BR") {
      //generated.push("\n"); // This might be a stretch
      generated.push("\n")
      generated.push("<br id='nodename-br'/>");
      generated.push("\n")
      //generated.push("\n"); // This might be a stretch
    }
    if (child.nodeName === "HR") {
      generated.push("\n"); // This might be a stretch
      generated.push("---");
      generated.push("\n"); // This might be a stretch
    }
    if (child.nodeName === "DIV" && child.classList.length === 0) {
      //generated.push("<br/>");
      //generated.push("<br b/>");
      console.log("Should add new line?")
      console.log(child.textContent)
      console.log(child.parentNode.nodeName)
      console.log(mode)
      if(child.parentNode.nodeName != "LI" && mode != "noNL"){
        console.log("Adding new line")
        generated.push("\n");
      }
      const md = iterateDOM(child);
      generated.push(md);
    }
    if (child.nodeName === "A") {
      // Maybe I should just preserve <a>?
      if (JSON.parse(child.dataset.internal)) {
        const href = child.getAttribute("href");
        generated.push(`[[${href}]]`);
      } else {
        const href = child.getAttribute("href");
        const text = child.innerText;
        generated.push(`[${text}](${href})`);
      }
    }
    if (child.nodeName === "LI") {
      // TODO this is ignoring all possibly HTML inside lists
      const inner = iterateDOM(child).join("");
      //const text = child.innerText;
      let nl = "\n";
      if (mode === "foldNL") {
        nl = "\\n";
      }
      if (child.nextSibling === null) {
        nl = "";
      }
      const md = `- ${inner}${nl}`;
      generated.push(md);
    }
    if (child.nodeName === "H1") {
      // TODO this is ignoring all possibly HTML inside headers
      const text = child.innerText;
      generated.push(`# ${text}\n`);
    }
    if (child.nodeName === "H2") {
      // TODO this is ignoring all possibly HTML inside headers
      const text = child.innerText;
      generated.push(`## ${text}\n`);
    }
    if (child.nodeName === "H3") {
      // TODO this is ignoring all possibly HTML inside headers
      const text = child.innerText;
      generated.push(`### ${text}\n`);
    }
    if (child.nodeName === "H4") {
      // TODO this is ignoring all possibly HTML inside headers
      const text = child.innerText;
      generated.push(`#### ${text}\n`);
    }
    if (child.nodeName === "SPAN" && child.classList.length === 0) {
      const md = iterateDOM(child);
      generated.push(md);
    }
    if (child.nodeName === "PRE") {
      console.debug("PRE");
      const splits = child.innerText.split("\n").filter((l) => l.length > 0);
      console.debug(splits);
      const md = "\n```\n" + splits.join("\n<br id='br-pre'/>\n") + "\n```\n";
      generated.push(md);
    }
    if (child.classList.contains("dynamic-div")) {
      // const text = child.innerText;
      const allClasses = Array.from(child.classList)
        .filter((c) => c != "dynamic-div")
        .map((c) => `.${c}`)
        .join(" ");
      const inner = iterateDOM(child, "foldNL").join("").trim();
      console.debug(`Inner: ${inner}`);
      const toAdd = [allClasses, inner].join(" ").trim();
      console.debug(toAdd);
      const md = `\`[div] .dynamic-div ${toAdd}\``;
      generated.push(md);
      //generated.push("\n");
    }
    //<div class="wired code" data-evalString="12+3" id="c1711130846912" data-kind="javascript">15</div>
    if (child.classList.contains("wired") && child.classList.contains("code")) {
      const kind = child.dataset.kind;
      const id = child.id;
      const evalString = child.dataset.evalString.split("\n").join("\\n"); // TODO This needs a test itself
      const value = child.textContent.split("\n").join("\\n"); // TODO This needs a test itself; TODO extend to other cases of using textContent and not innerText
      const md = `\`[div] .wired .code id=${id} kind=${kind} evalString={${evalString}} value={${value}}\``;
      generated.push(md);
      continue;
    }
  }
  return generated.flat(Infinity);
}

const divBlock = "[div]";

const parseDiv = (divData) => {
  console.debug(`Parsing div: ${divData}`);
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
    const text = splits.slice(1).join(" ");
    return dynamicDiv(text);
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
    console.debug(`Code, value: ${value}`);
    const evalString = rest
      .replace(" " + veq + value + "}", "")
      .replace(esq, "")
      .slice(0, -1);
    console.debug(`Code, evalString: ${evalString}`);
    const div = document.createElement("div");
    div.classList.add("wired");
    div.classList.add("code");
    div.id = id;
    div.dataset.evalString = evalString;
    div.textContent = value; // TODO extend to the other cases
    div.dataset.kind = kind;
    return div;
  }
  return;
};
