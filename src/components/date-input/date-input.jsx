import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./date-input.module.css";
import he from "date-fns/locale/he";
import "./date-input.css";
import { useFilters } from "../../contexts/filters-context";

registerLocale("he", he);

export const DateInput = () => {
    const { selectedFilters, handleFilterChange } = useFilters();
    const [dateRange, setDateRange] = useState([
        selectedFilters.StartDate ? new Date(selectedFilters.StartDate) : null,
        selectedFilters.EndDate ? new Date(selectedFilters.EndDate) : null
    ]);
    const [startDate, endDate] = dateRange;

    // Обновляем локальное состояние, когда изменяется контекст фильтров
    useEffect(() => {
        if (selectedFilters.StartDate && selectedFilters.EndDate) {
            setDateRange([
                new Date(selectedFilters.StartDate), 
                new Date(selectedFilters.EndDate)
            ]);
        }
    }, [selectedFilters.StartDate, selectedFilters.EndDate]);

    // Утилита для проверки, представляют ли две даты один и тот же день
    const areSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    // Обработчик изменения дат в датапикере
    const handleDateChange = (update) => {
        console.log("DatePicker update:", update);
        setDateRange(update);

        // Утилита для форматирования даты в локальном формате YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Если первая дата выбрана, но вторая еще нет
        if (update[0] && !update[1]) {
            console.log("Выбрана только одна дата:", update[0]);
            const formattedStartDate = formatDate(update[0]);
            handleFilterChange('StartDate', formattedStartDate);
            handleFilterChange('EndDate', formattedStartDate);
            handleFilterChange('GroupBy', 'HOUR'); // Почасовой режим для одного дня
            console.log("Отправлено: StartDate =", formattedStartDate, ", EndDate =", formattedStartDate, ", GroupBy = HOUR");
            return;
        }

        // Если обе даты выбраны
        if (update[0] && update[1]) {
            const formattedStartDate = formatDate(update[0]);
            const formattedEndDate = formatDate(update[1]);

            console.log("Форматированные даты:", formattedStartDate, formattedEndDate);

            // Проверяем, выбран ли только один день (сравниваем год, месяц и день)
            const isSameDay = areSameDay(update[0], update[1]);

            console.log("Результат проверки на один день:", isSameDay);

            // Устанавливаем дату начала и конца
            handleFilterChange('StartDate', formattedStartDate);
            handleFilterChange('EndDate', formattedEndDate);

            // Устанавливаем режим группировки в зависимости от выбранного интервала
            if (isSameDay) {
                console.log("Устанавливаем почасовой режим для одного дня");
                handleFilterChange('GroupBy', 'HOUR');
                console.log("Отправлено: StartDate =", formattedStartDate, ", EndDate =", formattedEndDate, ", GroupBy = HOUR");
            } else {
                console.log("Устанавливаем дневной режим");
                handleFilterChange('GroupBy', 'DAY');
                console.log("Отправлено: StartDate =", formattedStartDate, ", EndDate =", formattedEndDate, ", GroupBy = DAY");
            }
        } else {
            console.warn("Одна из дат не выбрана:", update);
        }
    };

    return (
        <div className={styles.dateInput}>
            <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                locale="he"
                dateFormat="dd/MM/yy"
                placeholderText="בחר תאריך"
            />
        </div>
    );
};
