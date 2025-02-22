import weave from "../src/weave.js";
import { createButton, events } from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

mocha.checkLeaks();
mocha.run();

describe("createPanel", function () {
  const root = document.getElementById(weave.root);
  it("should serialize and deserialize basic stuff", function () {
    const panel = root.querySelectorAll(".body-container");
    chai.expect(panel).to.not.be.empty;
    chai.expect(panel).to.have.length(1);
  });
});
