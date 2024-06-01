export { id, eval_, sql, wireEval };

import { reset, common } from "./commands_base.js";

import { pad, wrap, postfix } from "./doms.js";

import weave from "./weave.js";

// Allow access to a common context for accessing the internals.
// I may make this more extensive, for interesting "libraries"
function contextualEval(code, data) {
  console.log(`Evaluating in context, ${code} with context`);
  console.log(data);
  /*function evaling(code){
    const evaluation = eval?.(code);
    return evaluation
  }
  return evaling.call(data, code);*/
  const foo = {
    foo: Function(code),
    data: data,
  };
  const func = foo.foo.bind(foo);
  const evaluation = func();
  console.log("evaluation result:");
  console.log(evaluation);
  return evaluation;
}

const evalSQL = (selectionText) => {
  try {
    const evaluation = alasql(selectionText);
    console.log("SQL evaluation: ");
    console.log(typeof evaluation);
    console.log(Array.isArray(evaluation));
    console.log(evaluation);
    const lines = selectionText.split("\n");
    const multiline = lines.length > 1;
    let result;
    // Multiline will always return an object, but the values will be integers (affected rows)
    if (typeof evaluation !== "object" && !multiline) {
      return [
        null,
        null,
        [document.createTextNode(selectionText)],
        null,
        evaluation,
      ];
    }
    const filtered = evaluation.filter((element) => !Number.isInteger(element));
    if (filtered.length == 0) {
      return [
        null,
        null,
        [document.createTextNode(selectionText)],
        null,
        evaluation,
      ];
    }
    if (Array.isArray(filtered[0])) {
      // This case assumes we got just one result row on a multi-statement
      result = filtered[0];
    } else {
      // This is that we got an array of objects, i.e. a table to process
      result = filtered;
    }
    let headers = new Set();
    for (const row of result) {
      Object.keys(row).forEach((key) => headers.add(key));
    }
    headers = Array.from(headers);
    const table = document.createElement("table");

    const headerRow = table.insertRow();
    headers.forEach((key) => {
      const th = document.createElement("th");
      th.textContent = key;
      headerRow.appendChild(th);
    });

    // Data Rows
    result.forEach((row) => {
      const tableRow = table.insertRow();
      headers.forEach((key) => {
        const cell = tableRow.insertCell();
        cell.textContent = row[key] || ""; // Handle potential missing values
      });
    });
    return [null, null, [table], null, evaluation];
  } catch (error) {
    console.error("Evaluation (SQL) failed: ", error);
    return [null, null, null, error, null];
  }
};

const evalJS = (selectionText, body, node) => {
  try {
    const evaluation = contextualEval(selectionText, {
      weave: weave,
      body: body,
      node: node,
    }); //eval?.(selectionText);
    const lines = selectionText.split("\n");
    const multiline = lines.length > 1;
    let assignment, rvalue;
    if (!multiline) {
      console.log("not multiline");
      const matchesAssignment = selectionText.match(/(\w*)\s*=\s*(.*)/);
      if (matchesAssignment) {
        const variable = matchesAssignment[1];
        console.log("Has an equal, variable is named ", variable);
        assignment = document.createElement("span");
        assignment.classList.add("assignment");
        rvalue = document.createTextNode(matchesAssignment[2]);
        const assignmentText = document.createTextNode(`${variable}`);
        assignment.appendChild(assignmentText);
      }
      const text = document.createTextNode(JSON.stringify(evaluation));
      return [assignment, rvalue, [text], null, evaluation];
    }
    const texts = lines.map((line) => document.createTextNode(line));
    return [assignment, rvalue, texts, null, evaluation];
  } catch (error) {
    console.error("Evaluation of (JS) failed: ", error);
    return [null, null, null, error];
  }
};

const evalExpr = (selectionText, kind, body, node) => {
  console.log("Evaluating " + selectionText);
  const whitespaceRegex = /^\s+$/;
  if (whitespaceRegex.test(selectionText)) {
    return [null, null, null, null, null];
  }
  if (kind == "javascript") {
    return evalJS(selectionText, body, node);
  }
  if (kind == "sql") {
    return evalSQL(selectionText);
  }
};

