// ==UserScript==
// @name          Goodreads and Amazon Libby Results
// @namespace     https://github.com/holyspiritomb
// @version       2.0.5
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
    const libraries = unsafeWindow.APP.patron.cards.all.map((card) => {
      return {
        baseKey: card.library.baseKey,
        _: { activeKey: card.library._.activeKey, name: card.library._.name },
      };
    });
    console.log("library sync button clicked");
    console.log(libraries);
    const stringylibraries = JSON.stringify(libraries);
    GM.setValue("libraries", stringylibraries);
  };

  function currentSite() {
    if (unsafeWindow.location.host == "www.amazon.com") {
      return "amazon";
    } else if (unsafeWindow.location.host == "www.goodreads.com") {
      return "gr";
    } else if (unsafeWindow.location.host == "libbyapp.com" ) {
      return "libby";
    }
  }

  const site = currentSite();

  function getApiString(title, author) {
    let searchString;
    if (author != undefined) {
      searchString = encodeURIComponent(title) + "&creator=" + encodeURIComponent(author);
      // return searchString;
    } else {
      searchString = encodeURIComponent(title);
    }
    return searchString;
  }

  function getUrlString(title, author) {
    let searchString;
    if (author != undefined) {
      searchString = encodeURIComponent(title) + encodeURIComponent(" ") + encodeURIComponent(author);
      // return searchString;
    } else {
      searchString = encodeURIComponent(title);
    }
    return searchString;
  }

  async function findAnchor() {
    let anchorEl;
    if (site == "amazon") {
      const findAmznBox = async () => document.getElementById("shopAllFormats_feature_div") || document.getElementById("bookDescription_feature_div") || document.getElementById("tmmSwatches");
      anchorEl = await findAmznBox();
    } else if (site == "gr") {
      anchorEl = document.querySelector(".BookPageMetadataSection__description");
      if (anchorEl == null) {
        let findGrBox = () => document.querySelector("[itemprop='description']") || document.getElementById("descriptionContainer");
	      anchorEl = findGrBox();
      }
    } else {
      return;
    }
    return anchorEl;
  }

  function sanitize(t) {
    let sanitized = t.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
    return sanitized;
  }

  const getTitle = async () => {
    if (site == "amazon") {
      let findAmTitleEl = () => document.querySelector("#ebooksTitle") || document.querySelector("span#productTitle") || document.querySelector("#title");
      const bookTitleEl = findAmTitleEl();
      return bookTitleEl.innerText;
    } else if (site == "gr") {
      const bookTitleEl = document.querySelector("[data-testid='bookTitle']");
      return bookTitleEl.innerText;
    }
  }

  const getAuthor = async () => {
    if (site == "amazon") {
      let findAuthorEl = () => document.querySelector("div#bylineInfo > span.author > a") || document.querySelector("div#bylineInfo > a#bylineContributor");
      const authorEl = findAuthorEl();
      if (authorEl == null) {
        return undefined;
      } else {
        return authorEl.innerText;
      }
    } else if (site == "gr") {
      const findAuthorEl = () => document.querySelector("[aria-label^='By: ']") || document.querySelector("span.ContributorLink__name");
      const authorEl = findAuthorEl();
      return authorEl.innerText;
    }
  }

  async function createResultsDiv() {
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
    libbyResultsContainer.style.lineHeight = "1.5em";
    libbyResultsContainer.style.height = "auto";
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

  function insertContainer(el, prevContainer) {
    var position;
    if (site == "gr") {
      position = "afterend"
    } else if (site == "amazon") {
      position = "beforebegin"
    }
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
    const anchor = await findAnchor();
    if (anchor && anchor != undefined) {
      let libbyResults = await createResultsDiv();
      insertContainer(libbyResults, anchor);
    }
    const bookAuthorStr = await getAuthor();
    const bookTitle = await getTitle();

    let searchTitle = sanitize(bookTitle);
    let apiSearchString = getApiString(searchTitle, bookAuthorStr);
    let urlSearchString = getUrlString(searchTitle, bookAuthorStr);

    let libraries = JSON.parse(await GM.getValue("libraries", "[]"));
    
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
            noresultsElementLink.href = `https://libbyapp.com/search/${libraryKey}/search/query-${urlSearchString}/page-1`;
            noresultsElementLink.style.color = "#555";
            noresultsElementLink.innerText = "none found";
            noresultsElem.appendChild(noresultsElementLink);
            const libbyResults = () => document.getElementById("libby-results-forked");
            const box = libbyResults();
            box.appendChild(noresultsElem);
            // document.getElementById("libby-results-forked").appendChild(noresultsElem);
          } else {
            let resultsElement = document.createElement('div');
            resultsElement.className=library.baseKey;
            resultsElement.style.paddingBottom="5px";
            resultsElement.style.display = "flex";
            resultsElement.style.flexDirection = "row";
            let resultsElementLink = document.createElement("div");
            resultsElementLink.id = `libby-forked-${libraryKey}`;
            // resultsElementLink.href = `https://${library.baseKey}.overdrive.com/search/title?query=${apiSearchString}`;
            // resultsElementLink.href = `https://libbyapp.com/search/${library.baseKey}/search/query-${urlSearchString}/page-1`;
            resultsElement.appendChild(resultsElementLink);
            
            // document.getElementById("libby-results-forked").appendChild(resultsElement);
            const libbyResults= () => document.getElementById("libby-results-forked");
            const box = libbyResults();
            box.appendChild(resultsElement);

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
              let resultElem = document.createElement('a');
              resultElem.className = "result";
              resultElem.href = `https://libbyapp.com/search/${libraryKey}/search/query-${urlSearchString}/page-1/${item.id}`;
              resultElem.style.display = "block";
              resultElem.title = `${libraryKey}: ${item.title} by ${item.creators[0].name} ${itemFormat}`;
              resultElem.style.color = linkColor;
              resultElem.innerHTML = bookLinkText;
              document.getElementById(
                `libby-forked-${libraryKey}`
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
