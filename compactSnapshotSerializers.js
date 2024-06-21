// compactSnapshotSerializers.js

// Custom serializer using JSON.stringify() replacer
var maxScreen = 20;
const customSerializer = {
	// Test if the value is an object and not null
	test: (val) => typeof val === 'object' && val !== null,
	print: (val, serialize) => {
		let stringified = JSON.stringify(val, (key, value) => {
			let stringfy = JSON.stringify(value);
			if ((stringfy.length + key.length) < maxScreen) return stringfy;
			return value;
		}, 2) // Indentation level of 2 spaces
		// Clean up the resulting JSON string with regex replacements
		return stringified
			.replace(/\\"/g, '') // Remove escaped quotes
			.replace(/\[\s*\{/, '[{') // Fix arrays of objects
			.replace(/}\s*]/, '}]')
			.replace(/}\s*,\s*\{/, '},{');
	}
};

module.exports = {
	test(val) {
		return customSerializer.test(val);
	},
	serialize(val, config, indentation, depth, refs, printer) {
		return customSerializer.print(val);
	},
};
