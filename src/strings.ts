export function stringTemplate(template, modifationObject){
	if(!String.isString(template)) return template;

	return template.replace(/\{(?<key>[^}]+)}/, (_,aaa)=>{
		let [key, arg] = aaa.split(':')
		let replacement = modifationObject[key]
		let value = typeof replacement == 'function'? replacement(arg):replacement;

		return value
	} )
}

export const modifications = {
	date:(format='yyyy-MM-DD')=> moment().format(format),
	time:(format = 'HH:mm') => moment().format(format)
}

export const typeMap = {
	date: '📅',
	number:'🔢',
	textarea:'💬',
	time:'⌚'
}
