import React from "react";
import "../styles/sidebar.css";

interface SidebarProps {
  activeButton: number;
  setActiveButton: (buttonId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeButton, setActiveButton }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-buttons">
          <button
            className={`sidebar-button ${activeButton === 1 ? "active" : ""}`}
            onClick={() => setActiveButton(1)}
          >
            Ripper
          </button>
        </div>

        <div className="sidebar-buttons-misceleaneous">
          <button
            className={`sidebar-button ${activeButton === 2 ? "active" : ""}`}
            onClick={() => setActiveButton(2)}
          >
            Settings
          </button>
          <button
            className={`sidebar-button ${activeButton === 3 ? "active" : ""}`}
            onClick={() => setActiveButton(3)}
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
