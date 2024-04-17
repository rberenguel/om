import weave from "../src/weave.js";
import { createButton, events } from "./test_helpers.js";
import {manipulation} from "../src/manipulation.js";
import { get } from "../src/libs/idb-keyval.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

// mocha.checkLeaks();
mocha.run();

const waitForTimeout = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// TODO ctrl-s also saves the current session, which 
// is problematic since testing uses the same db as "real"
// weave. Either:
//   - preserve session, 
//   - use a separate db
//   - new flag for save?

describe("keys on panel", function () {
  const root = document.getElementById(weave.root);
  const modal = () => document.getElementById("modal");
  it("C-t should title a panel", async function () {
    const panel = root.querySelector(".body-container");
    const filename = manipulation.get(panel, manipulation.fields.kFilename)
    const ctrlT = events.cDash("t")
    panel.dispatchEvent(ctrlT)
    await waitForTimeout(300)
    const input = modal().querySelector("input")
    await waitForTimeout(100)
    input.value = "testing-file"
    input.dispatchEvent(events.enter)
    await waitForTimeout(100)
    const title = manipulation.get(panel, manipulation.fields.kTitle)
    chai.expect(title).to.equal("testing-file")
   })
   it("C-s should save a file", async function () {
    const panel = root.querySelector(".body-container");
    const filename = manipulation.get(panel, manipulation.fields.kFilename)
    console.log(`filename: ${filename}`)
    get(filename)
      .then((content) => chai.expect(content).to.be.undefined)
      .catch(err => chai.expect(err).to.be.null)
    const ctrlS = events.cDash("s")
    panel.dispatchEvent(ctrlS)
    await waitForTimeout(500)
    get(filename)
      .then((content) => chai.expect(content).to.be.undefined)
      .catch(err => chai.expect(err).to.be.null)
  });
  it("C-r should toggle raw mode", function () {
    const panel = root.querySelector(".body-container");
    const ctrlR = events.cDash("r")
    panel.dispatchEvent(ctrlR)
    chai.expect(panel.raw).to.be.true
    panel.dispatchEvent(ctrlR)
    chai.expect(panel.raw).to.be.false
  });
  it("C-l should trigger a load (and Esc on the input dismiss it)", async function () {
    const panel = root.querySelector(".body-container");
    const ctrlL = events.cDash("l")
    const modal = () => document.getElementById("modal");
    chai.expect(modal().showing).to.be.undefined
    panel.dispatchEvent(ctrlL)
    chai.expect(modal().showing).to.be.true
    await waitForTimeout(10)
    const input = modal().querySelector("input")
    await waitForTimeout(100)
    input.dispatchEvent(events.esc)
    chai.expect(modal().showing).to.be.false
  })
  it("C-l should trigger a load (and losing focus dismiss it)", async function () {
    const panel = root.querySelector(".body-container");
    const ctrlL = events.cDash("l")
    chai.expect(modal().showing).to.be.false
    panel.dispatchEvent(ctrlL)
    chai.expect(modal().showing).to.be.true
    await waitForTimeout(10)
    const input = modal().querySelector("input")
    await waitForTimeout(100)
    input.blur()
    await waitForTimeout(200)
    chai.expect(modal().showing).to.be.false
  })
});


