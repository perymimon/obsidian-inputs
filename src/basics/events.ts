export function waitFor(element: HTMLElement, eventName: string) {
	const {promise, resolve, reject} = Promise.withResolvers()
	element.addEventListener(eventName, resolve, {once: true})
	return promise;
}

export function globalWaitFor(element: HTMLElement, eventName: keyof DocumentEventMap, selector: string) {
	const {promise, resolve, reject} = Promise.withResolvers()
	const resolver = (event: UIEvent, delegateTarget: HTMLElement) => {
		if (delegateTarget != element) return;
		resolve([event, delegateTarget])
		globalThis.document.off(eventName, selector, resolver)
	}
	globalThis.document.on(eventName, selector, resolver)
	return promise;
}
