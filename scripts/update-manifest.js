// update-manifest.js
const fs = require('fs-extra');

async function updateManifest() {
	const packageJson = await fs.readJson('package.json');
	const manifestPath = 'manifest.json'; // Adjust the path as needed
	const manifest = await fs.readJson(manifestPath);

	// Update manifest fields with package.json values
	manifest.name = packageJson.name;
	manifest.version = packageJson.version;
	manifest.description = packageJson.description;
	manifest.author = packageJson.author;

	// Write updated manifest back to file
	await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

updateManifest()
	.then(() => console.log('Manifest updated successfully'))
	.catch(err => console.error('Error updating manifest:', err));
