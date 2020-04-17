const csv2json = require("csvjson-csv2json")
const fs       = require("fs")
const consola  = require("consola")

fs.readFile("./puma/Packshots_WEB_.csv", "utf8", function(err, csv){
  consola.info({
    message: `Reading CSV file`
  })
  const json = csv2json(csv, {
    parseNumbers: true
  })

  consola.info({
    message: `Converted and stored ${json.length} objects`
  })

  const fileData = `const productsData = ${JSON.stringify(json)}`
  const fileContent = new Uint8Array(Buffer.from(fileData))
  fs.writeFile("./puma/data.js", fileContent, (err) => {
    if (err){
      consola.error(new Error(err))
    }

    consola.ready({
      message: `New data JSON saved in data.js!`,
      badge: true
    })

  })
})
