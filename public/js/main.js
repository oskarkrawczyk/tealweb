class Gallery {

  constructor(galleryElements){
    this.imagesPerRow = 4
    this.galleryElements = galleryElements

    this.buildElements(this.galleryElements)
  }

  rebuild(rows){
    this.imagesPerRow = rows
    this.buildElements(this.galleryElements)
  }

  getRatio(image, cb){
    let tempImage = new Image()
    tempImage.src = image.smallSrc
    tempImage.addEventListener("load", function(){
      let ratio = this.naturalWidth / this.naturalHeight
      cb(ratio)
    })
  }

  buildElements(galleries){
    galleries.forEach((gallery, index) => {
      let allRows = []
      let rows = this.buildStructure(gallery)
      let visibleRows = parseInt(gallery.dataset.imagesVisibleRows) || 1

      gallery.innerHTML = ""

      rows.forEach((row, index) => {
        let hiddenRow = index >= visibleRows ? "hidden" : ""
        let rowDiv = document.createElement("div")
        rowDiv.setAttribute("class", `galleryRow ${hiddenRow}`)

        allRows.push(rowDiv)

        row.forEach((image) => {
          let galleryImage = document.createElement("a")
          galleryImage.setAttribute("class", "galleryImage")
          galleryImage.setAttribute("href", image.largeSrc)
          galleryImage.dataset.fslightbox = ""

          let img = document.createElement("img")
          img.setAttribute("src", image.smallSrc)

          this.getRatio(image, (ratio) => {
            galleryImage.style.flex = ratio
            galleryImage.appendChild(img)
            rowDiv.appendChild(galleryImage)

            let script = document.createElement("script")
            script.src = "/public/js/fslightbox.min.js"
            document.head.appendChild(script)
          })
        })

        gallery.appendChild(rowDiv)
      })

      if (rows.length > 1){
        let expandImagesDiv = document.createElement("div")
        expandImagesDiv.setAttribute("class", "expandImages")

        let expandImagesLink = document.createElement("a")
        expandImagesLink.setAttribute("href", "#")
        expandImagesLink.innerText = `Show all images`
        expandImagesLink.addEventListener("click", function(event){
          event.preventDefault()
          event.stopPropagation()

          // expand all hidden rows
          allRows.forEach((row) => {
            row.classList.remove("hidden")
          })

          // hide expander
          expandImagesDiv.innerHTML = ""
        })

        expandImagesDiv.appendChild(expandImagesLink)
        gallery.appendChild(expandImagesDiv)
      }
    })
  }

  buildStructure(gallery){
    let rows    = []
    let row     = 0
    let counter = 0
    let from    = parseInt(gallery.dataset.imagesFrom)
    let to      = parseInt(gallery.dataset.imagesTo)
    let set     = gallery.dataset.imagesSet
    let dirSub  = gallery.dataset.imagesSetSub
    let padBy   = parseInt(gallery.dataset.imagesPad) || 2

    if (gallery.dataset.imagesPerRow){
      this.imagesPerRow = parseInt(gallery.dataset.imagesPerRow)
    }

    for (var i = from; i <= to; i++){
      if (counter === this.imagesPerRow){
        row = row + 1
        counter = 0
      }

      counter = counter + 1

      if (!rows[row]){
        rows[row] = []
      }

      let paddedImageIndex = (i).toString().padStart(padBy, "0")

      // console.log(paddedImageIndex)

      let sub = dirSub ? `${dirSub}/` : ""

      console.log(dirSub)

      rows[row].push({
        smallSrc: `/public/images/projects/${set}/small/${sub}${paddedImageIndex}.jpg`,
        mediumSrc: `/public/images/projects/${set}/medium/${sub}${paddedImageIndex}.jpg`,
        largeSrc: `/public/images/projects/${set}/large/${sub}${paddedImageIndex}.jpg`
      })
    }
    return rows
  }
}

class Teal {

