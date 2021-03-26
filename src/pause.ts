let reactivityPaused = false

export function isPaused() {
	return reactivityPaused
} 

export function pause() {
	reactivityPaused = true
}

export function unpause() {
	reactivityPaused = false
}