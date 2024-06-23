import fs from 'node:fs';
import path from 'node:path';

import swc from '@swc/core';
import babel from '@babel/core';
import preset from '@babel/preset-typescript';
import t from '@babel/types';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..')


function getFileComponents(dir: string): string[] {
    return fs.readdirSync(path.resolve(__dirname, dir), {
        recursive: true
    }).reduce<string[]>((acc, item) => {
        if (Buffer.isBuffer(item)) {
            return acc
        } else {
            const stat = fs.statSync(path.resolve(__dirname, item))
            const ext = path.extname(path.resolve(__dirname, item))
            if (stat.isFile() && (isComponent(ext) || isCss(ext))) {
                return [...acc, item]
            }
            return acc
        }

    }, [])
}

function isComponent(ext: string) {
    return !!(ext.match(/\.(tsx)/g)?.length)
}

function isCss(ext: string) {
    return !!(ext.match(/\.css/g)?.length)
}

function isCssModule(ext: string) {
    return !!(ext.match(/\.module\.css/g)?.length)
}

function readFile(filePath: string): string {
    try {
        return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8')
    } catch (err) {
        throw err
    }
}

const filePaths = getFileComponents('./');

function replaceClassNamesToModulePlugin(): babel.PluginObj {
    let isClassnamesModuleImported = false;
    let lastImportDeclaretionIndex = null;
    return {
        pre(file) {
            isClassnamesModuleImported = false;
            lastImportDeclaretionIndex = null
        },
        visitor: {
            // {
            //     type: 'JSXAttribute',
            //     name: 'className'
            // }: function (path, state) {
            //     debugger
            // },
            // JSXIdentifier(path) {
            //     if (t.isJSXIdentifier(path.node, { name: 'className' })) {
            //         debugger
            //     }
            // },
            Program(path) {
                if (t.isProgram(path.node, { sourceType: 'module' }) && !isClassnamesModuleImported) {
                    let moduleIdentificator = t.identifier('cx');
                    let defaultModuleSpecifier = t.importDefaultSpecifier(moduleIdentificator);
                    let stringLiteral = t.stringLiteral('classnames')
                    let importDeclaretion = t.importDeclaration([defaultModuleSpecifier], stringLiteral)

                    let parentBodyNodePaths = path.get('body');
                    for (let i = 0; i < parentBodyNodePaths.length; i++) {
                        const currentNode = parentBodyNodePaths[i];

                        if (t.isImportDeclaration(currentNode.node)) {
                            lastImportDeclaretionIndex = i;
                            if (!isClassnamesModuleImported && currentNode.node.source.value === 'classnames') {
                                isClassnamesModuleImported = true;
                            }
                        }
                    }
                    if (!isClassnamesModuleImported) {
                        lastImportDeclaretionIndex !== null ? parentBodyNodePaths[lastImportDeclaretionIndex].insertAfter(importDeclaretion) : parentBodyNodePaths[0].insertBefore(importDeclaretion)
                    }


                    // moduleBodyNode.
                    // t.jsxExpressionContainer(t.memberExpression(t.identifier('styles'), t.identifier('a'), false))

                }
            },
            JSXAttribute(path) {
                const attributeNameNode = path.get('name').node;
                const attributeValueNode = path.get('value').node;

                if (t.isJSXIdentifier(attributeNameNode, { name: 'className' })) {
                    if (t.isJSXExpressionContainer(attributeValueNode)) {

                    }
                }

            },
        },
    };
}

filePaths.forEach(filePath => {
    // let folderPath = filePath.replace(/\[a-zA-Z0-9_.-]+\.(tsx)/g, '');
    let folderPath = filePath.replace(/\\[a-zA-Z0-9_.-]+\.(tsx|css)/g, '');

    if (!isComponent(filePath) && !isCss(filePath)) {
        return
    }

    debugger

    if (isCss(filePath) && !isCssModule(filePath)) {
        if (!fs.existsSync(path.resolve(rootDir, 'dist', folderPath))) {
            fs.mkdirSync(path.resolve(rootDir, 'dist', folderPath), { recursive: true });
        }
        fs.copyFile(filePath, filePath.replace(/\.css/, '.module.css'), err => {
            debugger
        })
    }

    if (isComponent(filePath)) {
        let code = readFile(filePath)
        let transformResult = babel.transform(code, {
            presets: [['@babel/preset-typescript', {
                isTSX: true,
                allExtensions: true,
            }]],
            plugins: [
                replaceClassNamesToModulePlugin
            ]
        })
        try {
            if (!fs.existsSync(path.resolve(rootDir, 'dist', folderPath))) {
                fs.mkdirSync(path.resolve(rootDir, 'dist', folderPath), { recursive: true });
            }

            // fs.writeFile(path.resolve(rootDir, 'dist', filePath), transformResult.code, err => {
            //     console.error(err)
            // });
        } catch (err) {
            console.error(err);
        }
    }
})
