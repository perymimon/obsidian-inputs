// @ts-nocheck
import {getStructure, getTFile, targetFile} from "./api";
import {TFile} from "obsidian";
import {log} from "./internalApi";

var app = globalThis.app

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

export async function waitFileIsReady(tFile: TFile) {
	var time = 10
	do {
		await sleep(time)
		if (time > 2000) throw `more then 2s and the file ${tFile.path} not ready`
		var data = getStructure(tFile)
		time *= 2
	} while (data.dirty)
}

export function markFileAsDirty(tFile: TFile) {
	var struct = getStructure(tFile)
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
