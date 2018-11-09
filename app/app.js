#!/usr/bin/env node
const utils = require('./utils.js')
const ProgressBar = require('progress')
const { argv } = require('yargs')
const { prompt, input, select } = require('enquirer')
const { resolve, dirname, basename, extname } = require('path')
const { print } = utils

async function prepareOptions (argv) {
    return {
        scriptName: argv._[0],
        scriptsPath: resolve(__dirname, '../scripts'),
        projectPath: resolve(process.cwd(), argv.project || '.'),
    }
}

async function main () {
    let { scriptName, scriptsPath, projectPath } = await prepareOptions(argv)

    const availableScripts = await utils.globFiles('*.js', scriptsPath)
    const scripts = availableScripts.map(path => ({
        name: basename(path, extname(path)),
        path
    }))

    if (!scriptName) {
        scriptName = await select({
            message: 'What module do you want to run?',
            choices: scripts.map(script => script.name)
        })
    }

    const script = scripts.find(script => script.name === scriptName)

    if (!script) {
        throw `Module '${scriptName}' was not found.`
    }

    const module = require(script.path)

    if (module.analyze === undefined) {
        throw `'${scriptName}' is not a module.`
    }

    let packageJson
    try {
        let packageContents = await utils.readFile(resolve(process.cwd(), 'package.json'))
        packageJson = JSON.parse(packageContents)
    } catch (e) {
        throw `Could not find a 'package.json' file (possibly in a wrong directory).`
    }

    const typescriptPaths = await utils.globFiles('{,!(node_modules)/**/}*.{ts,tsx}', projectPath)

    const bar = new ProgressBar(':percent [:bar]', { total: typescriptPaths.length, clear: true, complete: '#', incomplete: ' ' })
   
    let sourceFiles = []
    for (let path of typescriptPaths) {
        sourceFiles.push(await utils.parseFile(path))
        bar.tick()
    }

    module.analyze(sourceFiles, packageJson, argv, utils)
}

// async function main () {
//     let scriptFiles = await globFiles('./scripts/*.mjs', '/Users/are/Projects/indio-statistics/')
//     let files = await globFiles('{,!(node_modules)/**/}*.{ts,tsx}', PROJECT_PATH)
//     let sourceFiles = await Promise.all(files.map(parseFile))

//     let scripts = scriptFiles.map(sf => ({
//         name: basename(sf, extname(sf)),
//         path: sf
//     }))

//     let scriptName = ''

//     if (process.argv.length > 2) {
//         scriptName = process.argv[2]
//     } else {
//         scriptName = await enquirer.select({
//             message: 'Choose a module to run',
//             name: 'script',
//             choices: scripts.map(script => script.name)
//         })
//     }

//     let chosenScript = scripts.find(script => script.name == scriptName)

//     let module = await import(chosenScript.path)

//     let result = await module.analyze(sourceFiles, utils)
//

main().catch((err) => {
    print`\n\t{bold {red ✗} An error has occured.}\n\t${err.message || err}`
})
