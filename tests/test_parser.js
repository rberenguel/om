import weave from "../src/weave.js";
import { parseIntoWrapper, toMarkdown } from "../src/parser.js";

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
    chai.expect(addConfig(txt)).to.eql(md)
  });
});

describe('Dynamic div: parsing & idempotency', function() {
    let body = document.getElementById(b)
    it('should create a div', function() {
        const txt = "`[div] .dynamic-div foo bar baz`"
        parseIntoWrapper(addConfig(txt), body)
        const div = body.querySelector(".dynamic-div")
        chai.expect(div.classList).to.not.be.null
        chai.expect(div.innerText).to.eql("foo bar baz")
        const md = toMarkdown(body)
        // console.log(`"${addConfig(txt)}"`)
        // console.log(`"${md}"`)
        chai.expect(addConfig(txt)).to.eql(md)
        div.remove()
    });
    it('should create a div with particular classes', function() {
        const txt = "`[div] .dynamic-div .class1 .class2 .class3 foo bar baz`"
        parseIntoWrapper(addConfig(txt), body)
        const div = body.querySelector(".dynamic-div")
        chai.expect(div.classList).to.not.be.null
        chai.expect(Array.from(div.classList)).to.include("class1")
        chai.expect(Array.from(div.classList)).to.include("class2")
        chai.expect(Array.from(div.classList)).to.include("class3")
        chai.expect(div.innerText).to.eql("foo bar baz")
        const md = toMarkdown(body)
        // console.log(`"${addConfig(txt)}"`)
        // console.log(`"${md}"`)
        chai.expect(addConfig(txt)).to.eql(md)
        div.remove()
    });
    it('should nest lists in divs', function() {
        const txt = "`[div] .dynamic-div - foo\\n- bar\\n- baz`"
        parseIntoWrapper(addConfig(txt), body)
        const div = body.querySelector(".dynamic-div")
        console.log(body)
        chai.expect(div.classList).to.not.be.null
        chai.expect(div.children[0].nodeName).to.eql("LI")
        const lis = div.querySelectorAll("li")
        chai.expect(lis).to.have.length(3)
        chai.expect(lis[2].innerText).to.eql("baz")
        const md = toMarkdown(body)
        console.log(`"${addConfig(txt)}"`)
        console.log(`"${md}"`)
        chai.expect(addConfig(txt)).to.eql(md)
        div.remove()
    });
})
