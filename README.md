# Badger 2040 Studio

![Badger 2040](https://github.com/pimoroni/badger2040/blob/main/badger_os/badges/badge.jpg?raw=true)

**A modern, browser-based visual editor for the Pimoroni Badger 2040.**

Design custom e-ink layouts and push them directly to your device via Web Serial—no local Python environment or complex setup required.

## Features

* **Visual Editor:** Drag, drop, and position text and lines on a 296x128 pixel canvas.
* **Direct Push:** Sync designs over USB instantly via the Web Serial API.
* **Live Preview:** View a real-time representation of the 1-bit e-ink display.
* **Element Management:** Add, edit, or remove layers for text and geometric lines.
* **Responsive Design:** A sleek, dark-themed interface built for modern browsers.

## Getting Started

### Prerequisites
* A **Pimoroni Badger 2040** (or Badger 2040 W).
* A Web Serial compatible browser (Chrome, Edge, or Opera).
* A USB-C data cable.

### How to Use
1. **Connect:** Click the "Connect" button and select your device from the browser prompt.
2. **Design:** Use the "Text" and "Line" tools to build your layout. Modify properties like content and position in the sidebar.
3. **Push:** Use the "Push to Badger" button to transmit the design data to the device's filesystem.

## Tech Stack

* **Frontend:** React and Vite
* **Styling:** Tailwind CSS and Shadcn UI
* **Communication:** Web Serial API
* **Icons:** Lucide React

## Project Structure

* `/src/components`: UI elements for the editor and console.
* `/src/services`: Logic for Serial communication and external data.
* `/src/App.tsx`: Main application state and layout.

## Future Enhancements

* **Image Support:** Uploading and dithering images for 1-bit displays.
* **Template Gallery:** A collection of community-made badge designs.
* **Offline Support:** Converting the studio into a Progressive Web App (PWA).

## Contributing

Contributions are welcome. Please feel free to submit pull requests or report issues to help improve the tool for the maker community.

## License

This project is licensed under the MIT License.
