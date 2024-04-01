import weave from "../src/weave.js";
import { parseIntoWrapper, toMarkdown } from "../src/parser.js";
import { stringDiffer } from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
const b = "b0";

const config = `<!--
- width: 1000
- height: 529
- fontSize: 
- fontFamily: 
- filename: foo
- folded: false
- gfont: undefined
- x: 455
- y: 554
-->
`;

const addConfig = (text) => {
  return config + text;
};

mocha.checkLeaks();
mocha.run();

describe("New lines and whitespace", function () {
  let body = document.getElementById(b);
  it("should handle br in markdown properly", function () {
    const txt = `<br/>
a
<br/>
b
<br/>
c
<br/>`;
    parseIntoWrapper(addConfig(txt), body);
    const md = toMarkdown(body);
    console.log(`"${addConfig(txt)}"`);
    console.log(`"${md}"`);
    chai.expect(addConfig(txt)).to.eql(md);
  });
});

describe("Dynamic div: parsing & idempotency", function () {
  let body = document.getElementById(b);
  it("should create a div", function () {
    const txt = "`[div] .dynamic-div foo bar baz`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".dynamic-div");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.innerText).to.eql("foo bar baz");
    const md = toMarkdown(body);
    // console.log(`"${addConfig(txt)}"`)
    // console.log(`"${md}"`)
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
  it("should create a div with particular classes", function () {
    const txt = "`[div] .dynamic-div .class1 .class2 .class3 foo bar baz`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".dynamic-div");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(Array.from(div.classList)).to.include("class1");
    chai.expect(Array.from(div.classList)).to.include("class2");
    chai.expect(Array.from(div.classList)).to.include("class3");
    chai.expect(div.innerText).to.eql("foo bar baz");
    const md = toMarkdown(body);
    // console.log(`"${addConfig(txt)}"`)
    // console.log(`"${md}"`)
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
  it("should nest lists in divs", function () {
    const txt = "`[div] .dynamic-div - foo\\n- bar\\n- baz`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".dynamic-div");
    console.log(body);
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.children[0].nodeName).to.eql("LI");
    const lis = div.querySelectorAll("li");
    chai.expect(lis).to.have.length(3);
    chai.expect(lis[2].innerText).to.eql("baz");
    const md = toMarkdown(body);
    //console.log(`"${addConfig(txt)}"`)
    //console.log(`"${md}"`)
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
});

describe("Button: parsing & idempotency", function () {
  let body = document.getElementById(b);
  it("should create a button and parse it again", function () {
    const txt = "`[div] .wrap u .alive raw raw`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".wrap");
    const inner = div.querySelector(".alive");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.innerText).to.eql("raw");
    chai.expect(inner.dataset.action).to.eql("raw");
    const md = toMarkdown(body);
    //console.log(`"${addConfig(txt)}"`)
    //console.log(`"${md}"`)
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
});

describe("Code: parsing & idempotency", function () {
  let body = document.getElementById(b);
  it("should create a code block and parse it again", function () {
    const txt =
      "`[div] .wired .code id=1234 kind=javascript evalString={12+11} value={23}`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".wired.code");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.innerText).to.eql("23");
    chai.expect(div.dataset.evalString).to.eql("12+11");
    const md = toMarkdown(body);
    console.log(`"${addConfig(txt)}"`);
    console.log(`"${md}"`);
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
  it("should create a multiline code block and parse it again", function () {
    const ev = "function foo(x){\\n  return x + 42\\n}";
    const txt =
      "`[div] .wired .code id=1234 kind=javascript " +
      `evalString={${ev}} value={${ev}}\``;
    console.log(txt);
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".wired.code");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.textContent).to.equal(ev);
    chai.expect(div.dataset.evalString).to.equal(ev);
    const md = toMarkdown(body);
    console.log(`"${addConfig(txt)}"`);
    console.log(`"${md}"`);
    stringDiffer(addConfig(txt), md);
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });

  it("should handle braces inside code blocks", function () {
    const txt =
      "`[div] .wired .code id=1234 kind=javascript evalString={a = (c) => {c+5}} value={a = (c) => {c+5}}`";
    parseIntoWrapper(addConfig(txt), body);
    const div = body.querySelector(".wired.code");
    chai.expect(div.classList).to.not.be.null;
    chai.expect(div.innerText).to.eql("a = (c) => {c+5}");
    chai.expect(div.dataset.evalString).to.eql("a = (c) => {c+5}");
    const md = toMarkdown(body);
    console.log(`"${addConfig(txt)}"`);
    console.log(`"${md}"`);
    chai.expect(addConfig(txt)).to.eql(md);
    div.remove();
  });
});

describe("Links, links, links", function () {
  let body = document.getElementById(b);
  it("should handle links properly (1 internal link)", function () {
    const il = "internal link";
    const txt = `[[${il}]]`;
    parseIntoWrapper(addConfig(txt), body);
    const a = body.querySelector("a");
    chai.expect(a.getAttribute("href")).to.equal(il);
    chai.expect(a.textContent).to.equal(il);
    chai.expect(JSON.parse(a.dataset.internal)).to.be.true;
    const md = toMarkdown(body);
    chai.expect(addConfig(txt)).to.eql(md);
    a.remove();
  });
  it("should handle links properly (2 links, 1 line)", function () {
    const il = "internal link";
    const elT = "external link wooo";
    const elH = "example.com";
    const txt = `[[${il}]] [${elT}](${elH})`;
    parseIntoWrapper(addConfig(txt), body);
    const as = body.querySelectorAll("a");
    const int = as[0];
    const ext = as[1];
    chai.expect(int.getAttribute("href")).to.equal(il);
    chai.expect(int.textContent).to.equal(il);
    chai.expect(JSON.parse(int.dataset.internal)).to.be.true;
    chai.expect(ext.getAttribute("href")).to.equal(elH);
    chai.expect(ext.textContent).to.equal(elT);
    chai.expect(JSON.parse(ext.dataset.internal)).to.be.false;
    const md = toMarkdown(body);
    chai.expect(addConfig(txt)).to.eql(md);
    int.remove();
    ext.remove();
  });
  it("should handle links properly (2 links, 1 line, div in the middle)", function () {
    const il = "internal link";
    const elT = "external link wooo";
    const elH = "example.com";
    const txt = `[[${il}]] \`[div] .dynamic-div .class1 .class2 .class3 foo bar baz\` [${elT}](${elH})`;
    parseIntoWrapper(addConfig(txt), body);
    const as = body.querySelectorAll("a");
    const int = as[0];
    const ext = as[1];
    chai.expect(int.getAttribute("href")).to.equal(il);
    chai.expect(int.textContent).to.equal(il);
    chai.expect(JSON.parse(int.dataset.internal)).to.be.true;
    chai.expect(ext.getAttribute("href")).to.equal(elH);
    chai.expect(ext.textContent).to.equal(elT);
    chai.expect(JSON.parse(ext.dataset.internal)).to.be.false;
    const md = toMarkdown(body);
    stringDiffer(md, addConfig(txt));
    chai.expect(addConfig(txt)).to.eql(md);
    int.remove();
    ext.remove();
  });
  it("should handle links properly (1 internal link, code block with bracket before)", function () {
    const il = "internal link";
    const txt = `\`[div] .wired .code id=1234 kind=javascript evalString={a[0]} value={a[0]}\`  [[${il}]]`;
    parseIntoWrapper(addConfig(txt), body);
    const a = body.querySelector("a");
    const code = body.querySelector(".wired.code");
    chai.expect(a.getAttribute("href")).to.equal(il);
    chai.expect(a.textContent).to.equal(il);
    chai.expect(JSON.parse(a.dataset.internal)).to.be.true;
    chai.expect(code.textContent).to.equal("a[0]");
    const md = toMarkdown(body);
    chai.expect(addConfig(txt)).to.eql(md);
    a.remove();
  });
});
