/* ==========================================================================
   THREAD SYNCHRONIZATION & MUTEX LOCK MONITOR
   OS Concept: Mutex Locks, Counting Semaphores, Critical Section Protection
   ========================================================================== */

class SyncResource {
    constructor(id, name, maxCount = 1) {
        this.id = id; // Resource ID e.g. 'ICU'
        this.name = name; // Resource Display Name e.g. 'ICU Bed Unit'
        this.maxCount = maxCount; // Capacity (Semaphore limit)
        this.availableCount = maxCount;
        
        this.holderPID = null; // Single holder or list of holders
        this.waitingQueue = []; // List of process PIDs waiting for this lock
        this.lockStatus = 'FREE'; // 'FREE', 'LOCKED'
    }

    acquire(pid) {
        if (this.holderPID === pid) return true; // Already acquired by this process

        if (this.availableCount > 0 && this.waitingQueue.length === 0) {
            this.availableCount--;
            this.holderPID = pid;
            this.lockStatus = 'LOCKED';
            window.uiController.logSystem(`[MUTEX LOCK] Process ${pid} acquired Mutex Lock for ${this.name}`, 'lock');
            return true;
        } else {
            if (!this.waitingQueue.includes(pid)) {
                this.waitingQueue.push(pid);
                window.uiController.logSystem(`[MUTEX BLOCK] Process ${pid} blocked waiting for ${this.name} Lock`, 'lock');
            }
            return false; // Could not acquire lock, process must WAIT
        }
    }

    release(pid) {
        if (this.holderPID === pid) {
            this.holderPID = null;
            this.availableCount++;
            window.uiController.logSystem(`[MUTEX UNLOCK] Process ${pid} released Mutex Lock for ${this.name}`, 'lock');

            if (this.waitingQueue.length > 0) {
                const nextPID = this.waitingQueue.shift();
                this.holderPID = nextPID;
                this.availableCount--;
                this.lockStatus = 'LOCKED';
                window.uiController.logSystem(`[MUTEX HANDOVER] Lock for ${this.name} granted to waiting Process ${nextPID}`, 'lock');
                
                // Wake up process state from WAITING to READY
                const proc = window.processManager.getProcess(nextPID);
                if (proc && proc.state === 'WAITING') {
                    proc.state = 'READY';
                }
            } else {
                this.lockStatus = 'FREE';
            }
            return true;
        }
        return false;
    }
}

class SynchronizationEngine {
    constructor() {
        this.syncResources = {
            'ICU': new SyncResource('ICU', 'ICU Bed Unit', 1),
            'Ventilator': new SyncResource('Ventilator', 'Ventilator System', 1),
            'MRI': new SyncResource('MRI', 'MRI Scanner Suite', 1),
            'OR': new SyncResource('OR', 'Operating Room Suite', 1)
        };
    }

    requestResource(resourceKey, pid) {
        if (!this.syncResources[resourceKey]) return true;
        return this.syncResources[resourceKey].acquire(pid);
    }

    releaseResourceByPID(pid) {
        Object.values(this.syncResources).forEach(res => {
            if (res.holderPID === pid) {
                res.release(pid);
            }
            // Remove from waiting queue if present
            const idx = res.waitingQueue.indexOf(pid);
            if (idx !== -1) {
                res.waitingQueue.splice(idx, 1);
            }
        });
    }

    isHolder(resourceKey, pid) {
        const res = this.syncResources[resourceKey];
        return res ? res.holderPID === pid : false;
    }

    reset() {
        this.syncResources = {
            'ICU': new SyncResource('ICU', 'ICU Bed Unit', 1),
            'Ventilator': new SyncResource('Ventilator', 'Ventilator System', 1),
            'MRI': new SyncResource('MRI', 'MRI Scanner Suite', 1),
            'OR': new SyncResource('OR', 'Operating Room Suite', 1)
        };
    }
}

// Global Synchronization Engine instance
window.syncEngine = new SynchronizationEngine();
