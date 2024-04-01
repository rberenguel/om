import weave from "../src/weave.js";
import { createButton, events } from "./test_helpers.js";

weave.root = "weave-target";
weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);

mocha.checkLeaks();
mocha.run();

describe("createPanel", function () {
  const root = document.getElementById(weave.root);
  it("should create a new panel", function () {
    const panel = root.children;
    chai.expect(panel).to.not.be.empty;
    chai.expect(panel).to.have.length(1);
  });
  it("should have created a panel with two elements (handle wrapping body)", function () {
    const panelElements = root.children[0].children;
    chai.expect(panelElements).to.not.be.empty;
    chai.expect(panelElements).to.have.length(1);
    console.info(panelElements);
    chai.expect(panelElements[0].classList.contains("better-handle")).to.be
      .true;
    chai.expect(panelElements[0].children[0].classList.contains("body")).to.be
      .true;
  });
});

describe("split text / button", function () {
  const panelBody = () =>
    document.getElementById(weave.root).querySelector(".body");
  const splitButton = () => panelBody().querySelector(".wrap");
  describe("should go from text to button", function () {
    it("should become a button on right click", function () {
      createButton("split", panelBody());
      chai.expect(splitButton().innerText).to.eql("split");
      const buttonNode = splitButton().children[0];
      chai.expect(buttonNode.dataset.action).to.eql("split");
    });
  });
  describe("should behave as a button", function () {
    it("should not be contenteditable", function () {
      chai.expect(splitButton().contentEditable).to.equal("false");
    });
    it("should create two new panels when clicking twice", function () {
      const panels = () => document.getElementsByClassName("body-container");
      chai.expect(panels()).to.have.length(1);
      console.log(splitButton());
      splitButton().dispatchEvent(events.mousedown);
      splitButton().dispatchEvent(events.mousedown);
      chai.expect(panels()).to.have.length(3);
      panelBody.innerHTML = "";
    });
  });
});

describe("clear text / button", function () {
  let thirdPanelBody, button;
  const kLorem = "Lorem ipsum";
  it("should become a button on right click", function () {
    thirdPanelBody = document
      .getElementById(weave.root)
      .querySelectorAll(".body")[2];
    console.log(thirdPanelBody);
    createButton("clear", thirdPanelBody);
    button = thirdPanelBody.querySelector(".wrap");
    chai.expect(button.innerText).to.eql("clear");
    const buttonNode = button.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("clear");
  });
  it("after adding some text, and clicking on it, should clear the second panel on click", function () {
    const panels = () => document.getElementsByClassName("body-container");
    const secondBody = panels()[1].querySelector(".body");
    chai.expect(panels()).to.have.length(3);
    secondBody.innerText = kLorem;
    chai.expect(secondBody.innerText).to.equal(kLorem);
    secondBody.dispatchEvent(events.click);
    button.dispatchEvent(events.mousedown);
    chai.expect(secondBody.innerText).to.equal("");
  });
});

describe("close text / button", function () {
  let secondPanelBody, button;
  it("should become a button on right click", function () {
    secondPanelBody = document
      .getElementById(weave.root)
      .querySelectorAll(".body")[1];
    console.log(secondPanelBody);
    createButton("close", secondPanelBody);
    button = secondPanelBody.querySelector(".wrap");
    chai.expect(button.innerText).to.eql("close");
    const buttonNode = button.children[0];
    chai.expect(buttonNode.dataset.action).to.eql("close");
  });
  it("should close the first panel on click (after cleaning the click history)", function () {
    const panels = () => document.getElementsByClassName("body-container");
    const firstPanelBody = panels()[0].querySelector(".body");
    const thirdPanelBody = panels()[2].querySelector(".body");
    thirdPanelBody.dispatchEvent(events.click);
    thirdPanelBody.dispatchEvent(events.click);
    thirdPanelBody.dispatchEvent(events.click);
    chai.expect(weave.lastBodyClickId()).to.equal("b2");
    chai.expect(panels()).to.have.length(3);
    firstPanelBody.dispatchEvent(events.click);
    chai.expect(weave.lastBodyClickId()).to.equal("b0");
    button.dispatchEvent(events.mousedown);
    chai.expect(panels()).to.have.length(2);
    chai.expect(panels()[0].querySelector(".body").id).to.equal("b1");
    chai.expect(panels()[1].querySelector(".body").id).to.equal("b2");
    // Clear the second panel
    panels()[1].querySelector(".body").innerHTML = "";
  });
});

