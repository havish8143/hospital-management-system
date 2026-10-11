/* ==========================================================================
   BANKER'S ALGORITHM & RESOURCE ALLOCATION GRAPH (RAG)
   OS Concept: Deadlock Avoidance (Banker's), Deadlock Detection (RAG Cycle)
   ========================================================================== */

class BankerAndRAG {
    constructor() {
        // System Equipment Resources & Available Counts
        this.resources = {
            'ICU': { total: 3, available: 3 },
            'Ventilator': { total: 2, available: 2 },
            'MRI': { total: 2, available: 2 },
            'OR': { total: 2, available: 2 }
        };

        this.resourceKeys = Object.keys(this.resources);
        this.lastSafetyResult = null;
    }

    /**
     * Executes Banker's Safety Algorithm to verify if granting current allocations
     * leads to a SAFE or UNSAFE state.
     */
    checkSafetyState(processes) {
        const activeProcs = processes.filter(p => p.state !== 'TERMINATED');
        const numProcs = activeProcs.length;
        if (numProcs === 0) {
            return { safe: true, sequence: [], message: 'System is SAFE (No active processes)' };
        }

        // Build Available Vector
        const work = {};
        this.resourceKeys.forEach(res => {
            work[res] = this.resources[res].available;
        });

        // Track finished state of each active process
        const finish = new Array(numProcs).fill(false);
        const safeSeq = [];

        let count = 0;
        let progress = true;

        while (count < numProcs && progress) {
            progress = false;
            for (let i = 0; i < numProcs; i++) {
                if (!finish[i]) {
                    const proc = activeProcs[i];
                    // Calculate process need for requested resource
                    const need = this.getProcessNeed(proc);
                    
                    // Check if Need <= Work for all resource types
                    let canExecute = true;
                    for (const res of this.resourceKeys) {
                        if ((need[res] || 0) > work[res]) {
                            canExecute = false;
                            break;
                        }
                    }

                    if (canExecute) {
                        // Pretend to allocate and finish process
                        const alloc = this.getProcessAllocation(proc);
                        for (const res of this.resourceKeys) {
                            work[res] += (alloc[res] || 0);
                        }
                        finish[i] = true;
                        safeSeq.push(proc.pid);
                        progress = true;
                        count++;
                    }
                }
            }
        }

        if (count === numProcs) {
            this.lastSafetyResult = {
                safe: true,
                sequence: safeSeq,
                message: `System is in a SAFE State! Safe Execution Sequence: <strong style="color:#2ed573;">${safeSeq.join(' ➔ ')}</strong>`
            };
        } else {
            this.lastSafetyResult = {
                safe: false,
                sequence: [],
                message: `<strong style="color:#ff3838;">UNSAFE STATE / DEADLOCK RISK!</strong> System cannot guarantee safe execution completion without resource contention.`
            };
        }

        return this.lastSafetyResult;
    }

    getProcessAllocation(proc) {
        const alloc = { ICU: 0, Ventilator: 0, MRI: 0, OR: 0 };
        if (proc.resourceClaim && proc.resourceClaim !== 'none') {
            if (proc.state === 'RUNNING' || proc.state === 'WAITING' || proc.state === 'READY') {
                // If resource is held
                if (window.syncEngine && window.syncEngine.isHolder(proc.resourceClaim, proc.pid)) {
                    alloc[proc.resourceClaim] = 1;
                }
            }
        }
        return alloc;
    }

    getProcessMax(proc) {
        const max = { ICU: 0, Ventilator: 0, MRI: 0, OR: 0 };
        if (proc.resourceClaim && proc.resourceClaim !== 'none') {
            max[proc.resourceClaim] = 1;
        }
        return max;
    }

    getProcessNeed(proc) {
        const max = this.getProcessMax(proc);
        const alloc = this.getProcessAllocation(proc);
        const need = {};
        this.resourceKeys.forEach(res => {
            need[res] = Math.max(0, max[res] - alloc[res]);
        });
        return need;
    }

    /**
     * RAG Canvas Visual Renderer
     * Renders processes (circles) and resources (squares) with directed edges (arrows).
     */
    drawRAGCanvas(canvas, processes) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const activeProcs = processes.filter(p => p.state !== 'TERMINATED');
        
        // Define node positions
        const procNodes = [];
        const resNodes = [];

        // Position 4 Resource Nodes in a square around center
        const resPositions = [
            { id: 'ICU', x: width * 0.3, y: height * 0.3 },
            { id: 'Ventilator', x: width * 0.7, y: height * 0.3 },
            { id: 'MRI', x: width * 0.3, y: height * 0.7 },
            { id: 'OR', x: width * 0.7, y: height * 0.7 }
        ];

        resPositions.forEach(r => {
            resNodes.push({
                id: r.id,
                x: r.x,
                y: r.y,
                instances: this.resources[r.id].total,
                avail: this.resources[r.id].available
            });
        });

        // Position Process Nodes around outer perimeter
        const numP = activeProcs.length;
        activeProcs.forEach((p, idx) => {
            const angle = (idx / Math.max(1, numP)) * Math.PI * 2;
            const radius = Math.min(width, height) * 0.38;
            const x = width / 2 + Math.cos(angle) * radius;
            const y = height / 2 + Math.sin(angle) * radius;
            procNodes.push({ id: p.pid, name: p.name, x: x, y: y, proc: p });
        });

        // 1. Draw Edges (Allocation & Request)
        procNodes.forEach(pNode => {
            const proc = pNode.proc;
            if (proc.resourceClaim && proc.resourceClaim !== 'none') {
                const rNode = resNodes.find(r => r.id === proc.resourceClaim);
                if (rNode) {
                    const isAllocated = window.syncEngine && window.syncEngine.isHolder(proc.resourceClaim, proc.pid);
                    
                    if (isAllocated) {
                        // Allocation Edge: Resource ➔ Process (Solid Cyan)
                        this.drawArrow(ctx, rNode.x, rNode.y, pNode.x, pNode.y, '#00d2d3', false, 'Allocation');
                    } else if (proc.state === 'WAITING' || proc.state === 'READY') {
                        // Request Edge: Process ➔ Resource (Dashed Orange)
                        this.drawArrow(ctx, pNode.x, pNode.y, rNode.x, rNode.y, '#ffa502', true, 'Request');
                    }
                }
            }
        });

        // 2. Draw Resource Nodes (Squares)
        resNodes.forEach(rNode => {
            ctx.fillStyle = 'rgba(13, 19, 33, 0.9)';
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2;
            const size = 50;
            ctx.fillRect(rNode.x - size/2, rNode.y - size/2, size, size);
            ctx.strokeRect(rNode.x - size/2, rNode.y - size/2, size, size);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(rNode.id, rNode.x, rNode.y - 4);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px JetBrains Mono';
            ctx.fillText(`Avail:${rNode.avail}/${rNode.instances}`, rNode.x, rNode.y + 12);
        });

        // 3. Draw Process Nodes (Circles)
        procNodes.forEach(pNode => {
            ctx.beginPath();
            ctx.arc(pNode.x, pNode.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = pNode.proc.color || '#6c5ce7';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(pNode.id, pNode.x, pNode.y + 4);
        });
    }

    drawArrow(ctx, fromX, fromY, toX, toY, color, dashed = false, label = '') {
        const headlen = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.restore();

        // Arrow head
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// Global Banker & RAG Instance
window.bankerRAG = new BankerAndRAG();
