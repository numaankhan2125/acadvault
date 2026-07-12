// State Variables
let activeSemester = "1";
let activeBranch = "CSE";
let searchQuery = "";
let isAdminMode = false;

// Custom additions stored in LocalStorage
let customDatabase = {};

// Initialize Application
function init() {
    protectPage();
    loadCustomData();
    checkSessionAuth();
    renderBranchPills();
    renderBranchDropdownOptions();
    setupEventListeners();
    render();
}

// Load custom data from LocalStorage
function loadCustomData() {
    const stored = localStorage.getItem("acadvault_custom_v2");
    if (stored) {
        try {
            customDatabase = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing custom database:", e);
            customDatabase = {};
        }
    }
}

// Save custom data to LocalStorage
function saveCustomData() {
    localStorage.setItem("acadvault_custom_v2", JSON.stringify(customDatabase));
}

// Check session storage for existing auth
function checkSessionAuth() {
    const sessionAuth = sessionStorage.getItem("acadvault_admin_auth");
    if (sessionAuth === "true") {
        isAdminMode = true;
        updateAdminUIState();
    }
}

// Render the row of branch selector pills
function renderBranchPills() {
    const container = document.getElementById("branchPills");
    container.innerHTML = "";
    
    // Get all branches from default database
    const branches = Object.keys(ACADVAULT_DATABASE);
    
    branches.forEach(branch => {
        const pill = document.createElement("div");
        pill.className = `branch-pill ${branch === activeBranch ? 'active' : ''}`;
        pill.setAttribute("data-branch", branch);
        pill.textContent = getFriendlyBranchName(branch);
        
        pill.addEventListener("click", () => {
            document.querySelectorAll(".branch-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            activeBranch = branch;
            render();
        });
        
        container.appendChild(pill);
    });
}

// Convert short keys to descriptive names for pills
function getFriendlyBranchName(branch) {
    const names = {
        "CSE": "B.Tech CSE",
        "ECE": "B.Tech ECE",
        "EEE": "B.Tech EEE",
        "CIVIL": "B.Tech CIVIL",
        "MECH": "B.Tech MECH",
        "AI & ML": "AI & ML",
        "CSE AI & DS": "AI & DS",
        "INF": "IT / INF",
        "BCA": "BCA",
        "BBA": "BBA"
    };
    return names[branch] || branch;
}

// Render dynamic options in the modal branch dropdown selector
function renderBranchDropdownOptions() {
    const select = document.getElementById("paperBranchSelect");
    select.innerHTML = "";
    
    const branches = Object.keys(ACADVAULT_DATABASE);
    branches.forEach(branch => {
        const option = document.createElement("option");
        option.value = branch;
        option.textContent = getFriendlyBranchName(branch);
        select.appendChild(option);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Semester Sidebar Navigation
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            activeSemester = item.getAttribute("data-sem");
            render();
        });
    });

    // Search Input Event
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        render();
    });

    // Admin Locking Toggle Control
    const adminLockBtn = document.getElementById("adminLockBtn");
    const authModal = document.getElementById("adminPasswordModal");
    const closeAuthBtn = document.getElementById("closeAuthModalBtn");
    const cancelAuthBtn = document.getElementById("cancelAuthModalBtn");
    const authForm = document.getElementById("adminPasswordForm");

    adminLockBtn.addEventListener("click", () => {
        if (isAdminMode) {
            // Lock Admin Mode
            isAdminMode = false;
            sessionStorage.removeItem("acadvault_admin_auth");
            updateAdminUIState();
            showToast("Admin Mode Locked", "success");
            render();
        } else {
            // Show password modal to unlock
            authModal.classList.add("active");
            document.getElementById("adminPasswordInput").focus();
        }
    });

    // Close Auth Modal
    const closeAuthModal = () => {
        authModal.classList.remove("active");
        authForm.reset();
    };
    closeAuthBtn.addEventListener("click", closeAuthModal);
    cancelAuthBtn.addEventListener("click", closeAuthModal);
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    // Submit Auth Passcode
    authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const passcode = document.getElementById("adminPasswordInput").value;
        if (btoa(passcode) === ADMIN_HASH) {
            isAdminMode = true;
            sessionStorage.setItem("acadvault_admin_auth", "true");
            updateAdminUIState();
            closeAuthModal();
            showToast("Admin Mode Unlocked successfully!", "success");
            render();
        } else {
            showToast("Incorrect Admin Passcode!", "error");
        }
    });

    // Add Custom Paper Modal Management
    const addModal = document.getElementById("addPaperModal");
    const openAddBtn = document.getElementById("openAddModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const addForm = document.getElementById("addPaperForm");

    openAddBtn.addEventListener("click", () => {
        document.getElementById("paperBranchSelect").value = activeBranch;
        document.getElementById("paperSemSelect").value = activeSemester;
        addModal.classList.add("active");
    });

    const closeAddModal = () => {
        addModal.classList.remove("active");
        addForm.reset();
    };
    closeModalBtn.addEventListener("click", closeAddModal);
    cancelModalBtn.addEventListener("click", closeAddModal);
    addModal.addEventListener("click", (e) => {
        if (e.target === addModal) closeAddModal();
    });

    // Submit custom paper form
    addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const branch = document.getElementById("paperBranchSelect").value;
        const sem = document.getElementById("paperSemSelect").value;
        const subjectName = document.getElementById("paperSubjectInput").value.trim();
        const subjectCode = document.getElementById("paperSubjectCodeInput").value.trim().toUpperCase() || "CUST";
        const paperTitle = document.getElementById("paperTitleInput").value.trim();
        const paperType = document.getElementById("paperTypeSelect").value;
        const paperUrl = document.getElementById("paperUrlInput").value.trim();

        if (!subjectName || !paperTitle || !paperUrl) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        // Add item to custom Database state
        if (!customDatabase[branch]) {
            customDatabase[branch] = {};
        }
        if (!customDatabase[branch][sem]) {
            customDatabase[branch][sem] = {};
        }
        
        // Find existing subject in either default db or custom db
        let subjectKey = subjectName;
        // Let's match existing keys in case of capitalization mismatch
        const defaultSubjects = ACADVAULT_DATABASE[branch] && ACADVAULT_DATABASE[branch][sem] ? Object.keys(ACADVAULT_DATABASE[branch][sem]) : [];
        const customSubjects = Object.keys(customDatabase[branch][sem]);
        const allSubjects = [...new Set([...defaultSubjects, ...customSubjects])];
        
        const match = allSubjects.find(sub => sub.toLowerCase() === subjectName.toLowerCase());
        if (match) {
            subjectKey = match;
        }

        if (!customDatabase[branch][sem][subjectKey]) {
            customDatabase[branch][sem][subjectKey] = [];
        }

        const customPaper = {
            id: "c-" + Date.now(),
            title: paperTitle,
            url: paperUrl,
            type: paperType
        };

        customDatabase[branch][sem][subjectKey].push(customPaper);
        
        saveCustomData();
        closeAddModal();
        showToast(`Successfully added "${paperTitle}" to ${subjectKey}!`, "success");
        render();
    });
}

