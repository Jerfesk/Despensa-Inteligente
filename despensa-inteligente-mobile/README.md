# Despensa Inteligente - Mobile Version

## Overview
This is the mobile version of the "Despensa Inteligente" application, designed to provide a seamless experience on mobile devices. The application utilizes Progressive Web App (PWA) techniques to enhance usability and performance.

## Project Structure
The project is organized as follows:

```
despensa-inteligente-mobile
├── public
│   ├── index.html          # Main entry point for the mobile version
│   ├── estoque.html       # Mobile version of the inventory page
│   ├── manifest.json      # PWA metadata
│   ├── service-worker.js   # Service worker for caching and offline functionality
│   ├── css
│   │   ├── styles.css      # General styles for the application
│   │   └── mobile.css      # Mobile-specific styles
│   └── js
│       ├── app.js          # Main JavaScript logic for the application
│       └── mobile.js       # Mobile-specific JavaScript logic
├── package.json            # npm configuration file
└── README.md               # Project documentation
```

## Features
- **Responsive Design**: The application is optimized for mobile devices, ensuring a user-friendly interface on smaller screens.
- **PWA Support**: Users can install the app on their devices and access it offline, thanks to the service worker and manifest file.
- **Enhanced User Experience**: Mobile-specific JavaScript enhances interactions, including touch events and responsive behaviors.

## Setup Instructions
1. Clone the repository:
   ```
   git clone https://github.com/Jerfesk/Despensa-Inteligente.git
   ```
2. Navigate to the project directory:
   ```
   cd despensa-inteligente-mobile
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the application:
   ```
   npm start
   ```

## Usage
- Open `public/index.html` in a mobile browser to access the application.
- Users can navigate to the inventory page via the main menu.
- The app can be added to the home screen for easy access.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.