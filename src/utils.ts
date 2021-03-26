export interface Dict<T = any> { [key: string]: T }
export const isPrimitive = (value: any) => !(value instanceof Object)

export function shallowClone(source: any): any {
	return isPrimitive(source) ? source :
		source instanceof Array ? [...source] :
			Object.assign(Object.create(Object.getPrototypeOf(source)), { ...source })
}

export function mapObject<T = any>(obj: any, op: Function): T {
	return Object.keys(obj).reduce((prev, key) => {
		prev[key] = op(obj[key])
		return prev
	}, Object.create(obj.constructor.prototype))
}