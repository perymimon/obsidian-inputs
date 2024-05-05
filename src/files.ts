// @ts-nocheck1
import {TFile} from "obsidian";
import {addToContextList, getActiveFile, log} from "./internalApi";
import {targetFile} from "./types";
import {getFileStructure, waitFileStructureReady} from "./fileData";

var app = globalThis.app
// context
export const lastTouchFiles: TFile[] = []
export const lastCreatedFiles: TFile[] = []

export async function getTFileContent(file: targetFile) {
	var tFile = getTFile(file)
	return await app.vault.read(tFile)
}

export function getFreeFileName(path: targetFile, root: targetFile = ''): string {
	if (path instanceof TFile) path = path.path;
	if (path.startsWith('[[') && path.endsWith(']]')) path = path.slice(2, -2)

	if (root instanceof TFile) {
		//remove the name
		root = root.path.split('/').slice(0, -1).join('/')
	}
	const [, joinPath, ext] = joinPaths(root, path).match(/(.*?)(\.\w*)?$/)
	// find a free name
	let index = 0, pathName;
	do {
		pathName = index ? `${joinPath} ${index}` : joinPath
		pathName += (ext || '.md')
		index++
		//@ts-ignore getFileByPath exist in vault
		var file = app.vault.getFileByPath(pathName)
	} while (file)
	return pathName
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
	newPath = getFreeFileName(newPath, tFile)
	var originalPath = tFile.path
	await app.vault.rename(tFile!, newPath)
	log('renameFile', `"${originalPath}" rename to "${newPath}"`)
}

export async function removeFile(path: targetFile) {
	var tFile = getTFile(path)
	if (!tFile) return
	await app.vault.trash(tFile!, false)
}
export function isFileNotation(path: string) {
	if (path.startsWith('[[') && path.endsWith(']]')) return true
	return /\.(js|md)$/.test(path);

}

export async function modifyFileContent(path: targetFile, content: string) {
	let tFile = await letTFile(path);
	await app.vault.modify(tFile, content)
	markFileAsDirty(tFile)
	await waitFileStructureReady(tFile)
	addToContextList(tFile, lastTouchFiles)
}

export function getTFile(file?: targetFile): TFile {
	if (file instanceof TFile) return file as TFile;
	file = (file || '').trim()
	if (!file || file == 'activeFile') return getActiveFile()
	let path:string = (file.startsWith('[[') && file.endsWith(']]')) ? file.slice(2, -2) : file
	return app.metadataCache.getFirstLinkpathDest(path, "")
}

export async function letTFile(path?: targetFile): Promise<TFile> {
	let tFile = getTFile(path)
	if (tFile) return tFile
	// if (!autoCreate) return null
	return await createTFile(path as string)
}

export async function createTFile(path: targetFile, content: string = '') {
	var pathName = getFreeFileName(path)
	var folders = path.split('/').slice(0, -1).join('/')
	await app.vault.createFolder(folders).catch(_ => _)
	const tFile = await app.vault.create(pathName, String(content))
	await waitFileStructureReady(tFile)
	addToContextList(tFile, lastCreatedFiles)
	addToContextList(tFile, lastTouchFiles)
	return tFile
}
