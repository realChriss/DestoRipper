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
                            Button 1
                        </button>
                    </div>
                        <button
                            className="sidebar-button"
                            onClick={() => setButtons(2)}
                        >
                            Button 2
                        </button>
                    </div>
                        <button
                            className="sidebar-button"
                            onClick={() => setButtons(3)}
                        >
                            Button 3
                        </button>
                    </div>
        </>
    );
};
export default Sidebar;