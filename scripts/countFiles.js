exports.analyze = async function analyze (files, packageJson, argv, { print }) {
    let tsFiles = files.filter(file => file.fileName.match(/tsx$/)).length
    let tsxFiles = files.filter(file => file.fileName.match(/ts$/)).length

    print`\n\tProject {italic ${packageJson.name}} contains {green ${tsFiles + tsxFiles}} typescript files ({green ${tsFiles}} ts, {green ${tsxFiles}} tsx).`
}
