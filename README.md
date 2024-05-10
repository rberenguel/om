[#](#) Weave

> [!CAUTION]
> Some functionality around saving is currently in a broken state.

This is **Weave**, a text "editor" inspired by [Plan9's Acme](<https://en.wikipedia.org/wiki/Acme_(text_editor)>).

Below you can see an example of things you might do with it.

https://github.com/rberenguel/weave/assets/2410938/bf6bef3c-1c37-435d-b83c-d8a3d04d7f0c

<img src="media/light.png" width=300> <img src="media/dark.png" width=300>|

If you need a command, just write it.
Need to bold a piece of text? Just type **bold** or **b** and double-click on the word.
It will become your bold button.

> [!CAUTION]
> I have made many changes recently so the documentation below on how to use it and capabilities is outdated. I will update it
> once I have stabilised functionality.

---

Ideally the whole editor would live in a bookmarklet, as a `data:text/html` URI. But that is not cross-browser compatible for saving (Chrome and Edge don't allow it), so the best is that you use it from GitHub pages… or **just `git clone` and open the HTML locally as a file**. That seems to work fine in Chrome and Safari, just drag the HTML file to them. Data is stored as URL anchors, so technically it could be read from some log in GitHub. The inspiration for this was [here](https://mostlymaths.net/2020/10/202058-readings.html/#worlds-smallest-office-suitehttpszsergecompostsawfice).

---

<!-- vscode-markdown-toc -->

- [Rough areas](#Roughareas)
- [Planned features?](#Plannedfeatures)
- [The commands available (so far) are the following](#Thecommandsavailablesofararethefollowing)
- [Name?](#Name)
- [Why?](#Why)
- [Tests](#Tests)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

---

### <a name='Roughareas'></a>Rough areas

- Creating lists by writing a dash and a space in a new line works, but can behave somewhat weirdly.
- Font size and width are stored in pixels, which can be a pain if the window is resized (particularly width).
- Print preview looks bad, but when printing it actually works. It also prints the "buttons". I'm still unsure if I want to fix this.

### <a name='Plannedfeatures'></a>Planned features?

- [x] ~~Creating headings by typing hashes at the beginning of the line.~~
- [ ] Checkboxes.
- [ ] Code cleanup, there is a lot of repetition (particularly in how I handle and rewrite selection ranges).
- [ ] Code cleanup, make it easier to reason about and extend, since I'm using it pretty regularly.
- [x] ~~Inject the fonts so there is no need to pull the CSSs for mono and serif.~~

### <a name='Thecommandsavailablesofararethefollowing'></a>The commands available (so far) are the following **outdated**

| Command     | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| mono        | Switch to a monospace font (Monoid) (stored in config)                         |
| serif       | Switch to a serif font (Reforma1969) (stored in config)                        |
| fontup      | Increase the document font by 2 pixels (stored in config)                      |
| fontdown    | Decrease the document font by 2 pixels (stored in config)                      |
| new         | Create a new document (erasing the current one)                                |
| print/🖨️    | Trigger the print dialog                                                       |
| dark        | Toggle dark/light mode (stored in config)                                      |
| save/💾     | Save the current changes and config in the URL, so it survives browser crashes |
| bold/b      | Bold the selected text                                                         |
| italic/i    | Italicize the selected text                                                    |
| underline/u | Underline the selected text                                                    |
| help        | Display help                                                                   |
| narrow      | Reduce the typing area width by 10% (stored in config)                         |
| widen       | Increase the typing area width by 10% (stored in config)                       |

### <a name='Name'></a>Name?

This used to be named Om, short for _Omni_. Acme (corp and the editor too) do many things.

After adding a bunch of features I started to not like the name that much, and changed it to
_Weave_, because it lets you weave evaluated code with normal text, a bit like `weave` from
Knuth's Literate Programming tool.

### <a name='Why'></a>Why?

Useful to take somewhat transient and local notes, without needing a text editor of any kind. It's also kind of fun having so much functionality in it.

### <a name='Tests'></a>Tests

I have set up tests using Mocha/Chai running directly in the browser. They create a "Weave" instance hidden, and run commands against that. Works surprisingly effective. You can see them all [here](http://rberenguel.github.io/weave/tests/all_the_tests.html). Each panel corresponds to a separate iframe with a set of tests.

The tests don't run independently (for example, testing that `split` splits depends on testing that `split` becomes a button), so clicking on the "isolation" will fail.

### Libraries used (incomplete, sorry, will eventually fill these up)

# [svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom)
