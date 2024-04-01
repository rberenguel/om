export { hilite };

const pythonKeywords = [
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
];

const javascriptKeywords = [
  "abstract",
  "arguments",
  "await",
  "boolean",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "number",
  "of",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "shorthand",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
];
const keywords = pythonKeywords.concat(javascriptKeywords);

const hilite = () => {
  const pres = document.getElementsByTagName("pre");
  for (let pre of pres) {
    let text = pre.innerHTML;
    for (let kw of keywords) {
      text = text.replaceAll(kw + " ", `<span class='keyword'>${kw}</span> `);
    }
    text = text.replaceAll(
      /[^>]("[^"]*")[^>]/g,
      "<span class='string'>$1</span>",
    );
    //text = text.replaceAll(/[^>]({)[^>]/g, "<span class='brace'>$1</span>")
    //text = text.replaceAll(/[^>](})[^>|$]/g, "<span class='brace'>$1</span>")
    //text = text.replaceAll(/[^>](\;)$/g, "<span class='brace'>$1</span>")
    pre.innerHTML = text;
  }
};
