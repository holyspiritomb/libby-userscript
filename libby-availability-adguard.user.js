// ==UserScript==
// @name         Goodreads and Amazon Libby Results
// @namespace    https://github.com/holyspiritomb
// @version      3.1.0
// @description  Searches for the book you are looking at on Goodreads or Amazon across all your libby libraries with cards. Originally forked from Dylancyclone's Goodreads Libby Results script.
// @author       holyspiritomb
// @updateURL    https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @downloadURL  https://raw.githubusercontent.com/holyspiritomb/libby-userscript/main/libby-availability-adguard.user.js
// @match        https://www.goodreads.com/book/show/*
// @match        https://www.amazon.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=libbyapp.com
// @require      https://raw.githubusercontent.com/LoneBoco/GM_config/550b6fc909fdd825252b60e836d324054dde085c/gm_config.js
// @resource     wincss https://unpkg.com/7.css/dist/7.scoped.css
// @grant        GM.setValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
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
          'default': 'queerliblib,fairfax'
        },
      },
      'events': {
        'init': onInit,
        'save': function() {
          this.log(this.get('libraries'))
          console.log(this)
        }
      },
      'css': [
        "#MyConfig .config_header{font-size:1.2em}",
      ].join(" "),
    }
  );

  function onInit() {
  // initialization complete
  // value is now available
    const libraryListInit = gmc.get('libraries');
    console.log(libraryListInit)
    console.log(gmc)
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
        const findGrBox = () => document.querySelector("[itemprop='description']") || document.getElementById("descriptionContainer");
        anchorEl = findGrBox();
      }
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
    }
  }

  const getAuthor = async () => {
    if (site == "amazon") {
      const findAuthorEl = () => document.querySelector("div#bylineInfo > span.author > a") || document.querySelector("div#bylineInfo span#contributorLink");
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
    libbyContainer.className = "win7";
    libbyContainer.style.margin = "10px";
    let libbyResultsHeader;
    if (site == "amazon") {
      libbyResultsHeader = document.createElement("h3");
      libbyResultsHeader.className = "rpi-header a-spacing-small";
    } else if (site == "gr") {
      libbyResultsHeader = document.createElement("h4");
      libbyResultsHeader.className = "Text Text__title3";
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
      const url = `https://thunder.api.overdrive.com/v2/libraries/${library}/media?query=${apiSearchString}`;
      fetch(url)
        .then((response) => response.json())
        .then((result) => {
          if (result.totalItems === 0){
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

            const resultItems = result.items;
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
              // let linkColor;
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
        });
    });
    // put something here in case of no results
  };

  if ((unsafeWindow.location.host == "www.goodreads.com") || (unsafeWindow.location.host == "www.amazon.com")) {
    GM_addStyle(wincss);
    GM_addStyle(`
      @media screen and (width > 500px) {
        #MyConfig[style] {
          inset: 35% 10% !important;
          height: 300px !important;
          width: 400px !important;
        }
      }
      @media screen and (width <= 500px) {
        #MyConfig[style] {
          inset: 20% 10% !important;
          height: 220px !important;
          overflow-y: scroll;
          overflow-x: scroll;
        }
        #MyConfig_wrapper {
          padding: 0.5em;
        }
      }
      #libbyUserscriptConfig {
        padding-top:0.5em;
        padding-bottom:0.5em;
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
    console.log("Adding results in 10 seconds...")
    setTimeout(() => {
      addLibbyResults();
    }, 10000);
  }
})();
