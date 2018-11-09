const chalk = require('chalk')
const glob = require('glob')
const fs = require('fs')
const ts = require('typescript')

function readFile (filename) {
    return new Promise((res, rej) => fs.readFile(filename, 'utf8', (err, contents) => {
        if (err) {
            return rej(err)
        }

        return res(contents)
    }))
}

async function parseFile (fileName) {
    let sourceFile = ts.createSourceFile(
        fileName,
        await readFile(fileName),
        ts.ScriptTarget.ES2017
    )

    return sourceFile
}

function rank (sets) {
    let result = new Map();

    sets.forEach(set => {
        set.forEach(entry => {
            if (result.has(entry)) {
                result.set(entry, result.get(entry) + 1)
            } else { 
                result.set(entry, 1)
            }
        })
    })
    
    let data = Array.from(result.entries())

    data.sort((a, b) => b[1] - a[1])

    return data
}

function chunk(array, size) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}

function print(...args) {
    let res = chalk(...args)
    console.log(chalk(...args))
    return res
}


function globFiles (pattern, path, absolute = true) {
    return new Promise((res, rej) => {
        glob(pattern, {
            cwd: path,
            absolute: absolute
        }, (err, files) => {
            if (err) {
                rej(err)
            } else {
                res(files)
            }
        })
    })
}

module.exports = {
    print,
    chunk,
    rank,
    globFiles,
    parseFile,
    readFile
}