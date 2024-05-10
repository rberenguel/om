import weave from "../src/weave.js";
import {
  addSelectedTextTo,
  createButton,
  events,
  assertTwoWayConversion,
  stringDiffer,
} from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

const create =
  "CREATE TABLE IF NOT EXISTS cities (city string, population number);";
const insert =
  "INSERT INTO cities VALUES ('Rome',2863223),('Paris',2249975),('Berlin',3517424),('Madrid',3041579);";
const select =
  "SELECT * FROM cities WHERE population < 3000000 ORDER BY population DESC;";
const drop = "DROP TABLE cities;";

//mocha.checkLeaks(); I need leaks for code evals
mocha.run();

describe("sql text / button", function () {
  const panelBody = document.getElementById(weave.root).querySelector(".body");
  it("should become a button on right click", function () {
    createButton("sql", panelBody);
    const evalButton = panelBody.querySelector(".wrap");
    chai.expect(evalButton.innerText).to.eql("sql");
    const buttonNode = evalButton.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("sql");
    assertTwoWayConversion(panelBody);
  });
  describe("no rows returned, single line: CREATE TABLE", function () {
    const evaluation = create;
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let evalButton, evaluated;
    it("should create an evaluation block on click after selecting text to evaluate", function () {
      evalButton = panelBody.querySelector(".wrap > .alive");
      addSelectedTextTo(evaluation, panelBody);
      evalButton.dispatchEvent(events.mousedown);
      assertTwoWayConversion(panelBody);
      evaluated = panelBody.querySelector(".wired.code");
      chai.expect(evaluated).to.exist;
    });
    it("should hold the CREATE statement in text", function () {
      stringDiffer(create, evaluated.textContent);
      chai.expect(evaluated.textContent).to.equal(create);
    });
    it("should hold the number of affected rows as the value assigned to the evaluation", function () {
      chai.expect(eval(evaluated.id)).to.equal(1);
    });
    it("should correctly assign the string to evaluate to the data container of the block", function () {
      chai.expect(evaluated.dataset.evalString).to.equal(evaluation);
      addSelectedTextTo(drop, panelBody);
      evalButton.dispatchEvent(events.mousedown);
      panelBody.querySelector(".wired.code").remove();
      panelBody.querySelector(".wired.code").remove();
    });
  });

  describe("no rows returned, multiline (CREATE TABLE + INSERT)", function () {
    const evaluation = `${create}\n${insert}`;
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let evalButton, evaluated;
    it("should create an evaluation block on click after selecting text to evaluate", function () {
      evalButton = panelBody.querySelector(".wrap > .alive");
      addSelectedTextTo(evaluation, panelBody);
      console.log(window.getSelection() + "");
      evalButton.dispatchEvent(events.mousedown);
      evaluated = panelBody.querySelector(".wired.code");
      chai.expect(evaluated).to.exist;
      // assertTwoWayConversion(panelBody) This adds the data twice, sadly
    });
    it("should hold the CREATE+INSERT statements in text", function () {
      stringDiffer(evaluated.textContent, evaluation);
      chai.expect(evaluated.textContent).to.equal(evaluation);
    });

    it("should hold the number of affected rows as the value assigned to the evaluation", function () {
      chai.expect(eval(evaluated.id)).to.deep.equal([1, 4]);
    });
    it("should correctly assign the string to evaluate to the data container of the block", function () {
      // TODO: this just needs a proper setter
      chai
        .expect(evaluated.dataset.evalString.replace("\\n", "\n"))
        .to.equal(evaluation);
    });
  });
  /*
  describe("rows returned (SELECT after CREATE, INSERT)", function () {
    const evaluation = select;
    const panelBody = document
      .getElementById(weave.root)
      .querySelector(".body");
    let evalButton, evaluated;
    it("should create an evaluation block on click after selecting text to evaluate", function () {
      evalButton = panelBody.querySelector(".wrap > .alive");
      addSelectedTextTo(evaluation, panelBody);
      evalButton.dispatchEvent(events.mousedown);
      evaluated = panelBody.querySelectorAll(".wired.code")[1]; // The second one, select block
      chai.expect(evaluated).to.exist;
    });
    it("should hold the CREATE+INSERT statements in text", function () {
      console.log(evaluated);
      console.log(evaluated.innerText);
      chai
        .expect(evaluated.innerText)
        .to.include("city\tpopulation\nRome\t2863223\nParis");
    });
    it("should hold the JSON-returned value from the query", function () {
      chai.expect(eval(evaluated.id)).to.deep.equal([
        { city: "Rome", population: 2863223 },
        { city: "Paris", population: 2249975 },
      ]);
    });
  });*/
});