// Update DOM elements when admin mode lock/unlock states toggle
function updateAdminUIState() {
    const lockBtn = document.getElementById("adminLockBtn");
    const lockIcon = document.getElementById("adminLockIcon");
    const lockText = document.getElementById("adminLockText");
    const openAddBtn = document.getElementById("openAddModalBtn");

    if (isAdminMode) {
        lockBtn.classList.add("unlocked");
        lockIcon.innerHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        `;
        lockText.textContent = "Admin Unlocked";
        openAddBtn.style.display = "inline-flex";
    } else {
        lockBtn.classList.remove("unlocked");
        lockIcon.innerHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        `;
        lockText.textContent = "Admin Locked";
        openAddBtn.style.display = "none";
    }
}

// Delete custom paper event
function deleteCustomPaper(branch, sem, subject, paperId) {
    if (!isAdminMode) return;
    
    if (customDatabase[branch] && customDatabase[branch][sem] && customDatabase[branch][sem][subject]) {
        customDatabase[branch][sem][subject] = customDatabase[branch][sem][subject].filter(p => p.id !== paperId);
        
        // Clean empty subject lists
        if (customDatabase[branch][sem][subject].length === 0) {
            delete customDatabase[branch][sem][subject];
        }
        
        saveCustomData();
        showToast("Custom paper deleted successfully", "success");
        render();
    }
}

