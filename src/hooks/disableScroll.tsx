import { useEffect } from "react";

const useDisableScroll = (disable: boolean) => {
  useEffect(() => {
    if (disable) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [disable]);
};

export default useDisableScroll;
