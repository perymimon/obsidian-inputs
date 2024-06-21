/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports  = ({
	preset:'ts-jest',
	moduleDirectories: ['node_modules', 'src', 'test'],
	testEnvironment: "jsdom",
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			warnOnly: true,
			diagnostics: false
		}],
	},
	// moduleNameMapper: {
	// 	'^obsidian$': '<rootDir>/node_modules/obsidian',
	// },
	snapshotSerializers: ['./compactSnapshotSerializers.js'],
})
