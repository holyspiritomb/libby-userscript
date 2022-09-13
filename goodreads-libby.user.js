// ==UserScript==
// @name          Goodreads Libby Results (forked)
// @namespace     https://github.com/holyspiritomb
// @version       1.0.0
// @description   Searches for the book you are looking at on Goodreads across all your libby libraries. Forked from Dylancyclone's script.
// @author        holyspiritomb
// @match         https://libbyapp.com/interview/menu
// @include       /^https?://.*\.goodreads\.com/book/show.*$/
// @icon          https://www.google.com/s2/favicons?sz=64&domain=libbyapp.com
// @grant         GM.setValue
// @grant         GM.getValue
// @run-at        document-idle
// @license       MIT
// ==/UserScript==

(function () {
  "use strict";

  const syncLibraries = () => {
    // Grab libraries from libby and remove circular references
    let libraries = unsafeWindow.APP.libraries.all.map((library) => {
      return {
        baseKey: library.baseKey,
        _: { activeKey: library._.activeKey, name: library._.name },
      };
    });
    libraries = JSON.stringify(libraries);
    GM.setValue("libraries", libraries);
  };

  const createLibbyButton = () => {
    let builderDiv = document.createElement("div");
    builderDiv.innerHTML = `
					<div class="menu-library-buttons">
						<button class="menu-library-buttons-add-library halo" role="button" type="button">
								<span role="text">Save Libraries (userscript)</span>
						</button>
					</div>
				`.trim();
    let libbySyncButton = builderDiv.firstChild;
    libbySyncButton.onclick = syncLibraries;
    return libbySyncButton;
  };

  /**
   * Add the button
   * Might outrun the rest of the dom,
   * so keep retrying until the container is ready
   */
  const addLibbyButton = () => {
    let container = document.getElementsByClassName("menu-library-buttons");
    if (container && container[0]) {
      container[0].parentNode.insertBefore(
        createLibbyButton(),
        container[0].nextSibling
      );
    } else {
      setTimeout(addLibbyButton, 10);
    }
  };

  const addGoodreadsResults = async () => {
    let bookTitle = document.getElementById("bookTitle").innerHTML.trim();
    let bookAuthor = document
      .getElementsByClassName("authorName")[0]
      .firstChild.innerHTML.trim();
    let searchTitle = bookTitle.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
    let searchString = encodeURIComponent(searchTitle) + "&creator=" + encodeURIComponent(bookAuthor);
    console.log(searchString);
    let libraries = JSON.parse(await GM.getValue("libraries", "[]"));
    let previousBox = document.getElementById("descriptionContainer");
    previousBox.innerHTML += `<div style="padding-left: 1em;
                        padding-right: 1em" id="grLibbyBox">
                        <h2 class="buyButtonContainer__title u-inlineBlock">Libby results</h2>
          <div id="libby-results"></div>
          </div>`;

    if (libraries.length === 0) {
      document.getElementById(
        "libby-results"
      ).innerHTML = `No libraries found, please visit <a href="https://libbyapp.com/interview/menu" target="_blank">here</a> to sync your libraries.`;
    }

    libraries.map((library) => {
      let libraryKey = library._.activeKey || library.baseKey;
      let url = `https://thunder.api.overdrive.com/v2/libraries/${libraryKey}/media?query=${searchString}`;
      fetch(url)
        .then((response) => response.json())
        .then((result) => {
          //let libraryResultURL = "http://" + library.baseKey +".overdrive.com/search/title?query=" + encodeURIComponent(bookTitle) + "&creator=" + encodeURIComponent(bookAuthor);
          //console.log("url of book: ", libraryResultURL);
          document.getElementById(
            "libby-results"
          ).innerHTML += `<div>${library._.name} <b><a href="http://${library.baseKey}.overdrive.com/search/title?query=${searchString}" target="_blank">${result.totalItems} results</a></b></div>`;
        });
    });
  };

  if (unsafeWindow.location.host == "libbyapp.com") {
    addLibbyButton();
  } else if (unsafeWindow.location.host == "www.goodreads.com") {
    addGoodreadsResults();
  }
})();
