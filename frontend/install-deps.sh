#!/bin/bash

# Install React and related dependencies
npm install react react-dom react-router-dom react-query react-hot-toast

# Install TypeScript and type definitions
npm install --save-dev typescript @types/react @types/react-dom @types/react-router-dom @types/node

# Install UI related dependencies
npm install @headlessui/react @heroicons/react classnames date-fns

# Install development dependencies
npm install --save-dev @tailwindcss/forms autoprefixer postcss tailwindcss

# Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Make the script executable
chmod +x install-deps.sh

echo "Dependencies installed successfully!"

# Create necessary directories if they don't exist
mkdir -p src/{components,hooks,utils,types,services,context,config}

# Initialize TypeScript configuration if it doesn't exist
if [ ! -f tsconfig.json ]; then
  npx tsc --init
fi

# Update package.json scripts
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint src --ext .ts,.tsx"
npm pkg set scripts.format="prettier --write \"src/**/*.{ts,tsx}\""

echo "Setup completed successfully!"