import {getInlineFields} from "../src/data.inlineFields";


describe('getInlineFields from bulk of content', () => {
	test('one field [variable::value] in a row', async () => {
		const array = getInlineFields(`
				# title
				some content [variable::value]
				extra line
			`)
		expect(array).toMatchObject([{
			"fullKey": "variable",
			"innerField": "variable::value",
			"isRound": true,
			"isSquare": false,
			"key": "variable",
			"keyOffset": [31, 39],
			"offset": [30, 47],
			"oldValue": "value",
			"outerField": "[variable::value]",
			"value": "value",
			"valueOffset": [41, 46],
		}])
	})
	const cases = [[
		'[variable::value] [variable::value]',
		`
				# title
				some content [variable::value] [variable::value]
				extra line
			`
	], [
		'with wikiLink as value [variable::[[value]]]',
		`
				# title
				some content [variable::[[value]]]
				extra line
			`
	], [
		'with wikiLink as value variable::[[value]] and more after text',
		`
			# title [::[[value]]]
			some content variable::[[value]] and more after text
			extra line
		`
	], [
		'with wikiLink as value variable::[[value]] and more after text (time::10)',
		`
			# title [::[[value]]]
			some content variable::[[value]] and more after text (time::10)
			extra line
		`
	]]

	for (const _case of cases) {
		test(_case[0], () => {
			const array = getInlineFields(_case[1])
			expect(array).toMatchSnapshot()
		})
	}


})
