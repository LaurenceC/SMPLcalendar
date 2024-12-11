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
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = holiday.name;
        nameSpan.className = 'holiday-name';
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'holiday-dates';
        if (holiday.startDate === holiday.endDate) {
            dateSpan.textContent = format(new Date(holiday.startDate), 'MMM d, yyyy');
        } else {
            dateSpan.textContent = `${format(new Date(holiday.startDate), 'MMM d, yyyy')} - ${format(new Date(holiday.endDate), 'MMM d, yyyy')}`;
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-holiday';
        deleteButton.textContent = '×';
        deleteButton.dataset.startDate = holiday.startDate;
        deleteButton.dataset.endDate = holiday.endDate;
        
        const holidayInfo = document.createElement('div');
        holidayInfo.className = 'holiday-info';
        holidayInfo.appendChild(nameSpan);
        holidayInfo.appendChild(dateSpan);
        
        holidayItem.appendChild(holidayInfo);
        holidayItem.appendChild(deleteButton);
        holidayList.appendChild(holidayItem);
    });
}

function addHoliday(name, startDate, endDate = null) {
    const holidays = loadHolidays();
    const holiday = {
        name,
        startDate: startDate,
        endDate: endDate || startDate
    };
    
    holidays.push(holiday);
    localStorage.setItem('holidays', JSON.stringify(holidays));
    renderHolidays();
    generateCalendar();
}

function deleteHoliday(startDate, endDate) {
    const holidays = loadHolidays();
    console.log('Before delete:', holidays);
    console.log('Deleting holiday with startDate:', startDate, 'endDate:', endDate);
    
    const updatedHolidays = holidays.filter(h => {
        const match = !(h.startDate === startDate && h.endDate === endDate);
        console.log('Holiday:', h, 'Match:', match);
        return match;
    });
    
    console.log('After delete:', updatedHolidays);
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
    renderHolidays();
    generateCalendar();
}

function loadHolidays() {
    const holidaysJson = localStorage.getItem('holidays');
    return holidaysJson ? JSON.parse(holidaysJson) : [];
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
    if (!currentConfig.holidays) return null;
    
    const holiday = currentConfig.holidays.find(holiday => {
        try {
            const checkDate = new Date(date);
            const holidayStart = new Date(holiday.startDate || holiday.date);
            const holidayEnd = new Date(holiday.endDate || holiday.startDate || holiday.date);
            
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

function initializeHolidaysIfFirstTime() {
    const isFirstTime = !localStorage.getItem('holidaysInitialized');
    if (isFirstTime) {
        const currentYear = new Date().getFullYear();
        const defaultHolidays = getDefaultUSHolidays(currentYear);
        localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
        localStorage.setItem('holidaysInitialized', 'true');
        return defaultHolidays;
    }
    return null;
}

function resetToDefaultHolidays() {
    const currentYear = new Date().getFullYear();
    const defaultHolidays = getDefaultUSHolidays(currentYear);
    localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
    
    // Clear and rebuild the holiday list UI
    const holidayList = document.getElementById('holidayList');
    holidayList.innerHTML = '';
    defaultHolidays.forEach(holiday => {
        addHolidayToList(holiday);
    });
    
    // Update the calendar
    updateCalendar();
}

function addHolidayToList(holiday) {
    const holidayItem = document.createElement('div');
    holidayItem.className = 'holiday-item';
    
    let dateDisplay;
    try {
        const startDate = new Date(holiday.startDate);
        const endDate = new Date(holiday.endDate);

        if (holiday.endDate && holiday.endDate !== holiday.startDate) {
            dateDisplay = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
        } else {
            dateDisplay = format(startDate, 'MMM d, yyyy');
        }
    } catch (e) {
        console.error('Invalid date in holiday:', holiday);
        dateDisplay = 'Invalid date';
    }
    
    holidayItem.innerHTML = `
        <div class="holiday-info">
            <div class="holiday-name">${holiday.name}</div>
            <div class="holiday-date">${dateDisplay}</div>
        </div>
        <button class="delete-holiday" data-start-date="${holiday.startDate}" data-end-date="${holiday.endDate}">×</button>
    `;
    document.getElementById('holidayList').appendChild(holidayItem);
}

function updateCalendar() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const dimWeekends = document.getElementById('dimWeekends').checked;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    // Set the time portions for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get the first and last months to display
    const start = startOfMonth(startDate);
    const end = endOfMonth(endDate);
    const format = getCurrentFormat();
    
    let calendarContent;
    switch (format) {
        case 'word':
            calendarContent = generateWordCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'html':
            calendarContent = generateHtmlCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'text':
            calendarContent = generateTextCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'markdown':
            calendarContent = generateMarkdownCalendar(start, end, startDate, endDate, dimWeekends);
            break;
    }
    
    const preview = document.querySelector('.preview');
    if (format === 'text' || format === 'markdown') {
        preview.innerHTML = `<pre style="color: #E6E6E6;">${calendarContent}</pre>`;
    } else {
        preview.innerHTML = calendarContent;
    }
    document.getElementById('calendar-output').style.display = 'block';
    
    // Save state after generating calendar
    saveLastState();
}

document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copy');
    const addHolidayButton = document.getElementById('addHoliday');
    const resetHolidaysButton = document.getElementById('resetHolidays');
    const holidayList = document.getElementById('holidayList');
    const preview = document.querySelector('.preview');
    const successMessage = document.getElementById('successMessage');
    const formatOptions = document.querySelectorAll('.format-option');
    const holidayStartDate = document.getElementById('holidayStartDate');
    const holidayEndDate = document.getElementById('holidayEndDate');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const dimWeekends = document.getElementById('dimWeekends');
    
    // Load saved configuration
    loadConfig();

    // Generate initial calendar
    generateCalendar();

    copyButton.addEventListener('click', copyToClipboard);
    
    // Auto-update end date when start date changes
    holidayStartDate.addEventListener('change', (e) => {
        if (!holidayEndDate.value) {
            holidayEndDate.value = e.target.value;
        }
        holidayEndDate.min = e.target.value; // Prevent end date before start date
    });

    // Generate calendar when inputs change
    startDate.addEventListener('change', () => {
        generateCalendar();
        saveLastState();
    });

    endDate.addEventListener('change', () => {
        generateCalendar();
        saveLastState();
    });

    dimWeekends.addEventListener('change', () => {
        generateCalendar();
        saveLastState();
    });
    
    addHolidayButton.addEventListener('click', () => {
        const name = document.getElementById('holidayName').value.trim();
        const startDate = holidayStartDate.value;
        const endDate = holidayEndDate.value || startDate; // Use start date if end date is empty
        
        if (!name || !startDate) {
            alert('Please enter holiday name and start date');
            return;
        }
        
        if (new Date(endDate) < new Date(startDate)) {
            alert('End date must be after or equal to start date');
            return;
        }
        
        addHoliday(name, startDate, endDate);
        
        // Clear inputs
        document.getElementById('holidayName').value = '';
        holidayStartDate.value = '';
        holidayEndDate.value = '';
    });
    
    document.getElementById('holidayList').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-holiday')) {
            const startDate = e.target.dataset.startDate;
            const endDate = e.target.dataset.endDate;
            if (startDate && endDate) {
                deleteHoliday(startDate, endDate);
            }
        }
    });
    
    formatOptions.forEach(option => {
        option.addEventListener('click', () => {
            formatOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            generateCalendar();
            saveLastState();
        });
    });
    
    resetHolidaysButton.addEventListener('click', () => {
        if (confirm('This will reset all holidays to the default US holidays. Are you sure?')) {
            resetToDefaultHolidays();
        }
    });
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

