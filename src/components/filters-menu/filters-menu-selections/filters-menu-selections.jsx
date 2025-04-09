import { useFilters } from "../../../contexts/filters-context";
import styles from "./filters-menu-selections.module.css";
import { Select } from "../../select/select";
import { useState, useEffect, useRef } from "react";

export const FiltersMenuSelections = () => {
    const { 
        filterOptions, 
        selectedFilters, 
        handleFilterChange, 
        handleFilterFocus, 
        isLoading 
    } = useFilters();
    
    // Состояние для отслеживания скрытия сообщений
    const [showErrorMessages, setShowErrorMessages] = useState({});
    
    // Ref для отслеживания постоянно скрытых сообщений
    const hiddenMessagesRef = useRef({});
    
    // При изменении filterOptions обновляем состояние сообщений об ошибках
    // но при этом учитываем уже скрытые пользователем сообщения
    useEffect(() => {
        const newErrorState = {};
        Object.keys(filterTypeMapping).forEach(id => {
            const apiType = filterTypeMapping[id];
            // Показываем сообщение только если оно не было скрыто пользователем
            newErrorState[id] = filterOptions[`${apiType}_empty`] === true && !hiddenMessagesRef.current[id];
        });
        setShowErrorMessages(newErrorState);
    }, [filterOptions]);

    // Обработчик клика по сообщению об ошибке - теперь добавляет сообщение
    // в список постоянно скрытых, чтобы не показывать его снова
    const handleErrorMessageClick = (id) => {
        // Сохраняем в ref, что сообщение было скрыто
        hiddenMessagesRef.current[id] = true;
        
        // Обновляем состояние для немедленного скрытия
        setShowErrorMessages(prev => ({
            ...prev,
            [id]: false
        }));
    };

    // Эта функция вызывается для отображения правильного значения из объекта опций
    const getDisplayValue = (optionObj, id) => {
        // Специальная обработка для SubCluster - значение находится в ClusterSubDesc
        if (id === "SubCluster" && optionObj.ClusterSubDesc !== undefined) {
            return optionObj.ClusterSubDesc;
        }
        
        // Для остальных фильтров используем маппинг
        const mappings = {
            "Agency": "agency_name",
            "Cluster": "ClusterName",
            "SubCluster": "SubCluster",  // Для обратной совместимости
            "City": "CityName", 
            "RouteNumber": "RouteNumber",
            "LineType": "LineType",
            "linegroup": "descrip"
        };
        
        // Получаем значение по маппингу
        const value = optionObj[mappings[id] || id] || optionObj.value || optionObj;
        
        // Если значение - объект, преобразуем его в строку
        if (value !== null && typeof value === "object") {
            return String(Object.values(value)[0] || '');
        }
        
        return String(value || '');
    };

    // Эта функция вызывается для получения правильного значения для option value
    const getOptionValue = (optionObj, id) => {
        // Специальная обработка для SubCluster - значение находится в ClusterSubDesc
        if (id === "SubCluster" && optionObj.ClusterSubDesc !== undefined) {
            return optionObj.ClusterSubDesc;
        }
        
        const mappings = {
            "Agency": "agency_id",
            "Cluster": "Clusterid",
            "SubCluster": "SubCluster",  // Для обратной совместимости
            "City": "CityName",
            "RouteNumber": "LineID",
            "LineType": "LineType",
            "linegroup": "id"
        };
        
        const value = optionObj[mappings[id] || id] || optionObj.value || optionObj;
        
        // Преобразуем в строку, чтобы избежать проблем с объектами
        if (value !== null && typeof value === "object") {
            return String(Object.values(value)[0] || '');
        }
        
        return String(value || '');
    };

    // Функция для получения массива элементов для селекта
    const getSelectItems = (id) => {
        const options = filterOptions[filterTypeMapping[id]] || [];
        const result = options.map(option => getDisplayValue(option, id));
        console.log(`getSelectItems для ${id}:`, result);
        return result;
    };

    // Функция для создания Set с активным элементом
    const getActiveFilters = (id) => {
        if (!selectedFilters[id]) return new Set();
        
        const options = filterOptions[filterTypeMapping[id]] || [];
        for (const option of options) {
            if (getOptionValue(option, id) === selectedFilters[id]) {
                return new Set([getDisplayValue(option, id)]);
            }
        }
        
        return new Set();
    };

    // Функция для проверки наличия и загрузки данных фильтра при открытии селекта
    const handleSelectOpen = (id) => {
        if (!filterOptions[filterTypeMapping[id]]) {
            handleFilterFocus(filterTypeMapping[id]);
        }
    };

    // Обработчик клика для изменения фильтра
    const handleSelectClick = (id) => (value) => {
        // Сначала загружаем данные, если нужно
        if (!filterOptions[filterTypeMapping[id]]) {
            handleFilterFocus(filterTypeMapping[id]);
            return;
        }
        
        const options = filterOptions[filterTypeMapping[id]] || [];
        for (const option of options) {
            if (getDisplayValue(option, id) === value) {
                // Нашли совпадение - передаем значение в обработчик фильтров
                handleFilterChange({ target: { id, value: getOptionValue(option, id) } });
                break;
            }
        }
    };

    // Конфигурация для соответствия ID фильтра и типа запроса API
    const filterTypeMapping = {
        "Agency": "Agency",
        "Cluster": "Cluster",
        "SubCluster": "SubCluster",
        "City": "Cities",
        "RouteNumber": "LineID",
        "LineType": "LineType",
        "linegroup": "linegroup"
    };

    return (
        <div className={styles.selections}>
            {[
                { id: "Agency", label: "מפעיל" },
                { id: "Cluster", label: "אשכול (אזורים)" },
                { id: "SubCluster", label: "תת אשכול" },
                { id: "City", label: "עיר" },
                { id: "RouteNumber", label: "קו" },
                { id: "LineType", label: "סוג קו" },
                { id: "linegroup", label: "קבוצת קווים" }
            ].map(({ id, label }) => (
                <div key={id} className={styles.selection}>
                    {isLoading[filterTypeMapping[id]] ? (
                        <div className={styles.loadingIndicator}>טוען נתונים...</div>
                    ) : id === "linegroup" && showErrorMessages[id] ? (
                        <div 
                            className={styles.noGroupsMessage}
                            onClick={() => handleErrorMessageClick(id)}
                        >
                            אין קבוצות קווים זמינות למשתמש זה
                        </div>
                    ) : (
                        <Select
                            name={label}
                            items={getSelectItems(id)}
                            onClick={handleSelectClick(id)}
                            onOpen={() => handleSelectOpen(id)}
                            activeFilters={getActiveFilters(id)}
                            type="radio"
                            thereIsSearch={true}
                            style="round"
                            size=""
                            thereIsAgree={false}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
