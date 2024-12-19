import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, parse, addMonths } from 'date-fns';
import config from './config.json';

let currentConfig = { ...config };

function saveConfig() {
    // In a real application, this would be an API call
    // For now, we'll just update our local copy
    localStorage.setItem('calendarConfig', JSON.stringify(currentConfig));
}

function renderFlags() {
    const FlagList = document.getElementById('FlagList');
    if (!FlagList) return;
    
    FlagList.innerHTML = '';
    
    const Flags = loadFlags();
    if (!Flags || Flags.length === 0) {
        return;
    }
    
    Flags.sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA - dateB;
    }).forEach(Flag => {
        const FlagItem = document.createElement('div');
        FlagItem.className = 'Flag-item';
        
        const FlagInfo = document.createElement('div');
        FlagInfo.className = 'Flag-info';
        
        const nameSpan = document.createElement('div');
        nameSpan.textContent = Flag.name;
        nameSpan.className = 'Flag-name';
        
        const dateSpan = document.createElement('div');
        dateSpan.className = 'Flag-date';
        if (Flag.startDate === Flag.endDate) {
            dateSpan.textContent = format(new Date(Flag.startDate), 'MMM d, yyyy');
        } else {
            dateSpan.textContent = `${format(new Date(Flag.startDate), 'MMM d, yyyy')} - ${format(new Date(Flag.endDate), 'MMM d, yyyy')}`;
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-Flag';
        deleteButton.textContent = '×';
        deleteButton.onclick = () => {
            deleteFlag(Flag.startDate, Flag.endDate);
        };
        
        FlagInfo.appendChild(nameSpan);
        FlagInfo.appendChild(dateSpan);
        FlagItem.appendChild(FlagInfo);
        FlagItem.appendChild(deleteButton);
        FlagList.appendChild(FlagItem);
    });
}

function loadFlags() {
    const FlagsJson = localStorage.getItem('Flags');
    return FlagsJson ? JSON.parse(FlagsJson) : [];
}

function addFlag(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('FlagName');
    const startDateInput = document.getElementById('FlagStartDate');
    const endDateInput = document.getElementById('FlagEndDate');
    
    const name = nameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value || startDate;
    
    if (!name || !startDate) {
        alert('Please enter a Flag name and start date');
        return;
    }
    
    const Flags = loadFlags();
    const Flag = {
        name,
        startDate,
        endDate
    };
    
    Flags.push(Flag);
    localStorage.setItem('Flags', JSON.stringify(Flags));
    
    // Clear form
    nameInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
    
    renderFlags();
    generateCalendar();
}

function deleteFlag(startDate, endDate) {
    const Flags = loadFlags();
    const updatedFlags = Flags.filter(h => 
        !(h.startDate === startDate && h.endDate === endDate)
    );
    
    localStorage.setItem('Flags', JSON.stringify(updatedFlags));
    renderFlags();
    generateCalendar();
}

