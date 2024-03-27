import {getStructure, targetFile} from "./api";
import {TFile} from "obsidian";
import {Target} from "./internalApi";

var app = global.app

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
		time *= 2
		var data = getStructure(tFile)
	} while (data.dirty)
}

export function markFileAsDirty(tFile: TFile) {
	var struct = getStructure(tFile)
	if (struct) struct.dirty = true
}