// Render main content grid based on active semester and branch
function render() {
    const titleElement = document.getElementById("activeSemTitle");
    if (searchQuery) {
        titleElement.textContent = `Search Results: "${searchQuery}"`;
    } else {
        titleElement.textContent = `${getFriendlyBranchName(activeBranch)} — Semester ${activeSemester} Papers`;
    }

    const grid = document.getElementById("subjectsGrid");
    grid.innerHTML = "";

    // Compile list of subjects to process.
    // If a search query is active, we search across all 8 semesters!
    // Otherwise, we search only within the active semester.
    let subjectsToProcess = [];

    if (searchQuery) {
        for (let sem = 1; sem <= 8; sem++) {
            const semStr = sem.toString();
            const defaultSubjects = ACADVAULT_DATABASE[activeBranch] && ACADVAULT_DATABASE[activeBranch][semStr]
                ? ACADVAULT_DATABASE[activeBranch][semStr]
                : {};
            const customSubjects = customDatabase[activeBranch] && customDatabase[activeBranch][semStr]
                ? customDatabase[activeBranch][semStr]
                : {};
            const allSubjectNames = [...new Set([...Object.keys(defaultSubjects), ...Object.keys(customSubjects)])];
            
            allSubjectNames.forEach(name => {
                subjectsToProcess.push({
                    name: name,
                    semester: semStr,
                    defaultPapers: defaultSubjects[name] || [],
                    customPapers: customSubjects[name] || []
                });
            });
        }
    } else {
        const defaultSubjects = ACADVAULT_DATABASE[activeBranch] && ACADVAULT_DATABASE[activeBranch][activeSemester]
            ? ACADVAULT_DATABASE[activeBranch][activeSemester]
            : {};
        const customSubjects = customDatabase[activeBranch] && customDatabase[activeBranch][activeSemester]
            ? customDatabase[activeBranch][activeSemester]
            : {};
        const allSubjectNames = [...new Set([...Object.keys(defaultSubjects), ...Object.keys(customSubjects)])];
        
        allSubjectNames.forEach(name => {
            subjectsToProcess.push({
                name: name,
                semester: activeSemester,
                defaultPapers: defaultSubjects[name] || [],
                customPapers: customSubjects[name] || []
            });
        });
    }

    let renderedCount = 0;

    subjectsToProcess.forEach(subject => {
        const subjectName = subject.name;
        const allPapers = [...subject.defaultPapers, ...subject.customPapers];

        // Search Filters
        const matchesSubject = subjectName.toLowerCase().includes(searchQuery);
        const matchingPapers = allPapers.filter(paper => 
            paper.title.toLowerCase().includes(searchQuery) ||
            paper.type.toLowerCase().includes(searchQuery)
        );

        const shouldRender = matchesQuery(subjectName, allPapers);

        if (shouldRender) {
            renderedCount++;
            
            // Filter papers to display
            const displayPapers = searchQuery ? matchingPapers : allPapers;

            // Separate into Model vs. Previous year lists
            const modelPapers = displayPapers.filter(p => p.type === "Model Paper" || p.type === "Notes / Study Material");
            const prevPapers = displayPapers.filter(p => p.type === "Previous Year Paper");

            const card = document.createElement("div");
            card.className = "subject-card";

            // Generate Model Papers list HTML
            let modelHTML = "";
            if (modelPapers.length > 0) {
                modelPapers.forEach(paper => {
                    modelHTML += renderPaperRow(paper, subjectName, subject.semester);
                });
            } else {
                modelHTML = `<div class="no-papers-msg">No model papers added yet.</div>`;
            }

            // Generate Previous Year Papers list HTML
            let prevHTML = "";
            if (prevPapers.length > 0) {
                prevPapers.forEach(paper => {
                    prevHTML += renderPaperRow(paper, subjectName, subject.semester);
                });
            } else {
                prevHTML = `<div class="no-papers-msg">No previous papers available.</div>`;
            }

            // Generate subject code
            let code = "UG";
            if (activeBranch === "BCA") code = "BCA";
            else if (activeBranch === "BBA") code = "BBA";
            else code = `${activeBranch}`;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title-group">
                        <h3>${subjectName}</h3>
                    </div>
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <span class="card-code" style="background: rgba(168, 85, 247, 0.1); color: var(--accent-purple); border-color: rgba(168, 85, 247, 0.15);">Sem ${subject.semester}</span>
                        <span class="card-code">${code}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="paper-section">
                        <div class="paper-section-title model">
                            <span>Model Papers</span>
                        </div>
                        <ul class="paper-list">
                            ${modelHTML}
                        </ul>
                    </div>

                    <div class="paper-section">
                        <div class="paper-section-title prev">
                            <span>Previous Papers</span>
                        </div>
                        <ul class="paper-list">
                            ${prevHTML}
                        </ul>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        }
    });

    // Add click triggers to dynamically rendered delete buttons
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const paperId = btn.getAttribute("data-id");
            const subject = btn.getAttribute("data-subject");
            const sem = btn.getAttribute("data-sem");
            deleteCustomPaper(activeBranch, sem, subject, paperId);
        });
    });

    // Update Stats Badge
    document.getElementById("statsCount").textContent = renderedCount;

    // Render Empty State
    if (renderedCount === 0) {
        const isComingSoon = ["6", "7", "8"].includes(activeSemester);
        const iconHTML = isComingSoon 
            ? `
                <svg class="empty-icon" style="color: var(--accent-purple);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              `
            : `
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                    <line x1="9" y1="11" x2="15" y2="11"></line>
                </svg>
              `;
        const titleText = isComingSoon ? "Coming Soon..." : "No Question Papers Found";
        const descText = isComingSoon 
            ? `Curriculum papers for Semester ${activeSemester} are currently being compiled and will be available soon.`
            : `There are no old question papers listed under ${getFriendlyBranchName(activeBranch)} Semester ${activeSemester}. Try switching semesters or search again.`;

        grid.innerHTML = `
            <div class="empty-state">
                ${iconHTML}
                <h3>${titleText}</h3>
                <p>${descText}</p>
            </div>
        `;
    }
}