function initializeEventListeners() {
    // Add Flag form submission
    const addFlagButton = document.getElementById('addFlag');
    if (addFlagButton) {
        addFlagButton.onclick = addFlag;
    }
    
    // Reset Flags button
    const resetButton = document.querySelector('.reset-Flags');
    if (resetButton) {
        resetButton.onclick = () => {
            const currentYear = new Date().getFullYear();
            const defaultFlags = getDefaultUSFlags(currentYear);
            localStorage.setItem('Flags', JSON.stringify(defaultFlags));
            renderFlags();
            generateCalendar();
        };
    }
    
    document.getElementById('startDate').addEventListener('change', generateCalendar);
    document.getElementById('endDate').addEventListener('change', generateCalendar);
    document.getElementById('dimWeekends').addEventListener('change', generateCalendar);

    // Format options event listeners
    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', function() {
            const calendarPreview = document.getElementById('calendar-preview');
            const isPreviewVisible = calendarPreview.style.display === 'block';
            const isSameFormat = this.classList.contains('last-clicked');

            // Remove selected class from all options
            document.querySelectorAll('.format-option').forEach(opt => {
                opt.classList.remove('selected');
                opt.classList.remove('last-clicked');
            });

            // If clicking the same format while preview is visible, hide it
            if (isPreviewVisible && isSameFormat) {
                calendarPreview.style.display = 'none';
                return;
            }

            // Get current calendar content in the new format
            const startDateStr = document.getElementById('startDate').value;
            const endDateStr = document.getElementById('endDate').value;
            
            if (startDateStr && endDateStr) {
                const startDate = new Date(startDateStr);
                const endDate = new Date(endDateStr);
                const dimWeekends = document.getElementById('dimWeekends').checked;
                
                // Get the first and last months to display
                const start = startOfMonth(startDate);
                const end = endOfMonth(endDate);
                
                // Generate content in selected format for clipboard
                const format = this.dataset.format;
                let clipboardContent;
                switch (format) {
                    case 'word':
                        clipboardContent = generateWordCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'html':
                        clipboardContent = generateHtmlCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'text':
                        clipboardContent = generateTextCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'markdown':
                        clipboardContent = generateMarkdownCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                }
                
                // Copy to clipboard
                navigator.clipboard.writeText(clipboardContent);
                
                // Update preview and button state
                this.classList.add('selected');
                this.classList.add('last-clicked');
                
                if (!isPreviewVisible) {
                    showCalendarPreview();
                }
                generateCalendar();
            }
            
            // Save state
            saveLastState();
        });
    });

    // Add change handler for dim weekends
    const dimWeekendsCheckbox = document.getElementById('dimWeekends');
    if (dimWeekendsCheckbox) {
        dimWeekendsCheckbox.addEventListener('change', () => {
            generateCalendar();
            saveLastState();
        });
    }

    // Add change handlers for date inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            const startDate = new Date(this.value);
            const endDate = new Date(document.getElementById('endDate').value);
            
            if (this.value && document.getElementById('endDate').value) {
                if (!validateDateRange(startDate, endDate)) {
                    alert('Date range cannot exceed 16 months');
                    this.value = ''; // Clear invalid date
                    return;
                }
                generateCalendar();
            }
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', function() {
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(this.value);
            
            if (this.value && document.getElementById('startDate').value) {
                if (!validateDateRange(startDate, endDate)) {
                    alert('Date range cannot exceed 16 months');
                    this.value = ''; // Clear invalid date
                    return;
                }
                generateCalendar();
            }
        });
    }
    
    // Add Flag Manager toggle
    const toggleFlagManagerBtn = document.querySelector('.toggle-flag-manager');
    if (toggleFlagManagerBtn) {
        toggleFlagManagerBtn.addEventListener('click', toggleFlagManager);
    }

    document.querySelector('.close-flag-manager').addEventListener('click', () => {
        const flagManager = document.querySelector('.Flag-manager');
        if (flagManager) {
            flagManager.style.display = 'none';
        }
    });
}

function getDefaultUSFlags(year) {
    return [
        {
            name: "New Year's Day",
            startDate: `${year}-01-01`,
            endDate: `${year}-01-01`
        },
        {
            name: "Martin Luther King Jr. Day",
            startDate: `${year}-01-15`,  // Third Monday in January
            endDate: `${year}-01-15`
        },
        {
            name: "Presidents' Day",
            startDate: `${year}-02-19`,  // Third Monday in February
            endDate: `${year}-02-19`
        },
        {
            name: "Memorial Day",
            startDate: `${year}-05-27`,  // Last Monday in May
            endDate: `${year}-05-27`
        },
        {
            name: "Independence Day",
            startDate: `${year}-07-04`,
            endDate: `${year}-07-04`
        },
        {
            name: "Labor Day",
            startDate: `${year}-09-02`,  // First Monday in September
            endDate: `${year}-09-02`
        },
        {
            name: "Columbus Day",
            startDate: `${year}-10-14`,  // Second Monday in October
            endDate: `${year}-10-14`
        },
        {
            name: "Veterans Day",
            startDate: `${year}-11-11`,
            endDate: `${year}-11-11`
        },
        {
            name: "Thanksgiving Day",
            startDate: `${year}-11-28`,  // Fourth Thursday in November
            endDate: `${year}-11-28`
        },
        {
            name: "Christmas Day",
            startDate: `${year}-12-25`,
            endDate: `${year}-12-25`
        }
    ];
}

// Add state management functions
function saveElementState(elementId, state) {
    const savedStates = JSON.parse(localStorage.getItem('elementStates') || '{}');
    savedStates[elementId] = state;
    localStorage.setItem('elementStates', JSON.stringify(savedStates));
}

function loadElementState(elementId) {
    const savedStates = JSON.parse(localStorage.getItem('elementStates') || '{}');
    return savedStates[elementId];
}

