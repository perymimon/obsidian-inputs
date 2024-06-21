// @ts-nocheck-cancel
import {TFile} from "obsidian";
import {addToContextList, getActiveFile} from "./internalApi";
import {fileDesc, targetFile} from "./types";
import {getFileStructure, waitFileStructureReady} from "./data";
import {log} from "./tracer";

var app = globalThis.app
// context
export const lastTouchFiles: TFile[] = []
export const lastCreatedFiles: TFile[] = []

export async function getTFileContent(file?: targetFile): Promise<string> {
	var tFile = getTFile(file!)
	if (!tFile) throw `${file} file is not exist`
	return await app.vault.read(tFile)
}

export function getFileName(path: targetFile, root: targetFile = ''): fileDesc {
	if (path instanceof TFile) path = path.path;
	if (path.startsWith('[[') && path.endsWith(']]')) path = path.slice(2, -2)
	if (root instanceof TFile) root = root.path
	root = root.split('/').slice(0, -1).join('/')
	var wholePath = joinPaths(root, path)
	const [, pathMinusExt, ext] = wholePath.match(/(.*?)(\.\w*)?$/)!
	var paths = pathMinusExt.split('/')
	var filename = paths.pop() || ''
	var folders = paths.join('/')

	return {folders, file: `${filename}${ext}`, filename, extname: ext, path: wholePath}
}

export function getFreeFileName(path: targetFile, root: targetFile = ''): fileDesc {
	var folderDesc = getFileName(path, root)
	// find a free name
	var {folders, filename, extname} = folderDesc
	let index = 0
	let newFileName, newPath, newFile
	do {
		newFileName = `${filename}${index ? ` ${index}` : ''}`
		newFile = `${newFileName}${(extname || '.md')}`
		newPath = joinPaths(folders, newFile)
		index++
		//@ts-ignore getFileByPath exist in vault
		var file = app.vault.getFileByPath(newPath)
	} while (file)

	return {folders, file: newFile, filename: newFileName, extname, path: newPath}
}

export function joinPaths(root: string, relative: string): string {
	const rootArray = root.split('/');
	const relativeArray = relative.split('/');

	// Remove trailing empty string caused by splitting '/'
	if (rootArray.at(-1) === '') rootArray.pop();
	if (relativeArray[0] === '') {
		relativeArray.shift();
		rootArray.length = 0
	}

	for (const part of relativeArray) {
		if (part === '..') rootArray.pop();
		else if (part !== '.') rootArray.push(part);
	}

	return rootArray.join('/');
}


export function markFileAsDirty(tFile: TFile) {
	var struct = getFileStructure(tFile)
	if (struct) struct.dirty = true
}

export async function renameFile(file: targetFile, newPath: targetFile) {
	var tFile = getTFile(file)
	if (!tFile) return
	let {path} = getFreeFileName(newPath, tFile)
	var originalPath = tFile.path
	await app.vault.rename(tFile!, path)
	log('renameFile', `"${originalPath}" to "${newPath}"`)
}

export async function removeFile(path: targetFile) {
	var tFile = getTFile(path)
	if (!tFile) return
	await app.vault.trash(tFile!, false)
}

export function isFileNotation(path: string) {
	if (path.startsWith('[[') && path.endsWith(']]')) return path.slice(2, -2)
	if (/\.(js|md)$/.test(path)) return path
	return ''
}

export async function modifyFileContent(path: targetFile, content: string) {
	let tFile = await letTFile(path);
	await app.vault.modify(tFile, content)
	markFileAsDirty(tFile)
	await waitFileStructureReady(tFile)
	addToContextList(tFile, lastTouchFiles)
}

// Overloads
export function getTFile(): TFile;
export function getTFile(file?: targetFile): TFile | null;
// Implementation
export function getTFile(file?: targetFile): TFile | null {
	if (file instanceof TFile) return file
	file = (file || '').trim()
	if (!file || file == 'activeFile') return getActiveFile()
	let path: string = (file.startsWith('[[') && file.endsWith(']]')) ? file.slice(2, -2) : file
	return app.metadataCache.getFirstLinkpathDest(path, "") || null
}

export async function letTFile(file?: targetFile): Promise<TFile> {
	let tFile = getTFile(file!)
	if (tFile) return tFile
	// if (!autoCreate) return null
	return await createTFile(file as string)
}

// if file is exiting tFile it create a new file with inc index in the end
export async function createTFile(file: targetFile, content: string = '') {
	var {path, folders} = getFreeFileName(file)
	await app.vault.createFolder(folders).catch(_ => _)
	const tFile = await app.vault.create(path, String(content))
	await waitFileStructureReady(tFile)
	addToContextList(tFile, lastCreatedFiles)
	addToContextList(tFile, lastTouchFiles)
	return tFile
}
