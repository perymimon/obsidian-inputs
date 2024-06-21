export const PATTERN = new RegExp([
	/(?:`|^)/,
	/(?<id>-\w+-)?\s*/,
	/(?:(?<type>[\w-]*?))?/,
	/(?::(?<name>.*?))?/,
	/(?:\?(?<options>.+?))?/,
	/\|/,
	/\s*(?<expression>.*?)/,
	/\s*(?<target>>.*?)?/,
	/\s*(?:$|`)/
].map(r => r.source).join(''), 'i')