function saveState() {
    // Save controls state
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        saveElementState('controls', {
            width: controlsContainer.style.width || '400px',
            height: controlsContainer.style.height || 'auto',
            left: controlsContainer.style.left || '20px',
            top: controlsContainer.style.top || '80px'
        });
    }

    // Save Flag manager state
    const FlagManager = document.querySelector('.Flag-manager');
    if (FlagManager) {
        saveElementState('FlagManager', {
            width: FlagManager.style.width || '400px',
            height: FlagManager.style.height || 'auto',
            left: FlagManager.style.left || '440px',
            top: FlagManager.style.top || '80px',
            display: FlagManager.style.display || 'block'
        });
    }

    // Save calendar preview state
    const calendarPreview = document.getElementById('calendar-preview');
    if (calendarPreview) {
        saveElementState('calendarPreview', {
            width: calendarPreview.style.width || '600px',
            left: calendarPreview.style.left || '50%',
            top: calendarPreview.style.top || '50%',
            display: calendarPreview.style.display || 'none'
        });
    }

    // Save dates and settings
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const dimWeekends = document.getElementById('dimWeekends');
    
    saveElementState('dateSettings', {
        startDate: startDate ? startDate.value : '',
        endDate: endDate ? endDate.value : '',
        dimWeekends: dimWeekends ? dimWeekends.checked : false
    });
}

function restoreState() {
    // Restore controls state
    const controlsState = loadElementState('controls');
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsState && controlsContainer) {
        Object.assign(controlsContainer.style, {
            width: controlsState.width,
            height: controlsState.height,
            left: controlsState.left,
            top: controlsState.top
        });
    }

    // Restore Flag manager state
    const FlagState = loadElementState('FlagManager');
    const FlagManager = document.querySelector('.Flag-manager');
    if (FlagState && FlagManager) {
        Object.assign(FlagManager.style, {
            width: FlagState.width,
            height: FlagState.height,
            left: FlagState.left,
            top: FlagState.top,
            display: FlagState.display
        });
    }

    // Restore calendar preview state
    const previewState = loadElementState('calendarPreview');
    const calendarPreview = document.getElementById('calendar-preview');
    if (previewState && calendarPreview) {
        Object.assign(calendarPreview.style, {
            width: previewState.width,
            height: previewState.height,
            left: previewState.left,
            top: previewState.top,
            display: previewState.display
        });
    }

    // Restore dates and settings
    const dateSettings = loadElementState('dateSettings');
    if (dateSettings) {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const dimWeekends = document.getElementById('dimWeekends');
        
        if (startDate) startDate.value = dateSettings.startDate;
        if (endDate) endDate.value = dateSettings.endDate;
        if (dimWeekends) dimWeekends.checked = dateSettings.dimWeekends;
    }
}

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    const draggableElements = document.querySelectorAll('.draggable');
    
    draggableElements.forEach(element => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        // Set initial positions
        const rect = element.getBoundingClientRect();
        element.style.position = 'absolute';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        
        element.addEventListener('mousedown', e => {
            // Ignore if clicking on input, button, or any interactive element
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'button' ||
                e.target.tagName.toLowerCase() === 'select' ||
                e.target.tagName.toLowerCase() === 'textarea' ||
                e.target.closest('.Flag-form') ||
                e.target.closest('.format-controls')) {
                return;
            }

            if (e.target === element || e.target.classList.contains('controls-header') || 
                e.target.classList.contains('Flag-header') || e.target.classList.contains('preview-header')) {
                isDragging = true;
                initialX = e.clientX - element.offsetLeft;
                initialY = e.clientY - element.offsetTop;
                element.classList.add('dragging');
            }
        });
        
        document.addEventListener('mousemove', e => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                saveState(); // Save state after dragging
            }
        });

        // Add resize observer to track size changes
        const resizeObserver = new ResizeObserver(() => {
            saveState(); // Save state when element is resized
        });
        resizeObserver.observe(element);
    });
}

