import { createContext, useState, useContext } from "react";

// Export the context so it can be imported directly
export const ChartOrderingContext = createContext({
    isModalOpen: false,
    setIsModalOpen: () => {},
});

export const ChartOrderingProvider = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <ChartOrderingContext.Provider value={{ isModalOpen, setIsModalOpen }}>
            {children}
        </ChartOrderingContext.Provider>
    );
};

export const useChartOrdering = () => useContext(ChartOrderingContext);