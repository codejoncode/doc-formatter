# 📄 AI Document Formatter

A modern React application that allows users to upload documents, format them with AI assistance, and export to PDF. Supports multiple file formats with drag-and-drop functionality.

![Document Formatter](https://img.shields.io/badge/React-18.2.0-blue) ![Tests](https://img.shields.io/badge/Tests-90%25%20Coverage-green) ![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

## ✨ Features

### 📁 **File Upload Support**
- **Drag & Drop Interface** - Intuitive file upload experience
- **8 Supported Formats**: `.txt`, `.html`, `.md`, `.docx`, `.doc`, `.pdf`, `.odt`, `.rtf`
- **20MB File Size Limit** - Handles large documents efficiently
- **Real-time Validation** - Instant feedback on file compatibility

### 🤖 **AI-Powered Formatting**
- **Intelligent Text Processing** - Automatically improves document structure
- **Paragraph Organization** - Smart spacing and formatting
- **List Detection** - Converts plain text to formatted lists
- **Header Recognition** - Automatically creates document hierarchy

### 📊 **PDF Export**
- **Professional Layout** - Clean, readable PDF output
- **Preserves Formatting** - Maintains document structure
- **Responsive Design** - Optimized for all screen sizes

### 🔧 **Technical Features**
- **React 18** - Modern React with hooks and concurrent features
- **Comprehensive Testing** - 90%+ test coverage with Jest and Cypress
- **Accessibility Compliant** - WCAG guidelines followed
- **Cross-browser Compatible** - Works on all modern browsers

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/codejoncode/doc-formatter.git
cd doc-formatter

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Available Scripts

### `npm start`
Runs the app in development mode with hot reloading.

### `npm test`
Launches the comprehensive test suite with coverage reporting.

### `npm run build`
Creates an optimized production build.

### `npm run test:coverage`
Runs tests with detailed coverage report.

### `npm run cypress:open`
Opens Cypress for end-to-end testing.

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **Create React App** - Build tooling
- **@react-pdf/renderer** - PDF generation
- **marked** - Markdown processing

### File Processing
- **mammoth** - DOCX file parsing
- **pdf-parse** - PDF text extraction
- **FileReader API** - Browser file handling

### Testing
- **Jest** - Unit testing framework
- **@testing-library/react** - Component testing
- **Cypress** - End-to-end testing
- **90%+ Coverage** - Comprehensive test suite

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── DocumentFormatter.js    # Main formatter component
│   ├── FileUpload.js           # File upload interface
│   └── PDFGenerator.js         # PDF export functionality
├── utils/               # Utility functions
│   └── fileParser.js    # File processing utilities
├── styles/              # CSS stylesheets
└── tests/              # Test files
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── e2e/           # End-to-end tests
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_MAX_FILE_SIZE=20971520
REACT_APP_SUPPORTED_FORMATS=txt,html,md,docx,doc,pdf,odt,rtf
```

### File Upload Limits
- **Maximum file size**: 20MB (configurable)
- **Supported formats**: 8 document types
- **Concurrent uploads**: 1 file at a time

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Coverage Report
```bash
npm run test:coverage
```

### E2E Testing
```bash
npm run cypress:open
```

### Test Categories
- **Unit Tests**: Component functionality and utilities
- **Integration Tests**: Full workflow testing
- **E2E Tests**: User interface and cross-browser testing

## 🎯 Usage

1. **Upload Document**
   - Drag and drop a file onto the upload area
   - Or click to browse and select a file
   - Supported formats: TXT, HTML, MD, DOCX, DOC, PDF, ODT, RTF

2. **Format Content**
   - Click "Format with AI" to process the document
   - The AI will improve structure, spacing, and readability
   - View the formatted result in the preview area

3. **Export PDF**
   - Click "Download PDF" to export the formatted document
   - Professional layout with proper formatting preserved

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Sample files (if applicable)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
The `build` folder contains the production build ready for deployment.

## 📊 Performance

- **Bundle Size**: Optimized for fast loading
- **File Processing**: Efficient parsing for large documents
- **Memory Usage**: Optimized for 20MB+ files
- **Cross-platform**: Windows, macOS, Linux support

---

**Built with ❤️ by [codejoncode](https://github.com/codejoncode)**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
