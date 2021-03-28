import Observable from './observable'
import queueJob from './scheduler'
import { isPaused } from './pause'

// Next ID
let id = 0

// Helper to create job and run it immediately
export function watch(f: Function) {
	return new Job(f).run()
}

// Wraps around a job-function to manage it's dependencies
export default class Job {
	// Stack of all running jobs
	static targetStack = new Array<Job>()

	// Dependencies from previous run
	dependencies: Set<Observable> = new Set()
	// Dependencies from most recent run
	newDependencies: Set<Observable> = new Set()
	// The function being managed 
	func: Function
	// Job's ID used to determine order of job executions
	id: number

	destroyed = false

	constructor(func: Function) {
		this.func = () => func()
		this.id = id++
	}

	// Add observable to dependencies
	addDependency(dep: Observable) {
		this.newDependencies.add(dep)
	}

	// Remove all previous dependencies that have not been touched in the rerun, and remove job as their subscriber
	// Necessary to avoid reference cycles which could prevent no longer used state or jobs from being garbage collected
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
		// If reactivity is paused or the job has been destroyed, exit
		if (isPaused() || this.destroyed) return
		// Push job to stack
		Job.targetStack.push(this)
		// Execute job
		this.func()
		// Pop stack
		Job.targetStack.pop()
		// Remove obsolete dependencies
		this.cleanupDependencies()

		return this
	}

	destroy() {
		// Remove and unsubscribe from all dependencies
		this.dependencies.forEach(o => {
			o.removeDependent(this)
		})
		this.dependencies.clear()
		this.destroyed = true
	}
}
