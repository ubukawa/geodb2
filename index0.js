const config = require('config')
const Parser = require('json-text-sequence').parser
const { spawn } = require('child_process')

const srcs = config.get('srcs')
const ogr2ogrPath = config.get('ogr2ogrPath')



for (const src of srcs) { // if source is a single file, this loop is not necessary.
  for (const tile of src.tiles){
    const downstream = process.stdout
  //console.log(`t_${tile[0]}_${tile[1]}_${tile[2]}`)
    const parser = new Parser()
      .on('data', f => {
        f.tippecanoe = {
            layer: src.layer,
            minzoom: src.minzoom,
            maxizoom: src.maxzoom
        }
        delete f.properties.SHAPE_Length //SHAPE_Length is not necessary
        //console.log(JSON.stringify(f, null, 2)) // f  when writing
        //downstream.write(`\x1e${JSON.stringify(f.properties)}\n`)
        downstream.write(`\x1e${JSON.stringify(f)}\n`)
      })
    const ogr2ogr = spawn(ogr2ogrPath, [
      '-f', 'GeoJSONSeq',
      '-lco', 'RS=YES',
      '/vsistdout/',
//      `t_${tile[0]}_${tile[1]}_${tile[2]}.geojsons`,
      src.url,
      `t_${tile[0]}_${tile[1]}_${tile[2]}`
    ])
    ogr2ogr.stdout.pipe(parser)

}

}