const formatEvaluation = (
  code,
  selectionText,
  kind,
  assignment,
  rvalue,
  return_text,
  error,
  evaluation,
  skipAssignment,
  skipPlain,
) => {
  code.classList.add("wired", "code");
  if (skipPlain || skipAssignment) {
    // If the block is wired we skip
    console.log("Skipping already wired");
    // I'm returning undefined for now, but I likely will need the node
    // further down.
    if (skipPlain) {
      return undefined;
    } else {
      return undefined;
    }
  } else {
    code.dataset.evalString = selectionText.split("\n").join("\\n");
    console.info("Setting data string to ", code.dataset.evalString);
    code.hover_title = code.dataset.evalString.replaceAll("\\n", "\n");
    code.id = "c" + Date.now();
    if (error) {
      code.appendChild(document.createTextNode(selectionText));
      code.classList.add("error");
      code.hover_title = error; // Beware padding with error in multiline
      pad(code);
      wrap(code);
      return code;
    }
    console.log("Passed through, assigning to variable if needed");
    console.info(evaluation);
    if (kind === "sql" && evaluation) {
      try {
        // Assign to a helper variable
        const foo = `${code.id} = ${JSON.stringify(evaluation)}`;
        console.info(`Evaluating ${foo}`);
        eval?.(foo);
      } catch (error) {
        console.error("Could not assign SQL to variable: ", error);
      }
    }

    if (assignment) {
      code.appendChild(assignment);
      code.appendChild(rvalue);
      assignment.insertAdjacentHTML("afterend", " = ");
      postfix(code);
    } else {
      if (return_text.length == 1) {
        // This no-op is needed to prevent floating weirdness (beforebegin)
        // and to allow the cursor to go to the end (afterend)
        wrap(code);
      } else {
        postfix(code);
      }
      console.log("Multiline evaluation returned");
      console.log(return_text);
      if (kind === "javascript") {
        console.log("Creating node with");
        console.log(evaluation);
        const tn = document.createTextNode(evaluation);
        code.appendChild(tn);
        return code;
      }
      for (let i = 0; i < return_text.length; i++) {
        const line = return_text[i];
        code.appendChild(line);
        if (i != return_text.length - 1) {
          const lineBreak = document.createElement("br");
          code.appendChild(lineBreak);
        }
      }
    }
  }
  return code;
};

const wireEvalFromScratch = (kind) => {
  const selection = window.getSelection();
  const selectionText = selection + "";
  const body = selection.anchorNode.parentElement.closest(".body").id; //anchorNode.closest(".body").id
  console.log(body);
  console.log(`Wiring eval, first time: ${selectionText}`);
  let code = document.createElement("DIV");
  let [assignment, rvalue, return_text, error, evaluation] = evalExpr(
    selectionText,
    kind,
    body,
    code,
  );
  console.info(kind);
  console.info("A, R, R_T, Er, Ev:");
  console.info(assignment, rvalue, return_text, error, evaluation);
  let range = selection.getRangeAt(0);
  // We need to skip the assignment span to get to the code block…
  // Or stay one below for no-assignments :shrug:
  const parentNodeAssignment = range.startContainer.parentNode.parentNode;
  const parentNodePlain = range.startContainer.parentNode;
  const tagAssignment = parentNodeAssignment.tagName;
  const tagPlain = parentNodePlain.tagName;
  const skipAssignment =
    tagAssignment == "DIV" &&
    parentNodeAssignment.classList.contains("wired") &&
    parentNodeAssignment.classList.contains("code");
  const skipPlain =
    tagPlain == "DIV" &&
    parentNodePlain.classList.contains("wired") &&
    parentNodePlain.classList.contains("code");
  range.deleteContents();
  range.insertNode(code);
  code = formatEvaluation(
    code,
    selectionText,
    kind,
    assignment,
    rvalue,
    return_text,
    error,
    evaluation,
    skipAssignment,
    skipPlain,
  );
  return code;
};

const codeInfo = document.querySelector(".code-info");
let codeInfoTimeout;

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      const parent = mutation.target.parentElement;
      console.log(mutation.target.parentElement);
      if (parent && parent.classList.contains("wired")) {
        parent.classList.add("dirty");
        parent.classList.remove("error");
        parent.hover_title = "edited";
      }
    }
  });
});

