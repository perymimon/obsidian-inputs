
## Goel

- button need name
- run md template or JS file, 
- embed the return to current position 
- or under some header (append | prepend)
- if it md file it can create new file. name of the file should can be used 
- name of the file should be generated from frontend variable or object that return from js file
- support literal template with auto generate form for missing values

abc

- return and inject to currant position (and disappear)
`Button js, moment().format("hh:mm")`

- inject literal template in current position ( and disappear)
`Button text, {time} {bookname}`

- inject literal template under to header (not disappear) ask for value
`Button text append #test header, - {time} {value}`
`Button text prepend #test header, - {time} {value}`

- create file from template and use it name for log under header
`Button[Log Game] template\log-game.md  `

```js
	form = run form('game log')
	live.createNote(`${form.gameName}`, `template.md`)
	live.log(textToLog, underHeader, prepend|append)
```
 
`Button[hello world] [[hello world.js]]`  

# playground
- 16:44 played the game, [[[[game-log@ gameboard 9]]]]
- 16:39 played the game, [[database/game-log/game-log@ taki 7.md]]