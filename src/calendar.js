import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, parse, addMonths } from 'date-fns';
import config from './config.json';

let currentConfig = { ...config };

function saveConfig() {
    // In a real application, this would be an API call
    // For now, we'll just update our local copy
    localStorage.setItem('calendarConfig', JSON.stringify(currentConfig));
}

function loadConfig() {
    const savedConfig = localStorage.getItem('calendarConfig');
    if (savedConfig) {
        currentConfig = JSON.parse(savedConfig);
        
        // Migrate old holiday format to new format
        if (currentConfig.holidays) {
            currentConfig.holidays = currentConfig.holidays.map(holiday => {
                if (holiday.date && !holiday.startDate) {
                    return {
                        name: holiday.name,
                        startDate: holiday.date,
                        endDate: holiday.date
                    };
                }
                return holiday;
            });
            // Save migrated config
            saveConfig();
        }
        
        // Restore last state
        if (currentConfig.lastState) {
            const { startDate, endDate, dimWeekends, selectedFormat } = currentConfig.lastState;
            if (startDate) document.getElementById('startDate').value = startDate;
            if (endDate) document.getElementById('endDate').value = endDate;
            document.getElementById('dimWeekends').checked = dimWeekends;
            
            // Set format
            const formatOptions = document.querySelectorAll('.format-option');
            formatOptions.forEach(option => {
                if (option.dataset.format === selectedFormat) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }
        
        // Render holidays
        renderHolidays();
    }
}

function renderHolidays() {
    const holidayList = document.getElementById('holidayList');
    if (!holidayList) return;
    
    holidayList.innerHTML = '';
    
    const holidays = loadHolidays();
    if (!holidays || holidays.length === 0) {
        return;
    }
    
    holidays.sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA - dateB;
    }).forEach(holiday => {
        const holidayItem = document.createElement('div');
        holidayItem.className = 'holiday-item';
        
        const holidayInfo = document.createElement('div');
        holidayInfo.className = 'holiday-info';
        
        const nameSpan = document.createElement('div');
        nameSpan.textContent = holiday.name;
        nameSpan.className = 'holiday-name';
        
        const dateSpan = document.createElement('div');
        dateSpan.className = 'holiday-date';
        if (holiday.startDate === holiday.endDate) {
            dateSpan.textContent = format(new Date(holiday.startDate), 'MMM d, yyyy');
        } else {
            dateSpan.textContent = `${format(new Date(holiday.startDate), 'MMM d, yyyy')} - ${format(new Date(holiday.endDate), 'MMM d, yyyy')}`;
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-holiday';
        deleteButton.textContent = '×';
        deleteButton.onclick = () => {
            deleteHoliday(holiday.startDate, holiday.endDate);
        };
        
        holidayInfo.appendChild(nameSpan);
        holidayInfo.appendChild(dateSpan);
        holidayItem.appendChild(holidayInfo);
        holidayItem.appendChild(deleteButton);
        holidayList.appendChild(holidayItem);
    });
}

function loadHolidays() {
    const holidaysJson = localStorage.getItem('holidays');
    return holidaysJson ? JSON.parse(holidaysJson) : [];
}

function addHoliday(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('holidayName');
    const startDateInput = document.getElementById('holidayStartDate');
    const endDateInput = document.getElementById('holidayEndDate');
    
    const name = nameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value || startDate;
    
    if (!name || !startDate) {
        alert('Please enter a holiday name and start date');
        return;
    }
    
    const holidays = loadHolidays();
    const holiday = {
        name,
        startDate,
        endDate
    };
    
    holidays.push(holiday);
    localStorage.setItem('holidays', JSON.stringify(holidays));
    
    // Clear form
    nameInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
    
    renderHolidays();
    generateCalendar();
}

function deleteHoliday(startDate, endDate) {
    const holidays = loadHolidays();
    const updatedHolidays = holidays.filter(h => 
        !(h.startDate === startDate && h.endDate === endDate)
    );
    
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
    renderHolidays();
    generateCalendar();
}

function initializeEventListeners() {
    // Add holiday form submission
    const addHolidayButton = document.getElementById('addHoliday');
    if (addHolidayButton) {
        addHolidayButton.onclick = addHoliday;
    }
    
    // Reset holidays button
    const resetButton = document.querySelector('.reset-holidays');
    if (resetButton) {
        resetButton.onclick = () => {
            const currentYear = new Date().getFullYear();
            const defaultHolidays = getDefaultUSHolidays(currentYear);
            localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
            renderHolidays();
            generateCalendar();
        };
    }
}

function getDefaultUSHolidays(year) {
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

document.addEventListener('DOMContentLoaded', function() {
    // Initialize holidays if first time
    if (!localStorage.getItem('holidays')) {
        const currentYear = new Date().getFullYear();
        const defaultHolidays = getDefaultUSHolidays(currentYear);
        localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
    }
    
    // Load and render holidays
    renderHolidays();
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Add click event listeners to format options
    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', function() {
            // Update selected state
            document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

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
                
                // Show calendar preview if hidden
                const calendarPreview = document.getElementById('calendar-preview');
                if (calendarPreview.style.display === 'none') {
                    calendarPreview.style.display = 'block';
                    if (previewPosition.left && previewPosition.top) {
                        calendarPreview.style.left = previewPosition.left;
                        calendarPreview.style.top = previewPosition.top;
                    }
                }
            }
            
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

function updatePreviewTitle() {
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;
    const previewTitle = document.querySelector('.preview-title');
    
    if (!startDateStr || !endDateStr || !previewTitle) {
        previewTitle.textContent = 'Calendar Preview';
        return;
    }
    
    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            previewTitle.textContent = 'Calendar Preview';
            return;
        }
        
        if (startDate.getFullYear() === endDate.getFullYear()) {
            if (startDate.getMonth() === endDate.getMonth()) {
                // Same month and year
                previewTitle.textContent = format(startDate, 'MMMM yyyy');
            } else {
                // Same year, different months
                previewTitle.textContent = `${format(startDate, 'MMM')} - ${format(endDate, 'MMM yyyy')}`;
            }
        } else {
            // Different years
            previewTitle.textContent = `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
        }
    } catch (error) {
        console.error('Error updating preview title:', error);
        previewTitle.textContent = 'Calendar Preview';
    }
}

// Store calendar preview position
let previewPosition = { left: '50%', top: '50%' };

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
        calendarPreview.style.left = previewPosition.left;
        calendarPreview.style.top = previewPosition.top;
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
    
    // Only proceed if we have both dates
    if (!startDateStr || !endDateStr) {
        return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate date range
    if (!validateDateRange(startDate, endDate)) {
        alert('Date range cannot exceed 16 months');
        return;
    }

    // Set the time portions for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Update preview title
    updatePreviewTitle();

    // Get the first and last months to display
    const start = startOfMonth(startDate);
    const end = endOfMonth(endDate);
    
    // Generate preview content (always Word format)
    const previewContent = generateWordCalendar(start, end, startDate, endDate, dimWeekends);
    
    // Generate content in selected format for clipboard
    const format = getCurrentFormat();
    let clipboardContent;
    switch (format) {
        case 'word':
            clipboardContent = previewContent;
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
    
    // Update preview with Word format
    const preview = document.querySelector('.preview');
    preview.innerHTML = previewContent;
    
    // Calculate months difference for sizing
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth()) + 1;
    
    // Make sure the preview is visible and positioned
    const calendarPreview = document.getElementById('calendar-preview');
    calendarPreview.style.display = 'block';
    if (!calendarPreview.style.left && !calendarPreview.style.top) {
        calendarPreview.style.left = '50%';
        calendarPreview.style.top = '50%';
    }
    
    // Adjust preview height based on number of months
    preview.style.height = `${Math.min(70, Math.max(monthDiff * 15, 30))}vh`;
    
    // Copy selected format to clipboard
    navigator.clipboard.writeText(clipboardContent);
    
    // Save state
    saveLastState();
}

// Initialize calendar preview when document is loaded
document.addEventListener('DOMContentLoaded', initializeCalendarPreview);

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
    const holiday = isHoliday(date);
    
    if (!isProjectDay) {
        return { color: '#808080' }; // Gray for non-project days
    }
    
    if (holiday) {
        return { color: '#FFA500' }; // Orange for holidays
    }
    
    if (dimWeekends && weekend) {
        return { color: '#808080' }; // Gray for dimmed weekends
    }
    
    return { color: '#E6E6E6' }; // Soft white for active days
}

function isHoliday(date) {
    const holidays = loadHolidays();
    if (!holidays || holidays.length === 0) return false;
    
    return holidays.some(holiday => {
        try {
            const checkDate = new Date(date);
            const holidayStart = new Date(holiday.startDate);
            const holidayEnd = new Date(holiday.endDate || holiday.startDate);
            
            // Set time to midnight for comparison
            checkDate.setHours(0, 0, 0, 0);
            holidayStart.setHours(0, 0, 0, 0);
            holidayEnd.setHours(0, 0, 0, 0);
            
            return checkDate >= holidayStart && checkDate <= holidayEnd;
        } catch (e) {
            console.error('Invalid date in holiday check:', holiday);
            return false;
        }
    });
}

function getHolidayName(date) {
    const holidays = loadHolidays();
    if (!holidays || holidays.length === 0) return null;
    
    const holiday = holidays.find(holiday => {
        try {
            const checkDate = new Date(date);
            const holidayStart = new Date(holiday.startDate);
            const holidayEnd = new Date(holiday.endDate || holiday.startDate);
            
            // Set time to midnight for comparison
            checkDate.setHours(0, 0, 0, 0);
            holidayStart.setHours(0, 0, 0, 0);
            holidayEnd.setHours(0, 0, 0, 0);
            
            return checkDate >= holidayStart && checkDate <= holidayEnd;
        } catch (e) {
            console.error('Invalid date in holiday name check:', holiday);
            return false;
        }
    });
    return holiday ? holiday.name : null;
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
            calendarHtml += '<th align="center" width="14%" style="padding: 4px;">' + day + '</th>';
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

function createHtmlWeekRow(week, projectStartDate, projectEndDate, dimWeekends) {
    let row = '<tr>';
    week.forEach(day => {
        if (day === '') {
            row += '<td align="center" style="color: white; padding: 4px;"></td>';
        } else {
            const isHolidayDate = isHoliday(day);
            const isWeekendDay = isWeekend(day);
            const color = isHolidayDate ? '#FFA500' : (dimWeekends && isWeekendDay ? '#808080' : 'white');
            row += '<td align="center" style="color: ' + color + '; padding: 4px;">' + format(day, 'd') + '</td>';
        }
    });
    return row + '</tr>';
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
            calendarHtml += `<td data-render-src="header-cell" style="border: 1px solid #808080; padding: 5px; text-align: center; width: 14.28%; font-weight: bold; color: #2D2D2D; background-color: #E6E6E6;">${day}</td>`;
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
    row += '</tr>';
    return row;
}

async function initializeDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    let selectedElement = null;
    let offsetX = 0;
    let offsetY = 0;

    // Set initial positions
    draggables.forEach(element => {
        const rect = element.getBoundingClientRect();
        element.style.position = 'absolute';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';

        element.addEventListener('mousedown', function(e) {
            // Ignore if clicking on input, button, or any interactive element
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'button' ||
                e.target.tagName.toLowerCase() === 'select' ||
                e.target.tagName.toLowerCase() === 'textarea' ||
                e.target.closest('.holiday-form') ||
                e.target.closest('.format-controls')) {
                return;
            }
            
            e.preventDefault();
            selectedElement = element;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            element.classList.add('dragging');
        });
    });

    document.addEventListener('mousemove', function(e) {
        if (selectedElement) {
            e.preventDefault();
            selectedElement.style.left = (e.clientX - offsetX) + 'px';
            selectedElement.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        if (selectedElement) {
            selectedElement.classList.remove('dragging');
            selectedElement = null;
        }
    });
}
