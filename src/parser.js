export {
  getPropertiesFromFile,
  parseIntoWrapper,
  parseInto,
  iterateDOM,
  toMarkdown,
};

import weave from "./weave.js";
import { manipulation, panelFields } from "./manipulation.js";
import { createPanel } from "./panel.js";
import { placeTitle } from "./title.js";
import { iloadIntoBody } from "./loadymcloadface.js";
import { toTop } from "./doms.js";
import { dynamicDiv } from "./dynamicdiv.js";
import { calWithEvents, parseCalendar } from "./cal.js";
import { xgidRenderer } from "./xgid.js";
import { cmap } from "./cmap.js";

import { renderCard } from "./deck.js";

const DEBUG = false;

const parseProperties = (lines) => {
  let properties = {};
  for (const line of lines) {
    if (line.trim().length == 0) {
      continue;
    }
    try {
      const split = line.split(" ");
      const property = split[1].replace(":", "");
      const value = split.slice(2).join(" ");
      properties[property] = value;
    } catch (err) {
      console.error("Failed parsing a property, failing line: ", line);
      console.error(err);
    }
  }
  return properties;
};

const getPropertiesFromFile = (text) => {
  const lines = text.split("\n");
  let processingProperties = true;
  let propertiesLines = [];
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
      propertiesLines.push(line);
    } else {
      break;
    }
  }
  const properties = parseProperties(propertiesLines);
  return properties;
};

const parseIntoWrapper = (text, body, options = {}) => {
  if (DEBUG) {
    console.debug("Parsing: ");
    console.debug(text);
  }
  body.innerHTML = "";
  const container = body.closest(".body-container");
  const lines = text.split("\n");
  let processingProperties = true;
  let rest = [];
  let propertiesLines = [];
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
      propertiesLines.push(line);
    } else {
      rest.push(line);
    }
  }
  const properties = parseProperties(propertiesLines);
  for (const property in properties) {
    const value = properties[property];
    manipulation.set(container, property, value);
  }
  if (!options.keepStill) {
    manipulation.reposition(container);
    manipulation.resize(container);
  } else {
    manipulation.forcePositionToReality(container);
    //manipulation.forceSizeToReality(container);
  }
  placeTitle(container);
  const kind = manipulation.get(container, manipulation.fields.kKind);
  if (kind.trim() === "literal") {
    console.info("Parsing literal document");
    body.style.whiteSpace = "pre-wrap";
    body.innerText = rest.join("\n");
  } else {
    console.info("Parsing full markdown document");
    parseInto(rest.join("\n"), body);
  }
  const startup = properties[manipulation.fields.kStartup];
  if (startup && options.starting) {
    console.warn(startup);
    if (startup.includes("cmap")) {
      cmap.action(null, body).then(() => {
        body.click();

        toTop(body)();
        const container = body.closest(".body-container");
        body.focus();
        container.render();
        setTimeout(() => {
          container.render();
          container.render();
        }, 1);
      });
    }
    /*if (startup.includes("card")) {
      body.click();
      toTop(body)();
      renderCard(body);
    }*/
    // This may be a bad idea
  }
};