// Render individual paper row
function renderPaperRow(paper, subjectName, semester) {
    const isCustom = paper.id && paper.id.startsWith("c-");
    
    // Delete action button only visible in admin mode for custom added papers
    const deleteButton = (isAdminMode && isCustom) 
        ? `
            <button class="action-btn btn-delete" data-id="${paper.id}" data-subject="${subjectName}" data-sem="${semester}" title="Delete Custom Paper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
          `
        : "";

    return `
        <li class="paper-item">
            <div class="paper-info">
                <span class="paper-name" title="${paper.title}">${paper.title}</span>
                <span class="paper-badge">${paper.type}</span>
            </div>
            <div class="paper-actions">
                <a href="${paper.url}" target="_blank" class="action-btn" title="View Paper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </a>
                <a href="${paper.url}" download="${subjectName}_${paper.title}.pdf" class="action-btn" title="Download Paper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </a>
                ${deleteButton}
            </div>
        </li>
    `;
}



// Check if subject or papers match search query
function matchesQuery(subjectName, papers) {
    if (!searchQuery) return true;
    if (subjectName.toLowerCase().includes(searchQuery)) return true;
    return papers.some(p => p.title.toLowerCase().includes(searchQuery) || p.type.toLowerCase().includes(searchQuery));
}

// Show Slide-up Toast Notification
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "";
    if (type === "success") {
        icon = `
            <svg style="width: 18px; height: 18px; color: var(--accent-teal);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else {
        icon = `
            <svg style="width: 18px; height: 18px; color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);
    
    // Animate display
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Fade out and remove
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// Prevent right click and developer tool shortcuts to secure settings
function protectPage() {
    // Disable right-click context menu
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });

    // Disable common developer tools keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Prevent F12
        if (e.key === "F12" || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Prevent Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j")) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
            e.preventDefault();
            return false;
        }
    });
}

// Run init on load
window.addEventListener("DOMContentLoaded", init);

// Fade out splash loader after resources load & register service worker
window.addEventListener("load", () => {
    const loader = document.getElementById("loaderWrapper");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("fade-out");
        }, 1200); // 1.2 seconds elegant loading window
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
});