function toggleFlagManager() {
    const flagManager = document.querySelector('.Flag-manager');
    if (flagManager) {
        const isVisible = flagManager.style.display !== 'none';
        flagManager.style.display = isVisible ? 'none' : 'block';
        
        // Save state
        saveElementState('FlagManager', {
            ...loadElementState('FlagManager'),
            display: flagManager.style.display
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flags if first time
    if (!localStorage.getItem('Flags')) {
        const currentYear = new Date().getFullYear();
        const defaultFlags = getDefaultUSFlags(currentYear);
        localStorage.setItem('Flags', JSON.stringify(defaultFlags));
    }
    
    // Load and render Flags
    renderFlags();
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Add click event listeners to format options
    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', function() {
            const calendarPreview = document.getElementById('calendar-preview');
            const isPreviewVisible = calendarPreview.style.display === 'none';
            const isSameFormat = this.classList.contains('last-clicked');

            // Remove selected class from all options
            document.querySelectorAll('.format-option').forEach(opt => {
                opt.classList.remove('selected');
                opt.classList.remove('last-clicked');
            });

            // If clicking the same format while preview is visible, hide it
            if (isPreviewVisible && isSameFormat) {
                calendarPreview.style.display = 'none';
                return;
            }

            // Get current calendar content in the new format
            const startDateStr = document.getElementById('startDate').value;
            const endDateStr = document.getElementById('endDate').value;
            
            if (startDateStr && endDateStr) {
                const startDate = new Date(startDateStr);
                const endDate = new Date(endDateStr);
                const dimWeekends = document.getElementById('dimWeekends').checked;
                
                // Get the first and last months to display
                const start = startOfMonth(startDate);
                const end = endOfMonth(endDate);
                
                // Generate content in selected format for clipboard
                const format = this.dataset.format;
                let clipboardContent;
                switch (format) {
                    case 'word':
                        clipboardContent = generateWordCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'html':
                        clipboardContent = generateHtmlCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'text':
                        clipboardContent = generateTextCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                    case 'markdown':
                        clipboardContent = generateMarkdownCalendar(start, end, startDate, endDate, dimWeekends);
                        break;
                }
                
                // Copy to clipboard
                navigator.clipboard.writeText(clipboardContent);
                
                // Update preview and button state
                this.classList.add('selected');
                this.classList.add('last-clicked');
                
                if (!isPreviewVisible) {
                    showCalendarPreview();
                }
                generateCalendar();
            }
            
            // Save state
            saveLastState();
        });
    });

    // Add change handler for dim weekends
    const dimWeekendsCheckbox = document.getElementById('dimWeekends');
    if (dimWeekendsCheckbox) {
        dimWeekendsCheckbox.addEventListener('change', () => {
            generateCalendar();
            saveLastState();
        });
    }

    // Add change handlers for date inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            const startDate = new Date(this.value);
            const endDate = new Date(document.getElementById('endDate').value);
            
            if (this.value && document.getElementById('endDate').value) {
                if (!validateDateRange(startDate, endDate)) {
                    alert('Date range cannot exceed 16 months');
                    this.value = ''; // Clear invalid date
                    return;
                }
                generateCalendar();
            }
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', function() {
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(this.value);
            
            if (this.value && document.getElementById('startDate').value) {
                if (!validateDateRange(startDate, endDate)) {
                    alert('Date range cannot exceed 16 months');
                    this.value = ''; // Clear invalid date
                    return;
                }
                generateCalendar();
            }
        });
    }
    
    // Generate initial calendar
    generateCalendar();
});

function saveLastState() {
    currentConfig.lastState = {
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        dimWeekends: document.getElementById('dimWeekends').checked,
        selectedFormat: getCurrentFormat()
    };
    saveConfig();
}

function getCurrentFormat() {
    return document.querySelector('.format-option.selected').dataset.format;
}

// Add fade timeout functionality
let fadeTimeoutId = null;
let container = null;
let orangeClock = null;
let clockInterval = null;
let previewPosition = { left: '50%', top: '50%' };

function updateClock() {
    if (!orangeClock) return;
    
    const now = new Date();
    
    // Update date
    const dateElement = orangeClock.querySelector('.date');
    if (dateElement) {
        dateElement.textContent = format(now, 'MMMM d, yyyy');
    }
    
    // Update time
    const timeContainer = orangeClock.querySelector('.time');
    if (!timeContainer) return;

    const timeStr = format(now, 'HH:mm:ss');
    const parts = timeStr.split(':');
    
    // Get existing digits or create new container
    const existingDigits = timeContainer.querySelectorAll('.digit');
    if (existingDigits.length === 0) {
        // First time - create all elements
        timeContainer.innerHTML = '';
        
        // Add hours
        parts[0].split('').forEach(digit => {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'digit';
            digitSpan.textContent = digit;
            timeContainer.appendChild(digitSpan);
        });
        
        // Add first separator
        const sep1 = document.createElement('span');
        sep1.className = 'separator';
        sep1.textContent = ':';
        timeContainer.appendChild(sep1);
        
        // Add minutes
        parts[1].split('').forEach(digit => {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'digit';
            digitSpan.textContent = digit;
            timeContainer.appendChild(digitSpan);
        });
        
        // Add second separator
        const sep2 = document.createElement('span');
        sep2.className = 'separator';
        sep2.textContent = ':';
        timeContainer.appendChild(sep2);
        
        // Add seconds
        parts[2].split('').forEach(digit => {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'digit';
            digitSpan.textContent = digit;
            timeContainer.appendChild(digitSpan);
        });
    } else {
        // Update existing digits with animation
        const newDigits = [...parts[0], ...parts[1], ...parts[2]];
        existingDigits.forEach((digitElement, index) => {
            const newValue = newDigits[index];
            if (digitElement.textContent !== newValue) {
                // Fade out
                digitElement.classList.add('fade-out');
                
                // Update value and fade in after short delay
                setTimeout(() => {
                    digitElement.textContent = newValue;
                    digitElement.classList.remove('fade-out');
                    digitElement.classList.add('fade-in');
                    
                    // Remove fade-in class after animation
                    setTimeout(() => {
                        digitElement.classList.remove('fade-in');
                    }, 300);
                }, 150);
            }
        });
    }
}

