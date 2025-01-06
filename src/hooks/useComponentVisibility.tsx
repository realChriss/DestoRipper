import { useMemo } from 'react';

const useComponentVisibility = (activeButton: number, targetButton: number): boolean => {
    return useMemo(() => activeButton === targetButton, [activeButton, targetButton]);
};

export default useComponentVisibility;