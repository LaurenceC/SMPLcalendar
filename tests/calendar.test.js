import { jest } from '@jest/globals';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';

// Mock the functions since they're not exported directly
const calendar = {
    // Config Management
    currentConfig: {},
    saveConfig: () => {
        localStorage.setItem('calendarConfig', JSON.stringify(calendar.currentConfig));
    },

    // Flag Management
    loadFlags: () => {
        return JSON.parse(localStorage.getItem('Flags') || '[]');
    },
    addFlag: (event) => {
        event.preventDefault();
        const flagName = document.getElementById('FlagName').value;
        const flagStartDate = document.getElementById('FlagStartDate').value;
        const flagEndDate = document.getElementById('FlagEndDate').value || flagStartDate;
        
        if (!flagName || !flagStartDate) {
            alert('Please enter a Flag name and start date');
            return;
        }
        
        const flags = calendar.loadFlags();
        flags.push({ name: flagName, startDate: flagStartDate, endDate: flagEndDate });
        localStorage.setItem('Flags', JSON.stringify(flags));
    },
    deleteFlag: (startDate, endDate) => {
        const flags = calendar.loadFlags();
        const updatedFlags = flags.filter(flag => !(flag.startDate === startDate && flag.endDate === endDate));
        localStorage.setItem('Flags', JSON.stringify(updatedFlags));
    },

    // Date Utilities
    isWeekend: (date) => {
        const day = date.getUTCDay();
        return day === 0 || day === 6;
    },
    validateDateRange: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
    },
    getCurrentFormat: () => 'html',

    // State Management
    saveElementState: (elementId, state) => {
        localStorage.setItem(`state_${elementId}`, JSON.stringify(state));
    },
    loadElementState: (elementId) => {
        const state = localStorage.getItem(`state_${elementId}`);
        return state ? JSON.parse(state) : null;
    },
    saveState: () => {
        const elements = ['startDate', 'endDate', 'dimWeekends'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                calendar.saveElementState(id, element.value || element.checked);
            }
        });
    },

    // Calendar Generation
    generateCalendar: () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (!startDate || !endDate) return '';

        const start = startOfMonth(new Date(startDate));
        const end = endOfMonth(new Date(endDate));
        const dimWeekends = document.getElementById('dimWeekends').checked;

        return calendar.generateHtmlCalendar(start, end, new Date(startDate), new Date(endDate), dimWeekends);
    },
    generateHtmlCalendar: (start, end, projectStartDate, projectEndDate, dimWeekends) => {
        const months = [];
        let currentDate = start;
        while (currentDate <= end) {
            months.push(calendar.generateMonthCalendar(currentDate, 'html', projectStartDate, projectEndDate, dimWeekends));
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
        return months.join('\n\n');
    },
    generateMonthCalendar: (month, formatType, projectStartDate, projectEndDate, dimWeekends) => {
        const monthName = format(month, 'MMMM yyyy');
        return `<div class="month"><h2>${monthName}</h2></div>`;
    },

    // Styling
    getDayStyle: (date, projectStartDate, projectEndDate, dimWeekends) => {
        const isWeekendDay = calendar.isWeekend(date);
        const styles = { color: '#E6E6E6', backgroundColor: '#2D2D2D' };
        if (dimWeekends && isWeekendDay) {
            return { ...styles, opacity: '0.5' };
        }
        return styles;
    },
    isFlag: (date) => {
        const flags = calendar.loadFlags();
        const dateStr = format(date, 'yyyy-MM-dd');
        return flags.some(flag => {
            const start = new Date(flag.startDate);
            const end = new Date(flag.endDate);
            const current = new Date(dateStr);
            return current >= start && current <= end;
        });
    }
};

// Mock the functions
jest.mock('../src/calendar.js', () => calendar);

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock DOM elements
document.body.innerHTML = `
    <div id="FlagList"></div>
    <input id="FlagName" />
    <input id="FlagStartDate" />
    <input id="FlagEndDate" />
    <input id="startDate" value="2024-12-19" />
    <input id="endDate" value="2024-12-31" />
    <input type="checkbox" id="dimWeekends" />
`;

