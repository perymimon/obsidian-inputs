## Examples :

> **Example 1: Create a text input element:**  
> `text: Enter your name| {{input}} >::name` 
> 
> value will saved in inline-field called `name` in the same file. If the field doesn't exist, it's created.


> **Example 2: Create a text area with autocomplete:**  
>`text:select game| {{input}}, = #games >:games append`
> 
> Creates an input element that autocompletes from a Dataview query of files tagged with #games, appending the value the end of front matter `games::` key as an array.

> **Example 3: Create a radio input element**  
`text: Select color| red, blue, green| = #colors >:selectedColor`

> **Example 4: Creates a button element that increments the inline field number:**    
>  `button:click me| (number || 0)+1 >::number`

> **Example 5: Create a button to delete a specific header:**  
`button: Delete section| >::file#Section Name remove`

> **Example 6: same, just clear the header content:**  
> `button: Delete section| >::file#Section Name clear`
