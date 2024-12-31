import { useEffect, useState } from "react";
import "../styles/header.css";

const Header = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [headerTextScale, setHeaderTextScale] = useState(1);
    const [headerBlur, setHeaderBlur] = useState(0);
    const [headerTextOpacity, setHeaderTextOpacity] = useState(1);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollY / maxScroll) * 100;
            setScrollProgress(scrollPercent);

            const maxScrollForHeader = 100;
            const scale = Math.max(0.9, 1 - (scrollY / maxScrollForHeader) * 0.1);
            const blur = Math.min((scrollY / maxScrollForHeader) * 5, 5);
            const opacity = Math.max(0.6, 1 - (scrollY / maxScrollForHeader) * 0.4);

            setHeaderTextScale(scale);
            setHeaderBlur(blur);
            setHeaderTextOpacity(opacity);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className="header"
                style={{
                    backdropFilter: `blur(${headerBlur}px)`,
                }}
            >
                <div
                    className="scroll-progress"
                    style={{ width: `${scrollProgress}%` }}
                ></div>
                <div className="header-left"></div>
                <h1
                    className="headertext"
                    style={{
                        transform: `scale(${headerTextScale})`,
                        opacity: headerTextOpacity,
                    }}
                >
                    DestoRipper
                </h1>
                <div className="header-right"></div>
            </header>
        </>
    );
};

export default Header;


