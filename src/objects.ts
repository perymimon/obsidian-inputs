// @ts-nocheck
import {Target} from "./internalApi";
import {getFileData, link} from "./api";
import {TFile} from "obsidian";

export function deepAssign(target: object, ...sources: any[]) {
	for (let source of sources) {
		for (let k in source) {
			let vs = source[k], vt = target[k]
			if (Object(vs) == vs && Object(vt) === vt) {
				target[k] = deepAssign(vt, vs)
				continue
			}
			target[k] = source[k]
		}
	}
	return target
}

export function flatObject(obj) {
	const flatObject = {};
	const path = []; // current path

	function dig(obj) {
		if (obj !== Object(obj))
			/*is primitive, end of path*/
			return flatObject[path.join('.')] = obj; /*<- value*/

		//no? so this is an object with keys. go deeper on each key down
		for (let key in obj) {
			path.push(key);
			dig(obj[key]);
			path.pop();
		}
	}

	dig(obj);
	return flatObject;
}

function unflattenObject(flattenObject) {
	const unFlatten = Object.create(null);
	for (let [stringKeys, value] of Object.entries(flattenObject)) {
		let chain = stringKeys.split('.')
		let object = unFlatten

		for (let [i, key] of chain.slice(0, -1).entries()) {
			if (!object[key]) {
				let needArray = Number.isInteger(Number(chain[+i + 1]))
				object[key] = needArray ? [] : Object.create(null)
			}
			object = object[key];
		}
		let lastkey = chain.pop();
		object[lastkey] = value;
	}
	return unFlatten;
}

/**
 *
 * @param root
 * @param path
 * @param value
 * @param method replace|append|prepend|remove|clear
 */
export function objectSet(root:object, path:string, value:any, method:Target["method"] = 'replace') {
	let paths = path.split(/\[(\w+)\]|\.|\["(\w+)"\]/).filter(Boolean)
	let obj = root;
	while (paths.length > 1) {
        let p:string = paths.shift()!;
		obj[p] = typeof obj[p] == 'object' ? obj[p] as any : {};
        obj = obj[p] as Record<string, any>;
	}
	let p = paths[0]
	// @ts-ignore
	let oldValue = obj[p];
	switch (method) {
		case 'replace':
			obj[p] = value;
			break;
		case 'append':
			obj[p] = Array.isArray(obj[p]) ? [...obj[p], value] : [oldValue, value];
			break;
		case 'prepend':
			obj[p] = Array.isArray(obj[p]) ? [value, ...obj[p]] : [value, oldValue];
			break;
		case 'remove':
			delete obj[p];
			break;
		case 'clear':
			obj[p] = Array.isArray(obj[p]) ? [] : {};
			break;
		default:
			throw new Error('Invalid method');
	}
	return root;

}

export function objectGet(root:object, path:string | string[]) {
	let paths = Array.isArray(path)?
		path:
		path.split(/\[([ \w]+)\]|\.|\["([ \w]+)"\]|\['([ \w]+)'\]/).filter(Boolean)
	let current = root;
	do {
		if (current == void 0) return void 0;
		if( current instanceof TFile)
			return objectGet( getFileData(current),paths)
		let p = paths.shift()
		// @ts-ignore I count on undefined
		current = current[p]
	} while (paths.length)
	if( current instanceof TFile) return link(current)
	if(Number(current) ) return Number(current)
	return current
}
