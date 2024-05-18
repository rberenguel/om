export { xgid, xgidRenderer }

const xgid = {
    text: ["xgid"],
    action: (ev) => {
      const selection = window.getSelection();
      const text = selection + "";
      const rendered = xgidRenderer.render(text)
      console.log(rendered)
      let range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(rendered);
    },
    description: "Render a backgammon position from an xgid (eXtreme Gammon identifier)",
}

const xgidRenderer = (function () {
   let elt
  // Takes an element with id xgid expecting an XGID in its content.
  // It will replace it with a rendered board.
  function renderXGID(xgid) {
    
    if (!xgid) {
      elt = document.getElementById("xgid");
      if (!elt) {
        return;
      }
      xgid =
        document.elt.textContent ||
        "XGID=--Ab-BDBB---dB---c-dBb----:0:0:1:43:0:0:0:9:10";
    } else {
        elt = document.createElement("DIV")
    }
    const parsed = parseXGID(xgid);
    console.log(parsed);
    createTable(elt);
    renderPositionOnTable(parsed);
    renderDies(parsed._dice[0], parsed._dice[1], parsed._turn);
    const xgidDiv = document.createElement("DIV");
    xgidDiv.classList.add("bg-xgid-rendered");
    const bgBoardWrapper = elt.querySelector(".bg-board-wrapper")
    bgBoardWrapper.dataset.xgid = parsed.xgid
    bgBoardWrapper.appendChild(xgidDiv);
    xgidDiv.textContent = parsed.xgid;
    return elt
  }

  function renderPositionOnTable(parsed) {
    console.info("Rendering position as table");
    const position = parsed.board;
    let topPips = 0,
      bottomPips = 0;
    for (let i = 0; i < position.length; i++) {
      const selector = ".bg-board .bg-point-" + (25 - (i + 1));
      const stack = position[i];
      const td = elt.querySelector(selector);
      if (stack > 0) {
        topPips += stack * (i + 1);
      } else {
        bottomPips += -stack * (25 - (i + 1));
      }
      for (let j = 0; j < Math.abs(stack); j++) {
        console.info(`Stack for location ${i}, depth ${j}`);
        const a = document.createElement("A");
        if (stack > 0) {
          a.classList.add("bg-player-top-piece");
        } else {
          a.classList.add("bg-player-bottom-piece");
        }
        td.appendChild(a);
      }
    }

    // The bar documentation is confusing because I am using
    // "top" and "bottom" differently for the board and the players.
    // I should fix that, maybe.
    console.info("Adding pieces to the bar");
    const topBar = elt.querySelector(".bg-board .bg-top.bg-bar");
    for (let j = 0; j < parsed.bar[1]; j++) {
      const a = document.createElement("A");
      a.classList.add("bg-player-top-piece");
      topPips += 25;
      topBar.appendChild(a);
    }
    const bottomBar = elt.querySelector(".bg-board .bg-bottom.bg-bar");
    for (let j = 0; j < parsed.bar[0]; j++) {
      const a = document.createElement("A");
      a.classList.add("player-bottom-piece");
      bottomPips += 25;
      bottomBar.appendChild(a);
    }
    console.info("Adding pip counts");
    const topPipSection = elt.querySelector(
      "#bg-table-header > .bg-top.bg-bar"
    );
    topPipSection.textContent = topPips;
    const bottomPipSection = elt.querySelector(
      "#bg-table-footer > .bg-bottom.bg-bar"
    );
    bottomPipSection.textContent = bottomPips;
    const matchTop = elt.querySelector(".bg-top.bg-home.bg-player-top");
    const matchBottom = elt.querySelector(
      ".bg-bottom.bg-home.bg-player-bottom"
    );
    matchTop.textContent = `${parsed._score_top}/${parsed._match_length}`;
    matchBottom.textContent = `${parsed._score_bottom}/${parsed._match_length}`;

    console.info("Adding doubling cube");
    //1 bottom 0 centered -1 top
    const doubling = elt.querySelector("#bg-doubling");
    const cubeValue = Math.pow(2, parsed._cube);
    doubling.textContent = cubeValue == 1 ? 64 : cubeValue;
    if (parsed._cube_owner != 0) {
      if (parsed._cube_owner > 0) {
        document
          .querySelector("#bg-table-header > .bg-top.bg-bar")
          .appendChild(doubling);
      }
      if (parsed._cube_owner < 0) {
        document
          .querySelector("#bg-table-footer > .bg-bottom.bg-bar")
          .appendChild(doubling);
      }
    }
  }

  function renderDies(d1v, d2v, turn) {
    console.info(`Rendering dies with values ${d1v}, ${d2v}`);
    // TODO: Doubling/redoubling/etc
    if (d1v == 0 || d2v == 0) {
      return;
    }
    const class1 = "bg-f" + d1v;
    const class2 = "bg-f" + d2v;
    const d1Content = elt.querySelector("." + class1).innerHTML;
    const d2Content = elt.querySelector("." + class2).innerHTML;
    const d1 = elt.querySelector("#bg-dice1");
    d1.innerHTML = d1Content;
    d1.classList.add(class1);
    const d2 = elt.querySelector("#bg-dice2");
    d2.innerHTML = d2Content;
    d2.classList.add(class2);
    if (turn > 0) {
      d1.classList.add("bg-player-top");
      d2.classList.add("bg-player-top");
    }
    if (turn < 0) {
      d1.classList.add("bg-player-bottom");
      d2.classList.add("bg-player-bottom");
    }
  }

  function parseXGID(xgid) {
    const parts = xgid.split(":");

    const _position = parts[0].replace("XGID=", "");
    // 26 characters
    // 1st one: is bar of top player
    // 24 next: points 1-24 (from the bottom player perspective)
    // last: bar of bottom player
    // dash: empty point
    // A-P: checkers of bottom player
    // a-p: checkers of top player

    const toBoard = (positionString) => {
      let top_bar = positionString[0];
      top_bar =
        top_bar == "-" ? 0 : top_bar.charCodeAt(0) - "a".charCodeAt(0) + 1;
      let bottom_bar = positionString[positionString.length - 1];
      bottom_bar =
        bottom_bar == "-"
          ? 0
          : bottom_bar.charCodeAt(0) - "A".charCodeAt(0) + 1;
      let board = [];
      for (let c of positionString.slice(1, positionString.length - 1)) {
        if (c === "-") {
          board.push(0);
          continue;
        }
        if (c === c.toUpperCase()) {
          const stack = c.charCodeAt(0) - "A".charCodeAt(0) + 1;
          board.push(stack);
        } else {
          const stack = c.charCodeAt(0) - "a".charCodeAt(0) + 1;
          board.push(-stack);
        }
      }
      return [board, top_bar, bottom_bar];
    };

    const _cube = parts[1];
    // Cube value is 2^_cube
    const _cube_owner = parts[2];
    // 1 bottom 0 centered -1 top
    const _turn = parts[3];
    // 1 bottom -1 top
    const _dice = parts[4];
    // 00 player to roll/double
    // D player has doubled, waiting take/drop
    // B player has doubled, opponent beavered
    // R player doubled, beavered, raccooned
    const _score_bottom = parts[5];
    const _score_top = parts[6];
    const _crawford_jacoby = parts[7];
    // In match play, 1 means Crawford, 0 means not
    // Unlimited games: the value is Jacoby + 2xBeaver
    // 0 no
    // 1 Jacoby, no beaver
    // 2 No jacoby, beaver
    // 3 Jacoby and beaver
    const _match_length = parts[8];
    // 0 for unlimited
    const _max_cube = parts[9];
    // Max of 2^value
    let [board, top_bar, bottom_bar] = toBoard(_position);
    console.log(top_bar, bottom_bar);
    let position = {
      _position: _position,
      board: board,
      bar: [top_bar, bottom_bar],
      _cube: _cube,
      _cube_owner: _cube_owner,
      _turn: _turn,
      _dice: _dice,
      _score_bottom: _score_bottom,
      _score_top: _score_top,
      _crawford_jacoby: _crawford_jacoby,
      _match_length: _match_length,
      _max_cube: _max_cube,
      xgid: xgid,
    };
    return position;
  }

  function createTable(element) {
    element.innerHTML = tableTemplate;
  }

  const tableTemplate = `
    <div id="bg-dies">
      <div class="bg-f1">
        <span class="bg-dot"></span>
      </div>
      <div class="bg-f2">
        <span class="bg-dot"></span>
        <span class="bg-dot"></span>
      </div>
      <div class="bg-f3">
        <span class="bg-dot"></span>
        <span class="bg-dot"></span>
        <span class="bg-dot"></span>
      </div>
      <div class="bg-f4">
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
      </div>
      <div class="bg-f5">
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
        <div class="bg-column">
          <span class="bg-dot"></span>
        </div>
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
      </div>
      <div class="bg-f6">
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
        <div class="bg-column">
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
          <span class="bg-dot"></span>
        </div>
      </div>
    </div>
    
    <div class="bg-board-wrapper">
      <table>
        <tr id="bg-table-header">
          <td class="bg-top bg-placeholder"></td>
          <td class="bg-top bg-point-24 bg-round-top-left">1</td>
          <td class="bg-top bg-point-23">2</td>
          <td class="bg-top bg-point-22">3</td>
          <td class="bg-top bg-point-21">4</td>
          <td class="bg-top bg-point-20">5</td>
          <td class="bg-top bg-point-19">6</td>
          <td class="bg-top bg-bar bg-player-top-color"></td>
          <td class="bg-top bg-point-18">7</td>
          <td class="bg-top bg-point-17">8</td>
          <td class="bg-top bg-point-16">9</td>
          <td class="bg-top bg-point-15">10</td>
          <td class="bg-top bg-point-14">11</td>
          <td class="bg-top bg-point-13 bg-round-top-right">12</td>
          <td class="bg-top bg-placeholder"></td>
        </tr>
        <tr id="bg-table-top" class="bg-board">
          <td class="bg-top bg-home bg-player-top bg-round-left"></td>
          <td class="bg-top bg-point-24"></td>
          <td class="bg-top bg-point-23"></td>
          <td class="bg-top bg-point-22"></td>
          <td class="bg-top bg-point-21"></td>
          <td class="bg-top bg-point-20"></td>
          <td class="bg-top bg-point-19"></td>
          <td class="bg-top bg-bar"><div id="bg-dice1"></div></td>
          <td class="bg-top bg-point-18"></td>
          <td class="bg-top bg-point-17"></td>
          <td class="bg-top bg-point-16"></td>
          <td class="bg-top bg-point-15"></td>
          <td class="bg-top bg-point-14"></td>
          <td class="bg-top bg-point-13"></td>
          <td class="bg-top bg-placeholder bg-nob"></td>
        </tr>
        <tr id="bg-table-middle">
          <td class="bg-middle bg-placeholder bg-nob"></td>
          <td class="bg-middle bg-point-24">24</td>
          <td class="bg-middle bg-point-23">23</td>
          <td class="bg-middle bg-point-22">22</td>
          <td class="bg-middle bg-point-21">21</td>
          <td class="bg-middle bg-point-20">20</td>
          <td class="bg-middle bg-point-19">19</td>
          <td class="bg-middle bg-bar"><div id="bg-doubling">64</div></td>
          <td class="bg-middle bg-point-18">18</td>
          <td class="bg-middle bg-point-17">17</td>
          <td class="bg-middle bg-point-16">16</td>
          <td class="bg-middle bg-point-15">15</td>
          <td class="bg-middle bg-point-14">14</td>
          <td class="bg-middle bg-point-13">13</td>
        </tr>
        <tr id="bg-table-bottom" class="bg-board">
          <td class="bg-bottom bg-home bg-player-bottom bg-round-left"></td>
          <td class="bg-bottom bg-point-1"></td>
          <td class="bg-bottom bg-point-2"></td>
          <td class="bg-bottom bg-point-3"></td>
          <td class="bg-bottom bg-point-4"></td>
          <td class="bg-bottom bg-point-5"></td>
          <td class="bg-bottom bg-point-6"></td>
          <td class="bg-bottom bg-bar"><div id="bg-dice2"></div></td>
          <td class="bg-bottom bg-point-7"></td>
          <td class="bg-bottom bg-point-8"></td>
          <td class="bg-bottom bg-point-9"></td>
          <td class="bg-bottom bg-point-10"></td>
          <td class="bg-bottom bg-point-11"></td>
          <td class="bg-bottom bg-point-12"></td>
          <td class="bg-bottom bg-placeholder bg-nob"></td>
        </tr>
    
        <tr id="bg-table-footer">
          <td class="bg-bottom bg-placeholder"></td>
          <td class="bg-bottom bg-point-1 bg-round-bottom-left">1</td>
          <td class="bg-bottom bg-point-2">2</td>
          <td class="bg-bottom bg-point-3">3</td>
          <td class="bg-bottom bg-point-4">4</td>
          <td class="bg-bottom bg-point-5">5</td>
          <td class="bg-bottom bg-point-6">6</td>
          <td class="bg-bottom bg-bar bg-player-bottom-color"></td>
          <td class="bg-bottom bg-point-7">7</td>
          <td class="bg-bottom bg-point-8">8</td>
          <td class="bg-bottom bg-point-9">9</td>
          <td class="bg-bottom bg-point-10">10</td>
          <td class="bg-bottom bg-point-11">11</td>
          <td class="bg-bottom bg-point-12 bg-round-bottom-right">12</td>
          <td class="bg-bottom bg-placeholder"></td>
        </tr>
      </table>
    </div>
  `;

  return {
    render: function (xgid) {
      return renderXGID(xgid);
    },
  };
})();
