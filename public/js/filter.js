// Copyright - Oskar Krawczyk (oskar@krawczyk.io)

class Filter {

  constructor(productsData){
    this.filters    = document.querySelector("#filters .fieldset")
    this.blankslate = document.querySelector("#blankslate")
    this.results    = document.querySelector("#results")
    this.preview    = document.querySelector("#preview")
    this.overlay    = document.querySelector("#overlay")
    this.data       = productsData

    SEARCHJS.setDefaults({
      "text": true
    })

    this.textTypes = ["Index", "Nazwa"]

    // initial lisitng of all products
    this.buildFilters()
    this.filterProducts()
    this.preselectFilters()
    this.setupPreview()
  }

  setupPreview(){
    this.preview.addEventListener("click", () => {
      this.overlay.classList.add("hidden")
    })
  }

  buildFilters(){

    // ignore some columns from the JSON data
    let ignore  = [
      "Zdjęcie produktu",
      "Cena"
    ]
    let store   = {}
    let selects = {}

    Object.keys(this.data[0]).forEach((filter) => {
      if (ignore.indexOf(filter) < 0){
        selects[filter] = this.createFilter(filter)
        store[filter] = []

        Object.keys(this.data).forEach((item) => {
          this.ignoreExisting(store[filter], this.data[item][filter])
        })
      }
    })

    // special case for colors
    store["Kolor"] = this.buildColors(store["Kolor"])

    // fill selects with options
    Object.keys(selects).forEach((selectFilter) => {
      if (this.textTypes.indexOf(selectFilter) === -1){
        this.buildOptions(selects, selectFilter, store)
      }
    })
  }

  buildOptions(selects, selectFilter, store){

    // first empty option
    let option       = document.createElement("option")
    option.value     = ""
    option.innerText = ""
    selects[selectFilter].appendChild(option)

    store[selectFilter].forEach((item) => {
      let option       = document.createElement("option")
      option.value     = item
      option.innerText = item
      selects[selectFilter].appendChild(option)
    })
  }

  buildColors(colors){
    colors = colors.join(", ").split(", ")

    let tempColorStorage = []
    Object.keys(colors).forEach((color) => {

      // discard existing colors
      if (tempColorStorage.indexOf(colors[color]) < 0){
        tempColorStorage.push(colors[color])
      }
    })

    return tempColorStorage
  }

  createFilter(filter){
    let p = document.createElement("p")
    let label = document.createElement("label")
    let filterEl
    let help = ""

    if (filter === "Nazwa"){
      help = `<span data-title="Używaj przecinka aby szukać między kolekcjami produktów. Np. 'chinatown,helly'">?</span>`
    }

    label.innerHTML = `${filter} ${help}`

    if (this.textTypes.indexOf(filter) > -1){
      filterEl = document.createElement("input")
      filterEl.name = filter
      filterEl.type = "text"
      filterEl.addEventListener("keyup", (event) => {
        if (filterEl.value.length >= 3 || filterEl.value.length === 0){
          history.pushState({}, "", this.getSelections())
          this.filterProducts()
        }
      })
    } else {
      p.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>`

      filterEl = document.createElement("select")
      filterEl.name = filter
      filterEl.addEventListener("change", (event) => {
        event.preventDefault()
        event.stopPropagation()

        history.pushState({}, "", this.getSelections())
        this.filterProducts()
      })
    }

    p.appendChild(label)
    p.appendChild(filterEl)
    this.filters.appendChild(p)

    return filterEl
  }

  ignoreExisting(arr, item){
    if (arr.indexOf(item) < 0){
      return arr.push(item)
    }
  }

  getSelections(){
    let all = document.querySelectorAll("#filters select, #filters input")
    let out = []
    Array.from(all).forEach(function(el){
      let value = el.selectedIndex ? el[el.selectedIndex].value : el.value
      if (value !== ""){
        out.push(`${el.name}=${value}`)
      }
    })

    return `#${out.join("&")}`
  }

  decodeParams(){
    let decoded = {}
    let params = document.location.hash.split("#").pop()
    params = params.split("&")
    params.forEach((param) => {
      let key, value
      [key, value] = param.split("=")

      if (value){
        value = decodeURIComponent(value)
        decoded[key] = value

        // special case for one column
        if (key === "Nazwa"){
          let values = value.split(",")

          // remove all empty values
          values = values.filter((v) => {
            return v !== ""
          })

          // assign array to key
          if (values.length > 1){
            decoded[key] = values
          }
        }
      }
    })

    return decoded
  }

  preselectFilters(){
    let params = this.decodeParams()
    Object.keys(params).forEach((param) => {
      let key   = param
      let value = params[param]

      if (value){
        value = decodeURIComponent(value)
        let select = document.querySelector(`#filters *[name=${key}]`)

        if (select){
          select.value = value
        }
      }
    })
  }

  filterProducts(products){
    let searchQuery = this.decodeParams()
    // let searchQuery = { Nazwa: ["hel", "chinatown"], Sektor: "Sportstyle", Kolekcja: "Mężczyzna" }
    let filteredResults    = SEARCHJS.matchArray(this.data, searchQuery)
    this.results.innerHTML = this.buildGallery(filteredResults)

    if (filteredResults.length > 0){
      this.hideBlankslate()
    } else {
      this.showBlankslate()
    }

    console.clear()
    let els = this.results.querySelectorAll("li .tile")

    els.forEach((el, i) => {
      el.addEventListener("click", (event) => {
        event.stopPropagation()
        event.preventDefault()
        this.showPreview(el)
      })
    })

    let downloads = this.results.querySelectorAll("li .download")

    downloads.forEach((element, i) => {
      element.addEventListener("click", (event) => {
        event.stopPropagation()
        event.preventDefault()
        this.forceDownload(element)
      })
    })
  }

  forceDownload(element){
    let url = element.href
    let filename = url.split("/").pop()

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function(){
       var urlCreator = window.URL || window.webkitURL;
       var imageUrl = urlCreator.createObjectURL(this.response);
       var tag = document.createElement('a');
       tag.href = imageUrl;
       tag.download = filename;
       document.body.appendChild(tag);
       tag.click();
       document.body.removeChild(tag);
    }
    xhr.send();
  }

  showPreview(element){
    let img = preview.querySelector("img")
    img.src = element.href
    this.overlay.classList.remove("hidden")
  }

  hideBlankslate(){
    this.blankslate.classList.remove("visible")
  }

  showBlankslate(){
    this.blankslate.classList.add("visible")
  }

  buildGallery(products){
    let output = []
    products.forEach((product) => {
      output.push(`<li>
        <a class="tile" href="//cdn.byteal.pl/puma-2/${product.Index}.jpg" download>
          <img src="//cdn.byteal.pl/puma-2/${product.Index}.jpg" loading="lazy">
          <h3>${product.Nazwa}</h3>
          <section>
            <em>${product.Index}</em>
            <em>${product.Sektor}</em>
            <em>${product.Cena}zł</em>
          </section>
        </a>
        <a class="download" href="//cdn.byteal.pl/puma-2/${product.Index}.jpg" download>
          <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke-linecap="round" stroke-width="2"  fill="none" stroke-linejoin="round"><path d="M21 15v4 0c0 1.10457-.895431 2-2 2h-14l-8.74228e-08-3.55271e-15c-1.10457-4.82823e-08-2-.895431-2-2 0 0 0 0 0 0v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></g></svg>
        </a>
      </li>`)
    })

    return output.join("")
  }
}
