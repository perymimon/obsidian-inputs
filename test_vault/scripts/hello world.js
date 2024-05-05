// const result = await app.plugins.plugins.modalforms.api.openForm("top-table-game");
// let folder = "database/game-log"
// let gameName = result.game.value.toLowerCase().replace('game@','')
// var filename = `game-log@ ${ gameName }`
// var winOptions =  result.players.value.map(n=>`option(${n})`)

// const tfileTemplate = await live.getTFile('template')
// const file = await live.createNewNoteFromTemplate(tfileTemplate,"",filename)
// const port = {}
// const file = await live.createNote("newFile","template.md", port)
// debugger
// const file = await live.createNoteFromTemplate("template.md")
// debugger
// let quickadd = app.plugins.plugins['quickadd']
// let choice = quickadd.settings.choices.find( c => c.name.trim() == "script-daily-log")
// choice.format.format = `- {{time}} played the game [[${filename}]] \\n`
// quickadd.api.executeChoice('script-daily-log')
const form = await app.plugins.plugins.modalforms.api.openForm("top-table-game");
let folder = "database/game-log"
let gameName = form.game.value.toLowerCase().replace('game@','')
form.gameName = gameName
var filename = `game-log@ ${ gameName }`

const file = await live.templater('game-log template.md',`${folder}/${filename}`, {form})
const time = moment().format('HH:mm')
const link = app.fileManager.generateMarkdownLink(file,'',gameName)
await live.addLog({
    text: `- ${time} played the game, [[${link}]]`,
    location: '#playground',
    method: 'append'

})

