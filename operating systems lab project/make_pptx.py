import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set slide dimensions to 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    blank_layout = prs.slide_layouts[6]
    
    # Colors
    NAVY = RGBColor(30, 64, 175)     # #1e40af
    DARK_BLUE = RGBColor(15, 23, 42)  # #0f172a
    MUTED = RGBColor(71, 85, 105)    # #475569
    WHITE = RGBColor(255, 255, 255)
    CARD_BG = RGBColor(248, 250, 252)# #f8fafc
    BORDER_COLOR = RGBColor(203, 213, 225)
    ACCENT_BLUE = RGBColor(2, 132, 199)

    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title_text, slide_num_str):
        # Top title
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(10), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = NAVY
        p.font.name = 'Segoe UI'

        # Slide Number Badge
        tb_num = slide.shapes.add_textbox(Inches(11.2), Inches(0.4), Inches(1.3), Inches(0.5))
        tf_num = tb_num.text_frame
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = slide_num_str
        p_num.font.size = Pt(12)
        p_num.font.name = 'Consolas'
        p_num.font.color.rgb = MUTED

        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = BORDER_COLOR
        line.line.color.rgb = BORDER_COLOR

    def add_footer(slide, current_topic="Smart Hospital OS • Overview"):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.733), Inches(0.4))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = f"{current_topic}  |  Havish (24BYB0057) & Shanmukha Simha (24BDE0123)  |  Guide: Dr. PORKODI S"
        p.font.size = Pt(10)
        p.font.color.rgb = MUTED
        p.font.name = 'Segoe UI'

    def add_card(slide, left, top, width, height, title, items, bg_rgb=CARD_BG):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_rgb
        shape.line.color.rgb = BORDER_COLOR
        shape.line.width = Pt(1)

        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)
        tf.margin_bottom = Inches(0.2)

        # Title paragraph
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = NAVY
        p_title.font.name = 'Segoe UI'
        p_title.space_after = Pt(10)

        # Bullet items or text
        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}" if isinstance(items, list) else item
            p.font.size = Pt(13)
            p.font.color.rgb = DARK_BLUE
            p.font.name = 'Segoe UI'
            p.space_after = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, WHITE)

    # Main Card container
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.0), Inches(10.333), Inches(5.5))
    card1.fill.solid()
    card1.fill.fore_color.rgb = CARD_BG
    card1.line.color.rgb = BORDER_COLOR

    tf1 = card1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.5)
    tf1.margin_right = Inches(0.5)
    tf1.margin_top = Inches(0.5)

    p = tf1.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "BCSE303P - OPERATING SYSTEMS LAB MINI PROJECT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    p.font.name = 'Segoe UI'
    p.space_after = Pt(14)

    p2 = tf1.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "Smart Hospital Resource Management System"
    p2.font.size = Pt(28)
    p2.font.bold = True
    p2.font.color.rgb = NAVY
    p2.font.name = 'Segoe UI'
    p2.space_after = Pt(12)

    p3 = tf1.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "An Application-Oriented OS Project Overview Integrating 5 Core OS Concepts"
    p3.font.size = Pt(14)
    p3.font.color.rgb = MUTED
    p3.font.name = 'Segoe UI'
    p3.space_after = Pt(28)

    # Team details box
    p4 = tf1.add_paragraph()
    p4.alignment = PP_ALIGN.CENTER
    p4.text = "PROJECT TEAM MEMBERS"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = DARK_BLUE

    p5 = tf1.add_paragraph()
    p5.alignment = PP_ALIGN.CENTER
    p5.text = "Havish (Reg. No: 24BYB0057)   |   Shanmukha Simha (Reg. No: 24BDE0123)"
    p5.font.size = Pt(15)
    p5.font.bold = True
    p5.font.color.rgb = NAVY
    p5.space_after = Pt(20)

    p6 = tf1.add_paragraph()
    p6.alignment = PP_ALIGN.CENTER
    p6.text = "Under the Guidance of: Dr. PORKODI S (Assistant Professor Senior Grade – 1)"
    p6.font.size = Pt(13)
    p6.font.color.rgb = MUTED

    p7 = tf1.add_paragraph()
    p7.alignment = PP_ALIGN.CENTER
    p7.text = "School of Computer Science Engineering and Information Systems (SCOPE) • Fall 2026"
    p7.font.size = Pt(11)
    p7.font.color.rgb = MUTED

    # -------------------------------------------------------------
    # SLIDE 2: Project Overview & Background
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, WHITE)
    add_header(slide2, "Project Overview & Background Idea", "Slide 02 / 10")
    add_footer(slide2)

    add_card(slide2, 0.8, 1.6, 5.7, 4.9, "Why We Built This Project", [
        "In our OS lab curriculum, concepts like scheduling, mutexes, and deadlocks are typically studied as standalone CLI C programs.",
        "We aimed to design a real-world system where multiple OS concepts work together in one working application.",
        "Instead of abstract numbers, modeling emergency room operations makes OS concepts clear, visual, and practical."
    ])

    add_card(slide2, 6.833, 1.6, 5.7, 4.9, "The Hospital Resource Bottleneck", [
        "Specialized hospital units are strictly limited in capacity (ICU beds, MRI scanners, Ventilators, Surgery Rooms).",
        "Patients arrive randomly with varying urgency levels (P1 Emergency Trauma to P4 Routine Checkup).",
        "Uncoordinated processing leads to long queue delays, machine contention, and surgical deadlocks."
    ])

    # -------------------------------------------------------------
    # SLIDE 3: Hospital Operations mapped to OS Concepts
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, WHITE)
    add_header(slide3, "Real-World Hospital Mapping to OS Concepts", "Slide 03 / 10")
    add_footer(slide3)

    add_card(slide3, 0.8, 1.6, 11.733, 4.9, "5 Integrated Operating System Concepts", [
        "1. Patient Admissions ➔ Process Control Block (PCB): Tracks PID, priority, burst time, RAM demand, and 5-state transitions.",
        "2. Triage Doctor / OR ➔ CPU Priority Scheduling: Preempts running lower-priority tasks when P1 Trauma patients arrive.",
        "3. Shared Medical Equipment ➔ Mutex Locks & Semaphores: Ensures mutual exclusion for ICU Beds, MRI, and Surgery Rooms.",
        "4. Multi-Equipment Surgery Claims ➔ Banker's Safety & RAG: Computes Need = Max - Alloc and detects circular wait deadlocks.",
        "5. Diagnostic Scan Storage ➔ Memory Partitioning & Paging: Manages 1024 KB RAM (First/Best-Fit) and LRU/FIFO virtual page replacement."
    ])

    # -------------------------------------------------------------
    # SLIDE 4: CPU Scheduling Engine
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, WHITE)
    add_header(slide4, "Concept 1: CPU Priority Scheduling & Preemption", "Slide 04 / 10")
    add_footer(slide4)

    add_card(slide4, 0.8, 1.6, 5.7, 4.9, "4 Priority Triage Levels", [
        "P1 - Emergency Trauma (Highest): Cardiac arrest cases. Immediately preempts any running task on the doctor CPU core.",
        "P2 - Urgent Surgery: High priority surgical queue placement.",
        "P3 - General OPD Ward: Standard consultation priority.",
        "P4 - Routine Checkup (Lowest): General routine checkups."
    ])

    add_card(slide4, 6.833, 1.6, 5.7, 4.9, "Preemption & Aging Logic", [
        "Preemptive Context Switching: Saves state of running process back to READY and schedules P1 Trauma immediately.",
        "Starvation Prevention (Aging): Boosts effective priority if a routine P4 case waits longer than 10 ticks in the queue.",
        "Dynamic Gantt Timeline: Logs execution ticks, context switches, and CPU utilization metrics in real-time."
    ])

    # -------------------------------------------------------------
    # SLIDE 5: Process Control Block (PCB)
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, WHITE)
    add_header(slide5, "Concept 2: Process Control Block (PCB) & State Flow", "Slide 05 / 10")
    add_footer(slide5)

    add_card(slide5, 0.8, 1.6, 5.7, 4.9, "PCB Data Structure", [
        "PID: Unique Identifier (e.g., P101, P102)",
        "Priority: Numerical Urgency Level (P1 to P4)",
        "Burst Time: Remaining CPU execution duration",
        "Memory Required: Allocation demand in KB",
        "Resource Claim: Needed equipment (ICU, OR, MRI)",
        "Accounting Metrics: Arrival, Wait, and Turnaround Times"
    ])

    add_card(slide5, 6.833, 1.6, 5.7, 4.9, "5-State Process Machine", [
        "NEW: Patient process created and validated.",
        "READY: Allocated RAM and placed in triage queue.",
        "RUNNING: Scheduled on doctor CPU core.",
        "WAITING: Blocked waiting for an occupied Mutex lock.",
        "TERMINATED / DONE: Treatment complete, memory and resources released."
    ])

    # -------------------------------------------------------------
    # SLIDE 6: Thread Synchronization & Mutexes
    # -------------------------------------------------------------
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, WHITE)
    add_header(slide6, "Concept 3: Thread Synchronization & Mutex Locks", "Slide 06 / 10")
    add_footer(slide6)

    add_card(slide6, 0.8, 1.6, 5.7, 4.9, "Shared Critical Equipment", [
        "ICU Bed Unit Mutex: Single-patient exclusive access.",
        "Ventilator Mutex: Critical respiratory support lock.",
        "MRI Scanner Mutex: Diagnostic imaging suite lock.",
        "Operating Room (OR) Mutex: Surgical unit critical section."
    ])

    add_card(slide6, 6.833, 1.6, 5.7, 4.9, "Preventing Race Conditions", [
        "Mutual Exclusion: Two medical teams cannot book the same MRI scanner simultaneously.",
        "Lock Management: When acquired, status changes to LOCKED.",
        "Waiting List: Any requesting process is moved to WAITING state until the lock holder releases the resource."
    ])

    # -------------------------------------------------------------
    # SLIDE 7: Banker's Algorithm & RAG
    # -------------------------------------------------------------
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, WHITE)
    add_header(slide7, "Concept 4: Banker's Algorithm & RAG Graph", "Slide 07 / 10")
    add_footer(slide7)

    add_card(slide7, 0.8, 1.6, 5.7, 4.9, "Banker's Safety Check", [
        "Multi-Resource Surgeries: Verifies safety before granting combined machine requests.",
        "Matrix Evaluation: Maintains Available, Max, Allocation, and Need (Need = Max - Alloc).",
        "Safe Sequence: Grants claims only if a complete deadlock-free execution order exists."
    ])

    add_card(slide7, 6.833, 1.6, 5.7, 4.9, "Resource Allocation Graph (RAG)", [
        "Canvas Visualizer: Interactive RAG rendered on HTML5 Canvas.",
        "Graph Nodes: Circles = Patient Processes, Squares = Resources.",
        "Graph Edges: Solid arrows = Held Allocation, Dashed = Pending Requests.",
        "Cycle Detection: Built-in cycle detector alerts on circular wait deadlocks."
    ])

    # -------------------------------------------------------------
    # SLIDE 8: Memory Partitioning & Paging
    # -------------------------------------------------------------
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, WHITE)
    add_header(slide8, "Concept 5: Memory Allocation & Virtual Paging", "Slide 08 / 10")
    add_footer(slide8)

    add_card(slide8, 0.8, 1.6, 5.7, 4.9, "Main RAM Partitioning (1024 KB)", [
        "First-Fit: Allocates space in the first suitable free block.",
        "Best-Fit: Minimizes remaining fragment size.",
        "Worst-Fit: Uses the largest available free partition.",
        "Deallocation & Merging: Merges contiguous free spaces upon patient discharge."
    ])

    add_card(slide8, 6.833, 1.6, 5.7, 4.9, "Virtual Memory Paging", [
        "Physical Page Frames: 4 physical frames for loading diagnostic scan pages.",
        "LRU Replacement: Evicts the least recently accessed page upon fault.",
        "FIFO Replacement: Replaces the oldest loaded page.",
        "Performance Metrics: Real-time Page Hits, Page Faults, and Hit Ratio tracking."
    ])

    # -------------------------------------------------------------
    # SLIDE 9: System Architecture & Tech Stack
    # -------------------------------------------------------------
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, WHITE)
    add_header(slide9, "System Architecture & Software Modules", "Slide 09 / 10")
    add_footer(slide9)

    add_card(slide9, 0.8, 1.6, 3.64, 4.9, "Frontend Dashboard", [
        "HTML5 & CSS3 Interface",
        "Responsive Grid Layout",
        "Gantt & RAG Canvas",
        "Terminal Log Console"
    ])

    add_card(slide9, 4.84, 1.6, 3.64, 4.9, "7 Modular JS Engines", [
        "process_manager.js",
        "cpu_scheduler.js",
        "banker_rag.js",
        "synchronization.js",
        "memory_manager.js",
        "os_engine.js & ui_controller.js"
    ])

    add_card(slide9, 8.88, 1.6, 3.64, 4.9, "Live Simulation Engine", [
        "Clock Ticker (0.8s/tick)",
        "Step-by-step Execution",
        "Play / Pause / Reset",
        "Scenario Presets"
    ])

    # -------------------------------------------------------------
    # SLIDE 10: Conclusion & Summary
    # -------------------------------------------------------------
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10, WHITE)
    add_header(slide10, "Conclusion & Key Takeaways", "Slide 10 / 10")
    add_footer(slide10)

    add_card(slide10, 1.5, 1.6, 10.333, 4.9, "Summary of Achievements", [
        "Multi-Concept Integration: Successfully integrated 5 core OS concepts into a unified working application.",
        "Practical Utility: Demonstrated how OS scheduling, mutexes, and memory algorithms solve real hospital bottleneck problems.",
        "Interactive Evaluation: Provided an interactive live simulator for testing algorithms, preemption events, and deadlock safety.",
        "Team Project: Developed by Havish (24BYB0057) & Shanmukha Simha (24BDE0123) under the guidance of Dr. PORKODI S."
    ])

    output_filename = r"c:\Users\havis\Documents\operating systems lab project\Smart_Hospital_OS_Overview.pptx"
    prs.save(output_filename)
    print(f"Successfully generated PowerPoint presentation at: {output_filename}")

if __name__ == "__main__":
    create_presentation()
