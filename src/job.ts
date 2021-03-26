import Observable from './observable'
import queueJob from './scheduler'
import { isPaused } from './pause'

let id = 0

export function watch(f: Function) {
	return new Job(f).run()
}

export default class Job {
	
	static targetStack = new Array<Job>()
	static reactivityPaused = false
	static queue: Set<Job> = new Set()

	dependencies: Set<Observable> = new Set()
	newDependencies: Set<Observable> = new Set()
	func: Function
	id: number
	destroyed = false

	constructor(func: Function) {
		this.func = () => func()
		this.id = id++
	}

	addDependency(dep: Observable) {
		this.newDependencies.add(dep)
	}

	cleanupDependencies() {
		this.dependencies.forEach(d => {
			if (!this.newDependencies.has(d)) d.removeDependent(this)
		})
		let tmp = this.dependencies
		this.dependencies = this.newDependencies
		this.newDependencies = tmp
		this.newDependencies.clear()
	}

	queue() {
		queueJob(this)
		return this
	}

	run() {
		if (isPaused() || this.destroyed) return
		Job.targetStack.push(this)
		this.func()
		Job.targetStack.pop()
		this.cleanupDependencies()
		return this
	}

	destroy() {
		this.dependencies.forEach(o => {
			o.removeDependent(this)
		})
		this.dependencies.clear()
		this.destroyed = true
	}
}
