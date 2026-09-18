// ==UserScript==
// @name         Goodreads and Amazon Libby Results
// @namespace    https://github.com/holyspiritomb
// @version      3.0.0
// @description  Searches for the book you are looking at on Goodreads or Amazon across all your libby libraries with cards. Originally forked from Dylancyclone's Goodreads Libby Results script.
// @author       holyspiritomb
// @updateURL    https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @downloadURL  https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @match        https://www.goodreads.com/book/show/*
// @match        https://www.amazon.com/dp/B*
// @match        https://www.amazon.com/gp/product/B*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=libbyapp.com
// @require      https://raw.githubusercontent.com/LoneBoco/GM_config/550b6fc909fdd825252b60e836d324054dde085c/gm_config.js
// @grant        GM.setValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

/* globals GM_config */
(function () {
  "use strict";

  let gmc = new GM_config(
    {
      // 'frame': frame,
      'id': 'MyConfig', // The id used for this instance of GM_config
      'title': 'Libby Userscript Settings', // Panel Title
      'fields': {
        'libraries': {
          'label': 'libraries separated by commas', // Appears next to field
          'type': 'textarea',
          'default': 'queerliblib,fairfax'
        },
      },
      'events': {
        'init': onInit,
        'save': function() {
          this.log(this.get('libraries'))
        }
      },
      'frameStyle': [
        'bottom: 0; border: 1px solid #000; display: none; height: 250px;',
        'left: 0; margin: 0; max-height: 50%; max-width: 75%; opacity: 0;',
        'overflow: auto; padding: 0; position: fixed; right: auto; top: auto;',
        'width: 300px; z-index: 9999; border-radius:5px;'
      ].join(' '),
      'css': "#MyConfig {background-color:ivory;,color:#000000} #MyConfig .config_header{font-size:1.2em; color: black} #MyConfig *{color:black, background-color:lightgray}",
    }
  );

  function onInit() {
  // initialization complete
  // value is now available
    let libraryListInit = gmc.get('libraries');
    console.log(libraryListInit)
  }


  function currentSite() {
    if (unsafeWindow.location.host == "www.amazon.com") {
      return "amazon";
    } else if (unsafeWindow.location.host == "www.goodreads.com") {
      return "gr";
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
    let button = document.createElement("span");
    button.id = "libbyUserscriptConfig";
    button.innerText = "config";
    button.addEventListener('click', function(){
      gmc.open()
    })
    libbyContainer.appendChild(button);
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

  const addLibbyResults = async () => {
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


    const libraryList = gmc.get('libraries')

    if (libraryList.length === 0) {
      document.getElementById("libby-results-forked").innerHTML = `No libraries found. Please configure some libraries.`;
    }

    const libraries = libraryList.split(",")

    libraries.map((library) => {
      library = library.trim()
      let url = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${apiSearchString}`;
      fetch(url)
        .then((response) => response.json())
        .then((result) => {
          if (result.totalItems === 0){
            console.log(`none found at ${library}`);
            let noresultsElem = document.createElement('div');
            noresultsElem.className=library;
            noresultsElem.style.paddingBottom="5px";
            noresultsElem.style.display = "flex";
            noresultsElem.style.flexDirection = "row";
            let noresultsElementLink = document.createElement("a");
            noresultsElementLink.id = `libby-forked-${library}`;
            noresultsElementLink.href = `https://libbyapp.com/search/${library}/search/query-${urlSearchString}/page-1`;
            noresultsElementLink.style.color = "#555";
            noresultsElementLink.innerText = "none found";
            noresultsElem.appendChild(noresultsElementLink);
            const libbyResults = () => document.getElementById("libby-results-forked");
            const box = libbyResults();
            box.appendChild(noresultsElem);
          } else {
            let resultsElement = document.createElement('div');
            resultsElement.className=library;
            resultsElement.style.paddingBottom="5px";
            resultsElement.style.display = "flex";
            resultsElement.style.flexDirection = "row";
            let resultsElementLink = document.createElement("div");
            resultsElementLink.id = `libby-forked-${library}`;
            resultsElement.appendChild(resultsElementLink);
            
            // document.getElementById("libby-results-forked").appendChild(resultsElement);
            const libbyResults = () => document.getElementById("libby-results-forked");
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
              resultElem.href = `https://libbyapp.com/search/${library}/search/query-${urlSearchString}/page-1/${item.id}`;
              resultElem.style.display = "block";
              resultElem.title = `${library}: ${item.title} by ${item.creators[0].name} ${itemFormat}`;
              resultElem.style.color = linkColor;
              resultElem.innerHTML = bookLinkText;
              document.getElementById(
                `libby-forked-${library}`
              ).appendChild(resultElem);
            });
          }
        });
    });
    // put something here in case of no resulrs
  };

  if ((unsafeWindow.location.host == "www.goodreads.com") || (unsafeWindow.location.host == "www.amazon.com")) {
    GM_addStyle(`
      #libbyUserscriptConfig {
        border: 1px outset currentColor;
        border-radius: 3px;
        color: currentColor;
        padding: 3px;
        padding-left:5px;
        padding-right:5px;
        display: block;
        margin-left:auto;
        margin-right:auto;
        text-align:center;
      }
      #libby-results-forked > div::before {
      content: attr(class) ': ';
      flex-basis: 7.5em;
      line-height: inherit;
      }
      #libby-results-forked > div {
        padding-top: 0.75em;
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
    console.log("Adding results in 10 seconds...")
    setTimeout(() => {
      addLibbyResults();
      // gmc.open()
    }, 5000);
  }
})();