function startClock() {
    if (!orangeClock) {
        orangeClock = document.querySelector('.orange-clock');
    }
    
    // Initial update without showing the clock
    updateClock();
    
    // Show the clock after a short delay
    setTimeout(() => {
        orangeClock.classList.add('visible');
    }, 500);
    
    // Start the clock interval
    clockInterval = setInterval(updateClock, 1000);
}

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    if (orangeClock) {
        orangeClock.classList.remove('visible');
    }
}

function clearFadeTimeout() {
    if (fadeTimeoutId) {
        clearTimeout(fadeTimeoutId);
        fadeTimeoutId = null;
    }
}

function resetFadeTimeout() {
    clearFadeTimeout();
    
    if (container) {
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
    }
    
    if (orangeClock) {
        orangeClock.classList.remove('visible');
    }
    
    fadeTimeoutId = setTimeout(() => {
        if (container) {
            container.classList.remove('fade-in');
            container.classList.add('fade-out');
        }
        if (orangeClock) {
            orangeClock.classList.add('visible');
            updateClock(); // Ensure clock is updated when shown
        }
    }, 5000); // 5 seconds of inactivity
}

function initializeFadeTimeout() {
    container = document.querySelector('.container');
    orangeClock = document.querySelector('.orange-clock');
    
    if (orangeClock) {
        startClock();
        updateClock(); // Initial update
    }
    
    // Reset fade timeout on any mouse movement or keyboard activity
    document.addEventListener('mousemove', resetFadeTimeout);
    document.addEventListener('click', resetFadeTimeout);
    document.addEventListener('keydown', resetFadeTimeout);
    
    // Initial fade timeout
    resetFadeTimeout();
}

document.addEventListener('DOMContentLoaded', function() {
    restoreState(); // Restore saved state
    initializeDragAndDrop();
    initializeEventListeners();
    initializeFadeTimeout(); // Initialize fade timeout functionality
    initializeContextMenu(); // Initialize context menu functionality
    // Ensure a default format is selected
    if (!document.querySelector('.format-option.selected')) {
        const htmlFormat = document.querySelector('.format-option[data-format="html"]');
        if (htmlFormat) {
            htmlFormat.classList.add('selected');
        }
    }
    
    // Initialize calendar preview
    initializeCalendarPreview();
    
    // Add event listeners for date changes
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const dimWeekends = document.getElementById('dimWeekends');
    
    [startDate, endDate].forEach(input => {
        input?.addEventListener('change', saveState);
    });
    
    dimWeekends?.addEventListener('change', saveState);
    
    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
    
    // Initialize other functionality
    if (!localStorage.getItem('Flags')) {
        const currentYear = new Date().getFullYear();
        const defaultFlags = getDefaultUSFlags(currentYear);
        localStorage.setItem('Flags', JSON.stringify(defaultFlags));
    }
    
    renderFlags();
    generateCalendar();
});

function isWeekend(date) {
    const day = getDay(date);
    return day === 0 || day === 6;
}

function getDayStyle(date, projectStartDate, projectEndDate, dimWeekends) {
    // Reset time portions to compare just the dates
    const compareDate = date.getTime();
    const startDate = new Date(projectStartDate).setHours(0, 0, 0, 0);
    const endDate = new Date(projectEndDate).setHours(23, 59, 59, 999);
    
    const isProjectDay = compareDate >= startDate && compareDate <= endDate;
    const weekend = isWeekend(date);
    const Flag = isFlag(date);
    
    if (!isProjectDay) {
        return { color: '#808080' }; // Gray for non-project days
    }
    
    if (Flag) {
        return { color: '#FFA500' }; // Orange for Flags
    }
    
    if (dimWeekends && weekend) {
        return { color: '#808080' }; // Gray for dimmed weekends
    }
    
    return { color: '#E6E6E6' }; // Soft white for active days
}