  constructor(){
    this.navTrigger  = document.querySelector("#nav")
    this.navItems    = document.querySelectorAll("nav li a")
    this.pages       = document.querySelectorAll("[data-page]")
    this.hero        = document.querySelector("video")
    this.page        = document.querySelector("#page")
    this.pageMeta    = document.querySelector("#page .meta")
    this.pageBody    = document.querySelector("#page .pageBody")
    this.project     = document.querySelector("#project")
    this.projectBody = document.querySelector("#project .pageBody")
    this.body        = document.body

    this.state = {
      nav: false
    }

    // current opened overlay context, either project or page
    this.currentContext

    this.attachEvents()
    this.setDefaultPage()
  }

  attachEvents(){
    this.navTrigger.addEventListener("click", (event) => {
      this.toggleNav.call(this, event)
    })

    this.attachPagesEvents()

    Array.from(document.querySelectorAll(".pageLogo")).forEach((pageLogo) => {
      pageLogo.addEventListener("click", (event) => {
        event.stopPropagation()
        event.preventDefault()
        this.hidePage()
      })
    })

    // this.attachObserver()
  }

  attachPagesEvents(){
    // console.log("attachPagesEvents")
    let pages = document.querySelectorAll("[data-page]")

    Array.from(pages).forEach((page) => {
      page.addEventListener("click", (event) => {
        event.stopPropagation()
        event.preventDefault()
        this.fetchPage(page)
        this.state.nav = false
        this.hideNav()
      }, this)
    })
  }

  setDefaultPage(){
    if (document.location.hash.indexOf("#!/") >= 0){
      let slug = document.location.hash.split("#!/")[1]
      this.fetchPage(document.querySelector(`[data-page="${slug}"]`))
    }
  }

  parseSlug(page){
    let filter = page.split("/").length >= 1 ? page.split("/")[1] : false
    let url = `/pages/${page.split("/")[0]}.html`

    return {
      filter: filter,
      url:    url
    }
  }

  buildGallery(){
    this.galleries = new Gallery(document.querySelectorAll(".galleryContainer"))
  }

  // reflowGallery(width){
  //
  //   // if (width >= 984){
  //   //   console.log("full")
  //   // } else if (width <= 984 && width >= 600){
  //   //   console.log("med")
  //   // } else if (width <= 600){
  //   //   console.log("small")
  //   // }
  //   console.log(width >= 600, width <= 590)
  //   if (width <= 600 && width >= 599){
  //     console.log("small")
  //   }
  //   // this.galleries.rebuild(rows)
  // }

  fetchPage(trigger){
    let page    = trigger.dataset.page
    let url     = `/pages/${page}.html`
    let project = trigger.dataset.project === ""
    let filter  = this.parseSlug(page).filter

    this.currentContext = project ? "project" : "page"

    if (filter){
      url = this.parseSlug(page).url
    }

    if (this.currentContext === "project"){
      url = `/projects/${page}.html`
    }

    if (page !== ""){
      fetch(url, {
        method: "get"
      }).then(response => {
        return response.text()
      }).then(html => {
        let title

        if (this.currentContext === "project"){
          this.projectBody.innerHTML = html
          title = this.projectBody.querySelector("#project h3")
        } else {
          this.pageBody.innerHTML = html
          title = this.pageBody.querySelector("#project h3")
        }

        this.showPage(trigger, filter)

        history.pushState({
          page: page
        }, `teal. &minus; ${title}`, `#!/${page}`)
      })
      .catch(error => {
        console.log("Well shucks:", error)
      })
    } else {
      console.warn("No such page")
    }
  }

  animateCourtain(){
    courtain.classList.add("show")
  }

  showPage(trigger, filter){
    let courtain = document.querySelector("#courtain")

    // pause the homepage video when project is opened
    this.hero.pause()
    courtain.classList.add("show")

    setTimeout(() => {
      if (this.currentContext === "project"){
        this.body.classList.add("projectOpened")
      } else {
        this.body.classList.add("pageOpened")
        this.attachPagesEvents()
      }
    }, 300)

    setTimeout(() => {
      courtain.classList.remove("show")
    }, 2000)

    this.maskLogo(trigger)
    this.filterList(filter)
    this.buildGallery()
    this.addHeroImagesRatio()
    this.initSectionIndex()

    ga('send', 'pageview');
  }

