import Observable from './observable'
import { mapObject } from './utils'
import { watch } from './job'

export function defineReactive(target: any, name: string, getter: Function) {
	watch(() => target[name] = getter())
}

export default function makeReactive<T = any>(state: T): T {
	// @ts-ignore
	if (state?.__isProxy) return state // Already rective

	return 	Array.isArray(state) ? makeArrayReactive(state as any) : // Return reactive array
					state instanceof Object ? makeObjectReactive(state) : // Return reactive object
					state // State is not an object, must be primitive. Return as-is.
}

export function unwrap(state: any) {
	if (!state.__isProxy) {
		console.warn('unwrap() called on non-reactive state. Returning original object')
		return state
	}
	return { ...state }
}

export function deepUnwrap(state: any) {
	return mapObject(unwrap(state), deepUnwrap)
}

function makeObjectReactive(obj: any) {
	const observables = new Map<string | number | symbol, Observable>()

	return new Proxy(mapObject(obj, p => makeReactive(p)), {
		get(target, key, receiver) {
			if (key === '__isProxy') return true

			if (observables.has(key))
				observables.get(key).depend()
			else
				observables.set(key, new Observable().depend())

			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			if (target[key] === value) return true

			target[key] = makeReactive(value)
			observables.get(key)?.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			delete target[key]
			observables.get(key)?.notify()

			return true
		}
	})
}

function makeArrayReactive(arr: Array<any>) {
	const observable = new Observable()

	return new Proxy(arr.map(i => makeReactive(i)), {
		get(target, key, receiver) {
			if (key === '__isProxy') return true

			observable.depend()

			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			if (target[key] === value) return true

			target[key] = makeReactive(value)
			observable.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			delete target[key]
			observable.notify()

			return true
		}
	})
}
