const ts = require('typescript')
const { input } = require('enquirer')
const chalk = require('chalk')

function getImportByModule (name, node, sourceFile) {
    if (node.kind !== ts.SyntaxKind.ImportDeclaration) {
        return null
    }

    if (node.moduleSpecifier.text !== name) {
        return null
    }

    if (Array.isArray(node.importClause.namedBindings.elements)) {
        let bindings = node.importClause.namedBindings.elements.map(element => element.propertyName ? element.propertyName.escapedText : element.name.escapedText)
        return { filename: sourceFile.fileName, starImport: null, namedImports: bindings, unnamedImports: null }
    } else {
        return { filename: sourceFile.fileName, starImport: node.importClause.namedBindings.name.escapedText, namedImports: null, unnamedImports: [] }
    }
}

function findUsagesOfVariable (name, node, sourceFile) {
    let usages = []

    if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
        if (node.expression.escapedText === name) {
            usages.push(node.name.escapedText)
        }
    }

    ts.forEachChild(node, (n) => {
        usages = usages.concat(findUsagesOfVariable(name, n, sourceFile))
    })

    return usages
}

exports.analyze =  async function analyze (files, packageJson, argv, { print, rank, chunk }) {
    let [ ,packageName ] = argv._

    if (!packageName) {
        packageName = await input({
            name: 'packageName',
            message: 'What package do you want to inspect?'
        })
    }

    let imports = []

    for (let file of files) {
        let $import = null

        ts.forEachChild(file, (node) => {
            if (!$import) {
                $import = getImportByModule(packageName, node, file)
                
                if ($import) {
                    imports.push($import)
                }
            }

            if ($import && $import.starImport) {
                let r = findUsagesOfVariable($import.starImport, node, file)
                $import.unnamedImports = $import.unnamedImports.concat(r)
            }
        })
    }

    let ranking = rank(imports.map(i => i.namedImports || i.unnamedImports))

    print`
\t{bold General insights:}
\t\t# of files that use {italic ${packageName}}: \t\t\t\t{green ${imports.length}}
\t\t# of files that do {italic \`import * as _ from '${packageName}'\`}: \t{green ${imports.filter(d => d.starImport !== null).length}}
`
}