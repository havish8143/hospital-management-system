/* ==========================================================================
   CPU & PRIORITY SCHEDULER ENGINE
   OS Concept: CPU Scheduling, Preemptive Priority, Round Robin, SJF, FCFS
   ========================================================================== */

class CPUScheduler {
    constructor() {
        this.algorithm = 'priority_p'; // 'priority_p', 'rr', 'sjf', 'fcfs'
        this.timeQuantum = 2; // for Round Robin
        this.rrTickCounter = 0;
        
        this.runningProcess = null;
        this.ganttHistory = []; // { pid, name, priority, color, startTick, endTick }
        this.contextSwitches = 0;
        this.totalBusyTicks = 0;
    }

    setAlgorithm(algo) {
        this.algorithm = algo;
        this.rrTickCounter = 0;
    }

    /**
     * Main Scheduler Step function invoked on each global OS tick.
     * Evaluates ready queue, handles preemption, context switching, and updates execution metrics.
     */
    scheduleNext(currentTick, readyQueue, processManager) {
        // 1. Aging Mechanism: Prevent starvation for low-priority processes waiting in READY state
        readyQueue.forEach(proc => {
            proc.age++;
            // If waiting for > 10 ticks, temporarily boost effective priority
            if (proc.age > 10 && proc.priority > 1) {
                proc.effectivePriority = Math.max(1, proc.priority - 1);
            } else {
                proc.effectivePriority = proc.priority;
            }
        });

        // 2. Select next process according to chosen scheduling algorithm
        let selectedProc = null;

        if (readyQueue.length > 0) {
            if (this.algorithm === 'priority_p') {
                // Preemptive Priority: Lowest numerical priority value = highest priority
                readyQueue.sort((a, b) => {
                    const prioA = a.effectivePriority !== undefined ? a.effectivePriority : a.priority;
                    const priob = b.effectivePriority !== undefined ? b.effectivePriority : b.priority;
                    if (prioA !== priob) return prioA - priob;
                    return a.pid.localeCompare(b.pid); // tie-breaker by PID
                });
                selectedProc = readyQueue[0];

            } else if (this.algorithm === 'sjf') {
                // Shortest Job First (Preemptive / Shortest Remaining Time)
                readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
                selectedProc = readyQueue[0];

            } else if (this.algorithm === 'rr') {
                // Round Robin
                if (this.runningProcess && readyQueue.includes(this.runningProcess) && this.rrTickCounter < this.timeQuantum) {
                    selectedProc = this.runningProcess; // continue current quantum
                } else {
                    this.rrTickCounter = 0;
                    selectedProc = readyQueue[0]; // pick next in round robin FIFO queue
                }

            } else if (this.algorithm === 'fcfs') {
                // First Come First Served
                readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime);
                selectedProc = readyQueue[0];
            }
        }

        // 3. Handle Context Switch or Execution Continuation
        if (selectedProc !== this.runningProcess) {
            if (this.runningProcess && this.runningProcess.state === 'RUNNING') {
                // Preempt current running process back to READY state
                this.runningProcess.state = 'READY';
                window.uiController.logSystem(`[PREEMPTION] Process ${this.runningProcess.pid} (${this.runningProcess.name}) preempted by ${selectedProc ? selectedProc.pid : 'IDLE'}`, 'preempt');
            }

            if (selectedProc) {
                this.contextSwitches++;
                this.rrTickCounter = 0;
                selectedProc.state = 'RUNNING';
                if (selectedProc.startTime === -1) {
                    selectedProc.startTime = currentTick;
                }
                window.uiController.logSystem(`[CPU ALLOCATION] ${selectedProc.pid} (${selectedProc.name}) scheduled on CPU Core under ${this.algorithm.toUpperCase()}`, 'schedule');
            }

            this.runningProcess = selectedProc;
        } else if (this.runningProcess) {
            // Process continues running
            this.rrTickCounter++;
        }

        // 4. Execute 1 CPU burst tick if process running
        if (this.runningProcess) {
            this.totalBusyTicks++;
            this.runningProcess.remainingTime--;
            this.runningProcess.age = 0; // reset age on execution

            // Record step in Gantt timeline
            this.recordGanttStep(currentTick, this.runningProcess);

            // Check completion
            if (this.runningProcess.remainingTime <= 0) {
                this.runningProcess.state = 'TERMINATED';
                this.runningProcess.completionTime = currentTick + 1;
                this.runningProcess.turnaroundTime = this.runningProcess.completionTime - this.runningProcess.arrivalTime;
                this.runningProcess.waitTime = this.runningProcess.turnaroundTime - this.runningProcess.burstTime;

                window.uiController.logSystem(`[PROCESS DISCHARGED] ${this.runningProcess.pid} (${this.runningProcess.name}) completed treatment! Wait Time: ${this.runningProcess.waitTime}s, Turnaround: ${this.runningProcess.turnaroundTime}s`, 'system');

                // Release any held locks / resources
                if (window.syncEngine) {
                    window.syncEngine.releaseResourceByPID(this.runningProcess.pid);
                }
                if (window.memoryManager) {
                    window.memoryManager.deallocateMemory(this.runningProcess.pid);
                }

                this.runningProcess = null;
                this.rrTickCounter = 0;
            }
        } else {
            // CPU is IDLE
            this.recordGanttStep(currentTick, null);
        }
    }

    recordGanttStep(tick, proc) {
        const lastBlock = this.ganttHistory[this.ganttHistory.length - 1];
        const pid = proc ? proc.pid : 'IDLE';
        const color = proc ? proc.color : 'rgba(255,255,255,0.05)';
        const priority = proc ? proc.priority : 0;
        const name = proc ? proc.name : 'Idle';

        if (lastBlock && lastBlock.pid === pid) {
            lastBlock.endTick = tick + 1;
            lastBlock.duration = lastBlock.endTick - lastBlock.startTick;
        } else {
            this.ganttHistory.push({
                pid: pid,
                name: name,
                priority: priority,
                color: color,
                startTick: tick,
                endTick: tick + 1,
                duration: 1
            });
        }
    }

    reset() {
        this.runningProcess = null;
        this.ganttHistory = [];
        this.contextSwitches = 0;
        this.totalBusyTicks = 0;
        this.rrTickCounter = 0;
    }
}

// Global CPU Scheduler instance
window.cpuScheduler = new CPUScheduler();
