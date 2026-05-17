# GymSphere

GymSphere is a modern gym and fitness web application built using React. 
The project provides an interactive and responsive user interface for users to explore fitness services, workout programs, memberships, trainers, and more.
## Live demo
You can check the live demo at: 

```bash
https://gymsphere-nine.vercel.app/
```

---
## Features

- Responsive modern UI
- React component-based architecture
- Smooth navigation and user experience
- Reusable components
- Fast development environment
- Easy customization and scalability

---

## Technologies Used

- React.js
- JavaScript (ES6+)
- HTML5
- CSS3
- Tailwind CSS (if applicable)
- Node.js
- npm

---

## Getting Started

### Prerequisites

Make sure the following are installed on your system:

- Node.js
- npm or yarn

Check installation:

```bash
node -v
npm -v
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/rijalNR45/gymsphere.git
```

Navigate to the project directory:

```bash
cd gymsphere
```

Install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

---

## Running the Project

Start the development server:

```bash
npm start
```

or

```bash
yarn start
```

The application will run locally at:

```txt
http://localhost:3000
```

---

## Build for Production

Create an optimized production build:

```bash
npm run build
```

The production-ready files will be generated inside the `build/` folder.

---

## Project Structure

```txt
gymsphere/
│
├── public/            # Static files
├── src/               # Source files
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages
│   ├── assets/        # Images and icons
│   ├── styles/        # CSS/Tailwind styles
│   ├── App.js         # Main App component
│   └── index.js       # Entry point
│
├── package.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Runs the app in development mode |
| `npm run build` | Builds the app for production |
| `npm test` | Runs test cases |
| `npm run eject` | Ejects configuration files |

---

## Environment Variables

If required, create a `.env` file in the root directory.

Example:

```env
REACT_APP_API_URL=https://example-api.com
```

---

## Troubleshooting

### Dependency Issues

If dependencies fail to install:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

If port `3000` is occupied, React may automatically prompt you to use another port.

---

## Author

Developed by Salomi Raymajhi.
