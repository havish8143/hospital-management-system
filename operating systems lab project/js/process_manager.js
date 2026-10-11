/* ==========================================================================
   PROCESS MANAGER & PROCESS CONTROL BLOCK (PCB)
   OS Concept: Process Management, State Transitions, Process Control Blocks
   ========================================================================== */

class PCB {
    constructor(pid, name, priority, burstTime, memoryRequired = 64, resourceClaim = 'none') {
        this.pid = pid; // Process ID (e.g. P101)
        this.name = name; // Patient / Case Description
        this.priority = parseInt(priority); // Priority 1 (Highest) to 4 (Lowest)
        this.burstTime = parseInt(burstTime); // Total CPU time required
        this.remainingTime = parseInt(burstTime); // Remaining CPU time
        this.memoryRequired = parseInt(memoryRequired); // KB required
        this.resourceClaim = resourceClaim; // Resource needed e.g., 'ICU', 'Ventilator', 'MRI', 'OR', 'none'
        
        // State Machine: NEW, READY, RUNNING, WAITING, TERMINATED
        this.state = 'NEW'; 
        
        // Accounting Metrics
        this.arrivalTime = 0;
        this.startTime = -1;
        this.completionTime = 0;
        this.waitTime = 0;
        this.turnaroundTime = 0;

        // Aging counter for starvation prevention
        this.age = 0;

        // Color tag based on Priority
        this.color = this.assignColor(this.priority);
    }

    assignColor(prio) {
        switch(prio) {
            case 1: return '#ff4757'; // Emergency Red
            case 2: return '#ffa502'; // Urgent Amber
            case 3: return '#00d2d3'; // General Cyan
            case 4: return '#2ed573'; // Routine Green
            default: return '#00f2fe';
        }
    }

    getCategoryName() {
        switch(this.priority) {
            case 1: return 'Emergency Trauma';
            case 2: return 'Urgent Surgery';
            case 3: return 'General Ward';
            case 4: return 'Routine Checkup';
            default: return 'Standard Case';
        }
    }
}

class ProcessManager {
    constructor() {
        this.processes = [];
        this.nextPidCounter = 101;
    }

    createProcess(name, priority, burstTime, memoryRequired, resourceClaim) {
        const pid = `P${this.nextPidCounter++}`;
        const proc = new PCB(pid, name, priority, burstTime, memoryRequired, resourceClaim);
        this.processes.push(proc);
        return proc;
    }

    getProcess(pid) {
        return this.processes.find(p => p.pid === pid);
    }

    getAllProcesses() {
        return this.processes;
    }

    getProcessesByState(state) {
        return this.processes.filter(p => p.state === state);
    }

    resetAll() {
        this.processes = [];
        this.nextPidCounter = 101;
    }
}

// Global Process Manager instance
window.processManager = new ProcessManager();
