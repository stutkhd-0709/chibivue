export const isArray = Array.isArray;
export function isPlainObject(obj: any): boolean {
	return Object.prototype.toString.call(obj) === "[object Object]";
}