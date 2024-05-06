---
game: 3434
---
[number::252]
[file name::3434]

`text| __file name__ >note#game create`

`text| __index__ + {number} >::number replace`

`button|increment| number + 1 >::number`
`button|click me| number + 1 >file{number}::number`

`button|create file| {number} >file-{file name}-{number}`

`button|delete last file|>{lastFile} delete`

```inputs
text| [[top-table-game]] > ::: form
[[game-log-template]] > database/game-log/game-log@
```


hello this day we play (game::234)
## game
sdfsdf
sdfsdfds
qweqwe
sdfds
sdfsdf