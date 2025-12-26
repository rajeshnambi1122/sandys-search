# Sandy's Invoice Search

A powerful desktop application for searching and viewing PDF invoices with automatic text highlighting and page navigation.

## Features

- **Fast Full-Text Search**: Search across all PDFs in multiple directories simultaneously
- **Visual Peep Preview**: See highlighted snippets of matched text before opening the document
- **Auto Page Navigation**: Automatically jump to the page containing your search results in multi-page PDFs
- **Text Selection**: Select and copy text directly from PDF viewer
- **Real-time Highlighting**: Search terms are highlighted in yellow for easy identification
- **Modern UI**: Clean, responsive interface with Sandy's Market branding

## Project Structure

```
SearchPDF/
├── backend/           # Node.js Express server
│   ├── index.js      # Main server file with search and peep generation logic
│   └── package.json  # Server dependencies
├── desktop/          # Electron desktop application
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── PDFViewer.jsx  # PDF rendering with text layer
│   │   └── index.css      # Tailwind CSS styles
│   ├── main.js       # Electron main process
│   └── package.json  # Desktop app dependencies
└── invoices/         # PDF storage directory (local)
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## Installation

1. **Clone or download** this repository

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install desktop app dependencies:**
   ```bash
   cd desktop
   npm install
   ```

## Configuration

### Search Directories

By default, the application searches in two directories:
- `invoices/` - Local invoices folder
- `P:\My Drive\Documents` - Network drive location

To modify search directories, edit `backend/index.js`:

```javascript
const SEARCH_DIRS = [
    { key: 'invoices', path: path.join(__dirname, '../invoices') },
    { key: 'drive', path: 'YOUR_PATH_HERE' }
];
```

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:5002`

### 2. Start the Desktop App

In a new terminal:

```bash
cd desktop
npm start
```

The Electron app will launch automatically.

## Usage

1. **Enter search query** - Type invoice number, date, item name, or any text
2. **Click Search** - Results will display with highlighted preview images
3. **Click result** - PDF opens directly to the page with your search match
4. **Select text** - Click and drag to select and copy text from the PDF
5. **Navigate pages** - Use Previous/Next buttons or zoom controls

## Building for Production

### Desktop App

```bash
cd desktop
npm run build
```

This creates an installer in `desktop/release/`

## Technical Details

### Backend (Node.js + Express)

- **PDF Parsing**: Uses `pdf-parse` for text extraction
- **PDF Rendering**: Uses `pdfjs-dist` (v3.11.174) with `node-canvas` for server-side rendering
- **Peep Generation**: Renders PDF pages to canvas, highlights matches, and crops preview images
- **Page Tracking**: Identifies which page contains the first match for auto-navigation

### Frontend (React + Electron)

- **Framework**: React 19 with Vite for fast builds
- **PDF Viewer**: Custom viewer using `pdfjs-dist` with text layer for selection
- **Styling**: Tailwind CSS with custom Sandy's Market color scheme
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React hooks (useState)

## Troubleshooting

### Server won't start
- Check if port 5002 is already in use
- Verify Node.js and npm are installed correctly

### PDFs not found
- Ensure search directories exist and contain PDF files
- Check file permissions for the directories

### Text selection not working
- Ensure desktop app was rebuilt after code changes: `npm run build:vite`
- Restart the desktop app

### "No password given" errors
- Some PDFs are password-protected and cannot be searched
- The application will skip these files and continue with others

## Dependencies

### Backend
- express: Web server framework
- cors: Cross-origin resource sharing
- pdf-parse: PDF text extraction
- pdfjs-dist: PDF.js library for rendering
- canvas: Node.js canvas implementation for image generation

### Desktop
- electron: Desktop application framework
- react: UI framework
- pdfjs-dist: PDF rendering in browser
- tailwind-merge: Tailwind CSS utilities
- framer-motion: Animation library
- lucide-react: Icon library