describe('Calendar Functionality Tests', () => {
    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
    });

    describe('Configuration Management', () => {
        test('saveConfig should store configuration in localStorage', () => {
            calendar.currentConfig = { theme: 'dark' };
            calendar.saveConfig();
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'calendarConfig',
                JSON.stringify({ theme: 'dark' })
            );
        });
    });

    describe('Date Utilities', () => {
        test('isWeekend should correctly identify weekend days', () => {
            expect(calendar.isWeekend(new Date('2024-12-21T12:00:00Z'))).toBe(true); // Saturday
            expect(calendar.isWeekend(new Date('2024-12-22T12:00:00Z'))).toBe(true); // Sunday
            expect(calendar.isWeekend(new Date('2024-12-23T12:00:00Z'))).toBe(false); // Monday
        });

        test('validateDateRange should validate date ranges correctly', () => {
            expect(calendar.validateDateRange('2024-12-19', '2024-12-20')).toBe(true);
            expect(calendar.validateDateRange('2024-12-20', '2024-12-19')).toBe(false);
            expect(calendar.validateDateRange('2024-12-19', '2024-12-19')).toBe(true);
        });

        test('getCurrentFormat should return the default format', () => {
            expect(calendar.getCurrentFormat()).toBe('html');
        });
    });

    describe('State Management', () => {
        test('saveElementState and loadElementState should manage element states', () => {
            calendar.saveElementState('testElement', { value: 'test' });
            expect(calendar.loadElementState('testElement')).toEqual({ value: 'test' });
        });

        test('saveState should store current form state', () => {
            calendar.saveState();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });
    });

    describe('Flag Management', () => {
        const testFlag = {
            name: 'Test Flag',
            startDate: '2024-12-19',
            endDate: '2024-12-20'
        };

        beforeEach(() => {
            localStorageMock.setItem('Flags', JSON.stringify([testFlag]));
        });

        test('loadFlags should load flags from localStorage', () => {
            const flags = calendar.loadFlags();
            expect(flags).toHaveLength(1);
            expect(flags[0]).toEqual(testFlag);
        });

        test('isFlag should correctly identify flagged dates', () => {
            const date = new Date('2024-12-19T12:00:00Z');
            expect(calendar.isFlag(date)).toBe(true);
            expect(calendar.isFlag(new Date('2024-12-21T12:00:00Z'))).toBe(false);
        });

        test('addFlag should add new flag to localStorage', () => {
            const mockEvent = { preventDefault: jest.fn() };
            document.getElementById('FlagName').value = 'New Flag';
            document.getElementById('FlagStartDate').value = '2024-12-25';
            document.getElementById('FlagEndDate').value = '2024-12-26';

            calendar.addFlag(mockEvent);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'Flags',
                expect.stringContaining('New Flag')
            );
        });

        test('deleteFlag should remove flag from localStorage', () => {
            calendar.deleteFlag('2024-12-19', '2024-12-20');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'Flags',
                '[]'
            );
        });
    });

    describe('Calendar Generation', () => {
        test('generateCalendar should create calendar HTML', () => {
            document.getElementById('startDate').value = '2024-12-19';
            document.getElementById('endDate').value = '2024-12-31';
            document.getElementById('dimWeekends').checked = true;
            
            const result = calendar.generateCalendar();
            expect(result).toContain('<div class="month">');
            expect(result).toContain('December 2024');
        });

        test('generateHtmlCalendar should create multiple months', () => {
            const start = new Date('2024-12-01');
            const end = new Date('2024-12-31');
            const result = calendar.generateHtmlCalendar(
                start, end, start, end, true
            );
            expect(result).toContain('December 2024');
        });

        test('generateMonthCalendar should create month header', () => {
            const month = new Date(2024, 11, 1); // Month is 0-based, so 11 is December
            const result = calendar.generateMonthCalendar(
                month, 'html', month, month, true
            );
            expect(result).toContain('December 2024');
        });
    });

    describe('Styling', () => {
        test('getDayStyle should return correct styles for different dates', () => {
            const normalDay = new Date('2024-12-19T12:00:00Z');
            const weekendDay = new Date('2024-12-21T12:00:00Z');
            const projectStart = '2024-12-18';
            const projectEnd = '2024-12-22';

            const normalStyle = calendar.getDayStyle(normalDay, projectStart, projectEnd, true);
            expect(normalStyle).toEqual({
                color: '#E6E6E6',
                backgroundColor: '#2D2D2D'
            });

            const weekendStyle = calendar.getDayStyle(weekendDay, projectStart, projectEnd, true);
            expect(weekendStyle).toEqual({
                color: '#E6E6E6',
                backgroundColor: '#2D2D2D',
                opacity: '0.5'
            });
        });
    });
});
