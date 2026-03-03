# **App Name**: LODS Terminal

## Core Features:

- Secure Web Authentication: A web-responsive login page leveraging Firebase Auth (email/password) that mirrors existing logic for secure user access and session management.
- Delivery Booking Creation: Facilitate the creation of new delivery bookings with an intuitive form, replicating the comprehensive logic and validation found in the React Native BookingForm.
- Live Order Dashboard: Provide a real-time, interactive dashboard displaying 'pending' and 'active' orders, dynamically updating based on state management concepts from the mobile app's HomeScreen.
- Geospatial Delivery Tracking: Integrate Google Maps JavaScript API to visualize current rider locations and their optimized delivery routes for active orders, similar to MapScreen.js.
- Rider and Merchant Profile Management: Dedicated section for managing rider and merchant profiles, porting data handling and display logic from ProfileScreen.js and MerchantScreen.js.
- Admin & Merchant Navigation: An intuitive sidebar navigation menu providing quick access to key sections such as Dashboard, Orders, Merchants, and Settings, optimized for administrative and merchant workflows.
- AI Booking Assistant: A generative AI tool that suggests optimal details or auto-completes booking information during the creation of new delivery bookings to streamline data entry.

## Style Guidelines:

- Color scheme: A clean, professional light theme, leveraging the requested Blue-600 for core interactions.
- Primary color: A robust and trustworthy blue (#1A5DEA), reflecting the efficiency of logistics operations.
- Background color: A very subtle, cool light gray-blue (#F0F1F5), providing a clean and non-distracting canvas for data.
- Accent color: A vibrant, clear cyan (#3DEDE6) for highlights and calls-to-action, drawing attention to critical information without overwhelming the dashboard.
- Font choice: 'Inter' (sans-serif) for all text elements. Its modern, highly readable characteristics make it ideal for data-dense dashboards.
- Icons: Utilize the Shadcn/UI's default icons, favoring crisp, clear line icons that align with the 'Logistics Dashboard' aesthetic for effective communication.
- Overall Layout: A structured layout with a fixed left-hand navigation sidebar for primary navigation and a main content area optimized for both administrative dashboards (desktop) and merchant terminal operations (tablet).
- Responsiveness: Adapt content and components gracefully across desktop and tablet viewpoints, ensuring key information and interactions remain accessible and intuitive.
- Micro-interactions: Implement subtle, efficient animations for state changes, data loading, and transitions, enhancing user feedback without causing distractions, aligning with Shadcn/UI's motion principles.