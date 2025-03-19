#!/bin/bash

# Install dependencies
npm install

# Install TypeScript and type definitions
npm install --save-dev typescript @types/node @types/react @types/react-dom @types/react-router-dom @types/jest

# Install UI dependencies
npm install @headlessui/react @heroicons/react classnames react-hot-toast react-query

# Install development dependencies
npm install --save-dev @tailwindcss/forms autoprefixer postcss tailwindcss

# Initialize TypeScript configuration if it doesn't exist
if [ ! -f tsconfig.json ]; then
  npx tsc --init
fi

# Create necessary directories
mkdir -p src/components src/services src/types

echo "Setup completed successfully!"