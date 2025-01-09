import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import SupportedPlatformsButton from "../components/supportedPlatformsButton";
import DownloadComp from "../view-components/Download";
import SettingsComp from "../view-components/Settings";
import useComponentVisibility from "../hooks/useComponentVisibility";

const App = () => {
  const [activeButton, setActiveButton] = useState<number>(1);

  const isSupportedPlatformsVisible = useComponentVisibility(activeButton, 1);

  return (
    <div className="App">
      <Toaster />
      <Header />
      <Sidebar activeButton={activeButton} setActiveButton={setActiveButton} />
      <div className="App-Content">
        {isSupportedPlatformsVisible && <SupportedPlatformsButton />}
        {activeButton === 1 && <DownloadComp />}
        {activeButton === 2 && <SettingsComp />}
        {activeButton === 3 && <h1>Info</h1>}
      </div>
    </div>
  );
};

export default App;
