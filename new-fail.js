const config = require('config')
const Parser = require('json-text-sequence').parser
const { spawn } = require('child_process')

const minzoom = config.get('minzoom')
const maxzoom = config.get('maxzoom')
const srcs = config.get('srcs')
const ogr2ogrPath = config.get('ogr2ogrPath')
const tippecanoePath = config.get('tippecanoePath')
//const dstDir = config.get('dstDir')

for (const src of srcs){
    let nOpenFiles = 0
    for (const tile of src.tiles){
        const tippecanoe = spawn(tippecanoePath, [
            //`--output=${tile[0]}-${tile[1]}-${tile[2]}.mbtiles`, //zxy.mbtiles
            `--output-to-directory=${tile[0]}-${tile[1]}-${tile[2]}`, //folder
            `--no-tile-compression`,
            `--minimum-zoom=${minzoom}`,
            `--maximum-zoom=${maxzoom}`
        ], {stdio: ['pipe', 'inherit', 'inherit']})

        const downstream = tippecanoe.stdin

        nOpenFiles++

        const parser = new Parser()
          .on('data', f => {
            f.tippecanoe = {
                layer: src.layer,
                minzoom: src.minzoom,
                maxzoom: src.maxzoom
            }
            delete f.properties.SHAPE_Length
            downstream.write(`\x1e${JSON.stringify(f)}\n`)
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
            src.url,
            `t_${tile[0]}_${tile[1]}_${tile[2]}` //to specify the layer
        ])

        ogr2ogr.stdout.pipe(parser)
    }
}