  initSectionIndex(){
    let sectionIndex = Array.from(document.querySelectorAll(".sectionsIndex a"))

    if (sectionIndex){
      for (let section of sectionIndex) {
        let selector = `#${section.href.split("#").pop()}`
        section.addEventListener("click", (event) => {
          event.preventDefault()
          event.stopPropagation()

          document.querySelector(selector).scrollIntoView()
        })
        // let offsetTop = document.querySelector(selector).offsetTop
        // document.querySelector("#project").offsetTop = 100
      }
    }
  }

  maskLogo(trigger){
    let cover = trigger.querySelector("img")
    let logo = document.querySelector("#logo-clip")
    logo.src = cover.src
  }

  addHeroImagesRatio(){
    let heroImages = document.querySelectorAll(".hiCont img")

    heroImages.forEach(function(el){
      let tempImage = new Image()
      tempImage.src = el.src
      tempImage.addEventListener("load", function(){
        let ratio = this.naturalWidth / this.naturalHeight
        el.parentNode.style.flex = ratio
      })
    })
  }

  filterList(filter){
    let filtersCont = document.querySelector("#filters")
    let workItems   = document.querySelectorAll("#our-work .workItem")

    if (filtersCont){
      let filters = document.querySelectorAll("#filters a")

      Array.from(filters).forEach((filter, index) => {
        filter.addEventListener("click", (event) => {
          event.stopPropagation()
          event.preventDefault()

          this.toggleVisibility(workItems, event.target.dataset.type, filtersCont)
        })
      })
    }

    if (filter){
      this.toggleVisibility(workItems, filter, filtersCont)
    }
  }

  toggleVisibility(workItems, filter, filtersCont){
    let filterItems = filtersCont.querySelectorAll("li")
    let mode

    // activate the currently picked filter
    let activeFilterItem = filtersCont.querySelector(`a[data-type=${filter}]`)

    if (activeFilterItem.parentNode.classList.contains("active")){

      // disable filtres
      Array.from(filterItems).forEach((item, index) => {
        item.classList.remove("inactive")
      })

      // toggle work items based on picked filter
      Array.from(workItems).forEach((workItem, index) => {
        workItem.classList.remove("hidden")
      })

      history.pushState({
        page: "our-work"
      }, "teal. &minus; Creative studio from Warsaw. Production, Events, PR", `#!/our-work`)
    } else {

      // disable filtres
      Array.from(filterItems).forEach((item, index) => {
        item.classList.add("inactive")
        item.classList.remove("active")
      })

      activeFilterItem.parentNode.classList.remove("inactive")
      activeFilterItem.parentNode.classList.add("active")

      // toggle work items based on picked filter
      Array.from(workItems).forEach((workItem, index) => {
        workItem.classList.add("hidden")

        if (workItem.dataset.type === filter){
          workItem.classList.remove("hidden")
        }
      })

      history.pushState({
        page: filter
      }, "teal. &minus; Creative studio from Warsaw. Production, Events, PR", `#!/our-work/${filter}`)
    }
  }

  hidePage(){
    // unpause the homepage video when project is opened
    this.hero.play()

    if (this.currentContext === "project"){
      this.body.classList.remove("projectOpened")
      this.currentContext = "page"
    } else {
      this.body.classList.remove("pageOpened")
    }

    // let items = this.page.querySelectorAll("#project h3, .meta span, .info p")
    // Array.from(items).forEach((item) => {
    //   item.classList.remove("show")
    // })

    history.pushState({
      page: ""
    }, "Project", "/")
  }

  toggleClass(item, index){
    setTimeout(() => {
      item.classList[this.navMode]("show")
    }, index * 80)
  }

  toggleNav(event){
    event.stopPropagation()
    event.preventDefault()

    this.state.nav = !this.state.nav
    this.navMode   = this.state.nav ? "add" : "remove"

    Array.from(this.navItems).forEach(this.toggleClass, this)
  }

  hideNav(){
    Array.from(this.navItems).forEach((item) => {
      item.classList.remove("show")
    }, this)
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.TealManager = new Teal()
})

// window.addEventListener("resize", (event) => {
//   window.TealManager.reflowGallery(this.innerWidth)
// })