function isFlag(date) {
    const Flags = loadFlags();
    if (!Flags || Flags.length === 0) return false;
    
    return Flags.some(Flag => {
        try {
            const checkDate = new Date(date);
            const FlagStart = new Date(Flag.startDate);
            const FlagEnd = new Date(Flag.endDate || Flag.startDate);
            
            // Set time to midnight for comparison
            checkDate.setHours(0, 0, 0, 0);
            FlagStart.setHours(0, 0, 0, 0);
            FlagEnd.setHours(0, 0, 0, 0);
            
            return checkDate >= FlagStart && checkDate <= FlagEnd;
        } catch (e) {
            console.error('Invalid date in Flag check:', Flag);
            return false;
        }
    });
}

// Context menu functionality
function showContextMenu(e) {
    e.preventDefault();
    
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;
    
    // Position the menu at click coordinates
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    // Show the menu
    contextMenu.classList.add('show');
    
    // Ensure menu stays within viewport
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${e.clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${e.clientY - rect.height}px`;
    }
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.classList.remove('show');
    }
}

function initializeContextMenu() {
    // Add right-click event listener to show context menu
    document.addEventListener('contextmenu', showContextMenu);
    
    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        const contextMenu = document.getElementById('contextMenu');
        const fadeTimeout = document.getElementById('fadeTimeout');
        
        // Don't hide if clicking inside the menu or the timeout input
        if (contextMenu && fadeTimeout && 
            (contextMenu.contains(e.target) || fadeTimeout.contains(e.target))) {
            return;
        }
        
        hideContextMenu();
    });
    
    // Hide context menu when scrolling or resizing window
    document.addEventListener('scroll', hideContextMenu);
    window.addEventListener('resize', hideContextMenu);
}

function initializeCalendarPreview() {
    const hidePreviewBtn = document.querySelector('.hide-preview');
    const calendarPreview = document.getElementById('calendar-preview');

    hidePreviewBtn.addEventListener('click', () => {
        // Store position before hiding
        previewPosition = {
            left: calendarPreview.style.left,
            top: calendarPreview.style.top
        };
        calendarPreview.style.display = 'none';
    });

    // Initialize drag functionality for calendar preview
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    calendarPreview.addEventListener('mousedown', e => {
        if (e.target === calendarPreview || e.target.classList.contains('preview-header')) {
            isDragging = true;
            initialX = e.clientX - calendarPreview.offsetLeft;
            initialY = e.clientY - calendarPreview.offsetTop;
        }
    });

    document.addEventListener('mousemove', e => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            calendarPreview.style.left = currentX + 'px';
            calendarPreview.style.top = currentY + 'px';

            // Update stored position
            previewPosition = {
                left: calendarPreview.style.left,
                top: calendarPreview.style.top
            };
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function showCalendarPreview() {
    const calendarPreview = document.getElementById('calendar-preview');
    if (calendarPreview.style.display === 'none') {
        calendarPreview.style.display = 'block';
        
        // If there's a stored position from dragging, use that
        if (previewPosition.left !== '50%' || previewPosition.top !== '50%') {
            calendarPreview.style.left = previewPosition.left;
            calendarPreview.style.top = previewPosition.top;
        } else {
            // Center the preview in the viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const previewWidth = calendarPreview.offsetWidth;
            const previewHeight = calendarPreview.offsetHeight;
            
            const left = Math.max(0, (viewportWidth - previewWidth) / 2);
            const top = Math.max(0, (viewportHeight - previewHeight) / 2);
            
            calendarPreview.style.left = `${left}px`;
            calendarPreview.style.top = `${top}px`;
            
            // Update stored position
            previewPosition.left = calendarPreview.style.left;
            previewPosition.top = calendarPreview.style.top;
        }
    }
}

function validateDateRange(startDate, endDate) {
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
    return monthDiff <= 15; // 16 months including start month
}

function generateCalendar() {
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;
    const dimWeekends = document.getElementById('dimWeekends').checked;
    const preview = document.querySelector('.preview');
    
    if (!startDateStr || !endDateStr) {
        preview.innerHTML = '<p>Please select both start and end dates.</p>';
        return;
    }
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Validate date range
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    if (monthDiff > 16) {
        preview.innerHTML = '<p>Date range cannot exceed 16 months.</p>';
        return;
    }
    
    const selectedFormat = document.querySelector('.format-option.selected');
    const formatType = selectedFormat ? selectedFormat.dataset.format : 'html'; // Default to HTML if no format selected
    let calendarHtml = '';
    
    // Generate title
    const dateRange = `<h2 style="color: white; margin-bottom: 20px;">${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}</h2>`

    calendarHtml += dateRange;
    
    // Generate calendar for each month in the range
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const lastDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    while (currentDate <= lastDate) {
        const monthCalendar = `<div class="calendar-month">${generateMonthCalendar(currentDate, formatType, startDate, endDate, dimWeekends)}</div>`;
        calendarHtml += monthCalendar;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    preview.innerHTML = calendarHtml;
}

function generateMonthCalendar(month, formatType, projectStartDate, projectEndDate, dimWeekends) {
    let calendarHtml = '';
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    calendarHtml += '<table bgcolor="#2D2D2D" style="border-collapse: collapse;" cellspacing="0" cellpadding="0" border="1" width="100%">' +
        '<thead>' +
        '<tr><th colspan="7" align="left" bgcolor="#2D2D2D" style="color: white; padding: 8px;">' +
        format(month, 'yyyy') + ' ' + format(month, 'MMMM') +
        '</th></tr><tr bgcolor="#E8E8E8">';

    // Weekday headers
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
        calendarHtml += '<th align="center" width="14%" style="color: #333333; padding: 4px;">' + day + '</th>';
    });

    calendarHtml += '</tr></thead><tbody>';

    let currentWeek = [];
    const firstDayOfMonth = getDay(monthStart);

    // Fill in empty cells for the first week
    for (let i = 0; i < firstDayOfMonth; i++) {
        currentWeek.push('');
    }

    days.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            calendarHtml += createHtmlWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
            currentWeek = [];
        }
    });

    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push('');
        }
        calendarHtml += createHtmlWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
    }

    calendarHtml += '</tbody></table>';
    return calendarHtml;
}

function createHtmlWeekRow(week, projectStartDate, projectEndDate, dimWeekends) {
    let row = '<tr>';
    week.forEach(day => {
        if (day === '') {
            row += '<td align="center" style="color: white; padding: 4px;"></td>';
        } else {
            const isFlagDate = isFlag(day);
            const isWeekendDay = isWeekend(day);
            const color = isFlagDate ? '#FFA500' : (dimWeekends && isWeekendDay ? '#808080' : 'white');
            row += '<td align="center" style="color: ' + color + '; padding: 4px;">' + format(day, 'd') + '</td>';
        }
    });
    return row + '</tr>';
}

function generateHtmlCalendar(start, end, projectStartDate, projectEndDate, dimWeekends) {
    let calendarHtml = '';
    let currentDate = start;
    
    while (currentDate <= end) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        calendarHtml += '<table bgcolor="#2D2D2D" style="border-collapse: collapse;" cellspacing="0" cellpadding="0" border="1" width="100%">' +
            '<thead>' +
            '<tr><th colspan="7" align="left" bgcolor="#2D2D2D" style="color: white; padding: 8px;">' +
            format(currentDate, 'yyyy') + ' ' + format(currentDate, 'MMMM') +
            '</th></tr><tr bgcolor="#E8E8E8">';

        // Weekday headers
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            calendarHtml += '<th align="center" width="14%" style="color: #333333; padding: 4px;">' + day + '</th>';
        });

        calendarHtml += '</tr></thead><tbody>';

        let currentWeek = [];
        const firstDayOfMonth = getDay(monthStart);

        // Fill in empty cells for the first week
        for (let i = 0; i < firstDayOfMonth; i++) {
            currentWeek.push('');
        }

        days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                calendarHtml += createHtmlWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push('');
            }
            calendarHtml += createHtmlWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
        }

        calendarHtml += '</tbody></table>';
        currentDate = addMonths(currentDate, 1);
    }
    
    return calendarHtml;
}

function generateTextCalendar(start, end, projectStartDate, projectEndDate, dimWeekends) {
    let calendarText = '';
    let currentDate = start;
    
    while (currentDate <= end) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Month header
        calendarText += `\n${format(currentDate, 'yyyy MMMM')}\n`;
        calendarText += 'Su  Mo  Tu  We  Th  Fr  Sa\n';
        calendarText += '----------------------------\n';

        let currentWeek = [];
        const firstDayOfMonth = getDay(monthStart);

        // Add initial spaces
        for (let i = 0; i < firstDayOfMonth; i++) {
            currentWeek.push('  ');
        }

        days.forEach(day => {
            currentWeek.push(day ? format(day, 'd').padStart(2) : '  ');
            if (currentWeek.length === 7) {
                calendarText += currentWeek.join('  ') + '\n';
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push('  ');
            }
            calendarText += currentWeek.join('  ') + '\n';
        }

        calendarText += '\n';
        currentDate = addMonths(currentDate, 1);
    }

    return calendarText;
}

function generateMarkdownCalendar(start, end, projectStartDate, projectEndDate, dimWeekends) {
    let markdownText = '';
    let currentDate = start;
    
    while (currentDate <= end) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Month header
        markdownText += `\n### ${format(currentDate, 'yyyy MMMM')}\n\n`;
        markdownText += '| Su | Mo | Tu | We | Th | Fr | Sa |\n';
        markdownText += '|----|----|----|----|----|----|----|\n';

        let currentWeek = [];
        const firstDayOfMonth = getDay(monthStart);

        // Add initial spaces
        for (let i = 0; i < firstDayOfMonth; i++) {
            currentWeek.push('   ');
        }

        days.forEach(day => {
            currentWeek.push(day ? format(day, 'd').padStart(2) : '   ');
            if (currentWeek.length === 7) {
                markdownText += '| ' + currentWeek.join(' | ') + ' |\n';
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push('   ');
            }
            markdownText += '| ' + currentWeek.join(' | ') + ' |\n';
        }

        markdownText += '\n';
        currentDate = addMonths(currentDate, 1);
    }

    return markdownText;
}

function generateWordCalendar(start, end, projectStartDate, projectEndDate, dimWeekends) {
    let calendarHtml = '<div data-render-src="onenote-calendar" style="font-family: Calibri, sans-serif;">';
    let currentDate = start;
    let isFirstMonth = true;
    
    while (currentDate <= end) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        calendarHtml += `<div data-render-src="month-header" style="margin: ${isFirstMonth ? '5px' : '20px'} 0 5px 0; color: #E6E6E6; background-color: #2D2D2D; padding: 5px;">${format(currentDate, 'yyyy MMMM')}</div>`;
        
        calendarHtml += `
            <table data-render-src="calendar-table" style="border-collapse: collapse; width: 100%; margin-bottom: 40px; -webkit-border-horizontal-spacing: 0px; -webkit-border-vertical-spacing: 0px;">`;

        // Weekday headers
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        calendarHtml += '<tr>';
        weekDays.forEach(day => {
            calendarHtml += `<td data-render-src="header-cell" style="border: 1px solid #808080; padding: 5px; text-align: center; width: 14.28%; font-weight: bold; color: #333333; background-color: #E6E6E6;">${day}</td>`;
        });
        calendarHtml += '</tr>';

        let currentWeek = [];
        const firstDayOfMonth = getDay(monthStart);

        for (let i = 0; i < firstDayOfMonth; i++) {
            currentWeek.push('');
        }

        days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                calendarHtml += createWordWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push('');
            }
            calendarHtml += createWordWeekRow(currentWeek, projectStartDate, projectEndDate, dimWeekends);
        }

        calendarHtml += '</table>';
        currentDate = addMonths(currentDate, 1);
        isFirstMonth = false;
    }

    return calendarHtml + '</div>';
}

