// --- DOM Elements ---
const themeToggle = document.getElementById('theme-toggle');
const plannerGrid = document.getElementById('planner-grid');
const habitsList = document.getElementById('habits-list');
const habitProgressFill = document.getElementById('habit-progress-fill');
const habitProgressText = document.getElementById('habit-progress-text');
const quoteDisplay = document.getElementById('quote-display');
const dailyFocusPrompt = document.getElementById('daily-focus-prompt');
const plannerColorPopover = document.getElementById('planner-color-popover');
const exportPlannerBtn = document.getElementById('export-planner-btn');
const importPlannerBtn = document.getElementById('import-planner-btn');
const importPlannerFile = document.getElementById('import-planner-file');

let activePlannerTask = null; // Track which planner task is currently active for color picking

// --- Data Storage Keys ---
const STORAGE_KEYS = {
    THEME: 'focusMateTheme',
    PLANNER: 'focusMatePlanner',
    HABITS: 'focusMateHabits',
    FOCUS_PROMPT: 'focusMateDailyFocusPrompt',
    LAST_QUOTE_DATE: 'focusMateLastQuoteDate',
    QUOTE_INDEX: 'focusMateQuoteIndex'
};

// --- Configuration ---
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MOTIVATIONAL_QUOTES = [
    { quote: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
    { quote: "The mind is everything. What you think you become.", author: "Buddha" },
    { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" }
];

const PLANNER_COLORS = ['blue', 'green', 'yellow', 'pink', 'purple', 'gray']; // 'gray' for clear/default

// --- Helper Functions ---

/**
 * Safely parses JSON from localStorage.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
function getLocalStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return defaultValue; // Return default on error
    }
}

/**
 * Safely sets JSON to localStorage.
 * @param {string} key
 * @param {any} value
 */
function setLocalStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error setting localStorage key "${key}":`, e);
    }
}

// --- Theme Toggle Logic ---
function applyTheme(theme) {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(theme);
    themeToggle.querySelector('i').className = `fas fa-${theme === 'dark-theme' ? 'sun' : 'moon'}`;
    setLocalStorageItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
    const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    applyTheme(newTheme);
}

// --- Weekly Planner Logic ---
let plannerData = getLocalStorageItem(STORAGE_KEYS.PLANNER, {});

function renderPlanner() {
    plannerGrid.innerHTML = ''; // Clear existing grid
    DAYS_OF_WEEK.forEach(day => {
        const dayId = day.toLowerCase();
        const dayData = plannerData[dayId] || [{ content: '', color: 'yellow' }]; // Default to one empty task
        const plannerDayDiv = document.createElement('div');
        plannerDayDiv.className = 'planner-day';
        plannerDayDiv.dataset.day = dayId;
        plannerDayDiv.innerHTML = `<div class="planner-day-header">${day}</div>`;

        dayData.forEach((task, index) => {
            plannerDayDiv.appendChild(createPlannerTaskElement(task, index));
        });

        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'add-task-btn';
        addTaskBtn.textContent = '+ Add Task';
        addTaskBtn.onclick = () => addPlannerTask(dayId);
        plannerDayDiv.appendChild(addTaskBtn);

        plannerGrid.appendChild(plannerDayDiv);
    });
}

function createPlannerTaskElement(taskData, index) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'planner-task';
    taskDiv.contentEditable = true;
    taskDiv.dataset.index = index;
    taskDiv.dataset.color = taskData.color;
    taskDiv.dataset.placeholder = 'Add a task...';
    taskDiv.innerHTML = taskData.content;
    taskDiv.style.backgroundColor = `var(--planner-${taskData.color})`;

    // Event listeners for individual task
    taskDiv.addEventListener('input', (e) => updatePlannerTask(e.target));
    taskDiv.addEventListener('click', (e) => {
        activePlannerTask = e.target;
        showPlannerColorPopover(e.target);
    });
    // Handle backspace/delete on empty task to remove it
    taskDiv.addEventListener('keydown', (e) => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.textContent.trim() === '') {
            e.preventDefault(); // Prevent default browser behavior
            removePlannerTask(e.target);
        }
    });

    return taskDiv;
}

function addPlannerTask(dayId) {
    const newTask = { content: '', color: 'yellow' }; // Default new task color
    if (!plannerData[dayId]) {
        plannerData[dayId] = [];
    }
    plannerData[dayId].push(newTask);
    setLocalStorageItem(STORAGE_KEYS.PLANNER, plannerData);
    renderPlanner(); // Re-render the specific day or whole grid for simplicity
}

function updatePlannerTask(taskElement) {
    const dayId = taskElement.closest('.planner-day').dataset.day;
    const index = parseInt(taskElement.dataset.index);
    if (plannerData[dayId] && plannerData[dayId][index]) {
        plannerData[dayId][index].content = taskElement.innerHTML;
        plannerData[dayId][index].color = taskElement.dataset.color; // Ensure color is saved on input too
        setLocalStorageItem(STORAGE_KEYS.PLANNER, plannerData);
    }
}

function removePlannerTask(taskElement) {
    const dayId = taskElement.closest('.planner-day').dataset.day;
    const index = parseInt(taskElement.dataset.index);
    if (plannerData[dayId]) {
        plannerData[dayId].splice(index, 1);
        // If the last task is removed, add an empty one back to ensure a draggable area
        if (plannerData[dayId].length === 0) {
             plannerData[dayId].push({ content: '', color: 'yellow' });
        }
        setLocalStorageItem(STORAGE_KEYS.PLANNER, plannerData);
        renderPlanner();
    }
}

function showPlannerColorPopover(taskElement) {
    const rect = taskElement.getBoundingClientRect();
    plannerColorPopover.style.top = `${rect.bottom + 5}px`;
    plannerColorPopover.style.left = `${rect.left}px`;
    plannerColorPopover.classList.add('active');

    // Set selected state for current color
    plannerColorPopover.querySelectorAll('.popover-color-dot').forEach(dot => {
        dot.classList.remove('selected');
        if (dot.dataset.color === taskElement.dataset.color) {
            dot.classList.add('selected');
        }
    });
}

// Close popover when clicking outside
document.addEventListener('click', (e) => {
    if (!plannerColorPopover.contains(e.target) && !e.target.closest('.planner-task')) {
        plannerColorPopover.classList.remove('active');
        activePlannerTask = null;
    }
});

// Event listener for color dots in the popover
plannerColorPopover.addEventListener('click', (e) => {
    const colorDot = e.target.closest('.popover-color-dot');
    if (colorDot && activePlannerTask) {
        const newColor = colorDot.dataset.color;
        activePlannerTask.dataset.color = newColor;
        activePlannerTask.style.backgroundColor = `var(--planner-${newColor})`;
        updatePlannerTask(activePlannerTask); // Save the new color
        plannerColorPopover.classList.remove('active');
    }
});

// --- Daily Habit Tracker Logic ---
let habitsState = getLocalStorageItem(STORAGE_KEYS.HABITS, {});

function renderHabits() {
    const checkboxes = habitsList.querySelectorAll('.habit-checkbox');
    checkboxes.forEach(checkbox => {
        const habitId = checkbox.closest('.habit-item').dataset.habit;
        checkbox.checked = habitsState[habitId] || false;
    });
    updateHabitProgress();
}

function updateHabitProgress() {
    const checkboxes = habitsList.querySelectorAll('.habit-checkbox');
    let completedHabits = 0;
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            completedHabits++;
        }
    });
    const totalHabits = checkboxes.length;
    const progressPercentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

    habitProgressFill.style.width = `${progressPercentage}%`;
    habitProgressText.textContent = `${completedHabits}/${totalHabits} habits completed`;
}

habitsList.addEventListener('change', (e) => {
    if (e.target.classList.contains('habit-checkbox')) {
        const habitId = e.target.closest('.habit-item').dataset.habit;
        habitsState[habitId] = e.target.checked;
        setLocalStorageItem(STORAGE_KEYS.HABITS, habitsState);
        updateHabitProgress();
    }
});

// --- Motivational Mode Logic ---
function displayDailyQuote() {
    const today = new Date().toDateString();
    const lastQuoteDate = getLocalStorageItem(STORAGE_KEYS.LAST_QUOTE_DATE);
    let currentQuoteIndex = getLocalStorageItem(STORAGE_KEYS.QUOTE_INDEX, 0);

    // Change quote daily
    if (today !== lastQuoteDate) {
        currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
        setLocalStorageItem(STORAGE_KEYS.LAST_QUOTE_DATE, today);
        setLocalStorageItem(STORAGE_KEYS.QUOTE_INDEX, currentQuoteIndex);
    }

    const quoteData = MOTIVATIONAL_QUOTES[currentQuoteIndex];
    quoteDisplay.style.opacity = 0; // Start fade out
    setTimeout(() => {
        quoteDisplay.innerHTML = `"${quoteData.quote}"<cite class="quote-author">- ${quoteData.author}</cite>`;
        quoteDisplay.style.opacity = 1; // Fade in
    }, 500); // Allow time for old quote to fade out
}

function loadFocusPrompt() {
    dailyFocusPrompt.innerHTML = getLocalStorageItem(STORAGE_KEYS.FOCUS_PROMPT, '');
}

dailyFocusPrompt.addEventListener('input', () => {
    setLocalStorageItem(STORAGE_KEYS.FOCUS_PROMPT, dailyFocusPrompt.innerHTML);
});

// --- Export/Import Logic ---
exportPlannerBtn.addEventListener('click', () => {
    const dataToExport = getLocalStorageItem(STORAGE_KEYS.PLANNER, {});
    const filename = `FocusMate_Planner_${new Date().toISOString().slice(0,10)}.json`;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

importPlannerBtn.addEventListener('click', () => {
    importPlannerFile.click(); // Trigger the hidden file input
});

importPlannerFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('Importing will overwrite your current planner data. Continue?')) {
                    plannerData = importedData;
                    setLocalStorageItem(STORAGE_KEYS.PLANNER, plannerData);
                    renderPlanner();
                    alert('Planner data imported successfully!');
                }
            } catch (error) {
                alert('Error importing planner data. Please ensure it is a valid JSON file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme based on localStorage or default
    const savedTheme = getLocalStorageItem(STORAGE_KEYS.THEME, 'light-theme');
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', toggleTheme);

    renderPlanner();
    renderHabits();
    displayDailyQuote();
    loadFocusPrompt();
});