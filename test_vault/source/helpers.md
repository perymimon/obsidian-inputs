
# JS Native 
```js
/* Assuming that self.crypto.randomUUID() is available */
export function getUUID(): string {
	return window.crypto.randomUUID();
}
```
```js
export function parseUrl(str: string): URL | undefined {
	return new URL(str);
}

export function openURL(link: string): void {
	window.open(link, '_blank');
}
```
```js
export class DecimalPrecision {
	static round(value: number, decimalPlaces: number = 0): number {
		const p = Math.pow(10, decimalPlaces || 0);
		const n = value * p * (1 + Number.EPSILON);
		return Math.round(n) / p;
	}

	static ceil(value: number, decimalPlaces: number = 0): number {
		const p = Math.pow(10, decimalPlaces || 0);
		const n = value * p * (1 - Math.sign(value) * Number.EPSILON);
		return Math.ceil(n) / p;
	}

	static floor(value: number, decimalPlaces: number = 0): number {
		const p = Math.pow(10, decimalPlaces || 0);
		const n = value * p * (1 + Math.sign(value) * Number.EPSILON);
		return Math.floor(n) / p;
	}

	static trunc(value: number, decimalPlaces: number = 0): number {
		return value < 0 ? DecimalPrecision.ceil(value, decimalPlaces) : DecimalPrecision.floor(value, decimalPlaces);
	}

	static toFixed(value: number, decimalPlaces: number = 0): string {
		return DecimalPrecision.round(value, decimalPlaces).toFixed(decimalPlaces || 0);
	}
}
```