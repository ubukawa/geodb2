const config = require('config')
const Parser = require('json-text-sequence').parser
const { spawn } = require('child_process')

const minzoom = config.get('minzoom')
const maxzoom = config.get('maxzoom')
const srcs = config.get('srcs')
const ogr2ogrPath = config.get('ogr2ogrPath')
const tippecanoePath = config.get('tippecanoePath')
const dstDir = config.get('dstDir')



/// single tippecanoe file


const tippecanoe = spawn(tippecanoePath, [
    `--output-to-directory=${dstDir}`,
    `--no-tile-compression`,
    `--minimum-zoom=${minzoom}`,
    `--maximum-zoom=${maxzoom}`
  ], { stdio: ['pipe', 'inherit', 'inherit'] })

//const downstream = process.stdout
const downstream = tippecanoe.stdin

let nOpenFiles = 0

for (const src of srcs) {



  
    nOpenFiles++
    const parser = new Parser()
      .on('data', f => {
        f.tippecanoe = {
            layer: src.layer,
            minzoom: src.minzoom,
            maxizoom: src.maxzoom
        }
        delete f.properties.SHAPE_Length //SHAPE_Length is not necessary
        //console.log(JSON.stringify(f, null, 2))
        downstream.write(`\x1e${JSON.stringify(f)}\n`)
        //downstream.write(`\x1e${JSON.stringify(f.properties)}\n`)
      })
      .on('finish', () =>{
        nOpenFiles--
        if (nOpenFiles === 0){
            downstream.end()
        }
      })
    const ogr2ogr = spawn(ogr2ogrPath, [
      '-f', 'GeoJSONSeq',
      '-lco', 'RS=YES',
      '/vsistdout/',
      src.url
    ])
    ogr2ogr.stdout.pipe(parser)
  }





