# Universal Calendar Generator

A standalone web application that generates beautiful calendar tables that can be copied and pasted into any application. The application features a clean, modern dark theme with soft white accents, making it easy to use in any lighting condition.

## Features

- **Multiple Calendar Formats**
  - HTML format for rich text editors
  - Word format for Microsoft Word
  - Text format for plain text editors
  - Markdown format for markdown editors

- **Flag Management**
  - Add custom Flags with single dates or date ranges
  - Built-in US Flags that can be reset anytime
  - Flags appear in orange on the calendar for easy visibility
  - Edit or delete Flags as needed

- **Smart Calendar Generation**
  - Generate calendars for any date range
  - Automatic updates when changing dates or format
  - Weekend dimming option
  - Today's date highlighting

- **User Experience**
  - Clean, dark theme with soft white accents
  - One-click copy to clipboard
  - Success notifications for user actions
  - Responsive layout for all screen sizes
  - Works with any application that accepts formatted text

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Select your desired calendar format (HTML, Word, Text, or Markdown)
2. Choose start and end dates using the date pickers
3. (Optional) Add or manage Flags:
   - Click "Add Flag" to add custom Flags
   - Use "Reset to Default Flags" to restore US Flags
   - Delete individual Flags using the × button
4. Click "Copy Calendars to Clipboard" to copy the generated calendar
5. In your target application:
   - Open your desired page
   - Place your cursor where you want the calendar
   - Paste (Cmd+V on Mac, Ctrl+V on Windows)

## Testing

The application includes a comprehensive test suite built with Jest. The tests cover core functionality including:

- Date utility functions
- Flag management
- Calendar styling
- User interactions

To run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

Test files are located in the `tests` directory. Each test file corresponds to its source file in the `src` directory.

### Test Coverage

The test suite includes:
- Unit tests for date manipulation functions
- Integration tests for Flag management
- UI component tests with DOM manipulation
- LocalStorage mocking for data persistence tests

## Development

The application is built with:
- Vanilla JavaScript for maximum compatibility
- date-fns for reliable date manipulation
- Webpack for module bundling
- Modern CSS with flexbox layouts
- LocalStorage for persistent Flag storage
- Jest for testing

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.
