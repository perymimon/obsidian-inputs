import {getFileData} from "../src/data";
import {stringTemplate} from "../src/basics/strings";
jest.mock('../src/data')

describe('stringTemplate', () => {
	let fileData = getFileData('testFile.md')
	test('convert "(time)" to inline field"', async () => {
		const result = await stringTemplate('(time)', fileData)
		expect(result).toBe('(time::10:00)');
		const result2 = await stringTemplate('fill (yourname)', fileData)
		expect(result2).toBe('fill (yourname::)');
	})
	test('covert [var] to inline field ', async () => {
		const result = await stringTemplate('[time] my name is {{name}}', fileData)
		expect(result).toBe('[time::10:00] my name is Pery Tester');
		const result2 = await stringTemplate('fill [yourname]', fileData)
		expect(result2).toBe('fill [yourname::]');
	})
	test('convert "&name" to value from active file data', async () => {
		const result = await stringTemplate('name is &name', fileData)
		expect(result).toBe('name is Pery Tester');
	})
	test('covert {{var with space}} to value from active file data', async () => {
		const result = await stringTemplate('name is {{name}}', fileData)
		expect(result).toBe('name is Pery Tester');
		const result2 = await stringTemplate('name is {{full name}}', fileData)
		expect(result2).toBe('name is Pery Tester');
	})

	test('test 2 level deep reference from object', async () => {
		const result = await stringTemplate('value {{level.level}}', fileData)
		expect(result).toBe('value 2');
	})
	test('test error reference from object', async () => {
		const result = await stringTemplate('value {{level.level.level}}', fileData)
		expect(result).toBe('value undefined');
	})
	test('test reference data from another TFile', async () => {
		const result = await stringTemplate('value {{book.time}}', fileData)
		expect(result).toBe('value 22:00');
	})
	test('test basic math {{1+3}}', async () => {
		const result = await stringTemplate('value {{1+3}}', fileData)
		expect(result).toBe('value 4');
	})
	test('test reference to {{ notInScope }} variable', async () => {
		const result = await stringTemplate('value {{ notInScope }}', fileData)
		expect(result).toBe('value <error>ReferenceError: notInScope is not defined</error>');
	})

})
