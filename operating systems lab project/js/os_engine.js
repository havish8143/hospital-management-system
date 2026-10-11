/* ==========================================================================
   OS SIMULATION CENTRAL ENGINE
   Manages Global Clock Ticks, Event Dispatching, Preset Scenarios Loader
   ========================================================================== */

class OSEngine {
    constructor() {
        this.isRunning = false;
        this.tickCounter = 0;
        this.tickSpeedMs = 800;
        this.timerInterval = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        window.uiController.updateStatusUI('RUNNING');

        this.timerInterval = setInterval(() => {
            this.executeClockTick();
        }, this.tickSpeedMs);

        window.uiController.logSystem('[SIMULATION STARTED] Clock ticks active.', 'system');
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        window.uiController.updateStatusUI('PAUSED');
        window.uiController.logSystem('[SIMULATION PAUSED] Clock ticks suspended.', 'system');
    }

    step() {
        this.pause();
        this.executeClockTick();
        window.uiController.logSystem(`[SIMULATION STEP] Executed Tick ${this.tickCounter}`, 'system');
    }

    setSpeed(speedMs) {
        this.tickSpeedMs = parseInt(speedMs);
        if (this.isRunning) {
            this.pause();
            this.start();
        }
    }

    executeClockTick() {
        this.tickCounter++;
        
        // 1. Get processes from ProcessManager
        const allProcs = window.processManager.getAllProcesses();

        // 2. Identify READY processes that can be scheduled
        const readyQueue = [];
        allProcs.forEach(proc => {
            if (proc.state === 'NEW') {
                // Try memory allocation first
                const allocSuccess = window.memoryManager.allocateMemory(proc.pid, proc.name, proc.memoryRequired);
                if (allocSuccess) {
                    proc.state = 'READY';
                }
            }

            if (proc.state === 'READY' || proc.state === 'RUNNING') {
                // Check resource lock requirement
                if (proc.resourceClaim && proc.resourceClaim !== 'none') {
                    const lockGranted = window.syncEngine.requestResource(proc.resourceClaim, proc.pid);
                    if (lockGranted) {
                        readyQueue.push(proc);
                    } else {
                        proc.state = 'WAITING';
                    }
                } else {
                    readyQueue.push(proc);
                }
            }
        });

        // 3. Delegate to CPU Scheduler for tick execution
        window.cpuScheduler.scheduleNext(this.tickCounter, readyQueue, window.processManager);

        // 4. Update UI Renderings across all tabs
        window.uiController.renderAll();
    }

    loadPreset(presetKey) {
        this.pause();
        window.processManager.resetAll();
        window.cpuScheduler.reset();
        window.bankerRAG.resources = {
            'ICU': { total: 3, available: 3 },
            'Ventilator': { total: 2, available: 2 },
            'MRI': { total: 2, available: 2 },
            'OR': { total: 2, available: 2 }
        };
        window.syncEngine.reset();
        window.memoryManager.reset();
        this.tickCounter = 0;

        if (presetKey === 'default') {
            window.processManager.createProcess('Cardiac Emergency', 1, 6, 128, 'ICU');
            window.processManager.createProcess('Appendectomy Surgery', 2, 5, 96, 'OR');
            window.processManager.createProcess('Brain MRI Scan', 3, 4, 64, 'MRI');
            window.processManager.createProcess('Routine Blood Test', 4, 3, 32, 'none');
            window.uiController.logSystem('[PRESET LOADED] Balanced ER Load (P1, P2, P3, P4 cases added)', 'system');

        } else if (presetKey === 'mass_casualty') {
            window.cpuScheduler.setAlgorithm('priority_p');
            document.getElementById('algo-select').value = 'priority_p';
            
            window.processManager.createProcess('Minor Wound Care', 4, 8, 32, 'none');
            window.processManager.createProcess('Trauma - Car Crash 1', 1, 5, 128, 'ICU');
            window.processManager.createProcess('Trauma - Car Crash 2', 1, 4, 128, 'Ventilator');
            window.processManager.createProcess('Severe Burn Case', 1, 6, 96, 'OR');
            window.uiController.logSystem('[PRESET LOADED] Mass Casualty Incident (Preemptive Priority Preemption active)', 'system');

        } else if (presetKey === 'deadlock_risk') {
            // Setup processes requesting multiple overlapping resources
            const p1 = window.processManager.createProcess('Organ Transplant (P101)', 1, 8, 128, 'OR');
            const p2 = window.processManager.createProcess('High Risk ICU (P102)', 2, 7, 96, 'Ventilator');
            
            window.uiController.logSystem('[PRESET LOADED] Resource Contention (Simulates multi-resource lock deadlock risk)', 'system');

        } else if (presetKey === 'memory_stress') {
            window.processManager.createProcess('Full Body CT Scan Buffer', 2, 6, 256, 'MRI');
            window.processManager.createProcess('DNA Sequencing Buffer', 3, 7, 256, 'none');
            window.processManager.createProcess('Lab Pathology Database', 3, 8, 256, 'none');
            window.processManager.createProcess('Real-time ICU Telemetry', 1, 5, 128, 'ICU');

            // Trigger several page requests to generate hits & page faults
            window.memoryManager.accessPage(1);
            window.memoryManager.accessPage(2);
            window.memoryManager.accessPage(3);
            window.memoryManager.accessPage(4);
            window.memoryManager.accessPage(5);

            window.uiController.logSystem('[PRESET LOADED] Heavy Paging & Memory Pressure (Page replacement active)', 'system');
        }

        window.uiController.renderAll();
    }

    reset() {
        this.pause();
        window.processManager.resetAll();
        window.cpuScheduler.reset();
        window.bankerRAG.resources = {
            'ICU': { total: 3, available: 3 },
            'Ventilator': { total: 2, available: 2 },
            'MRI': { total: 2, available: 2 },
            'OR': { total: 2, available: 2 }
        };
        window.syncEngine.reset();
        window.memoryManager.reset();
        this.tickCounter = 0;
        window.uiController.logSystem('[SIMULATION RESET] All queues and registers cleared.', 'system');
        window.uiController.renderAll();
    }
}

// Global OS Engine Instance
window.osEngine = new OSEngine();
