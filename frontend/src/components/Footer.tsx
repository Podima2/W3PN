// src/components/Footer.jsx
export default function Footer() {
    return (
      <footer className="w-full mt-8 py-4 bg-gray-900 text-gray-400 text-center text-sm">
        <span>
          &copy; {new Date().getFullYear()} zkPrivi. All rights reserved.
        </span>
      </footer>
    );
  }