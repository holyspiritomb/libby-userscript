// ==UserScript==
// @name          Goodreads and Amazon Libby Results
// @namespace     https://github.com/holyspiritomb
// @version       2.0.4
// @description   Searches for the book you are looking at on Goodreads or Amazon across all your libby libraries with cards. Originally forked from Dylancyclone's Goodreads Libby Results script.
// @author        holyspiritomb
// @updateURL     https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability.user.js
// @match         https://libbyapp.com/interview/menu
// @include       /^https?://.*\.goodreads\.com/book/show.*$/
// @include       *://*.amazon.tld/*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=libbyapp.com
// @grant         GM.setValue
// @grant         GM.getValue
// @grant         GM_addStyle
// @run-at        document-idle
// @license       MIT
// ==/UserScript==

(function () {
  "use strict";

  const syncLibraries = () => {
    // Grab libraries from libby and remove circular references
    // Use current cards instead of all libraries in history
    let libraries = unsafeWindow.APP.patron.cards.all.map((card) => {
      return {
        baseKey: card.library.baseKey,
        _: { activeKey: card.library._.activeKey, name: card.library._.name },
      };
    });
    console.log("library sync button clicked");
    console.log(libraries);
    libraries = JSON.stringify(libraries);
    GM.setValue("libraries", libraries);
  };

  function createResultsDiv(site) {
    const libbyContainer = document.createElement("div");
    libbyContainer.id = "grLibbyBoxforked";
    libbyContainer.style.margin = "10px";
    let libbyResultsHeader;
    if (site == "amazon") {
      libbyResultsHeader = document.createElement("h3");
      libbyResultsHeader.className = "rpi-header a-spacing-small";
    } else if (site == "gr") {
      libbyResultsHeader = document.createElement("h4");
      libbyResultsHeader.className = "Text__title4";
    }
    libbyResultsHeader.innerHTML = "Libby Userscript Results";
    libbyContainer.appendChild(libbyResultsHeader);
    let libbyResultsContainer = document.createElement("div");
    libbyResultsContainer.id = "libby-results-forked";
    libbyResultsContainer.style.padding = "5px";
    if (site == "gr") {
      libbyResultsContainer.style.marginLeft = "1em";
      libbyResultsContainer.style.overflowY = "auto";
      libbyResultsContainer.style.maxHeight = "30vh";
    }
    libbyResultsContainer.style.display = "flex";
    libbyResultsContainer.style.flexDirection = "column";
    libbyContainer.appendChild(libbyResultsContainer);
    return libbyContainer;
  }

  function insertContainer(el, prevContainer, position) {
    prevContainer.insertAdjacentElement(position, el);
  }

  const createLibbyButton = () => {
    let builderDiv = document.createElement("li");
    builderDiv.innerHTML = `
					<li class="summary-list-action">
						<button class="summary-list-action-add-library halo" role="button" type="button">
								<span role="text" id="libby-script-forked">Save Libraries (userscript)</span>
						</button>
					</li>
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
    // let container = document.getElementsByClassName("menu-library-buttons");
    let container = document.getElementsByClassName("summary-list-action-add-library");
    if (container && container[0]) {
      container[0].parentNode.parentNode.insertBefore(
        createLibbyButton(),
        container[0].parentNode.nextSibling
      );
    } else {
      setTimeout(addLibbyButton, 10);
    }
  };

  const addGoodreadsResults = async () => {
    // let bookTitle;
    let bookTitleEl;
    // let bookAuthor;
    let bookAuthorEl;
    let bookAuthorStr;
    if (unsafeWindow.location.host == "www.amazon.com") {
      let findAmTitleEl = () => document.querySelector("span#ebooksTitle") || document.querySelector("span#productTitle");
      bookTitleEl = findAmTitleEl();
      let findBookAuthorEl = () => document.querySelector("div#bylineInfo > span.author > a") || document.querySelector("div#bylineInfo > a#bylineContributor");
      bookAuthorEl = findBookAuthorEl();
    } else if (unsafeWindow.location.host == "www.goodreads.com") {
      bookTitleEl = document.querySelector("[data-testid='bookTitle']");
      let findBookAuthorEl = () => document.querySelector("[aria-label^='By: ']") || document.querySelector("span.ContributorLink__name");
      bookAuthorEl = findBookAuthorEl();
    }
    let bookTitle = bookTitleEl.innerText;
    let searchTitle = bookTitle.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
    let apiSearchString;
    let urlSearchString;
    if (bookAuthorEl == null) {
      if (bookAuthorStr != undefined) {
        apiSearchString = encodeURIComponent(searchTitle) + "&creator=" + encodeURIComponent(bookAuthorStr);
        urlSearchString = encodeURIComponent(searchTitle) + encodeURIComponent(" ") + encodeURIComponent(bookAuthorStr);
      } else {
        apiSearchString = encodeURIComponent(searchTitle);
        urlSearchString = encodeURIComponent(searchTitle);
      }
    } else {
      let bookAuthor = bookAuthorEl.innerText;
      apiSearchString = encodeURIComponent(searchTitle) + "&creator=" + encodeURIComponent(bookAuthor);
      urlSearchString = encodeURIComponent(searchTitle) + encodeURIComponent(" ") + encodeURIComponent(bookAuthor);
    }
    //console.log(apiSearchString);
    let libraries = JSON.parse(await GM.getValue("libraries", "[]"));
    var previousBox;
    if (unsafeWindow.location.host == "www.amazon.com") {
      let findPreviousBox = () => document.getElementById("shopAllFormats_feature_div") || document.getElementById("bookDescription_feature_div") || document.getElementById("tmmSwatches");
      previousBox = findPreviousBox();
    } else if (unsafeWindow.location.host == "www.goodreads.com") {
      previousBox = document.querySelector(".BookDetails");
      if (previousBox == null) {
        let findPreviousBox = () => document.querySelector("[itemprop='description']") || document.getElementById("descriptionContainer");
	      previousBox = findPreviousBox();
      }
    }

    if (unsafeWindow.location.host == "www.amazon.com") {
      insertContainer(createResultsDiv("amazon"), previousBox, "beforebegin");
      let hr = document.createElement("hr");
      previousBox.insertAdjacentElement("beforebegin", hr);
    } else if (unsafeWindow.location.host == "www.goodreads.com") {
      insertContainer(createResultsDiv("gr"), previousBox, "afterend");
    }
    if (libraries.length === 0) {
      document.getElementById(
        "libby-results-forked"
      ).innerHTML = `No libraries found. Please visit <a href="https://libbyapp.com/interview/menu" target="_blank">here</a> to sync your libraries.`;
    }

    libraries.map((library) => {
      let libraryKey = library._.activeKey || library.baseKey;
      let url = `https://thunder.api.overdrive.com/v2/libraries/${libraryKey}/media?query=${apiSearchString}`;
      fetch(url)
        .then((response) => response.json())
        .then((result) => {
          if (result.totalItems === 0){
            console.log(`none found at ${library.baseKey}`);
            let noresultsElem = document.createElement('div');
            noresultsElem.className=library.baseKey;
            noresultsElem.style.paddingBottom="5px";
            noresultsElem.style.display = "flex";
            noresultsElem.style.flexDirection = "row";
            let noresultsElementLink = document.createElement("a");
            noresultsElementLink.id = `libby-forked-${library.baseKey}`;
            noresultsElementLink.href = `https://libbyapp.com/search/${library.baseKey}/search/query-${urlSearchString}/page-1`;
            noresultsElementLink.style.color = "#555";
            noresultsElementLink.innerText = "none found";
            noresultsElem.appendChild(noresultsElementLink);
            document.getElementById("libby-results-forked").appendChild(noresultsElem);
          } else {
            let resultsElement = document.createElement('div');
            resultsElement.className=library.baseKey;
            resultsElement.style.paddingBottom="5px";
            resultsElement.style.display = "flex";
            resultsElement.style.flexDirection = "row";
            let resultsElementLink = document.createElement("a");
            resultsElementLink.id = `libby-forked-${library.baseKey}`;
            // resultsElementLink.href = `https://${library.baseKey}.overdrive.com/search/title?query=${apiSearchString}`;
            resultsElementLink.href = `https://libbyapp.com/search/${library.baseKey}/search/query-${urlSearchString}/page-1`;
            resultsElement.appendChild(resultsElementLink);
            document.getElementById("libby-results-forked").appendChild(resultsElement);
            let resultItems = result.items;
            resultItems.forEach(item => {
              console.log(item);
              var itemFormat = "";
              if (item.type.id === "audiobook"){
                itemFormat = '\uD83C\uDFA7'
              }
              if (item.type.id === "ebook"){
                itemFormat = '\uD83D\uDCDA'
              }
              var bookLinkText;
              var linkColor;
              if (item.ownedCopies != 0) {
                if (item.availableCopies === 0) {
						      bookLinkText = `${item.holdsCount}/${item.ownedCopies} holds ${itemFormat}`;
                  linkColor = (document.querySelector("html[data-theme='light']")) ? "orange" : "#ffbe3d";
					      } else {
						      bookLinkText = `${item.availableCopies} available ${itemFormat}`;
                  linkColor = (document.querySelector("html[data-theme='light']")) ? "limegreen" : "#6dff6d";
					      }
				      } else {
					      bookLinkText = "request"
                linkColor = (document.querySelector("html[data-theme='light']")) ? "orange" : "#ffbe3d";
				      }
              let resultElem = document.createElement('div');
              resultElem.className = "result";
              resultElem.title = `${library.baseKey}: ${item.title} by ${item.creators[0].name} ${itemFormat}`;
              resultElem.style.color = linkColor;
              resultElem.innerHTML = bookLinkText;
              document.getElementById(
                `libby-forked-${library.baseKey}`
              ).appendChild(resultElem);
            });
          }
        });
    });
    // put something here in case of no resulrs
  };

  if (unsafeWindow.location.host == "libbyapp.com") {
    addLibbyButton();
  } else if ((unsafeWindow.location.host == "www.goodreads.com") || (unsafeWindow.location.host == "www.amazon.com")) {
    GM_addStyle(`#libby-results-forked > div::before {
      content: attr(class) ': ';
      flex-basis: 7.5em;
      line-height: inherit;
      }
      #libby-results-forked {
        line-height: 1.5em;
      }
      #libby-results-forked > div,
      #libby-results-forked > div > a,
      #libby-results-forked > div > a > div{
        line-height: inherit;
      }
      #libby-results-forked > div > a{
        text-decoration: none;
      }
      #libby-results-forked > div > a:hover {
        text-decoration: underline;
      }`);
    addGoodreadsResults();
  }
})();
