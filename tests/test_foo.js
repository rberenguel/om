mocha.checkLeaks();
mocha.run();

describe("foo", function () {
  it("should bar", function () {
    let a = 30;
    chai.expect(a * 3).to.eql(90);
  });
});
