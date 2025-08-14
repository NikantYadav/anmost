# AnMost

A modern, feature-rich REST client application built with Next.js and TypeScript, providing all the essential features of Postman and more.

## 🚀 Features

### Core Functionality
- **HTTP Methods**: Support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Request Builder**: Intuitive interface for building HTTP requests
- **Response Viewer**: Beautiful, syntax-highlighted response display
- **Real-time Testing**: Send requests and view responses instantly

### Advanced Features
- **Collections**: Organize requests into collections for better management
- **Environment Variables**: Define and use variables across requests with `{{variable}}` syntax
- **Request History**: Automatic tracking of all sent requests with search and filter
- **Code Generation**: Generate code snippets in 8+ programming languages:
  - cURL
  - JavaScript (Fetch & Axios)
  - Python (Requests)
  - Node.js (Axios)
  - PHP (cURL)
  - Java (OkHttp)
  - C# (HttpClient)

### Data Management
- **Import/Export**: Backup and share collections and environments
- **Local Storage**: All data persists locally in your browser
- **Search & Filter**: Powerful search across requests, responses, and headers

### User Experience
- **Dark/Light Mode**: Automatic theme detection
- **Responsive Design**: Works perfectly on desktop and mobile
- **Keyboard Shortcuts**: Efficient workflow with keyboard navigation
- **Syntax Highlighting**: JSON responses with proper formatting

## 🛠️ Technical Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Storage**: Browser LocalStorage
- **Icons**: Heroicons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rest-client-pro
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage Guide

### Getting Started (Free Features)

1. **Make HTTP Requests**: Choose method, enter URL, add headers and body
2. **View Responses**: See formatted responses with syntax highlighting
3. **Generate Code**: Get code snippets in 8+ programming languages
4. **Basic Testing**: Test any API endpoint immediately

### Premium Features (Sign In Required)

#### Using Environment Variables
1. Sign in and click "Environments" in the toolbar
2. Create environments for different setups (dev, staging, prod)
3. Add variables with key-value pairs
4. Use variables in requests with `{{variable_name}}` syntax
5. Variables work in URLs, headers, and request bodies

#### Managing Collections
1. Save requests by clicking "Save" button
2. Organize requests into collections by project or feature
3. Access saved requests from the sidebar
4. Click any saved request to load it instantly

#### Request History
1. All sent requests are automatically saved
2. Search and filter through your request history
3. Quickly re-run previous requests
4. Track API testing over time

#### Import/Export Data
1. Click "Import/Export" in the toolbar
2. **Export**: Download collections and environments as JSON
3. **Import**: Upload JSON files to restore or share data
4. **Backup**: Keep your API testing data safe

## 🎯 Feature Tiers

### Free Tier (No Account Required)
- ✅ All HTTP methods (GET, POST, PUT, DELETE, etc.)
- ✅ Request/Response testing
- ✅ Code generation (8+ languages)
- ✅ Basic request building
- ✅ Response formatting and syntax highlighting

### Premium Tier (Free Account Required)
- ✅ Save requests in collections
- ✅ Environment variables with `{{}}` syntax
- ✅ Request history with search
- ✅ Import/Export collections
- ✅ Data sync across sessions
- ✅ Advanced organization features

### Comparison with Postman

| Feature | REST Client Pro | Postman |
|---------|----------------|---------|
| Basic HTTP Testing | ✅ Free | ✅ Free |
| Collections | ✅ Free account | ✅ Free account |
| Environment Variables | ✅ Free account | ✅ Free account |
| Code Generation | ✅ Free | ✅ Free |
| Request History | ✅ Free account | ✅ Free account |
| Offline Usage | ✅ Full offline | ❌ Limited offline |
| No Download Required | ✅ Web-based | ❌ Desktop app |
| Open Source | ✅ MIT License | ❌ Proprietary |

## 🔧 Configuration

### Environment Variables
The application uses browser localStorage for persistence. No server-side configuration required.

### Customization
- Modify `src/styles/globals.css` for custom styling
- Update `tailwind.config.js` for theme customization
- Extend components in `src/components/` for additional features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Postman's excellent UX
- Built with modern web technologies
- Designed for developers, by developers

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues tab to report bugs or request new features.

---

**Made with ❤️ for the developer community**