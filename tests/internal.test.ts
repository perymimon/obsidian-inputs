import {parseExpression, parsePattern, parserTarget, patternToTitle} from "../src/internalApi";
import {traceExpression} from "../src/tracer";
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;
import {PATTERN} from "../src/consts";
import {Pattern} from "../src/types";

describe('parseTarget', () => {
	const files = ['', 'file', ' file', 'file with space', '[[file]]']
	const types = ['', ':', '::', '#']
	const paths = ['', 'path', 'path with space', 'path.path']
	const methods = '|append|prepend|replace|create|remove|clear|rename'.split('|')
	const cases = []
	const typeMap: Record<string, string> = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
	}
	for (let file of files)
		type:    for (let type of types)
			for (let path of paths) {
				if ((!!type ^ !!path)) continue type
				for (let method of methods)
					cases.push([
						`>${file}${type}${path} ${method}`,
						{
							file: file.trim(),
							targetType: !file && !type ? 'pattern' : type ? typeMap[type] : 'file',
							path, method
						}
					])
			}

	cases.forEach(([exp, status]) => {
		test(`"${exp}"`, () => {
			const target = parserTarget(exp)
			expect(target).toMatchObject(status)
			console.log(`"${exp}"`, status)
		})
	})

})

describe('parseValueExpression', () => {
	let spy: SpyInstance;

	beforeAll(() => {
		spy = jest.spyOn(console, 'log').mockImplementation(() => {
		});
	})
	afterAll(()=> spy.mockRestore())
	test('"import test.js"', async () => {
		const status = parseExpression('import test.js')
		expect(status).toMatchObject({
			execute: 'import test.js',
			file: 'test.js',
			type: 'import'
		})
		const logging = traceExpression(status)
		expect(logging.message).toContain('resolve "import test.js" by import "test.js" file')
	})
	test('"import test.md"', async () => {
		const status = await parseExpression('import test.md')
		expect(status).toMatchObject({
			execute: 'import test.md',
			file: 'test.md',
			type: 'template'
		})
		const logging = traceExpression(status)
		expect(logging.message).toContain('resolve "import test.md" by import content of "test.md" to templater')
	})
	test('random string', async () => {
		const status = await parseExpression('1 test.md')
		expect(status).toMatchObject({
			execute: '1 test.md',
			type: 'executed'
		})
		const logging = traceExpression(status)
		expect(logging.message).toContain('executed "1 test.md" and got ""')
	})
	test('empty string', async () => {
		const status = await parseExpression('   ')
		expect(status).toMatchObject({
			execute: '   ',
			type: 'empty'
		})
		const logging = traceExpression(status)
		expect(logging.message).toContain('try to resolve "   " but it consider empty')
	})
})

describe('parsePattern', () => {
	const ids = ['', '-123-', '-abc-']
	const types =['text','radio','textarea','button']
	const names =['',':name',':name with space',':name-with-dash']
	const optionss=['','1 option','1,2,3','?🤯,😍','= #tag']
	const expressions =['','1+1','{{reference value}} + text','1+ [var]', '&var.var','(var)']
	const targets = ['','>','> file', '>file:var.var method']
	for(let id of ids)
		for(let type of types)
			for (let name of names)
				for (let options of optionss)
					for(let expression of expressions)
						for( let target of targets){
							let pattern = `${id} ${type}${name && ':' + name}${options && `?${options}`}|${expression}${target}`
							test(pattern,()=>{
								const status = parsePattern(pattern,PATTERN )
								console.log(`"${pattern}" =>`, status)
								expect(status)
								.toMatchObject({id,type,name,options,expression,target})

							})
						}



	// test('`radio:mood?🤯,😍|> ::mood`', () => {
	// 	const pattern: Pattern = parsePattern(`radio:mood?🤯,😍|> ::mood`, PATTERN)!
	// 	expect(pattern).toMatchObject({
	// 		"type": "radio", "id": undefined,
	// 		"name": "mood", "options": "🤯,😍",
	// 		"expression": "", "target": "> ::mood"
	// 	})
	// })
	// test('`text:book?= #book | > :book.name`', () => {
	// 	const pattern: Pattern = parsePattern(`text:book?= #book | > :book.name`, PATTERN)!
	// 	expect(pattern).toMatchObject({
	// 		"type": "radio", "id": undefined,
	// 		"name": "mood", "options": "🤯,😍",
	// 		"expression": "", "target": "> ::mood"
	// 	})
	// })
})
