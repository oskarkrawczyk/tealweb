var gulp         = require("gulp")
var sass         = require("gulp-sass")
var concat       = require("gulp-concat")
var autoprefixer = require("gulp-autoprefixer")
var browserSync  = require("browser-sync")
var bsInjector   = require("bs-snippet-injector")

var options = {
  browsersync: {
    open: false,
    // xip: false,
    port: 3001,
    socket: {
      port: 3003
    },
    ui: {
      port: 3002
    },
    server: {
      baseDir: "./"
    }
  },
  sass: {
    includePaths: ["scss"]
  },
  cssnano: {
    reduceIdents: false,
    discardUnused: {
      fontFace: false
    },
    minifyFontValues: false
  },
  autoprefixer: {
    flexbos: "no-2009"
  }
}

var handleError = (err) => {
  console.log(err.toString())
  this.emit("end")
}

gulp.task("css", () => {
  return gulp
    .src([
      "public/scss/fonts.scss",
      "public/scss/reset.scss",
      "public/scss/main.scss",
      "public/scss/project.scss"
    ])
    .pipe(sass(options.sass).on("error", sass.logError))
    .pipe(autoprefixer(options.autoprefixer).on("error", handleError))
    .pipe(concat("all.css").on("error", handleError))
    .pipe(gulp.dest("public/css"))
    .pipe(browserSync.reload({
      stream: true
    }))
})

gulp.task("filter-css", () => {
  return gulp
    .src([
      "public/scss/fonts.scss",
      "public/scss/reset.scss",
      "public/scss/filter.scss"
    ])
    .pipe(sass(options.sass).on("error", sass.logError))
    .pipe(autoprefixer(options.autoprefixer).on("error", handleError))
    .pipe(concat("filter.css").on("error", handleError))
    .pipe(gulp.dest("public/css"))
    .pipe(browserSync.reload({
      stream: true
    }))
})

gulp.task("watch", () => {
  browserSync.init(options.browsersync)

  gulp.watch("public/scss/**/*.scss", ["css", "filter-css"])
})