const linkStateMachine = (line, body, mode = "") => {
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
        if (DEBUG) {
          console.debug("The accumulator at the middle is");
          console.debug(`"${accum}"`);
        }
        if (accum.length > 0) {
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
        // anything though, we need to finish, potentially, the link.
      } else {
        if (DEBUG) console.log("closing references");
        closedReference += 1;
        if (DEBUG) console.log(closedReference);
        if (DEBUG) console.log(linkText);
        if (closedReference == 2) {
          inReference = false; // Reference finished, emit it
          closedReference = 0;
          const link = document.createElement("a");
          const href = reference.join("");
          link.href = href;
          const title = weave.internal.fileTitles[href];
          link.innerText = reference.join(""); // TODO was title, why?
          link.dataset.internal = true;
          reference = [];
          if (DEBUG) {
            console.log(`Appending link for ${link}`);
            console.log(line);
            console.log(reference);
          }
          if (line === `[[${href}]]` && !mode.includes("longer")) {
            // The link is alone in a full line
            const div = document.createElement("DIV");
            div.appendChild(link);
            body.appendChild(div);
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
              if (DEBUG) {
                console.debug(link);
              }
              iloadIntoBody(href, body);
              toTop(body)();
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
    if (c == ")") {
      // We can either be in a real link reference, or just getting some braces
      if (!inLinkHref) {
        // A link has not really been started (something like `([a])` or `([])` maybe)
        if (DEBUG) console.log("not inlink, with", closedReference);
        if (linkText.length > 0 || closedReference > 0) {
          accum.push(`[${linkText}])`);
          closedReference = 0;
        } else {
          accum.push(")");
        }
        continue;
      }

      inLinkHref = false;
      // We _potentially_ finished a link, emit it
      const link = document.createElement("a");
      const href = linkHref.join("");
      link.href = href;
      const text = linkText.join("");
      link.textContent = text;
      link.dataset.internal = false;
      linkText = [];
      linkHref = [];
      if (line === `[${text}](${href})` && !mode.includes("longer")) {
        // The link is alone in a full line
        const div = document.createElement("DIV");
        div.appendChild(link);
        body.appendChild(div);
      } else {
        body.appendChild(link);
      }
      if (DEBUG) console.log(`Appending link for ${link}`);
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
          if (DEBUG) console.debug(link);
          iloadIntoBody(href, body);
          toTop(body)();
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
  if (DEBUG) {
    console.debug(`Mode ${mode}, the accumulator at the end is`);
    console.debug(`"${accum.join("").trim()}"`);
  }
  const accumed = accum.join("");
  if (accum.length > 0) {
    const tn = document.createTextNode(accumed);
    accum = [];
    if (mode.includes("longer")) {
      body.appendChild(tn);
      return;
    }
    if (accumed == line && accumed.trim().length > 0) {
      if (DEBUG) console.log(`Accumed: ${accumed}, line: ${line}`);
      if (mode.includes("preserve")) {
        if (DEBUG)
          console.debug(`Preserving accumulator (no new div) "${accumed}"`);
        body.appendChild(tn);
      } else {
        if (DEBUG) console.debug(`Adding accumulator div with "${accumed}"`);
        const div = document.createElement("div");
        div.appendChild(tn);
        body.appendChild(div);
      }
      //body.appendChild(tn)
    } else {
      body.appendChild(tn);
    }
  }
};

const parseInto = (text, body, mode = "") => {
  // mode: noDrag
  if (!text) {
    console.warn("No text provided for parseInto");
    return;
  }
  if (text.length == 0) {
    return;
  }
  if (DEBUG) {
    console.debug(`parseInto with mode ${mode}`);
    console.debug(`"${text}"`);
  }
  const lines = text.split("\n");
  let codeBlock = false;
  for (const line of lines) {
    if (DEBUG) console.debug(`Parsing line: ${line}`);
    if (line.startsWith("<br")) {
      const br = document.createElement("br");
      if (codeBlock) {
        codeBlock.appendChild(br);
      } else {
        if (DEBUG) console.log("Appending a br");
        if (DEBUG) console.log(line);
        body.appendChild(br);
      }

      continue;
    }
    if (codeBlock && !line.startsWith("```")) {
      const tn = document.createTextNode(line);
      codeBlock.appendChild(tn);
      codeBlock.appendChild(document.createElement("br"));
      continue;
    }
    if (line.startsWith("---")) {
      const rest = line.replace("---", "").trim();
      if (rest.length > 0 && !rest.startsWith(".")) {
        // Unexpected stuff on a supposed ruler…
        continue;
      }
      const hr = document.createElement("hr");
      if (rest.startsWith(".")) {
        // It has a class
        for (const klass of rest.replaceAll(".", " ").trim().split(" ")) {
          hr.classList.add(klass);
        }
      }
      body.appendChild(hr);
      continue;
    }
    if (line.startsWith("```")) {
      if (codeBlock) {
        body.appendChild(codeBlock);
        codeBlock = false;
      } else {
        const klasses = line.trim().replace("```", "").trim();
        codeBlock = document.createElement("PRE");
        if (klasses) {
          for (const klass of klasses.split(" ")) {
            if (klass.startsWith(".")) {
              codeBlock.classList.add(klass.replace(".", ""));
            }
          }
        }
      }
      continue;
    }
    if (line.startsWith("- ")) {
      const li = document.createElement("li");
      const rest = line.slice(2);
      if (DEBUG) console.log("List mode");
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
    if (DEBUG) console.debug(`simple: ${simple}, hasDiv: ${hasDiv}`);
    let wd = body;
    if (!mode.includes("preserve")) {
      // "preserve" means stay in the same context we have been provided instead of creating a new one.
      // I use this to keep a div-per-line structure
      wd = document.createElement("DIV");
    }
    if (DEBUG) console.debug(wd.classList);
    if (!hasDiv) {
      if (simple === null) {
        if (DEBUG) console.debug(`No div: ${line}`);
        // Here now I need to process links. Let's just inject a small state machine
        linkStateMachine(line, wd, mode);
      } else {
      }
    }
    if (hasDiv) {
      if (DEBUG) console.debug(`hasDiv: ${hasDiv}`);
      if (DEBUG) console.debug(wd);
      // Propagate the mode, we might want to preserve the link state machine output without adding any new divs
      linkStateMachine(simple, wd, `longer|${mode}`);
      //const tn = document.createTextNode(simple);
      //body.appendChild(tn);
      const [div, rest] = parseTillTick(hasDiv);
      if (DEBUG) console.debug(`div: ${div}, rest: ${rest}`);
      const divNode = parseDiv(div);
      wd.appendChild(divNode);
      if (DEBUG) console.log("Appended");
      parseInto(rest, wd, `preserve|${mode}`);
    }
    if (DEBUG) console.log(wd);
    if (!mode.includes("preserve")) {
      body.appendChild(wd);
    }
  }
};

const parseTillTick = (text) => {
  if (DEBUG) console.debug(`parseTillTick: ${text}`);
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

const toMarkdown = (element, fragment = false) => {
  if (DEBUG) {
    console.debug("Parsing markdown on element");
    console.debug(element);
  }
  // TODO text and literal should be part of some enum-like
  let kind;
  if (fragment) {
    kind = "pasted";
  } else {
    kind = manipulation.get(element, manipulation.fields.kKind);
  }
  let content;
  if (kind.trim() === "literal") {
    content = element.innerText;
  } else {
    content = content = iterateDOM(element);
  }
  let saveable = [];
  if (element.classList.contains("body")) {
    const container = element.closest(".body-container");
    saveable = ["<!--\n"];
    for (const prop of Object.values(panelFields)) {
      console.info(`Pulling ${prop} from container`);
      const _value = manipulation.get(container, prop);
      let value = _value;
      if (typeof _value !== "string") {
        value = JSON.stringify(_value);
      }
      saveable.push(`- ${prop}: ${value}\n`);
    }
    saveable.push("-->\n");
  }
  let fixedContent = [];
  fixedContent.push(content[0]);
  if (DEBUG) console.log("Purging of new lines");
  for (let i = 0; i < content.length - 1; i++) {
    const prev = content[i];
    const curr = content[i + 1];
    if (DEBUG) console.log(`curr: ${curr}`);
    if (prev == "\n" && curr == "\n") {
      if (DEBUG) console.log("Purging a new line (skips curr)");
      continue;
    }
    fixedContent.push(curr);
  }

  fixedContent = fixedContent.join("").trim();
  const fixedSaveable = saveable.join("");
  const markdown = fixedSaveable + fixedContent;
  console.info("Generated as markdown:");
  console.info(markdown);
  return markdown + "\n"; // Always add a new line at the end
};

function iterateDOM(node, mode = "") {
  // If mode == foldNL it will convert new lines into \n
  // If mode == noNL no new lines will be added to naked divs
  // The generated structures are never more than 2 levels deep, seems, for now
  let generated = [];
  let isFirstList = true;
  if (mode.includes("foldNL")) {
    // Lists (alone) in divs only work well if they don't take into account this
    isFirstList = false;
  }
  for (const child of node.childNodes) {
    //iterateDOM(child);
    if (child.classList && child.classList.contains("weave-skip")) {
      // Mandatory skip
      continue;
    }
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
    if (child.nodeName == "TABLE" && child.classList.contains("calendar")) {
      const events = parseCalendar(child);
      const stringified = JSON.stringify(events);
      const md = `\`[div] .calendar ${stringified}\`\n`;
      generated.push(md);
      continue;
    }
    if (child.nodeName != "LI" && !mode.includes("foldNL")) {
      isFirstList = true;
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
      if (node.nodeName === "PRE") {
        // Skip BRs in PREs
        continue;
      }
      generated.push("\n");
      generated.push("<br id='nodename-br'/>");
      generated.push("\n");
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
      if (DEBUG) {
        console.log("Should add new line?");
        console.log(child.textContent);
        console.log(child.parentNode.nodeName);
        console.log(mode);
      }
      if (child.parentNode.nodeName != "LI" && !mode.includes("noNL")) {
        if (DEBUG) console.log("Adding new line");
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
      const inner = iterateDOM(child).join("");
      //const text = child.innerText;
      let nl = "\n";
      if (mode.includes("foldNL")) {
        nl = "\\n";
      }
      if (child.nextSibling === null) {
        nl = "";
      }
      let md = "";
      if (isFirstList) {
        md = nl;
        isFirstList = false;
      }
      md += `- ${inner}${nl}`;
      generated.push(md);
    }
    // TODO headers need tests, particularly for additional inlined content like buttons
    if (child.nodeName === "H1") {
      const md = iterateDOM(child);
      generated.push(`\n# ${md.join(" ")}\n`);
    }
    if (child.nodeName === "H2") {
      const md = iterateDOM(child);
      generated.push(`\n## ${md.join(" ")}\n`);
    }
    if (child.nodeName === "H3") {
      const md = iterateDOM(child);
      generated.push(`\n### ${md.join(" ")}\n`);
    }
    if (child.nodeName === "H4") {
      const md = iterateDOM(child);
      generated.push(`\n#### ${md.join(" ")}\n`);
    }
    if (child.nodeName === "SPAN" && child.classList.length === 0) {
      const md = iterateDOM(child);
      generated.push(md);
    }
    if (child.nodeName === "P") {
      const md = iterateDOM(child);
      generated.push(md);
      generated.push("\n<br id='paragraph'/>\n");
    }
    if (child.nodeName === "PRE") {
      if (DEBUG) console.debug("PRE");
      const splits = child.innerText.split("\n").filter((l) => l.length > 0);
      const allClasses = Array.from(child.classList)
        .map((c) => `.${c}`)
        .join(" ");
      if (DEBUG) console.debug(splits);
      const md =
        "\n```" +
        ` ${allClasses}\n` +
        splits.join("\n<br id='br-pre'/>\n") +
        "\n```\n";
      generated.push(md);
    }
    if (child.classList.contains("dynamic-div")) {
      // const text = child.innerText;
      const allClasses = Array.from(child.classList)
        .filter((c) => c != "dynamic-div")
        .map((c) => `.${c}`)
        .join(" ");
      const iterated = iterateDOM(child, "foldNL").map((e) => {
        if (e == "\n") {
          return "\\n";
        }
        return e;
      });
      if (DEBUG) console.debug(`Iterated: ${iterated}`);
      const head = iterated.join("").trim();
      if (DEBUG) console.debug(`head: ${head}`);
      const inner = head.replace(/^(\\n)+/, "").replaceAll("\\n\\n", "\\n");
      if (DEBUG) console.debug(`Inner: ${inner}`);
      const toAdd = [allClasses, inner].join(" ").trim();
      if (DEBUG) console.debug(toAdd);
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
    if (child.classList.contains("bg-board-wrapper")) {
      const xgid = child.dataset.xgid;
      const md = `\`[div] .bg-board xgid=${xgid}\``;
      generated.push(md);
      continue;
    }
  }
  return generated.flat(Infinity);
}

const divBlock = "[div]";

const parseDiv = (divData, mode = "") => {
  if (DEBUG) console.debug(`Parsing div: ${divData}, mode: ${mode}`);
  if (!divData) {
    console.error("This is bad, no div data");
    const div = document.createElement("div");
    div.id = "failure-processing-div";
    return div;
  }
  if (!divData.startsWith(divBlock)) {
    if (DEBUG) console.debug(`Not a div`);
    return divData; // This eventually should create a textNode for code blocks in Markdown
  }
  const splits = divData
    .replace(divBlock, "")
    .split(" ")
    .filter((n) => n.length > 0);
  const klasses = splits[0];
  if (klasses.startsWith(".wrap")) {
    const div = document.createElement("div");
    div.contentEditable = false;
    for (const klass of klasses.replaceAll(".", " ").trim().split(" ")) {
      div.classList.add(klass);
    }
    const nodeType = splits[1];
    const node = document.createElement(nodeType);
    node.classList.add("alive"); // TODO Why do I keep alive?
    node.dataset.action = splits[3];
    node.innerText = splits.slice(4).join(" ");
    div.appendChild(node);
    return div;
  }
  if (klasses === ".calendar") {
    if (DEBUG) console.debug(`Calendar`);
    const events = JSON.parse(splits.slice(1).join(" "));
    console.log(events);
    const div = document.createElement("div");
    events.span = 1;
    const tables = calWithEvents(events, mode);
    return tables[0];
  }
  if (klasses === ".dynamic-div") {
    if (DEBUG) console.debug(`Dynamic div`);
    const text = splits.slice(1).join(" ");
    return dynamicDiv(text, mode);
  }
  if (klasses === ".bg-board") {
    const xgid = divData.replace("[div] .bg-board xgid=", "");
    console.log(divData, xgid);
    const board = xgidRenderer.render(xgid);
    return board;
  }
  // [div] .wired .code id=c1711131479729 kind=javascript evalString={{44 + 12}} value={56}`
  if (klasses === ".wired") {
    const veq = "value={";
    const esq = "evalString={";
    const noHeader = divData.replace("[div] .wired .code id=", "");
    const noHeaderSplits = noHeader.split(" ");
    const id = noHeaderSplits[0];
    const kind = noHeaderSplits[1].replace("kind=", "");
    const rest = noHeaderSplits.slice(2).join(" ");
    // The rest need more work.
    const value = rest.slice(rest.lastIndexOf(veq) + veq.length, -1);
    if (DEBUG) console.debug(`Code, value: ${value}`);
    const evalString = rest
      .replace(" " + veq + value + "}", "")
      .replace(esq, "")
      .slice(0, -1);
    if (DEBUG) console.debug(`Code, evalString: ${evalString}`);
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
