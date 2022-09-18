// ==UserScript==
// @name          Goodreads Libby Results (forked)
// @namespace     https://github.com/holyspiritomb
// @version       1.0.1
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
    let bookTitle = document.querySelector("meta[property='og:title']").content;
    let bookAuthor = document
      .getElementsByClassName("authorName")[0]
      .firstChild.innerHTML.trim();
    let searchTitle = bookTitle.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
    let searchString = encodeURIComponent(searchTitle) + "&creator=" + encodeURIComponent(bookAuthor);
    console.log(searchString);
    let libraries = JSON.parse(await GM.getValue("libraries", "[]"));
    var previousBox;
    if (!!(document.querySelector("html.mobile"))){
      previousBox = document.querySelector("[itemprop='description']");
    } else {
      previousBox = document.getElementById("descriptionContainer");
    }
    let libbyContainer = document.createElement("div");
    libbyContainer.id = "grLibbyBox";
    libbyContainer.innerHTML += `
                        <h2 class="buyButtonContainer__title u-inlineBlock brownBackground">Libby results</h2>
          <div id="libby-results" style="margin-left:1em;"></div>`;
    previousBox.insertAdjacentElement("afterend",libbyContainer);

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
          if (result.totalItems == 0){
            //console.log(`no items at ${librarykey}`);
          } else {
            document.getElementById(
              "libby-results"
            ).innerHTML += `<div class="${library.baseKey}" id="libby-${library.baseKey}"></div>`
            let resultItems = result.items;
            resultItems.forEach(item => {
              console.log(item);
              var itemFormat = "";
              if (item.type.id == "audiobook"){
                itemFormat = '\uD83C\uDFA7'
              }
              if (item.type.id == "ebook"){
                itemFormat = '\uD83D\uDCDA'
              }
              document.getElementById(
                `libby-${library.baseKey}`
              ).innerHTML += `<span><a href="http://${library.baseKey}.overdrive.com/search/title?query=${searchString}" title="${library.baseKey}: ${item.title} ${item.type.id}">${item.availableCopies}/${item.ownedCopies} ${itemFormat}</a></span>&nbsp;&nbsp;`;
            });
          }
        });
    });
  };

  if (unsafeWindow.location.host == "libbyapp.com") {
    addLibbyButton();
  } else if (unsafeWindow.location.host == "www.goodreads.com") {
    addGoodreadsResults();
  }
})();
