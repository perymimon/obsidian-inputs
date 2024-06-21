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

export const VIEW_TYPE_PAGE_DATA_VIEW = 'page-data'
export const TRIGGER_PAGE_DATA_OPEN = "page-data:open";
