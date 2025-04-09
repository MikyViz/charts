import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

// Function to get date X days before today
const getDateBefore = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

// Function to get today's date at 00:00:00
const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Function to get current date and time
const getCurrentDateTime = () => {
    return new Date();
};

// Current date for end date
const currentDate = new Date();
// 7 days before today for start date (to get 8 days total including today)
const weekAgo = getDateBefore(7);

export const FiltersContext = createContext();

export const useFilters = () => {
    const context = useContext(FiltersContext);
    if (!context) {
        throw new Error('useFilters must be used within a FiltersProvider');
    }
    return context;
};

export const FiltersProvider = ({ children }) => {
    const url = import.meta.env.VITE_URL;
    const userId = import.meta.env.VITE_USERID;
    const user = import.meta.env.VITE_USER;
    const password = import.meta.env.VITE_PASSWORD;
    
    // Хранилище для опций каждого фильтра
    const [filterOptions, setFilterOptions] = useState({});
    
    // State for tracking hourly view mode
    const [isHourlyView, setIsHourlyView] = useState(false);
    
    // Текущие выбранные значения фильтров
    const [selectedFilters, setSelectedFilters] = useState({
        Agency: '',
        Cluster: '',
        SubCluster: '',
        City: '',
        RouteNumber: '',
        LineType: '',
        linegroup: '',
        StartDate: weekAgo.toISOString().split('T')[0],
        EndDate: currentDate.toISOString().split('T')[0]
    });
    
    // Function to check if date is today
    const isToday = (dateStr) => {
        const today = new Date();
        const date = new Date(dateStr);
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };
    
    // Function to set hourly view for today
    const setHourlyViewForToday = () => {
        const now = getCurrentDateTime();
        const startOfToday = getStartOfToday();
    
        const startDate = startOfToday.toISOString().slice(0, 19).replace('T', ' ');
        const endDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
        setSelectedFilters((prev) => {
            const newFilters = {
                ...prev,
                StartDate: startDate,
                EndDate: endDate,
                GroupBy: 'HOUR', // Устанавливаем GroupBy в HOUR
            };
            console.log('Обновление фильтров для почасового режима:', newFilters);
            return newFilters;
        });
    
        setIsHourlyView(true);
        console.log('setIsHourlyView(true) вызван'); // Добавлено логирование
    };
    
    // Function to set daily view
    const setDailyView = (startDate, endDate) => {
        setSelectedFilters(prev => ({
            ...prev,
            StartDate: startDate,
            EndDate: endDate,
            GroupBy: 'DAY' // Устанавливаем GroupBy в DAY
        }));
        
        setIsHourlyView(false);
        console.log('setIsHourlyView(false) вызван'); // Добавлено логирование
    };
    
    // Состояние загрузки для каждого фильтра
    const [isLoading, setIsLoading] = useState({});
    
    // Общая ошибка
    const [error, setError] = useState(null);
    
    // Маппинг между ID фильтра и полем API
    const apiFieldMapping = {
        'Agency': 'AgencyId',
        'Cluster': 'ClusterId',
        'SubCluster': 'SubCluster', 
        'City': 'City',
        'RouteNumber': 'LineID',
        'LineType': 'LineType',
        'linegroup': 'linegroup'
    };
    
    // Функция загрузки опций для конкретного фильтра
    const loadFilterOptions = useCallback(async (filterType) => {
        // Если уже загружаем - не делаем повторный запрос
        if (isLoading[filterType]) return;
        
        setIsLoading(prev => ({ ...prev, [filterType]: true }));
        setError(null);
        
        try {
            const reqData = {
                UserId: userId,
                SelectChoice: filterType
            };
            
            // Добавляем выбранные фильтры к запросу
            Object.entries(selectedFilters).forEach(([key, value]) => {
                if (value && key in apiFieldMapping) {
                    // Числовые значения уже должны быть числами из-за изменений в handleFilterChange
                    reqData[apiFieldMapping[key]] = value;
                }
            });
            
            // Добавляем даты если есть
            if (selectedFilters.StartDate) reqData.StartDate = selectedFilters.StartDate;
            if (selectedFilters.EndDate) reqData.EndDate = selectedFilters.EndDate;
            
            console.log('Sending request for', filterType, 'with data:', reqData);
            
            const response = await axios.post(
                `${url}/UsersChoice`, 
                {
                    userName: user,
                    password: password,
                    data: reqData
                }
            );
            
            // Проверяем наличие данных, а не статус
            if (response.data?.ResData) {
                setFilterOptions(prev => ({
                    ...prev,
                    [filterType]: response.data.ResData || []
                }));
            } else if (response.data?.Status === "OK" && response.data?.Msg === "הפעולה הצליחה") {
                // Если пришло сообщение об успехе, но нет данных - устанавливаем пустой массив
                setFilterOptions(prev => ({
                    ...prev,
                    [filterType]: []
                }));
            } else {
                throw new Error(response.data?.Msg || 'Ошибка загрузки данных');
            }
        } catch (err) {
            console.error(`Ошибка при загрузке ${filterType}:`, err);
            
            // Исправим проверку сообщения об ошибке для групп линий (более гибкая проверка)
            if (filterType === 'linegroup' && 
                (err.response?.data?.ErrMsg === "אין למשתמש קבוצות קוים" || 
                 err.response?.data?.ErrMsg === "אין למשתמש קבוצות קווים" ||
                 err.response?.status === 406)) {
                
                console.log("Обнаружена ошибка с группами линий:", err.response?.data);
                
                // Установим пустой массив и специальный флаг
                setFilterOptions(prev => ({
                    ...prev,
                    [filterType]: [],
                    [`${filterType}_empty`]: true  // Этот флаг используется в UI
                }));
            } else if (err.message !== "הפעולה הצליחה") {
                setError(err.message || 'Произошла ошибка при загрузке фильтров');
            } else {
                setFilterOptions(prev => ({
                    ...prev,
                    [filterType]: []
                }));
            }
        } finally {
            setIsLoading(prev => ({ ...prev, [filterType]: false }));
        }
    }, [url, userId, user, password, selectedFilters, isLoading, apiFieldMapping]);
    
    // Обработчик фокуса на фильтре
    const handleFilterFocus = useCallback((filterType) => {
        if (!filterOptions[filterType]) {
            loadFilterOptions(filterType);
        }
    }, [filterOptions, loadFilterOptions]);
    
    // Updated handleFilterChange to detect same-day selection
    const handleFilterChange = useCallback((idOrEvent, directValue) => {
        let id, value;
        
        // Проверяем, что передано: событие или прямые значения
        if (directValue !== undefined) {
            // Если передано два параметра, то это прямые значения (id, value)
            id = idOrEvent;
            value = directValue;
        } else if (idOrEvent && idOrEvent.target) {
            // Если передан объект события с target, извлекаем значения из него
            id = idOrEvent.target.id;
            value = idOrEvent.target.value;
        } else {
            console.error('Некорректные параметры для handleFilterChange:', idOrEvent, directValue);
            return;
        }
        
        // Определяем, какие поля должны быть числовыми
        const numericFields = ['Agency', 'Cluster', 'linegroup'];
        
        // Преобразуем значение в число для числовых полей, если оно не пустое
        const processedValue = numericFields.includes(id) && value !== '' ? 
            Number(value) : value;
        
        // Обновляем выбранный фильтр
        setSelectedFilters(prev => {
            const newFilters = {
                ...prev,
                [id]: processedValue
            };
            
            console.log('Обновление фильтров:', newFilters);
            
            return newFilters;
        });
        
        // Определяем зависимые фильтры для сброса
        let filtersToReset = {};
        
        // Сбрасываем зависимые фильтры только если это не даты
        if (id !== 'StartDate' && id !== 'EndDate') {
            switch(id) {
                case 'Agency':
                    filtersToReset = { 
                        Cluster: '', SubCluster: '', 
                        City: '', RouteNumber: '', linegroup: '' 
                    };
                    break;
                // ... остальные case
            }
            
            // Сбрасываем зависимые фильтры
            if (Object.keys(filtersToReset).length) {
                setSelectedFilters(prev => ({
                    ...prev,
                    ...filtersToReset
                }));
                
                // Сбрасываем кэшированные опции для зависимых фильтров
                Object.keys(filtersToReset).forEach(filterKey => {
                    const apiFilterType = filterKey === 'RouteNumber' ? 'LineID' : 
                                        filterKey === 'City' ? 'Cities' : filterKey;
                    
                    setFilterOptions(prev => ({
                        ...prev,
                        [apiFilterType]: undefined
                    }));
                });
            }
        }
    }, []);
    
    // Применить фильтр (для будущего использования в запросах данных)
    const applyFilters = useCallback(() => {
        // Здесь логика применения фильтров для запроса данных
        return { ...selectedFilters };
    }, [selectedFilters]);
    
    // Сбросить все фильтры кроме дат
    const resetFilters = useCallback(() => {
        setSelectedFilters(prev => ({
            Agency: '',
            Cluster: '',
            SubCluster: '',
            City: '',
            RouteNumber: '',
            LineType: '',
            linegroup: '',
            StartDate: prev.StartDate,
            EndDate: prev.EndDate
        }));
        
        // Очищаем кэш опций
        setFilterOptions({});
    }, []);
    
    // Return the updated context value including hourly view functions
    return (
        <FiltersContext.Provider value={{
            filterOptions,
            selectedFilters,
            isLoading,
            error,
            handleFilterFocus,
            handleFilterChange,
            applyFilters,
            resetFilters,
            isHourlyView
        }}>
            {children}
        </FiltersContext.Provider>
    );
};