import Job from './job'
import { isPaused } from './pause'

export default class Observable {
	
	subscribers = new Set<Job>()

	depend() {
		if (isPaused()) return
		const job = Job.targetStack?.[Job.targetStack.length - 1]
		if (!job) return this
		job.addDependency(this)
		this.subscribers.add(job)
		return this
	}

	removeDependent(w: Job) {
		this.subscribers.delete(w)
	}

	notify(): Observable {
		if (isPaused()) return
		this.subscribers.forEach(f => f.queue())
		return this
	}
}
