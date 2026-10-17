// ==UserScript==
// @name         Goodreads and Amazon Libby Results
// @namespace    https://github.com/holyspiritomb
// @version      3.3.0
// @description  Searches for the book you are looking at on Goodreads or Amazon across all your libby libraries with cards. Originally forked from Dylancyclone's Goodreads Libby Results script.
// @author       holyspiritomb
// @updateURL    https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @downloadURL  https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @match        https://www.goodreads.com/book/show/*
// @match        https://www.amazon.com/*
// @match        https://bookshop.org/p/books/*
// @connect      thunder.api.overdrive.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=libbyapp.com
// @require      https://raw.githubusercontent.com/LoneBoco/GM_config/550b6fc909fdd825252b60e836d324054dde085c/gm_config.js
// @resource     wincss https://unpkg.com/7.css/dist/7.scoped.css
// @grant        GM.setValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

/* globals GM_config */
(function () {
  "use strict";
  const frame = document.createElement('dialog');
  frame.className = "win7";
  document.body.appendChild(frame);
  const win_css = GM_getResourceText("wincss");
  let wincss;
  if (win_css.startsWith('"')) {
    wincss = win_css.slice(0,-1);
  } else {
    wincss = win_css;
  }

  const gmc = new GM_config(
    {
      'frame': frame,
      'id': 'MyConfig', // The id used for this instance of GM_config
      'title': 'Libby Userscript Settings', // Panel Title
      'fields': {
        'libraries': {
          'label': 'libraries', // Appears next to field
          'title': 'list of libraries separated by commas',
          'type': 'textarea',
          'default': 'queerliblib, fairfax'
        },
      },
      'events': {
        'init': onInit,
        'save': function() {
          this.log(this.get('libraries'))
          console.log(this)
        },
        'open': function() {
          document.querySelector("#MyConfig_wrapper").className = "window";
          const titleBarText = document.createElement("div");
          titleBarText.innerText = "Libby Userscript";
          titleBarText.className = "title-bar-text";
          document.querySelector("#MyConfig .config_header").classList.add("title-bar");
          document.querySelector("#MyConfig .config_header").lastChild.remove();
          document.querySelector("#MyConfig .config_header").appendChild(titleBarText);
          document.querySelector("#MyConfig .section_header_holder").classList.add("window-body");
          document.querySelector("#MyConfig .section_header_holder").classList.add("has-space");
          const buttons = document.querySelector("#MyConfig_buttons_holder");
          document.querySelector("#MyConfig .section_header_holder").appendChild(buttons);
        }
      },
      'css': [
        "#MyConfig .field_label { font-weight: bold; margin-right: 6px; }",
        "#MyConfig .block { display: block; }",
        "#MyConfig .indent40 { margin-left: 40%; }",
        "#MyConfig .center { text-align: center; }",
        "#MyConfig .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }",
        "#MyConfig .reset, #MyConfig .reset a, #MyConfig_buttons_holder { text-align: right; }"
      ].join(" "),
    }
  );

  function onInit() {
  // initialization complete
  // value is now available
    const libraryListInit = gmc.get('libraries');
    console.log(libraryListInit)
    console.log(gmc)
    gmc.css.basic = "";
  }


  function currentSite() {
    if (window.location.host == "www.amazon.com") {
      return "amazon";
    } else if (window.location.host == "www.goodreads.com") {
      return "gr";
    } else if (window.location.host == "bookshop.org") {
      return "bookshop";
    }
  }

  const site = currentSite();

  function getLdJsonObj(input) {
    const jsonEl = document.querySelector("script[type='application/ld+json']");
    const jsonStr = jsonEl.innerText;
    const jsonObj = JSON.parse(jsonStr);
    const author = jsonObj.author[0].name;
    const title = jsonObj.name;
    if (input == "author") {
      console.log("author is: ", author);
      return author;
    } else if (input == "title") {
      console.log("title is: ", title);
      return title;
    } else {
      return null;
    }
  }

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
        const findGrBox = () => document.querySelector("[itemprop='description']") || document.getElementById("descriptionContainer");
        anchorEl = findGrBox();
      }
    } else if (site == "bookshop") {
      const selector = "div[data-testid='format-selector']";
      anchorEl = document.querySelector(selector);
      if (anchorEl == null) {
        const bsAnchorEl = () => document.querySelector(selector);
        anchorEl = bsAnchorEl();
        if (anchorEl == null) {
          const bsAnchorEl = async () => document.querySelector(selector);
          anchorEl = await bsAnchorEl();
        }
      }
      console.log(anchorEl);
    } else {
      return;
    }
    return anchorEl;
  }

  function sanitize(t) {
    const sanitized = t.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
    return sanitized;
  }

  const getTitle = async () => {
    if (site == "amazon") {
      const findAmTitleEl = () => document.querySelector("#ebooksTitle") || document.querySelector("span#productTitle") || document.querySelector("h1#title");
      const bookTitleEl = findAmTitleEl();
      return bookTitleEl.innerText;
    } else if (site == "gr") {
      const bookTitleEl = document.querySelector("[data-testid='bookTitle']");
      return bookTitleEl.innerText;
    } else if (site == "bookshop") {
      const bookTitle = getLdJsonObj("title");
      return bookTitle;
    }
  }

  const getAuthor = async () => {
    if (site == "amazon") {
      const findAuthorEl = () => document.querySelector("div#bylineInfo > span.author > a") || document.querySelector("div#bylineInfo span#contributorLink") || document.querySelector("a#bylineContributor");
      const authorEl = findAuthorEl();
      if (authorEl == null) {
        return "";
      }
      return authorEl.innerText;
    } else if (site == "gr") {
      const findAuthorEl = () => document.querySelector("[aria-label^='By: ']") || document.querySelector("span.ContributorLink__name");
      const authorEl = findAuthorEl();
      return authorEl.innerText;
    } else if (site == "bookshop") {
      const bookAuthor = getLdJsonObj("author");
      return bookAuthor;
    }
  }

  async function createResultsDiv() {
    const libbyContainer = document.createElement("div");
    libbyContainer.id = "grLibbyBoxforked";
    libbyContainer.className = "win7";
    if (site == "bookshop") {
      libbyContainer.style.minWidth = "350px";
      libbyContainer.style.marginLeft = "0px";
      libbyContainer.style.marginTop = "10px";
      libbyContainer.style.marginBottom = "10px";
    }
    let libbyResultsHeader;
    if (site == "amazon") {
      libbyResultsHeader = document.createElement("h3");
      libbyResultsHeader.className = "rpi-header a-spacing-small";
    } else if (site == "gr") {
      libbyResultsHeader = document.createElement("h4");
      libbyResultsHeader.className = "Text Text__title3";
    } else if (site == "bookshop") {
      libbyResultsHeader = document.createElement("h1");
      libbyResultsHeader.className = "title-sm lg:title-xl"
    }
    libbyResultsHeader.innerHTML = "Libby Userscript Results";
    libbyContainer.appendChild(libbyResultsHeader);
    const libbyResultsContainer = document.createElement("div");
    libbyResultsContainer.id = "libby-results-forked";
    libbyResultsContainer.style.padding = "5px";
    libbyResultsContainer.style.lineHeight = "1.5em";
    libbyResultsContainer.style.height = "auto";
    if (site == "gr") {
      libbyResultsContainer.style.marginLeft = "1em";
      libbyResultsContainer.style.overflowY = "auto";
      libbyResultsContainer.style.maxHeight = "30vh";
    } else if (site == "bookshop") {
      libbyResultsContainer.classList.add("self-stretch");
    }
    libbyResultsContainer.style.display = "flex";
    libbyResultsContainer.style.flexDirection = "column";
    libbyContainer.appendChild(libbyResultsContainer);
    const button = document.createElement("span");
    button.id = "libbyUserscriptConfig";
    button.innerText = "\uD83D\uDD27 Configure Libby Userscript";
    button.role = "button";
    button.title = "libby userscript configuration";
    button.ariaLabel = "libby userscript configuration";
    button.addEventListener('click', function(){
      gmc.open()
    })
    libbyContainer.appendChild(button);
    return libbyContainer;
  }

  function insertContainer(el, prevContainer) {
    let position;
    if (site == "gr") {
      position = "afterend"
    } else if (site == "amazon") {
      position = "beforebegin"
    } else if (site == "bookshop") {
      position = "beforebegin"
    }
    prevContainer.insertAdjacentElement(position, el);
  }

  const addLibbyResults = async () => {
    const anchor = await findAnchor();
    if (anchor && anchor != undefined) {
      const libbyResults = await createResultsDiv();
      insertContainer(libbyResults, anchor);
    }
    const bookAuthorStr = await getAuthor();
    const bookTitle = await getTitle();

    const searchTitle = sanitize(bookTitle);
    const apiSearchString = getApiString(searchTitle, bookAuthorStr);
    const urlSearchString = getUrlString(searchTitle, bookAuthorStr);


    const libraryList = gmc.get('libraries')

    if (libraryList.length === 0) {
      document.getElementById("libby-results-forked").innerHTML = `No libraries found. Please configure some libraries.`;
    }

    const libraries = libraryList.split(",")

    libraries.map((library) => {
      library = library.trim()
      const apiUrl = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${apiSearchString}`;
      GM_xmlhttpRequest({
        method: "GET",
        url: apiUrl,
        responseType: 'json',
        context: library,
        onload: function(response) {
          const requestResult = response.response;
          console.log(response.context, requestResult);
          if (requestResult.totalItems === 0) {
            console.log(`none found at ${library}`);
            const noresultsElem = document.createElement('div');
            noresultsElem.className=library;
            noresultsElem.style.paddingBottom="5px";
            noresultsElem.style.display = "flex";
            noresultsElem.style.flexDirection = "row";
            const noresultsElementLink = document.createElement("a");
            noresultsElementLink.id = `libby-forked-${library}`;
            noresultsElementLink.classList.add("no-result");
            noresultsElementLink.href = `https://libbyapp.com/search/${library}/search/query-${urlSearchString}/page-1`;
            noresultsElementLink.innerText = "none found";
            noresultsElementLink.ariaLabel = `no results found at ${library}`;
            noresultsElem.appendChild(noresultsElementLink);
            const libbyResults = () => document.getElementById("libby-results-forked");
            const box = libbyResults();
            box.appendChild(noresultsElem);
          } else {
            const resultsElement = document.createElement('div');
            resultsElement.className=library;
            resultsElement.style.paddingBottom="5px";
            resultsElement.style.display = "flex";
            resultsElement.style.flexDirection = "row";
            const resultsElementLink = document.createElement("div");
            resultsElementLink.id = `libby-forked-${library}`;
            resultsElement.appendChild(resultsElementLink);

            // document.getElementById("libby-results-forked").appendChild(resultsElement);
            const libbyResults = () => document.getElementById("libby-results-forked");
            const box = libbyResults();
            box.appendChild(resultsElement);

            const resultItems = requestResult.items;
            resultItems.forEach(item => {
              console.log(item);
              let itemFormat = "";
              if (item.type.id === "audiobook"){
                itemFormat = '\uD83C\uDFA7'
              }
              if (item.type.id === "ebook"){
                itemFormat = '\uD83D\uDCDA'
              }
              let bookLinkText;
              const resultClasses = ["result"];
              if (item.ownedCopies != 0) {
                if (item.availableCopies === 0) {
                  resultClasses.push("hold");
                  bookLinkText = `${item.holdsCount}/${item.ownedCopies} holds ${itemFormat}`;
                } else {
                  resultClasses.push("available");
                  bookLinkText = `${item.availableCopies} available ${itemFormat}`;
                }
              } else {
                resultClasses.push("request");
                bookLinkText = "request";
              }
              const resultElem = document.createElement('a');
              resultElem.classList.add(...resultClasses);
              resultElem.href = `https://libbyapp.com/search/${library}/search/query-${urlSearchString}/page-1/${item.id}`;
              resultElem.style.display = "block";
              resultElem.title = `${library}: ${item.title} by ${item.creators[0].name} ${itemFormat}`;
              resultElem.ariaLabel = `${library}: ${item.title} by ${item.creators[0].name} ${itemFormat}`;
              // resultElem.style.color = linkColor;
              resultElem.innerHTML = bookLinkText;
              document.getElementById(
                `libby-forked-${library}`
              ).appendChild(resultElem);
            });
          }
        }
      });
    });
  }

  const debugCss = `
  #grLibbyBoxforked {
    outline: 3px double currentColor !important;
  }
  #grLibbyBoxforked > * {
    outline: 2px dashed red;
  }
  #grLibbyBoxforked > * > * {
    outline: 1px dotted orange;
    padding: 2px;
  }
  #grLibbyBoxforked > * > * > * {
    outline: 1px dotted limegreen;
    padding: 2px;
  }
  #grLibbyBoxforked > * > * > * > *{
    outline: 1px dotted blue;
    padding: 2px;
  }`

  GM_addStyle(wincss);
  GM_addStyle(`
    @media screen and (width > 500px) {
      #MyConfig[style] {
        inset: 35% 10% !important;
        height: 300px !important;
        width: 400px !important;
        border: 0;
      }
    }
    @media screen and (width <= 500px) {
      #MyConfig[style] {
        inset: 20% 10% !important;
        height: 220px !important;
        overflow-y: scroll;
        overflow-x: scroll;
        background: transparent !important;
        border: 0 !important;
      }
    }
    #MyConfig textarea {
      color: #111 !important;
      background-color: #fff !important;
    }
    #libbyUserscriptConfig {
      padding-top:0.5em;
      padding-bottom:0.5em;
      color: #111 !important;
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
    #libby-results-forked > div > a > div {
      line-height: inherit;
    }
    #libby-results-forked a.no-result,
    #libby-results-forked a.result {
      text-decoration: none !important;
    }
    #libby-results-forked a.no-result {
      color: var(--color-text-subdued, #555) !important;
    }
    #libby-results-forked a.result.request,
    #libby-results-forked a.result.hold {
      color: var(--color-background-rating-star-base, #ff6e21) !important;
    }
    #libby-results-forked a.result.available {
      color: limegreen !important;
    }
    html[data-theme="dark"] #libby-results-forked a.result.request,
    html[data-theme="dark"] #libby-results-forked a.result.hold {
      color: #ffbe3d !important;
    }
    html[data-theme="dark"] #libby-results-forked a.result.available {
      color: #6dff6d !important;
    }
    #libby-results-forked a.result:hover {
      text-decoration: underline !important;
    }`);

  let TIMEOUT = 10000;

  if (window.location.href.endsWith("debug=true")) {
    GM_addStyle(debugCss);
    TIMEOUT = 5000; // I am impatient when debugging
  }
  console.log(`Adding results in ${TIMEOUT/1000} seconds...`)
  setTimeout(() => {
    addLibbyResults();
  }, TIMEOUT);
})();
