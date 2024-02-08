export function deepAssign(target: object, ...sources) {
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


export function objectSet(root, path, value, isPush) {
	let paths = path.split(/\[(\w+)\]|\.|\["(\w+)"\]/).filter(Boolean)
	let obj = root;
	while (paths.length > 1) {
		let p = paths.shift()
		obj[p] = typeof obj[p] == 'object' ? obj[p] : {};
		obj = obj[p]
	}
	let p = paths[0]

	if (isPush) {
		obj[p] = Array.isArray(obj[p]) ? obj[p] : []
		obj[p].push(value)
	}else {
		obj[p] = value
	}
}
export function objectGet(root, path) {
	let paths = path.split(/\[(\w+)\]|\.|\["(\w+)"\]/).filter(Boolean)
	let current = root;
	do {
		if (current == void 0) return void 0;
		let p = paths.shift()
		current = current[p]
	} while (paths.length)
	return current
}
