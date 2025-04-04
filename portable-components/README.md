# Bleu.js Components

This is a collection of reusable React components from Bleu.js, including a neural network visualization and various UI components.

## Components Included

- `Scene.tsx`: 3D neural network visualization using Three.js and React Three Fiber
- `Navbar.tsx`: Navigation bar component
- `Usage.tsx`: Usage statistics component
- `Settings.tsx`: Settings interface component
- `Sidebar.tsx`: Side navigation component
- `DashboardLayout.tsx`: Dashboard layout wrapper
- `PageTransition.tsx`: Page transition animations
- `Container.tsx`: Responsive container component
- `ApiKeys.tsx`: API key management interface
- `Auth/`: Authentication-related components
- `ProtectedRoute.tsx`: Route protection component

## Installation

1. Copy the `src/components` directory to your project
2. Install the required dependencies:

```bash
npm install @react-three/fiber @react-three/drei three react-router-dom @heroicons/react react-hot-toast axios
```

or

```bash
yarn add @react-three/fiber @react-three/drei three react-router-dom @heroicons/react react-hot-toast axios
```

## Usage

### Neural Network Visualization (Scene.tsx)

```tsx
import Scene from './components/Scene';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene />
    </div>
  );
}
```

### Navigation Bar (Navbar.tsx)

```tsx
import Navbar from './components/Navbar';

function App() {
  return (
    <div>
      <Navbar />
      {/* Your content */}
    </div>
  );
}
```

## Dependencies

- React 18+
- TypeScript
- Three.js
- React Three Fiber
- React Router DOM
- Heroicons
- React Hot Toast
- Axios

## Notes

- The components are written in TypeScript
- Some components may require additional context providers (like React Router)
- The neural network visualization requires WebGL support
- Components use Tailwind CSS for styling (you'll need to set up Tailwind in your project)

## License

MIT 