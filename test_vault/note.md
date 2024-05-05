---
opts: op2
opts2: op2
---
[start::12:33]   [end::12:33]   [duration::מספר שניות]  [win::]

`button:start| {{time}}>::start` `button:end|{{time}}>::end` `button:dur| duration(start,end)>::duration` 

`input| select player |- {{input}}: score::,= #gamer >#players append` 

[lastFile::[[myFile 2]]]

[your name::<error>ReferenceError: $c0 is not defined</error>]


`button:set file name| link($c0) >:: lastFile`
`button:set your name| {{$c0['my name']}} >::your name`
`button:create **fil**e| [[myFile 5]] >myFile create`

lkklj`dataview
list from #gamer 
 
המשחק הכי טוב שהיה לי השנה`

`input:name| ____,op1, op2> : opts`
`input:options| ____,op1, op2> : opts2`
## players
- [[פרי מימון]]
- [[סטאס פירר]]
-  [[פרי מימון]] [score::34]
- [[note]]: score::
- [[סטאס פירר]]:[ score::]  `input:score| {{input}}> ::score`
- [[סטאס פירר]]: score::
- [[נריה רוזנר]]: score::
- [[סטאס פירר]]: score::
- [[note]]: score::
- [[פרי מימון]]: score::
- [[איליה]]: score::
- [[נריה רוזנר]]: score::

# Game story
sdfsdf

```inputs 
button: top-game | [[game-log-template]] > database/game-log/game-log create
| new0.game > {{new0}} rename
| playing {{new0}} >#activity

``` 
## activity

playing <error>ReferenceError: $c0 is not defined</error>
playing [[$0 1.game]]
playing [[game@ NetRunner 8]]
playing [[game-log 4]]


### 777

```inputs 
text: top-game |
|{{input}} >#777

``` 
`button:name| #header.content > #header2 append 
| [[activeFile]].name > #log append`

`text: top-game |`
`| {{input}} >#777 `

`button:rename| ../pery > [[pery]] rename`

[volum::34d3sdf4]
[vol::34d3sdf4]
`button:vol| volum>::vol`  

(data::123)

data:: all the line long, so long that there no end f

`text:input placeholder| - &input | 1+2 > ::data`