const wireEval = (code) => {
  console.info("Wiring eval for node: ");
  console.info(code);
  code.eval = (content) => {
    const kind = code.dataset.kind;
    console.log("evaluating ", code);
    console.log(kind);
    const src = code;
    src.classList.remove("dirty");
    src.classList.remove("error");
    if (!content) {
      content = src.dataset.evalString;
    }
    content = content.replaceAll("\\n", "\n");
    console.log("Have evaluation string set to", src.dataset.evalString);
    src.dataset.index = "[?]";
    // TODO(me) Should add the index already on construction as empty and
    // populate on iteration
    src.hover_title = src.dataset.evalString.replaceAll("\\n", "\n");
    let [assignment, rvalue, return_text, error, evaluation] = evalExpr(
      content,
      kind,
      code.closest(".body").id,
      code,
    );
    if (error) {
      src.hover_title = error;
      src.classList.add("error");
      return;
    }
    /*src.innerHTML = "";
    if (assignment) {
      src.appendChild(assignment);
      src.appendChild(rvalue);
      assignment.insertAdjacentHTML("afterend", " = ");
    } else {
      for (let i = 0; i < evaluation.length; i++) {
        const line = evaluation[i];
        src.appendChild(line);
        if (i != evaluation.length - 1) {
          const lineBreak = document.createElement("br");
          src.appendChild(lineBreak);
        }
      }
    }*/
    src.innerHTML = "";
    formatEvaluation(
      src,
      content,
      kind,
      assignment,
      rvalue,
      return_text,
      error,
      evaluation,
    );
  };

  observer.observe(code, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  console.log("Added the observer");
  // Note that I might not need everything in code here
  code.addEventListener("pointerenter", infoOnHover(code));

  code.addEventListener("pointerleave", () => {
    clearTimeout(codeInfoTimeout);
    codeInfo.classList.remove("show");
    content.appendChild(codeInfo);
  });

  code.addEventListener("click", (ev) => {
    const src = ev.srcElement;
    if (src.editing) {
      return;
    }
    if (src.classList.contains("wired")) {
      // I can't do HTML here: otherwise I lose all the event handlers
      console.log("Wired, clicked");
      src.oldText = src.innerText;
      src.textContent = src.dataset.evalString.replaceAll("\\n", "\n");
      src.editing = true;
      console.info("Adding current id to stack, stack is");
      weave.internal.clickedId.unshift(code.id);
      weave.internal.clickedId.unshift(code.id);
      weave.internal.clickedId.length = 2;
      console.info(weave.internal.clickedId);
      ev.stopPropagation();
    } else {
      const clickEvent = new Event("click");
      src.closest(".wired").dispatchEvent(clickEvent);
    }
  });

  code.addEventListener("contextmenu", reevaluate);
};

const infoOnHover = (code) => (ev) => {
  codeInfoTimeout = setTimeout(() => {
    const mouseX = ev.clientX;
    const mouseY = ev.clientY;
    if (code.contains(ev.target)) {
      codeInfo.style.left = mouseX + 2 + "px";
      codeInfo.style.top = mouseY + 2 + "px";
      codeInfo.textContent = `${ev.target.dataset.kind}\n${ev.target.hover_title}\nid: ${code.id}`;
      codeInfo.classList.add("show");
      code.appendChild(codeInfo);
    }
  }, 1000);
};

const reevaluate = (ev) => {
  ev.preventDefault();
  const src = ev.srcElement;
  src.editing = false;
  const textNodes = [];
  let content;
  // Having an assignment node, makes this tricky to handle. An assignment node behaves differently, since it has a span.
  // Worse, if a single line assignment block becomes multiline… hell will break loose here too.
  const hasAssignment = Array.from(src.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE &&
      node.tagName === "SPAN" &&
      node.classList.contains("assignment"),
  );
  if (hasAssignment) {
    content = src.innerText; // This still won't work going from single to multiple lines
  } else {
    for (const node of src.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node.textContent);
      }
    }
    content = textNodes.join("\n");
  }
  console.log(`Invoking evaluation for ${src} for ${content}`);
  src.eval(content);
  console.log(`Updating internal evaluation string to ${content}`);
  src.dataset.evalString = content.split("\n").join("\\n");
  const codes = document.querySelectorAll(".code.wired");
  let i = 0;
  for (let cod of codes) {
    // TODO(me) This would look way better as an HTML hover
    cod.dataset.index = `[${i}]`;
    cod.hover_title = `${cod.dataset.index} ${cod.dataset.evalString.replaceAll("\\n", "\n")}`;
    i++;
    if (cod == src) {
      console.log("Skipping self");
      continue;
    } else {
      cod.eval();
    }
  }
};

const eval_ = {
  text: ["eval", "🧮"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const code = wireEvalFromScratch("javascript");
    code.dataset.kind = "javascript";
    if (!code) {
      return;
    }
    wireEval(code);
  },
  description: "Evaluate (JavaScript) the selected text",
};

const sql = {
  text: ["sql"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const code = wireEvalFromScratch("sql");
    code.dataset.kind = "sql";
    if (!code) {
      return;
    }
    wireEval(code);
  },
  description: "Evaluate (SQL) the selected text",
};

const id = {
  text: ["id"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    navigator.clipboard
      .writeText(weave.internal.clickedId[1]) // Fishy
      .then(() => {
        console.log("Id copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy id to clipboard: ", err);
      });
  },
  description: "Copy the id of a code block, div or body to the clipboard",
};
