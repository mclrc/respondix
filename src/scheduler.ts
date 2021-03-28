/* Currently highly inefficient. Does the job, but needs improvement.
 * See https://github.com/vuejs/vue-next/blob/master/packages/runtime-core/src/scheduler.ts for possible tweaks
 * PRs welcome
 */

import Job from './job'

const queuedJobs = new Set<Job>()
const isQueued = (j: Job) => queuedJobs.has(j)

let flushUpcoming = false

function flush() {
	flushUpcoming = false

	// Jobs should execute in the order of their creation
	const jobsToExecute = Array.from(queuedJobs).sort((a, b) => a.id - b.id)
	// Clear queue
	queuedJobs.clear()

	// Execute jobs in order of ascending IDs
	jobsToExecute.forEach(job =>job.run())
}

export default function queueJob(j: Job) {
	if (isQueued(j)) return;
	queuedJobs.add(j)
	if (!flushUpcoming) {
		flushUpcoming = true
		// Run flush when stack is empty, giving other jobs time to queue themselves
		queueMicrotask(flush)
	}
}
