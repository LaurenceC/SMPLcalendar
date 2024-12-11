# Calendar Generator for OneNote

A standalone web application that generates beautiful calendar tables that can be copied and pasted into OneNote or Word. The application features a clean, modern dark theme with soft white accents, making it easy to use in any lighting condition.

## Features

- **Multiple Calendar Formats**
  - HTML format for OneNote
  - Word format for Microsoft Word
  - Text format for plain text editors
  - Markdown format for markdown editors

- **Holiday Management**
  - Add custom holidays with single dates or date ranges
  - Built-in US holidays that can be reset anytime
  - Holidays appear in orange on the calendar for easy visibility
  - Edit or delete holidays as needed

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
  - Works with any version of OneNote (including OneNote for Mac)

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
3. (Optional) Add or manage holidays:
   - Click "Add Holiday" to add custom holidays
   - Use "Reset to Default Holidays" to restore US holidays
   - Delete individual holidays using the × button
4. Click "Copy Calendars to Clipboard" to copy the generated calendar
5. In your target application:
   - Open your desired page
   - Place your cursor where you want the calendar
   - Paste (Cmd+V on Mac, Ctrl+V on Windows)

## Development

The application is built with:
- Vanilla JavaScript for maximum compatibility
- date-fns for reliable date manipulation
- Webpack for module bundling
- Modern CSS with flexbox layouts
- LocalStorage for persistent holiday storage

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.
