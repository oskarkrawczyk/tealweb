const csv2json = require("csvjson-csv2json")
const fs       = require("fs")

fs.readFile("./puma/Packshots_WEB_.csv", "utf8", function(err, csv){
  const json = csv2json(csv, {
    parseNumbers: true
  })

  const fileData = `const productsData = ${JSON.stringify(json)}`
  const fileContent = new Uint8Array(Buffer.from(fileData))
  fs.writeFile("./puma/data.js", fileContent, (err) => {
    if (err) throw err;
    console.log("CSV converted! 👌🏻")
  })
})
