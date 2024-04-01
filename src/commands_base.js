export { reset, common, enterKeyDownEvent };

const info = document.querySelector("#info");

const enterKeyDownEvent = new KeyboardEvent("keydown", {
  key: "Enter",
  code: "Enter",
  which: 13,
  keyCode: 13,
  bubbles: false,
});

const reset = () => {
  info.classList.remove("fades");
  info.innerText = "";
  console.info("Resetted styles on info");
};

const common = (ev) => {
  reset();
  return ev.button !== 0;
};
