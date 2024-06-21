// import {link} from '../src/api'
import {getFileData} from "../src/data";
// jest.mock('fileData')
jest.mock('../src/data')
// import {stringTemplate} from "strings";
// import {resolveExpression} from "../src/api";

// const demoApp = mock<App>()


test('file data', () => {
	// const linkText = link('some file')
	let fileData = getFileData()
	expect(fileData).toMatchObject({time: '10:00'});
})



// test('Adding positive numbers is not zero', () => {
// 	for (let a = 1; a < 10; a++) {
// 		for (let b = 1; b < 10; b++) {
// 			expect(a + b).not.toBe(0);
// 		}
// 	}
// });
//
// test('rejects to octopus', async () => {
// 	await expect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus');
// });

