// GLOBALS
let fetchedQuotes = null
let selectedQuotes = null
let searchResultQuotes = null
let currentQuote = null
let currentSearchOption = 'all'
let audioQuotesOnly = false

// EVENT LISTNERS
$("#random-button").click(() => setCurrentQuoteAndDisplay())
$("#tweet-button").click(() => {
  const {quote, author} = currentQuote
  window.open(`https://twitter.com/intent/tweet?text=${quote} - ${author}`)
})
$("#search-bar").change(e => search(e))
$("#search-bar").keypress(e => {
  if (e.key === 'Enter') search(e)
})


$("#quoteAudioOption").change(() => handleQuoteAudioOptionChange())
$(".radio-search-option").click(e => currentSearchOption = e.target.value)

// FUNCTIONS
async function fetchQuotes () {
  // fetches quote automatically runs: see the 'onload' attribute on the body element
  const quotesJsonUrl = 'https://gist.githubusercontent.com/wasim-build/ef86214012be736228b2ae954fe75ac8/raw/5cb8a6487a8b822f53e3b7ca1ae13eef598d68da/civ-quotes.json'
  const fetchResponse = await fetch(quotesJsonUrl)
  const data = await fetchResponse.json()
  fetchedQuotes = data
  selectedQuotes = data
  setCurrentQuoteAndDisplay()
}

function setCurrentQuoteAndDisplay(id) {
  setCurrentQuote(id)
  displayQuote()
}

// current quote
function setCurrentQuote(id) {
  const setCurrentQuoteToRandom = () => {
    const randomNumber = Math.floor(Math.random() * selectedQuotes.length)
    currentQuote = selectedQuotes[randomNumber]
  }
  const setCurrectQuoteById = strId => {
    let id = parseInt(strId)
    currentQuote = selectedQuotes.find(quote => quote.id === id)
  }

  if(!id) {
    return setCurrentQuoteToRandom()
  } else {
    return setCurrectQuoteById(id)
  }
}

// display quote
function displayQuote() {
  const {subject, author, quote, game} = currentQuote

  $( "#quote-container" ).empty();
  const quoteHtml = getQuoteHtml()

  $("#quote-container").fadeOut(1200, function(){
    $("#quote-container").append(quoteHtml)
    setUpAudio()
    $("#quote-container").fadeIn(1200);
  })
}

function getQuoteHtml() {
  const {subject, author, quote, game} = currentQuote
  let gameEditionText = `from Civ ${gameNumberToRomanNumber(game)}`
  if(game === 6 && currentQuote.hasOwnProperty('proverbium')) {
    gameEditionText = `${gameEditionText} (Proverbium Mod)`
  }
  
  const blockQuoteHtml = () => {
    return (`
    <blockquote class="bg-white opacity-75 p-4 m-4 text-center">
      <p id="quote-text">${quote}</p>
    </blockquote>
    `)
  }

  const figCaptionHtml = () => {
    return (`
    <figcaption>
      <p class="text-end pe-4">
        <span id="quote-author" class="bg-white opacity-75 fst-italic p-2">- ${author}</span>
      </p>
      <p class="text-end pe-4 text-uppercase">
        <span id="quote-subject" class="bg-white opacity-75 p-2">${subject}</span>
      </p>
      <p class="text-end pe-4">
        <small class="bg-white opacity-75 p-2">
          <span id="quote-game" >${gameEditionText}</span>
        </small>
      </p>
    </figcaption
    `)
  }
  return (`
  <figure>
    ${blockQuoteHtml()}
    ${figCaptionHtml()}
  </figure>
  `)
}

function gameNumberToRomanNumber (int) {
  if(int === 4) return 'IV'
  if(int === 5) return 'V'
  if(int === 6) return 'VI'
  return int
}

// audio
function setUpAudio() {
  removePlayButton()
  const hasAudio = checkForAudio(currentQuote)
  if(hasAudio) {
    addPlayButton()
  } else {
    addNoAudioButton()
  }
}

