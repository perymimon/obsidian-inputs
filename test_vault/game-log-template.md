

[gamers append ::[[database/אנשים/נריה רוזנר.md]]]]]]]


[gamers::database/אנשים/איליה.md,database/אנשים/נריה רוזנר.md,database/אנשים/נריה רוזנר.md,[[database/אנשים/איליה.md,[[database/אנשים/איליה.md,[[database/אנשים/דני.md]]]]]]]


[game::[[database/topTableGame/game@ NetRunner.md]]]]]

`text|[[__select game__]]|= list from #topTableGame >::game -1-` `text|[[__select players__]]|= list from #gamer >::gamers append -2-`
`text|getLinkToFile(__select game__)|= list from #topTableGame >::game -3-` 

```dataview
list  from #gamer  
```
<%*
 const result = await app.plugins.plugins.modalforms.api.openForm("top-table-game");
 let folder = "database/game-log"
 let gameName = result.game.value.toLowerCase().replace('game@','')
 var filename = `game-log@ ${ gameName }`
 var players =  result.players.value.join(',')
 _%>
---
<% result.asFrontmatter() %>
date-created: <% tp.date.now("YYYY-MM-DD") %>
tags: game-log/<% gameName.replace(/\s+/g,'') %>
---
`button|End Game| {time} >::end` 
[[game@ <% gameName %>]] [[<% tp.date.now("YYYY-MM-DD") %>]] [start:: <% tp.date.now("HH:mm") %>] 
[end::] [duration::  ] [Who win:: `text|____| <% players %> `] 