describe("light text / button", function () {
  const buttonType = "light";
  let secondPanelBody, button;
  it("should become a button on right click", function () {
    secondPanelBody = document
      .getElementById(weave.root)
      .querySelectorAll(".body")[1];
    createButton(buttonType, secondPanelBody);
    button = secondPanelBody.querySelector(".wrap");
    chai.expect(button.innerText).to.eql(buttonType);
    const buttonNode = button.children[0];
    chai.expect(buttonNode.dataset.action).to.eql(buttonType);
  });
  it("should set all existing panels (containers and bodies) as light", function () {
    const panels = () => document.getElementsByClassName("body-container");
    button.dispatchEvent(events.mousedown);
    const allContainersLight = Array.from(panels()).every((p) =>
      p.classList.contains("light"),
    );
    const allBodiesLight = Array.from(panels()).every((p) =>
      p.querySelector(".body").classList.contains("light"),
    );
    chai.expect(allContainersLight).to.be.true;
    chai.expect(allBodiesLight).to.be.true;
  });
  it("should set the global config as light", function () {
    chai.expect(weave.config.dark).to.be.false;
  });
  it("should set the content as outer-light", function () {
    chai.expect(
      document.getElementById(weave.root).classList.contains("outer-light"),
    ).to.be.true;
  });
  it("should create any new panel as light", function () {
    createButton("split", secondPanelBody);
    const splitButton = secondPanelBody.querySelectorAll(".wrap")[1]; // The new button is the second
    splitButton.dispatchEvent(events.mousedown);
    const panels = document.getElementsByClassName("body-container");
    const lastPanel = panels[panels.length - 1];
    chai.expect(lastPanel.classList.contains("light")).to.be.true;
    // cleanup
    lastPanel.remove();
    secondPanelBody.innerHTML = "";
  });
});

describe("dark text / button", function () {
  const buttonType = "dark";
  let secondPanelBody, button;
  it("should become a button on right click", function () {
    secondPanelBody = document
      .getElementById(weave.root)
      .querySelectorAll(".body")[1];
    createButton(buttonType, secondPanelBody);
    button = secondPanelBody.querySelector(".wrap");
    chai.expect(button.innerText).to.eql(buttonType);
    const buttonNode = button.children[0];
    chai.expect(buttonNode.dataset.action).to.eql(buttonType);
  });
  it("should set all existing panels (containers and bodies) as light", function () {
    const panels = () => document.getElementsByClassName("body-container");
    button.dispatchEvent(events.mousedown);
    const allContainersDark = Array.from(panels()).every((p) =>
      p.classList.contains("dark"),
    );
    const allBodiesDark = Array.from(panels()).every((p) =>
      p.querySelector(".body").classList.contains("dark"),
    );
    chai.expect(allContainersDark).to.be.true;
    chai.expect(allBodiesDark).to.be.true;
  });
  it("should set the global config as dark", function () {
    chai.expect(weave.config.dark).to.be.true;
  });
  it("should set the content as outer-dark", function () {
    chai.expect(
      document.getElementById(weave.root).classList.contains("outer-dark"),
    ).to.be.true;
  });
  it("should create any new panel as dark", function () {
    createButton("split", secondPanelBody);
    const splitButton = secondPanelBody.querySelectorAll(".wrap")[1]; // The new button is the second
    splitButton.dispatchEvent(events.mousedown);
    const panels = document.getElementsByClassName("body-container");
    const lastPanel = panels[panels.length - 1];
    chai.expect(lastPanel.classList.contains("dark")).to.be.true;
  });
});
