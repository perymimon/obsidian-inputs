`textarea|- {time} some pre text ____ >append -10-`  

##### basics
simple input :: אני רוצה לכתוב סיפור על החיים שלי 
simple textarea:: sdfsdf
simple input:: `____placeholder__ -12-`

##### small modification
wider input :: `_________>append -3-`
## Continuous values
continues value :: 
continues values with pre text ::  `text|____,>append -7-`
continues values with delimiter text :: sdfsdf,23123,123213,123, `____, ++ -9-`
continues values with pre text with magic word :: -date sdfsdf 8980
-date sdfsdf sdfdsf
`-date sdfsdf textarea____++ -10-`
continues values with pre text with magic word :: -time sdfsdfsdfsdf

## frontmatter
simple input that saved in frontmatter `____ >:area -10-`
continues input that saved in frontmatter  `____>:book append -10-` 
continues input with pre words that saved in frontmatter `____|++:book -11-`
## options
input with fix options :: `text|,____|key:value,key1:value >append -4-`
input with dataview query :: `____|= list from #book  -5-`
input with fix options and dataview  :: `____ |key:value,key1:value, = list from #book -13-`

#### full syntax
type|___placeholder__|opt1, opt2:value, = sfdsdf >:yaml.field -00-