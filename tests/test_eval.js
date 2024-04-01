import weave from "../src/weave.js";
import {
  addSelectedTextTo,
  createButton,
  assertTwoWayConversion,
} from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

//mocha.checkLeaks(); I need leaks for code evals
mocha.run();

describe("eval text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("eval", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("eval");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("eval");
    assertTwoWayConversion(panelBody);
  });
});

describe("eval - direct evaluation", function () {
  const evaluation = "(9*6).toString(13)";
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  let evalButton, evaluated;
  it("should create an evaluation block on click after selecting text to evaluate", function () {
    evalButton = panelBody.querySelector(".wrap > .alive");
    addSelectedTextTo(evaluation, panelBody);
    const mousedown = new MouseEvent("mousedown");
    console.log(evalButton);
    evalButton.dispatchEvent(mousedown);
    assertTwoWayConversion(panelBody);
    evaluated = () => panelBody.querySelector(".wired.code");
    chai.expect(evaluated()).to.exist;
  });
  it("should correctly assign the result of the evaluation to the block", function () {
    chai.expect(evaluated().textContent).to.equal('"42"');
  });
  it("should correctly assign the string to evaluate to the data container of the block", function () {
    chai.expect(evaluated().dataset.evalString).to.equal(evaluation);
    evaluated().remove();
  });
});

describe("eval - assignments & edit/reassignment flow", function () {
  const mousedown = new MouseEvent("mousedown");
  const click = new MouseEvent("click");
  const contextmenu = new CustomEvent("contextmenu");
  const evaluation1 = "in_chai = +(9*6).toString(13)";
  const evaluation2 = "in_chai - 1";
  const evaluation3 = "in_chai - 2";
  const evaluation4 = "in_chai = -42";
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  let evalButton;
  it("should handle assignment and evaluation: a = f()", function () {
    evalButton = panelBody.querySelector(".wrap>.alive");
    addSelectedTextTo(evaluation1, panelBody);
    evalButton.dispatchEvent(mousedown);
    assertTwoWayConversion(panelBody);
    // Global leak expected here
    chai.expect(in_chai).to.equal(42);
    const assignment = panelBody.querySelector(".wired.code");
    chai.expect(assignment.textContent).to.equal(evaluation1);
  });
  it("should handle double assignment: a = f(); a-1", function () {
    addSelectedTextTo(evaluation2, panelBody);
    evalButton.dispatchEvent(mousedown);
    assertTwoWayConversion(panelBody);
    const second = panelBody.querySelectorAll(".wired.code")[1];
    chai.expect(second.textContent).to.equal("41");
  });
  it("should handle edits: clicking on the a-1 block switches from computed to computation", function () {
    const second = panelBody.querySelectorAll(".wired.code")[1];
    assertTwoWayConversion(panelBody);
    second.dispatchEvent(click);
    chai.expect(second.textContent).to.equal(evaluation2);
  });
  it("should handle edits: changing text and right clicking recomputes the value", function () {
    const second = panelBody.querySelectorAll(".wired.code")[1];
    second.textContent = evaluation3;
    second.dispatchEvent(contextmenu);
    chai.expect(second.textContent).to.equal("40");
    assertTwoWayConversion(panelBody);
  });
  it("should handle global recomputation: editing f() affects the things that depend on it", function () {
    const first = panelBody.querySelectorAll(".wired.code")[0];
    const second = panelBody.querySelectorAll(".wired.code")[1];
    first.textContent = evaluation4;
    first.dispatchEvent(contextmenu);
    assertTwoWayConversion(panelBody);
    chai.expect(first.textContent).to.equal(evaluation4);
    chai.expect(second.textContent).to.equal("-44");
  });
});
