# Obsidian live-form 

(docs)[https://perymimon.github.io/obsidian-inputs/]

thid plugin bring you powerfull way to create input and button compontes in the preivew mode that change the real markdown file . (current or other )

motivation of created this was the lack of stability of other plugin and i was sick from the loading time they take because they writed in some comilet library like savlet

this plugin is full of feature and can replace alot of plugins but take about 40ms imact time on loading (hope it was less)

note! the `input` and `button` expertion can change create and delete file, deal with dataview inline-field,frontmatter and header ( maybe lists in the future )

הפלגין הזה עדיין בשלבים המוקדמים שלו אז צפו לשינויים ועדכונים בזמן שהוא יהיה בשימוש והצורה הבוגרת שלו תתחיל להתגלות

##### עקרונות כתיבה ותכנון

- המידע משתנה בדף ולכן המידע לא יהיה תלוי באוסידיאן כדי לקרוא אותו
- הסינטקסט מתוכנן להיות נוח, ללא חלקים שצריכים להסגר משני כיוונים כמו סוגריים
- אין שימוש בספריות חיצוניות נכון לשלב זה, זמן עליה ממוצע של 40ms

#### יכולות

הקומפוננטות מתחלקות ל3 חלקים

### הממשק

- כפתור
- text input
- textarea input
- radio btn

### הביטוי שמייצר את הערך

* תבנית עם placeholder להחלפה
* הרצה של קובץ js
* הרצה של קובץ md דרך templater
* הרצה של הביטוי תחת סביבת הדף (כלומר כל המשתנים שבדף גלויים לביטוי)
* טקסט literal

### מקום שמירת הערך

- קובץ
- כותרת בקובץ
- frontmatter field in a file
- inline field (dataview) in a file

### examples

`text| __placeholder__ >::name`

create input element of type `text` save the input of the user to inline field `name` in the same file of the input. if the field not exist, create it

[name::user value]

`text|__ select game __|=list from #games >:games append`

create input elment that auto complate from dataview query of file with the tag `#games`. append the value to forntmatter games key as array.

`button|click me| (number || 0)+1 >::number`

create button element that increment inline-field `number`

### syntaxt

inputs: `-<id>- <type>| <input expresion><,options,> > <target value>`

`<id>` can be any uniq value,  It's optional and help to recognize the element For the focus after a content refresh of for `pattern replace`

`<type>` should be any input element ligal type like `text` `number`

`<input expresion>` like `<expresion>` but should have at list 4 underscore that replaced with input value When the expression evaluate

`<target value>` Expression that tell where and how to save the value

button: `-<id>- button|<name>|<expresion> > <targetValue>`

`<name>` button label

`<expresion>` expertion that evaluete in the scope of the current page, in 3 phases

step 1) replace any `{key}` with value of inline-field or frontmatter key or Special valuable that the described later

step 2) If the evaluate is surrounding by a square it consider a file if the file is a markdown file it's used like a templater template If the file is Javascript file is Import and run and if it returns something on the default export that's value will save on the target value

step 3) If it's not consider as a file expertion it try to evaluate the expection on the context of the page with the avilable API. it run like a code in the devtool console for example

step 4) If step two of step 3 draw error when they try to evaluate the expression then the all expression will return as a literal text

`<target value>` Expiration that will pass as the target of the value well it should be saved and how.

The template of the target value will look like this `><file>(<type><path>) <method>`

for example : `daily#target header append`

`file>`  Optional, The path of the file if the file is not exist it will create it. File section not exist The file will be the current one. Also the special file-name `activeFile` target the current file

`<type>` Optional, can be one the next symbols: `:` frontmatter `::` inline-field `#` header That represent a sub position in the target file,or the context if you prefer, If `<type>` symbols not exist the the whole target file will be the context target

`<path>` Must come after the type. and it is the fronmatter's path or the name of the inline-field or the name of the header

If either of the file or the type not exist the context is the `input` pattern himself

`<method>` How to treat the return value can be one of the next keyword:`append`|`prepend`|`replace`|`create`|`remove`|`

It depend on the contenxt

`frontmatter`: `append`,`prepend` treat the value as array and append and prepend rapidly `replace` just replace the current value

`inline-field`: `append` and `prepend` split the inlinefield by comma (,) and append or prepend the value to evalute array. `replace` just replace the current value

`header`: `append` add value after the last content line of the header. `prepend` add the value as a line Under the header. `replace` replce all header content with the value.`remove` delete the whole header and it content

`file`: `append` add the value the bottom of the file, `prepend`add the value to the top of the file, `remove` delete the file, `replace` the content of the file with the value, create` create new file event if the curren file exist

`input pattern` `append` add the value after the pattern, `prepend` add the value before the pattern, `replce` replace the pattern with the value, `remove` remove the pattern.

## Road Map

- syntax highlighter
- target lists in a page
- inline multi row commands (combo)
- toggle input (can change value from two options )
- roller view ( can change value from multiple options )
- all around templater replace solution, so not need toggle between multi syntax

Pricing
This plugin is provided to everyone for free, however if you would like to
say thanks or help support continued development, feel free to send a little thanks
through one of the following methods:

- [GitHub Sponsors](https://github.com/sponsors/perymimon)
- [Ko-fi](https://ko-fi.com/V7V8ZIG94)
- [PayPal](https://www.paypal.me/perymimon)