function generateCalendar() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const dimWeekends = document.getElementById('dimWeekends').checked;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    // Set the time portions for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get the first and last months to display
    const start = startOfMonth(startDate);
    const end = endOfMonth(endDate);
    const format = getCurrentFormat();
    
    let calendarContent;
    switch (format) {
        case 'word':
            calendarContent = generateWordCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'html':
            calendarContent = generateHtmlCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'text':
            calendarContent = generateTextCalendar(start, end, startDate, endDate, dimWeekends);
            break;
        case 'markdown':
            calendarContent = generateMarkdownCalendar(start, end, startDate, endDate, dimWeekends);
            break;
    }
    
    const preview = document.querySelector('.preview');
    if (format === 'text' || format === 'markdown') {
        preview.innerHTML = `<pre style="color: #E6E6E6;">${calendarContent}</pre>`;
    } else {
        preview.innerHTML = calendarContent;
    }
    document.getElementById('calendar-output').style.display = 'block';
    
    // Save state after generating calendar
    saveLastState();
}

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

        // Fill in empty cells for the last week
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
    let row = '<tr bgcolor="#2D2D2D">';
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

async function copyToClipboard() {
    const preview = document.querySelector('.preview');
    const successMessage = document.getElementById('successMessage');
    const format = getCurrentFormat();
    
    try {
        let content;
        if (format === 'text' || format === 'markdown') {
            content = preview.textContent.trim();
            await navigator.clipboard.writeText(content);
        } else {
            // Clean up the HTML by removing extra whitespace
            content = preview.innerHTML
                .replace(/>\s+</g, '><')  // Remove whitespace between tags
                .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
                .trim();                  // Remove leading/trailing whitespace
            
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([content], { type: 'text/html' }),
                'text/plain': new Blob([preview.textContent.trim()], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);
        }
        
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 2000);
    } catch (err) {
        console.error('Clipboard error:', err);
        // Fallback to older method if Clipboard API fails
        const textarea = document.createElement('textarea');
        textarea.value = format === 'text' || format === 'markdown' 
            ? preview.textContent.trim() 
            : preview.innerHTML.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 2000);
    }
}
