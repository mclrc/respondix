import Job from './job'
import { isPaused } from './pause'

// Class to wrap set of subscribers (jobs)
export default class Observable {
	// Subscribers to this observable
	subscribers = new Set<Job>()

	// Add currently running job to subscribers. Called by reactive state proxy 'get' interceptors
	depend() {
		 // If reactivity is paused, don't add subscriber
		if (isPaused()) return
		// Find running job
		const job = Job.targetStack?.[Job.targetStack.length - 1]
		
		// If job exists, add job to subscribers and observable to job's dependencies
		if (!job) return this
		job.addDependency(this)
		this.subscribers.add(job)
		
		return this
	}

	removeDependent(w: Job) {
		this.subscribers.delete(w)
	}

	// Queue all subscribers. Called by reactive state proxy 'set' interceptors when relevant state changes
	notify(): Observable {
		// If reactivity is paused, exit
		if (isPaused()) return
		// Queue all subscribers to be rerun
		this.subscribers.forEach(f => f.queue())
		return this
	}
}
