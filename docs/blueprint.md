# **App Name**: SayWith Manager

## Core Features:

- Input Forms: Input fields for Name, Template (dropdown), and Status (checkbox).
- File Upload: Upload media (image/video), audio (mp3), and SRT/text files to Firebase Storage.
- URL Generation: Get the download URLs for media and audio files after uploading to Firebase Storage.
- Data Saving: Save name, template, status, media URL, audio URL, and SRT/text content to Firebase Realtime Database under a unique ID (Saywith/unique id/).
- Success Feedback: Display a success pop-up and show the copyable generated unique ID after saving.
- Data Editing: Enable editing of data by entering a unique ID, fetching corresponding information from Firebase, and pre-filling input fields for modification.
- AI content suggestion: Enable the tool to manage the content type and show it's details

## Style Guidelines:

- Background color: Dark scheme (#121212) for a modern look.
- Primary color: Vibrant orange (#FFA500) for emphasis and a bold feel.
- Accent color: Analogous green (#ADFF2F), less saturated and of higher brightness, for interactive elements.
- Headline font: 'Space Grotesk' (sans-serif) for a modern, readable title and headings.
- Body font: 'Inter' (sans-serif) for a clean and modern interface.
- Note: currently only Google Fonts are supported.
- Simple, modern icons for file types and actions.
- User-friendly layout with clear sections for input forms, file uploads, and data display.