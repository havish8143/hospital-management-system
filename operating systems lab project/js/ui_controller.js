/* ==========================================================================
   UI CONTROLLER MODULE
   DOM Binding, Event Listeners, Tab Switching, Table & Canvas Rendering
   ========================================================================== */

class UIController {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
            window.osEngine.loadPreset('default');
        });
    }

    bindEvents() {
        // 1. Simulation Control Buttons
        document.getElementById('btn-play').addEventListener('click', () => window.osEngine.start());
        document.getElementById('btn-pause').addEventListener('click', () => window.osEngine.pause());
        document.getElementById('btn-step').addEventListener('click', () => window.osEngine.step());
        document.getElementById('btn-reset').addEventListener('click', () => window.osEngine.reset());

        // Speed Range
        const speedRange = document.getElementById('speed-range');
        speedRange.addEventListener('input', (e) => {
            const speed = e.target.value;
            document.getElementById('speed-val').textContent = `${(speed / 1000).toFixed(1)}s/tick`;
            window.osEngine.setSpeed(speed);
        });

        // Algorithm Selector
        document.getElementById('algo-select').addEventListener('change', (e) => {
            window.cpuScheduler.setAlgorithm(e.target.value);
            this.logSystem(`[SCHEDULER ALGORITHM CHANGED] Switched to ${e.target.value.toUpperCase()}`, 'schedule');
            this.renderAll();
        });

        // Preset Selector
        document.getElementById('preset-select').addEventListener('change', (e) => {
            window.osEngine.loadPreset(e.target.value);
        });

        // Navigation Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
                
                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                document.getElementById(targetTab).classList.add('active');

                if (targetTab === 'tab-deadlock') {
                    this.renderRAGCanvas();
                }
            });
        });

        // Modal Form Handling
        const modal = document.getElementById('add-patient-modal');
        document.getElementById('btn-add-patient').addEventListener('click', () => modal.classList.add('active'));
        document.getElementById('modal-close-btn').addEventListener('click', () => modal.classList.remove('active'));
        document.getElementById('modal-cancel-btn').addEventListener('click', () => modal.classList.remove('active'));

        document.getElementById('add-patient-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('input-patient-name').value;
            const priority = parseInt(document.getElementById('input-priority').value);
            const burst = parseInt(document.getElementById('input-burst').value);
            const memory = parseInt(document.getElementById('input-memory').value);
            const resource = document.getElementById('input-resource').value;

            const proc = window.processManager.createProcess(name, priority, burst, memory, resource);
            this.logSystem(`[NEW PROCESS ENQUEUED] ${proc.pid} (${proc.name}) registered with Priority P${proc.priority}`, 'system');
            
            modal.classList.remove('active');
            document.getElementById('add-patient-form').reset();
            this.renderAll();
        });

        // Banker Safety Check Button
        document.getElementById('btn-check-safety').addEventListener('click', () => {
            const res = window.bankerRAG.checkSafetyState(window.processManager.getAllProcesses());
            this.renderSafetyResult(res);
        });

        // Deadlock Detect Button
        document.getElementById('btn-detect-deadlock').addEventListener('click', () => {
            const res = window.bankerRAG.checkSafetyState(window.processManager.getAllProcesses());
            const banner = document.getElementById('rag-detection-banner');
            if (res.safe) {
                banner.className = 'rag-banner alert-success';
                document.getElementById('rag-status-text').innerHTML = '<i class="fa-solid fa-circle-check"></i> RAG Status: Normal - No Deadlock Cycles Detected';
            } else {
                banner.className = 'rag-banner alert-danger';
                document.getElementById('rag-status-text').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> RAG Status: DEADLOCK CYCLE DETECTED! Resource Contention Blocking Execution';
            }
        });

        // Paging Simulator Access Button
        document.getElementById('btn-request-page').addEventListener('click', () => {
            const input = document.getElementById('page-req-input');
            const pageNum = input.value;
            if (pageNum !== '') {
                const res = window.memoryManager.accessPage(pageNum);
                document.getElementById('page-request-log').textContent = res.message;
                this.renderMemory();
            }
        });

        // Memory Fit Policy Selector
        document.getElementById('mem-algo-select').addEventListener('change', (e) => {
            window.memoryManager.allocationPolicy = e.target.value;
            this.logSystem(`[MEMORY POLICY CHANGED] Switched to ${e.target.value.toUpperCase()}`, 'memory');
            this.renderMemory();
        });

        // Clear Log
        document.getElementById('btn-clear-log').addEventListener('click', () => {
            document.getElementById('os-log-container').innerHTML = '';
        });
    }

    updateStatusUI(state) {
        const ind = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        const btnPlay = document.getElementById('btn-play');
        const btnPause = document.getElementById('btn-pause');

        if (state === 'RUNNING') {
            ind.classList.add('running');
            text.textContent = 'RUNNING';
            btnPlay.disabled = true;
            btnPause.disabled = false;
        } else {
            ind.classList.remove('running');
            text.textContent = 'PAUSED';
            btnPlay.disabled = false;
            btnPause.disabled = true;
        }
    }

    logSystem(message, category = 'system') {
        const container = document.getElementById('os-log-container');
        if (!container) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${category}`;
        entry.innerHTML = `<span style="color:#64748b;">[T+${window.osEngine.tickCounter}s]</span> ${message}`;
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    }

    renderAll() {
        document.getElementById('tick-counter').textContent = window.osEngine.tickCounter;
        this.renderPCBTable();
        this.renderCPUDisplay();
        this.renderGanttChart();
        this.renderBankerMatrices();
        this.renderRAGCanvas();
        this.renderSynchronization();
        this.renderMemory();
        this.renderAnalytics();
    }

    renderPCBTable() {
        const tbody = document.getElementById('pcb-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const procs = window.processManager.getAllProcesses();
        if (procs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#64748b;">No processes in queue. Click "New Patient" or select a preset.</td></tr>`;
            return;
        }

        procs.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.pid}</strong></td>
                <td>${p.name}</td>
                <td><span class="badge-priority P${p.priority}">${p.getCategoryName()}</span></td>
                <td>P${p.priority}</td>
                <td><span class="badge-state ${p.state}">${p.state}</span></td>
                <td>${p.burstTime}s</td>
                <td>${p.remainingTime}s</td>
                <td>${p.memoryRequired} KB</td>
                <td>${p.resourceClaim !== 'none' ? `<span style="color:#00d2d3;">${p.resourceClaim}</span>` : 'None'}</td>
                <td>
                    ${p.state !== 'TERMINATED' ? `<button class="btn-text-sm" onclick="uiController.removeProcess('${p.pid}')"><i class="fa-solid fa-xmark"></i></button>` : '—'}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // State machine counters
        document.getElementById('cnt-new').textContent = procs.filter(p => p.state === 'NEW').length;
        document.getElementById('cnt-ready').textContent = procs.filter(p => p.state === 'READY').length;
        document.getElementById('cnt-running').textContent = procs.filter(p => p.state === 'RUNNING').length;
        document.getElementById('cnt-waiting').textContent = procs.filter(p => p.state === 'WAITING').length;
        document.getElementById('cnt-terminated').textContent = procs.filter(p => p.state === 'TERMINATED').length;
    }

    removeProcess(pid) {
        const p = window.processManager.getProcess(pid);
        if (p) {
            p.state = 'TERMINATED';
            window.syncEngine.releaseResourceByPID(pid);
            window.memoryManager.deallocateMemory(pid);
            this.logSystem(`[PROCESS TERMINATED] ${pid} removed manually`, 'system');
            this.renderAll();
        }
    }

    renderCPUDisplay() {
        const container = document.getElementById('cpu-current-process');
        const running = window.cpuScheduler.runningProcess;

        if (running && running.state === 'RUNNING') {
            container.innerHTML = `
                <div class="cpu-running-proc">
                    <div>
                        <span class="badge-priority P${running.priority}" style="margin-right:8px;">P${running.priority}</span>
                        <strong style="font-size:1.1rem;">${running.pid}: ${running.name}</strong>
                    </div>
                    <div>
                        <span style="font-family:var(--font-mono); color:var(--primary); font-size:1.1rem; font-weight:700;">${running.remainingTime}s remaining</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `<span class="idle-text">IDLE - CPU Ready Queue Empty</span>`;
        }

        // Live CPU metrics
        const totalTicks = Math.max(1, window.osEngine.tickCounter);
        const busyTicks = window.cpuScheduler.totalBusyTicks;
        const util = Math.round((busyTicks / totalTicks) * 100);

        document.getElementById('cpu-util-val').textContent = `${util}%`;
        document.getElementById('cpu-cs-val').textContent = window.cpuScheduler.contextSwitches;
    }

    renderGanttChart() {
        const container = document.getElementById('gantt-timeline');
        if (!container) return;
        container.innerHTML = '';

        const history = window.cpuScheduler.ganttHistory;
        if (history.length === 0) {
            container.innerHTML = `<div class="gantt-empty">No simulation ticks recorded yet.</div>`;
            return;
        }

        history.forEach(block => {
            const div = document.createElement('div');
            div.className = `gantt-block ${block.pid === 'IDLE' ? 'idle' : ''}`;
            div.style.backgroundColor = block.color;
            div.style.flex = block.duration;
            div.title = `${block.pid} (${block.name}): ${block.startTick}s - ${block.endTick}s`;
            div.innerHTML = `
                <span>${block.pid}</span>
                <span style="font-size:0.65rem; opacity:0.8;">${block.duration}s</span>
            `;
            container.appendChild(div);
        });
    }

    renderBankerMatrices() {
        const availContainer = document.getElementById('banker-available-res');
        if (!availContainer) return;
        availContainer.innerHTML = '';

        Object.entries(window.bankerRAG.resources).forEach(([key, res]) => {
            const div = document.createElement('div');
            div.className = 'res-chip';
            div.innerHTML = `${key}: <strong style="color:var(--primary);">${res.available}</strong> / ${res.total}`;
            availContainer.appendChild(div);
        });

        const activeProcs = window.processManager.getAllProcesses().filter(p => p.state !== 'TERMINATED');

        // Render Alloc, Max, Need tables
        this.renderMatrixTable('matrix-allocation-container', activeProcs, p => window.bankerRAG.getProcessAllocation(p));
        this.renderMatrixTable('matrix-max-container', activeProcs, p => window.bankerRAG.getProcessMax(p));
        this.renderMatrixTable('matrix-need-container', activeProcs, p => window.bankerRAG.getProcessNeed(p));
    }

    renderMatrixTable(containerId, processes, dataGetter) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (processes.length === 0) {
            container.innerHTML = '<span style="font-size:0.78rem; color:#64748b;">No active processes</span>';
            return;
        }

        const resKeys = window.bankerRAG.resourceKeys;
        let html = `<table class="matrix-table"><thead><tr><th>PID</th>`;
        resKeys.forEach(k => html += `<th>${k}</th>`);
        html += `</tr></thead><tbody>`;

        processes.forEach(p => {
            const rowData = dataGetter(p);
            html += `<tr><td><strong>${p.pid}</strong></td>`;
            resKeys.forEach(k => {
                html += `<td>${rowData[k] || 0}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    renderSafetyResult(res) {
        const panel = document.getElementById('safety-result');
        if (!panel) return;
        if (res.safe) {
            panel.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> ${res.message}</div>`;
        } else {
            panel.innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${res.message}</div>`;
        }
    }

    renderRAGCanvas() {
        const canvas = document.getElementById('rag-canvas');
        if (canvas) {
            window.bankerRAG.drawRAGCanvas(canvas, window.processManager.getAllProcesses());
        }
    }

    renderSynchronization() {
        const container = document.getElementById('sync-resources-grid');
        if (!container) return;
        container.innerHTML = '';

        Object.values(window.syncEngine.syncResources).forEach(res => {
            const card = document.createElement('div');
            card.className = `sync-card ${res.lockStatus === 'LOCKED' ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="sync-card-header">
                    <span class="sync-title"><i class="fa-solid fa-microchip"></i> ${res.name}</span>
                    <span class="lock-badge ${res.lockStatus === 'LOCKED' ? 'locked' : 'free'}">${res.lockStatus}</span>
                </div>
                <div class="sync-holder">
                    Holder Thread: <strong>${res.holderPID ? res.holderPID : 'None (Available)'}</strong>
                </div>
                <div class="sync-wait-queue">
                    Waiting Queue (${res.waitingQueue.length}): 
                    ${res.waitingQueue.length > 0 ? res.waitingQueue.map(pid => `<span class="badge-state WAITING">${pid}</span>`).join(' ') : '<span style="color:#64748b;">Empty</span>'}
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderMemory() {
        const stats = window.memoryManager.getStats();
        document.getElementById('mem-used-val').textContent = `${stats.used} KB`;
        document.getElementById('mem-free-val').textContent = `${stats.free} KB`;
        document.getElementById('mem-frag-val').textContent = `${stats.extFrag} KB`;

        // Render Memory Map Bar
        const bar = document.getElementById('memory-map-bar');
        if (bar) {
            bar.innerHTML = '';
            window.memoryManager.memoryBlocks.forEach(blk => {
                const div = document.createElement('div');
                div.className = `mem-block ${blk.isAllocated ? 'allocated' : 'free'}`;
                div.style.flex = blk.size;
                div.title = `${blk.procName} (${blk.size} KB)`;
                div.innerHTML = `
                    <span>${blk.isAllocated ? blk.pid : 'FREE'}</span>
                    <span style="font-size:0.65rem;">${blk.size}KB</span>
                `;
                bar.appendChild(div);
            });
        }

        // Render Paging Frames
        const framesContainer = document.getElementById('page-frames-container');
        if (framesContainer) {
            framesContainer.innerHTML = '';
            window.memoryManager.pageFrames.forEach(f => {
                const card = document.createElement('div');
                card.className = `page-frame-card ${f.pageNum !== null ? 'active' : ''}`;
                card.innerHTML = `
                    <div style="font-size:0.75rem; color:#94a3b8;">Frame #${f.frameId}</div>
                    <div style="font-size:1.1rem; font-weight:700; color:var(--primary); margin:4px 0;">${f.pageNum !== null ? `Page #${f.pageNum}` : 'EMPTY'}</div>
                    <div style="font-size:0.65rem; color:#64748b;">Last Acc: ${f.lastAccess > 0 ? f.lastAccess : '—'}</div>
                `;
                framesContainer.appendChild(card);
            });
        }

        // Paging stats
        const hits = window.memoryManager.pageHits;
        const faults = window.memoryManager.pageFaults;
        const totalAcc = hits + faults;
        const ratio = totalAcc > 0 ? Math.round((hits / totalAcc) * 100) : 100;

        document.getElementById('page-hits-val').textContent = hits;
        document.getElementById('page-faults-val').textContent = faults;
        document.getElementById('page-ratio-val').textContent = `${ratio}%`;
    }

    renderAnalytics() {
        const procs = window.processManager.getAllProcesses().filter(p => p.state === 'TERMINATED');
        if (procs.length === 0) {
            document.getElementById('stat-avg-wait').textContent = '0.00 s';
            document.getElementById('stat-avg-turnaround').textContent = '0.00 s';
            document.getElementById('stat-throughput').textContent = '0.00 proc/min';
            return;
        }

        const totalWait = procs.reduce((acc, p) => acc + p.waitTime, 0);
        const totalTurnaround = procs.reduce((acc, p) => acc + p.turnaroundTime, 0);
        const avgWait = (totalWait / procs.length).toFixed(2);
        const avgTurnaround = (totalTurnaround / procs.length).toFixed(2);

        const totalTicks = Math.max(1, window.osEngine.tickCounter);
        const throughput = ((procs.length / totalTicks) * 60).toFixed(2);

        document.getElementById('stat-avg-wait').textContent = `${avgWait} s`;
        document.getElementById('stat-avg-turnaround').textContent = `${avgTurnaround} s`;
        document.getElementById('stat-throughput').textContent = `${throughput} proc/min`;
    }
}

// Global UI Controller Instance
window.uiController = new UIController();
