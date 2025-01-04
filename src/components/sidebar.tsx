import React from "react";
import "../styles/sidebar.css";



const Sidebar = () => {
    const [buttons, setButtons] = React.useState(0);

    return (
        <>
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="sidebar-buttons">
                        <button
                            className={`sidebar-button ${buttons === 1 ? 'active' : ''}`}
                            onClick={() => setButtons(1)}
                        >
                            Settings
                        </button>
                    </div>
                    </div>
                        <button
                            className={`sidebar-button ${buttons === 2 ? 'active' : ''}`}
                            onClick={() => setButtons(2)}
                        >
                            Info
                        </button>
                    </div>
        </>
    );
};
export default Sidebar;