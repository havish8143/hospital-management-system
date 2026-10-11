/* ==========================================================================
   MEMORY MANAGEMENT & VIRTUAL PAGING SIMULATOR
   OS Concept: Memory Partitioning (First-Fit, Best-Fit, Worst-Fit), Virtual Paging (LRU/FIFO)
   ========================================================================== */

class MemoryManager {
    constructor() {
        this.totalMemory = 1024; // KB
        this.allocationPolicy = 'first_fit'; // 'first_fit', 'best_fit', 'worst_fit'
        
        // Initial Memory Map with continuous free block
        this.memoryBlocks = [
            { id: 'block-0', start: 0, size: 1024, isAllocated: false, pid: null, procName: 'Free Space' }
        ];

        // Paging System Simulation
        this.pageReplacementAlgo = 'lru'; // 'lru', 'fifo'
        this.pageFrames = [
            { frameId: 0, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 1, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 2, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 3, pageNum: null, lastAccess: -1, loadTime: -1 }
        ];

        this.pageHits = 0;
        this.pageFaults = 0;
        this.accessCounter = 0;
    }

    allocateMemory(pid, procName, sizeKB) {
        // Find suitable block based on allocation policy
        let candidateIdx = -1;

        const freeBlocks = [];
        this.memoryBlocks.forEach((blk, idx) => {
            if (!blk.isAllocated && blk.size >= sizeKB) {
                freeBlocks.push({ idx: idx, block: blk });
            }
        });

        if (freeBlocks.length === 0) {
            window.uiController.logSystem(`[MEMORY ERROR] Out of Memory! Cannot allocate ${sizeKB}KB for ${pid}`, 'memory');
            return false;
        }

        if (this.allocationPolicy === 'first_fit') {
            candidateIdx = freeBlocks[0].idx;
        } else if (this.allocationPolicy === 'best_fit') {
            freeBlocks.sort((a, b) => a.block.size - b.block.size);
            candidateIdx = freeBlocks[0].idx;
        } else if (this.allocationPolicy === 'worst_fit') {
            freeBlocks.sort((a, b) => b.block.size - a.block.size);
            candidateIdx = freeBlocks[0].idx;
        }

        const targetBlock = this.memoryBlocks[candidateIdx];
        const remainingSize = targetBlock.size - sizeKB;

        // Allocate block
        targetBlock.isAllocated = true;
        targetBlock.pid = pid;
        targetBlock.procName = procName;
        targetBlock.size = sizeKB;

        // Insert remaining free block if size > 0
        if (remainingSize > 0) {
            const newFreeBlock = {
                id: `block-${Date.now()}`,
                start: targetBlock.start + sizeKB,
                size: remainingSize,
                isAllocated: false,
                pid: null,
                procName: 'Free Space'
            };
            this.memoryBlocks.splice(candidateIdx + 1, 0, newFreeBlock);
        }

        window.uiController.logSystem(`[MEMORY ALLOCATED] ${sizeKB}KB assigned to ${pid} using ${this.allocationPolicy.toUpperCase()}`, 'memory');
        return true;
    }

    deallocateMemory(pid) {
        let freed = false;
        this.memoryBlocks.forEach(blk => {
            if (blk.pid === pid) {
                blk.isAllocated = false;
                blk.pid = null;
                blk.procName = 'Free Space';
                freed = true;
            }
        });

        if (freed) {
            this.mergeAdjacentFreeBlocks();
            window.uiController.logSystem(`[MEMORY RECLAIMED] Memory freed for discharged process ${pid}`, 'memory');
        }
    }

    mergeAdjacentFreeBlocks() {
        for (let i = 0; i < this.memoryBlocks.length - 1; i++) {
            const curr = this.memoryBlocks[i];
            const next = this.memoryBlocks[i + 1];

            if (!curr.isAllocated && !next.isAllocated) {
                curr.size += next.size;
                this.memoryBlocks.splice(i + 1, 1);
                i--; // recheck same index
            }
        }
    }

    /**
     * Virtual Memory Paging Access Simulation
     */
    accessPage(pageNum) {
        this.accessCounter++;
        const pNum = parseInt(pageNum);

        // Check if page already resides in a frame (Page Hit)
        const hitFrame = this.pageFrames.find(f => f.pageNum === pNum);

        if (hitFrame) {
            this.pageHits++;
            hitFrame.lastAccess = this.accessCounter;
            return { hit: true, frameId: hitFrame.frameId, message: `PAGE HIT! Page #${pNum} found in Frame ${hitFrame.frameId}` };
        }

        // Page Fault occurs
        this.pageFaults++;

        // 1. Look for empty frame first
        const emptyFrame = this.pageFrames.find(f => f.pageNum === null);
        if (emptyFrame) {
            emptyFrame.pageNum = pNum;
            emptyFrame.lastAccess = this.accessCounter;
            emptyFrame.loadTime = this.accessCounter;
            return { hit: false, frameId: emptyFrame.frameId, message: `PAGE FAULT! Loaded Page #${pNum} into empty Frame ${emptyFrame.frameId}` };
        }

        // 2. Frame replacement needed (LRU or FIFO)
        let victimFrame = null;
        if (this.pageReplacementAlgo === 'lru') {
            // Pick frame with smallest lastAccess counter
            this.pageFrames.sort((a, b) => a.lastAccess - b.lastAccess);
            victimFrame = this.pageFrames[0];
        } else {
            // FIFO: Pick frame with smallest loadTime
            this.pageFrames.sort((a, b) => a.loadTime - b.loadTime);
            victimFrame = this.pageFrames[0];
        }

        const oldPage = victimFrame.pageNum;
        victimFrame.pageNum = pNum;
        victimFrame.lastAccess = this.accessCounter;
        victimFrame.loadTime = this.accessCounter;

        // Restore frame ID sorting order
        this.pageFrames.sort((a, b) => a.frameId - b.frameId);

        return { hit: false, frameId: victimFrame.frameId, message: `PAGE FAULT & REPLACEMENT! Evicted Page #${oldPage} from Frame ${victimFrame.frameId} ➔ Loaded Page #${pNum}` };
    }

    getStats() {
        let used = 0;
        this.memoryBlocks.forEach(b => { if (b.isAllocated) used += b.size; });
        const free = this.totalMemory - used;
        
        // External fragmentation = sum of free blocks smaller than 64KB
        let extFrag = 0;
        this.memoryBlocks.forEach(b => { if (!b.isAllocated && b.size < 64) extFrag += b.size; });

        return { total: this.totalMemory, used: used, free: free, extFrag: extFrag };
    }

    reset() {
        this.memoryBlocks = [
            { id: 'block-0', start: 0, size: 1024, isAllocated: false, pid: null, procName: 'Free Space' }
        ];
        this.pageFrames = [
            { frameId: 0, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 1, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 2, pageNum: null, lastAccess: -1, loadTime: -1 },
            { frameId: 3, pageNum: null, lastAccess: -1, loadTime: -1 }
        ];
        this.pageHits = 0;
        this.pageFaults = 0;
        this.accessCounter = 0;
    }
}

// Global Memory Manager Instance
window.memoryManager = new MemoryManager();
