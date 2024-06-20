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


function getFileAllFiles(dir: string): string[] {
    return fs.readdirSync(path.resolve(__dirname, dir), {
        recursive: true
    }).reduce<string[]>((acc, item) => {
        if (Buffer.isBuffer(item)) {
            return acc
        } else {
            const stat = fs.statSync(path.resolve(__dirname, item))
            const ext = path.extname(path.resolve(__dirname, item))

            if (stat.isFile() && ext === '.tsx') {
                return [...acc, item]
            }
            return acc
        }

    }, [])
}

function readFile(filePath: string): string {
    try {
        return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8')
    } catch (err) {
        throw err
    }
}

const filePaths = getFileAllFiles('./');

const replaceClassNamesToModulePlugin = (): babel.PluginObj => {
    let isClassnamesModuleImported = false;
    return {
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
                debugger
                if (t.isProgram(path.node, { sourceType: 'module' }) && !isClassnamesModuleImported) {
                    let moduleIdentificator = t.identifier('cx');
                    let defaultModuleSpecifier = t.importDefaultSpecifier(moduleIdentificator);
                    let stringLiteral = t.stringLiteral('classnames')
                    let importDeclaretion = t.importDeclaration([defaultModuleSpecifier], stringLiteral)

                    let parentBodyNodePaths = path.get('body');
                    for (let i = 0; i < parentBodyNodePaths.length; i++) {
                        debugger

                        if (!t.isImportDeclaration(parentBodyNodePaths[i].node)) {
                            debugger
                            parentBodyNodePaths[i].insertBefore(importDeclaretion)
                            break;
                        }
                        debugger
                    }


                    // moduleBodyNode.
                    // t.jsxExpressionContainer(t.memberExpression(t.identifier('styles'), t.identifier('a'), false))

                }
            },
            ImportDeclaration(path) {
                debugger
                if (path.get('source').node.value === 'classnames') {
                    debugger
                    isClassnamesModuleImported = true
                } else {

                }
            },
            JSXAttribute(path) {
                const attributeNameNode = path.get('name').node;
                const attributeValueNode = path.get('value').node;

                if (t.isJSXIdentifier(attributeNameNode, { name: 'className' }) && !t.isStringLiteral(attributeValueNode)) {
                    if (t.isJSXExpressionContainer(attributeValueNode)) {
                        debugger

                    }
                }
                debugger
                const attribute = path.node;

            },
        },
    };
}

filePaths.forEach(filePath => {
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

    // fs.writeFile('./result.tsx', transformResult.code);
})
