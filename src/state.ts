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
	if (!state.__isProxy)
		return state // Passed state not reactive. Return original object 
	// Return shallow clone of object. This breaks reactivity
	return { ...state }
}

export function deepUnwrap(state: any) {
	 // Recursively unwrap object
	return mapObject(unwrap(state), deepUnwrap)
}

function makeObjectReactive(obj: any) {
	// Map to hold observables, which in turn hold subscribed jobs, for each property
	const observables = new Map<string | number | symbol, Observable>()

	// Recursively create proxies for object and nested objects
	return new Proxy(mapObject(obj, p => makeReactive(p)), {
		get(target, key, receiver) {
			// Hard-coded property to  identify reactive state
			if (key === '__isProxy') return true

			// Create observable if not already present, add running job as subscriber
			if (observables.has(key))
				observables.get(key).depend()
			else
				observables.set(key, new Observable().depend())

			// Return requested value. If method, bind to proxy in order to detect mutations 
			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			// Exit if mutation has no effect
			if (target[key] === value) return true

			// Assign reactive version of value 
			target[key] = makeReactive(value)
			// Notify subscribers, if any
			observables.get(key)?.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			// Delete value. Notify subscribers
			delete target[key]
			observables.get(key)?.notify()

			return true
		}
	})
}

function makeArrayReactive(arr: Array<any>) {
	// Array only needs one observable since indices are not bound to specific items
	const observable = new Observable()

	// Create proxy for clone of array with reactive items
	return new Proxy(arr.map(i => makeReactive(i)), {
		get(target, key, receiver) {
			// Hard-coded property to identify reactive state
			if (key === '__isProxy') return true

			// Add running job to subscribers
			observable.depend()

			// Return requested value. If method, bind to proxy in order to detect mutations.
			// Even works for built-ins like push and pop. Scripting-language magic
			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			// Exit if mutation has no effect
			if (target[key] === value) return true

			// Assign reactive version of value
			target[key] = makeReactive(value)
			// Notify subscribers
			observable.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			// Delete value. Notify subscribers
			delete target[key]
			observable.notify()

			return true
		}
	})
}