function removePlayButton() {
  $( "#audio-button-container" ).empty();
}

function addPlayButton () {
  const buttonHtml = `
  <button id="sound-button" class="button p-2" onclick="playPause()">
    <audio id='soundd' onended="audioEnded()"></audio>
    <i id="soundB" class="fas fa-play"></i>
  </button>
  `
  $("#audio-button-container").append(buttonHtml)
  $('#soundd').attr("src", currentQuote.audio.url)
}

function addNoAudioButton() {
  const buttonHtml = `
  <button id="no-sound-button" class="button p-2" disabled>
    N/A
  </button>
  `
  $("#audio-button-container").append(buttonHtml)
}

function playPause() {
  if ($('#soundd').get(0).paused) {
    $('#soundd').get(0).play()
    $('#soundB').addClass("fa-pause").removeClass("fa-play")
  }
  else {
    $('#soundd').get(0).pause()
    $('#soundB').addClass("fa-play").removeClass("fa-pause")
  }
}
function audioEnded() {
  $('#soundB').addClass("fa-play").removeClass("fa-pause")
}

function handleQuoteAudioOptionChange() {
  audioQuotesOnly = !audioQuotesOnly
  if(audioQuotesOnly) {
    selectedQuotes = fetchedQuotes.filter( quote => checkForAudio(quote))
    if(!checkForAudio(currentQuote)) setCurrentQuoteAndDisplay()
  } else {
    selectedQuotes = fetchedQuotes
  }
}

function checkForAudio(quote) {
  return (
    quote.hasOwnProperty('audio') &&
    quote.audio.hasOwnProperty('url') &&
    quote.audio.url
  )
}

// search
function search(e) {
  deleteSearchResults() 
  
  let searchText = e.target.value
  if (searchText.length < 3) {
    return alert('must be at least 3 characters')
  }

  searchText = searchText.toUpperCase()
  const propsToSearch = setProps()

  const results = []

  selectedQuotes.forEach(quote => {
    for (const prop of propsToSearch) {
      let propValue = quote[prop]
      if(!propValue || (typeof propValue !== 'string')) continue
      propValue = propValue.toUpperCase()
      const hasSearchText = propValue.includes(searchText)
      if(hasSearchText) {
        results.push(quote)
        break
      }
    }
  })

  searchResultQuotes = results
  showSearchResults()
}

function setProps() {
  const allProps = ['subject', 'author', 'quote']
  if(currentSearchOption === 'all') {
    return allProps
  }
  filteredProps = allProps.filter(prop => prop === currentSearchOption)
  return filteredProps
}

function showSearchResults () {
  if(searchResultQuotes.length === 0) {
    $("#section-search-results").append("<div>sorry, there were no matches</div>")
  }
  const deleteButtonHtml = getDeleteButtonHtml()
  const resultsHtml = `<div><p>${searchResultQuotes.length} quotes have been found</p></div>`
  const overviewHtml = `
  <div class='d-flex justify-content-between'>
    ${resultsHtml}
    ${deleteButtonHtml}
  </div>
  `
  $("#section-search-results").append(overviewHtml)

  searchResultQuotes.forEach( quote => {
    const quoteResultHtml = searchResultQuoteHtml(quote)
    $("#section-search-results").append(quoteResultHtml)
  })
}

function searchResultQuoteHtml(resultQuote) {
  const {id, subject, author, quote, game} = resultQuote
  return `
  <div class='search-result-quote-bg m-2 p-2'>
    <p>"${quote}" - ${author} (${subject})</p>
    <div class='d-flex justify-content-between'>
      <small>from Civ ${gameNumberToRomanNumber(game)}</small>
      <button onclick="setCurrentQuoteAndDisplay(${id})">
        <i class="fas fa-tv"></i>
      </button>
    </div>
  </div>
  `
}

function getDeleteButtonHtml() {
  return `
  <div>
    <button onclick="deleteSearchResults()">X</button>
  </div>
  `
}

function deleteSearchResults () {
  $( "#section-search-results" ).empty();
}