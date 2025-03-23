import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export const FiltersContext = createContext();

export const useFilters = () => {
    const context = useContext(FiltersContext);
    if (!context) {
        throw new Error('useFilters must be used within a FiltersProvider');
    }
    return context;
};

// Функция для получения уникальных значений
const getUniqueValues = (array, key) => {
    return [...new Set(array.map(item => item && item[key]).filter(Boolean))];
};

export const FiltersProvider = ({ children }) => {
    const url = import.meta.env.VITE_URL;
    const userId = import.meta.env.VITE_USERID;
    const user = import.meta.env.VITE_USER;
    const password = import.meta.env.VITE_PASSWORD;

    const [allData, setAllData] = useState([]);
    const [filters, setFilters] = useState({
        Agency: [],
        Cluster: [],
        SubCluster: [],
        City: [],
        RouteNumber: [],
        LineType: [],
        linegroup: []
    });
    const [selectedFilters, setSelectedFilters] = useState({
        Agency: '',
        Cluster: '',
        SubCluster: '',
        City: '',
        RouteNumber: '',
        LineType: '',
        linegroup: ''
    });
    const [filteredData, setFilteredData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Маппинг полей для правильной фильтрации
    const fieldMapping = {
        Agency: 'agency_name',
        Cluster: 'ClusterName',
        SubCluster: 'ClusterSubDesc',
        City: 'CityName',
        RouteNumber: 'RouteNumber',
        LineType: 'LineType',
        linegroup: 'RouteNumber'
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${url}/UsersChoice`,
                {
                    userName: user,
                    password,
                    data: { UserId: userId, SelectChoice: 'All' }
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            const resData = response.data.ResData;
            setAllData(resData);
            
            // Инициализируем фильтры со всеми доступными значениями
            const initialFilters = {};
            Object.entries(fieldMapping).forEach(([filterKey, dataKey]) => {
                initialFilters[filterKey] = getUniqueValues(resData, dataKey);
            });
            
            setFilters(initialFilters);
            setFilteredData(resData);
        } catch (error) {
            console.error("Ошибка API:", error);
            setError(error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    }, [url, user, password, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ИСПРАВЛЕНО: Улучшена логика фильтрации
    const updateFilterOptions = (updatedFilters) => {
        // Сначала фильтруем данные по выбранным фильтрам
        const newFilteredData = allData.filter(item => {
            return Object.entries(updatedFilters).every(([filterKey, filterValue]) => {
                // Если значение фильтра пустое, не применяем фильтрацию
                if (!filterValue) return true;
                
                // Получаем соответствующее поле данных
                const dataKey = fieldMapping[filterKey];
                if (!dataKey) return true;
                
                // Получаем значение из данных
                const itemValue = item[dataKey];
                if (itemValue === undefined || itemValue === null) return false;
                
                // Сравниваем значения нечувствительно к регистру
                return String(itemValue).toLowerCase().trim() === String(filterValue).toLowerCase().trim();
            });
        });

        setFilteredData(newFilteredData);
        
        // Теперь обновляем доступные значения фильтров на основе отфильтрованных данных
        // При этом для каждого фильтра учитываем только другие выбранные фильтры!
        const newFilters = {};
        
        // Для каждого фильтра
        Object.keys(fieldMapping).forEach(filterKey => {
            // Создаем копию updatedFilters без текущего фильтра
            const otherFilters = Object.entries(updatedFilters)
                .filter(([key]) => key !== filterKey)
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});
            
            // Фильтруем данные только по другим фильтрам
            const relevantData = allData.filter(item => {
                return Object.entries(otherFilters).every(([otherKey, otherValue]) => {
                    if (!otherValue) return true;
                    const otherDataKey = fieldMapping[otherKey];
                    if (!otherDataKey) return true;
                    const itemValue = item[otherDataKey];
                    if (itemValue === undefined || itemValue === null) return false;
                    return String(itemValue).toLowerCase().trim() === String(otherValue).toLowerCase().trim();
                });
            });
            
            // Получаем уникальные значения для текущего фильтра
            newFilters[filterKey] = getUniqueValues(relevantData, fieldMapping[filterKey]);
        });
        
        setFilters(newFilters);
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        const updatedFilters = { ...selectedFilters, [id]: value };
        setSelectedFilters(updatedFilters);
        updateFilterOptions(updatedFilters);
    };

    const clearFilters = () => {
        const emptyFilters = {
            Agency: '',
            Cluster: '',
            SubCluster: '',
            City: '',
            RouteNumber: '',
            LineType: '',
            linegroup: ''
        };
        setSelectedFilters(emptyFilters);
        fetchData(); // Сбрасываем к исходным данным
    };

    return (
        <FiltersContext.Provider value={{ 
            filters, 
            selectedFilters, 
            handleFilterChange,
            filteredData,
            clearFilters,
            error,
            isLoading
        }}>
            {children}
        </FiltersContext.Provider>
    );
};