function createWordWeekRow(week, projectStartDate, projectEndDate, dimWeekends) {
    let row = '<tr>';
    week.forEach(day => {
        const style = day ? getDayStyle(day, projectStartDate, projectEndDate, dimWeekends) : { color: '#808080' };
        const cellStyle = [
            'border: 1px solid #808080',
            'padding: 5px',
            'text-align: center',
            'height: 20px',
            `color: ${style.color}`,
            '-webkit-border-horizontal-spacing: 0px',
            '-webkit-border-vertical-spacing: 0px'
        ].join(';');
        
        row += `<td data-render-src="day-cell" style="${cellStyle}">${day ? format(day, 'd') : ''}</td>`;
    });
    return row + '</tr>';
}

document.addEventListener('DOMContentLoaded', function() {
    restoreState(); // Restore saved state
    initializeDragAndDrop();
    initializeEventListeners();
    initializeFadeTimeout(); // Initialize fade timeout functionality
    initializeContextMenu(); // Initialize context menu functionality
    // Ensure a default format is selected
    if (!document.querySelector('.format-option.selected')) {
        const htmlFormat = document.querySelector('.format-option[data-format="html"]');
        if (htmlFormat) {
            htmlFormat.classList.add('selected');
        }
    }
    
    // Initialize calendar preview
    initializeCalendarPreview();
    
    // Add event listeners for date changes
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const dimWeekends = document.getElementById('dimWeekends');
    
    [startDate, endDate].forEach(input => {
        input?.addEventListener('change', saveState);
    });
    
    dimWeekends?.addEventListener('change', saveState);
    
    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
    
    // Initialize other functionality
    if (!localStorage.getItem('Flags')) {
        const currentYear = new Date().getFullYear();
        const defaultFlags = getDefaultUSFlags(currentYear);
        localStorage.setItem('Flags', JSON.stringify(defaultFlags));
    }
    
    renderFlags();
    generateCalendar();
});
