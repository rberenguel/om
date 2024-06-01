const currentBodyId = this.data.body;
const currentBody = document.getElementById(currentBodyId);
const codeNode = this.data.node; // This is not bound "correctly" on first run

const wc = () => currentBody.textContent.split(/\s+/).length;

if (!currentBody.wc) {
  currentBody.addEventListener("keyup", () => {
    // This is quite hacky, but re-evaluating
    // code blocks is error prone because of variable redefinition:
    // This is actually cleaner
    codeNode.textContent = wc() - 1;
  });
  currentBody.wc = true;
}

// Hack because otherwise we don't count well
return wc() - 71;
