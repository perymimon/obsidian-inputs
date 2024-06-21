import {InlineField} from "./types";
import {cleanString} from "./basics/strings";

export function getInlineFields(content: string, key?: string): InlineField[] {
	// const regex = /\[\s*(.*?)\s*::(.*?)]|\b(.*?)::(.*?)$|\(\s*(.*?)\s*::(.*?)\)/gm
	var def = '.*?', freeDef = '[^\\s]+'
	// const regex = new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])|(\\()(\\s*${key || def}\\s*)::(.*?)(\\))|()(${key ||freeDef})::(.*?)()$`, 'gm')
	var cleanContent = cleanString(content, {inlineField: false})
	const patterns = [
		new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])`, 'gm'),
		new RegExp(`(\\()(\\s*${key || def}\\s*)::(.*?)(\\))`, 'gm'),
		new RegExp(`()(${key ||freeDef})::(.*?)()$`, 'gm')
	]
	const fields: InlineField[] = [];
	let match;
	for (let inlinePattern of patterns) {
		cleanContent = cleanContent.replace(inlinePattern, (...match) => {
			const [field] = Array.from(match).filter(Boolean);
			const index = match.at(-2)
			var [startOffset, endOffset] = [index, index + field.length]
			var outerField = content.slice(startOffset, endOffset)
			var innerField = outerField.replace(/^[(\[]|[)\]]$/g, '')
			var [fullKey = '', fullValue = ''] = innerField.split('::')
			let [key, value] = [fullKey, fullValue].map(t => t.trim())
			let withBracket = !(outerField.length == innerField.length)

			let startKey = startOffset + (withBracket as unknown as number),
				endKey = startKey + fullKey.length,
				startValue = endKey + 2,
				endValue = startValue + fullValue.length
			fields.push({
				isRound: outerField[0] == '[',
				isSquare: outerField[0] == '(',
				outerField, innerField, key, value, fullKey,
				oldValue: fullValue,
				offset: [startOffset, endOffset],
				keyOffset: [startKey, endKey],
				valueOffset: [startValue, endValue]
			})
			return '_'.repeat(field.length)
		})
	}
	// while ((match = regex.exec(cleanContent)) !== null) {
	// 	// note to myself: don't take values from clean content
	//
	// }

	return fields.sort((f1, f2) => f1.offset[0] - f2.offset[0])
}

export function getClosesInlineFieldToPattern(inlineFields:InlineField[], pattern: string): InlineField | null {
	if (!inlineFields.length) return null
	if(inlineFields.length == 1) return inlineFields[0]

	var targetOffset = (content).indexOf(pattern)

	var closedInlineField = inlineFields.map((inlineField) => {
		var [s, e] = inlineField.offset
		return {
			dis: Math.abs((e > targetOffset) ? s - targetOffset : e - targetOffset),
			desc: inlineField
		}

	}).sort((a, b) => (a.dis - b.dis))
		.at(0)

	return closedInlineField!.desc
}
