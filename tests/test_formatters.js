import weave from "../src/weave.js";
import { addSelectedTextTo, createButton, events } from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

mocha.checkLeaks();
mocha.run();

describe("bold text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("bold", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("bold");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("bold");
  });
  describe("bold a word", function () {
    const text = ["this is going to partially get", "bolded"];
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let button;
    it("should create a bold block with the text", function () {
      button = panelBody.querySelector(".wrap");
      addSelectedTextTo(text[0], panelBody);
      addSelectedTextTo(text[1], panelBody);
      button.dispatchEvent(events.mousedown);
      const bolded = panelBody.querySelectorAll("b");
      chai.expect(bolded).to.have.length(2); // The bold button is itself <b>
      chai.expect(bolded[1].innerText).to.equal("bolded");
      panelBody.innerHTML = "";
    });
  });
});

describe("italic text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("italic", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("italic");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("italic");
  });
  describe("italicize a word", function () {
    const text = ["this is going to partially get", "italicized"];
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let button;
    it("should create a italic block with the text", function () {
      button = panelBody.querySelector(".wrap");
      addSelectedTextTo(text[0], panelBody);
      addSelectedTextTo(text[1], panelBody);
      button.dispatchEvent(events.mousedown);
      const bolded = panelBody.querySelectorAll("i");
      chai.expect(bolded).to.have.length(2); // The bold button is itself <b>
      chai.expect(bolded[1].innerText).to.equal("italicized");
      panelBody.innerHTML = "";
    });
  });
});

describe("underline text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("underline", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("underline");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("underline");
  });
  describe("underline a word", function () {
    const text = ["this is going to partially get", "underlined"];
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let button;
    it("should create an underline block with the text", function () {
      button = panelBody.querySelector(".wrap");
      addSelectedTextTo(text[0], panelBody);
      addSelectedTextTo(text[1], panelBody);
      button.dispatchEvent(events.mousedown);
      const bolded = panelBody.querySelectorAll("u");
      chai.expect(bolded).to.have.length(2); // The bold button is itself <b>
      chai.expect(bolded[1].innerText).to.equal("underlined");
      panelBody.innerHTML = "";
    });
  });
});

describe("gfont text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("gfont", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("gfont");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("gfont");
  });
  describe("add a particular one-word font", function () {
    const font = "Poppins";
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let button;
    it("should add the selected font to the style link list", function () {
      const links = () =>
        Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const initialLength = links().length;
      button = panelBody.querySelector(".wrap");
      addSelectedTextTo(font, panelBody);
      button.dispatchEvent(events.mousedown);
      chai.expect(initialLength + 1).to.be.equal(links().length);
      chai.expect(links().some((e) => e.href.includes(font))).to.be.true;
    });
    it("should have added the font to the panel configuration", function () {
      chai.expect(panelBody.dataset.gfont).to.equal(font);
      chai.expect(panelBody.style.fontFamily).to.equal(font);
    });
  });
  describe("add a particular multi-word font", function () {
    const font = "Redacted Script";
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let button;
    it("should add the selected font to the style link list", function () {
      const links = () =>
        Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const initialLength = links().length;
      button = panelBody.querySelector(".wrap");
      addSelectedTextTo(font, panelBody);
      button.dispatchEvent(events.mousedown);
      chai.expect(initialLength + 1).to.be.equal(links().length);
      chai.expect(links().some((e) => e.href.includes(font.split(" ")[0]))).to
        .be.true;
      panelBody.innerHTML = "";
    });
    it("should have added the font to the panel configuration", function () {
      chai.expect(panelBody.dataset.gfont).to.equal(font.replace(" ", "+"));
      chai.expect(panelBody.style.fontFamily).to.equal(`"${font}"`);
    });
  });
});
