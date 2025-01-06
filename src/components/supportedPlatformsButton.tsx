import React, { useState, useRef, useEffect } from "react";
import "../styles/supportedPlatformsButton.css";

const SupportedPlatformsButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<HTMLDivElement>(null);

    const togglePopup = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            popupRef.current &&
            !popupRef.current.contains(event.target as Node) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target as Node)
        ) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (svgRef.current) {
            if (isOpen) {
                svgRef.current.classList.add("rotate");
            } else {
                svgRef.current.classList.remove("rotate");
            }
        }
    }, [isOpen]);

    return (
        <div className="supported-platforms-button">
            <button
                ref={buttonRef}
                onClick={togglePopup}
                className="platform-button"
                type="button"
            >
                <div ref={svgRef} className="platform-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
                    </svg>
                </div>
                Supported Platforms
            </button>
            {isOpen && (
                <div
                    ref={popupRef}
                    className="platform-popup fade-in"
                >
                    <ul>
                        <li>youtube</li>
                        <li>soundcloud</li>
                        <li>tiktok</li>
                        <li>instagram</li>
                        <li>reddit</li>
                        <li>x</li>
                        <li>bluesky</li>
                        <li>spotify</li>
                    </ul>
                    <main className="platforms-disclaimer">
                        Desto isnt affiliaded with any of the platforms listed above.
                    </main>
                </div>
            )}
        </div>
    );
};

export default SupportedPlatformsButton;