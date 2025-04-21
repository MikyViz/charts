import { ChartCard } from "./chart-card/chart-card";
import styles from "./charts.module.css";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useFilters } from "../../contexts/filters-context";
import { 
    fetchPlanVsPerformance, 
    fetchPerformancePercentage, 
    fetchPlannedTrips, 
    fetchLinePerformanceDetails, 
    fetchPlannedChanges,
    fetchTripsPerformanceDetails
} from "../../services/charts-api";
import { ChartOrderModal } from "./chart-order-modal/chart-order-modal";
import { useChartOrdering } from "../../contexts/chart-ordering-context";

// Move defaultCharts definition to the top level, outside the component
const defaultCharts = [
    {
        data: [
            ["חודש", "בוצע", "מתוכנן"],
            ["ינו", 100, 90],
            ["פברואר", 160, 120],
            ["מרץ", 120, 110],
            ["אפריל", 110, 100],
            ["מאי", 130, 120],
            ["יוני", 140, 130],
        ],
        options: {
            chartArea: { width: "80%", height: "60%" },
            rtl: true,
            hAxis: {
                title: "תאיריכים",
                direction: -1,
                slantedText: true,
            },
            vAxis: { 
                title: "נסיעות",
            },
            legend: { 
                position: "top",
                alignment: "center",
                reverseCategories: false,
            },
            histogram: {
                bucketSize: 1,
                hideBucketItems: true,
            },
            bar: { groupWidth: "75%" },
            series: {
                0: { pointSize: 5 },
                1: { pointSize: 5 },
                2: { pointSize: 5 },
            },
            isStacked: false,
        },
        thereIsTypeData: false,
        type: "Line",
        isOnline: true,
        title: "תכנון / ביצוע",
    },
    // Add the rest of your default charts here
];

export const Charts = () => {
    const { selectedFilters, isHourlyView } = useFilters();
    const [chartsData, setChartsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartsOrder, setChartsOrder] = useState({}); // Store order preferences 
    const [hiddenCharts, setHiddenCharts] = useState([]); // Store hidden chart IDs

    const url = import.meta.env.VITE_URL;
    const userId = import.meta.env.VITE_USERID;
    const user = import.meta.env.VITE_USER;
    const password = import.meta.env.VITE_PASSWORD;

    // Используем useMemo для создания стабильного объекта authData
    const authData = useMemo(() => ({ 
        url, 
        user, 
        password, 
        userId 
    }), [url, userId, user, password]);

    useEffect(() => {
        // Проверяем, что даты установлены, чтобы избежать лишних запросов
        if (!selectedFilters.StartDate || !selectedFilters.EndDate) {
            console.log('Даты не установлены, запрос пропущен');
            setIsLoading(false);
            return;
        }
        
        // Добавляем флаг для предотвращения утечек памяти
        let isMounted = true;

        const loadChartData = async () => {
            if (isMounted) setIsLoading(true);

            try {
                const apiFilters = {
                    startDate: selectedFilters.StartDate,
                    endDate: selectedFilters.EndDate,
                    groupBy: selectedFilters.GroupBy, // Используем GroupBy из selectedFilters
                    City: selectedFilters.City,
                    AgencyId: selectedFilters.Agency,
                    ClusterId: selectedFilters.Cluster,
                    SubCluster: selectedFilters.SubCluster,
                    LineType: selectedFilters.LineType,
                    LineId: selectedFilters.RouteNumber,
                    linegroup: selectedFilters.linegroup
                };

                // Выполняем запросы к API
                const results = await Promise.allSettled([
                    fetchPlanVsPerformance(apiFilters, authData),
                    fetchPerformancePercentage(apiFilters, authData),
                    fetchPlannedTrips(apiFilters, authData),
                    fetchLinePerformanceDetails(apiFilters, authData),
                    fetchPlannedChanges(apiFilters, authData),
                    fetchTripsPerformanceDetails(apiFilters, authData)
                ]);

                const planVsPerformanceData = results[0].status === 'fulfilled' ? results[0].value : null;
                const performancePercentageData = results[1].status === 'fulfilled' ? results[1].value : null;
                const plannedTripsData = results[2].status === 'fulfilled' ? results[2].value : null;
                const linePerformanceData = results[3].status === 'fulfilled' ? results[3].value : null;
                const plannedChangesData = results[4].status === 'fulfilled' ? results[4].value : null;
                const tripsPerformanceDetailsData = results[5].status === 'fulfilled' ? results[5].value : null;

                if (isMounted) {
                    // Преобразуем имеющиеся данные в графики
                    const charts = transformDataToCharts(
                        planVsPerformanceData, 
                        performancePercentageData, 
                        plannedTripsData, 
                        linePerformanceData, 
                        plannedChangesData,
                        tripsPerformanceDetailsData
                    );
                    
                    if (charts.length === 0) {
                        console.warn("API не вернул данных для графиков, используем дефолтные");
                        setChartsData([]);
                    } else {
                        setChartsData(charts);
                    }
                    
                    // Записываем ошибки в консоль для отладки
                    results.forEach((result, index) => {
                        if (result.status === 'rejected') {
                            const endpoints = [
                                'TripsPlannedVSPerformed', 
                                'TripsPlannedVSPerformedPercentage', 
                                'TripsPlanned', 
                                'PerformanceDetailsForLine', 
                                'TripsPlannedChanges',
                                'TripsPerformanceDetails'
                            ];
                            console.error(`Ошибка при запросе ${endpoints[index]}:`, result.reason);
                        }
                    });
                }
            } catch (err) {
                console.error("Ошибка при загрузке данных для графиков:", err);
                if (isMounted) {
                    setError(err.message || "Ошибка при загрузке данных");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        loadChartData();
        
        // Функция очистки
        return () => {
            isMounted = false;
        };
    }, [selectedFilters, authData, isHourlyView]); // Add isHourlyView to dependencies

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedFilters.StartDate || !selectedFilters.EndDate) {
                console.log('Даты не установлены, запрос пропущен');
                return;
            }
    
            console.log('Отправка запроса с фильтрами:', selectedFilters);
    
            try {
                const response = await axios.post(`${url}/endpoint`, {
                    username: user,
                    password: password,
                    data: selectedFilters,
                });
    
                console.log('Ответ от API:', response.data);
            } catch (error) {
                console.error('Ошибка при отправке запроса:', error);
            }
        };
    
        fetchData();
    }, [selectedFilters, url, user, password]);

    // Форматирование даты для отображения по дням
    const formatDay = (dayStr) => {
        if (!dayStr) return 'N/A';

        try {
            // Для почасового режима обрабатываем формат "Apr 8 2025 1:00PM"
            if (isHourlyView && (dayStr.includes('AM') || dayStr.includes('PM'))) {
                const parts = dayStr.split(' ');
                return parts[parts.length - 1]; // Возвращаем только время "1:00PM"
            } 
            // Для обычного формата YYYY-MM-DD
            else if (dayStr.includes('-')) {
                const [year, month, day] = dayStr.split('-');
                return `${day}.${month}`;
            }
            
            return dayStr;
        } catch (e) {
            console.error('Ошибка при форматировании даты:', e);
            return dayStr;
        }
    };

    // Вспомогательная функция для преобразования названия месяца в номер
    const getMonthNumber = (monthName) => {
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        return months[monthName] || '00';
    };

    // Форматирует отображение часа из строки "Apr 8 2025 1:00PM" в "1:00PM"
    const formatHourDisplay = (hourStr) => {
        try {
            const parts = hourStr.split(' ');
            // Берем только последнюю часть строки с временем (например, "1:00PM")
            const timePart = parts[parts.length - 1];
            
            return timePart; // Возвращаем только время в 12-часовом формате
        } catch (e) {
            console.error('Ошибка при форматировании часа:', e, hourStr);
            return hourStr;
        }
    }

    // Функция для преобразования данных API в формат для графиков
    const transformDataToCharts = (
        planVsPerformanceData, 
        performancePercentageData, 
        plannedTripsData, 
        linePerformanceData, 
        plannedChangesData,
        tripsPerformanceDetailsData
    ) => {
        const charts = [];
        
        // 1. График "תכנון / ביצוע" (План / Выполнение)
        if (planVsPerformanceData && planVsPerformanceData.length > 0) {
            // Преобразуем данные API в формат для графика
            const planVsPerformanceChart = {
                data: [
                    ["חודש", "בוצע", "מתוכנן"],
                    // Преобразуем данные из planVsPerformanceData
                    ...planVsPerformanceData.map(item => {
                        const monthDisplay = formatDay(item.GroupBy || item.Month || item.Date);
                        return [
                            monthDisplay || 'חודש',      // Используем GroupBy для даты
                            item.Perfomerd || 0,          // Выполнено (fix: use Perfomerd instead of ActualTrips)
                            item.Planned || 0            // План (fix: use Planned instead of PlannedTrips)
                        ];
                    })
                ],
                options: {
                    chartArea: { width: "80%", height: "60%" },
                    rtl: true,
                    hAxis: {
                        title: "תאיריכים",
                        direction: -1,
                        slantedText: true,
                    },
                    vAxis: { 
                        title: "נסיעות",
                    },
                    legend: { 
                        position: "top",
                        alignment: "center",
                    },
                    series: {
                        0: { pointSize: 5 },
                        1: { pointSize: 5 }
                    },
                    isStacked: false,
                },
                type: "Line",
                isOnline: false,
                title: "תכנון / ביצוע",
            };
            charts.push(planVsPerformanceChart);
        }
        
        // 2. График "אחוז ביצוע" (Процент выполнения)
        if (performancePercentageData && performancePercentageData.length > 0) {
            const performancePercentageChart = {
                data: [
                    ["חודש", "אחוז ביצוע"],
                    // Преобразуем данные из performancePercentageData
                    ...performancePercentageData.map(item => {
                        const monthDisplay = formatDay(item.GroupBy || item.Month || item.Date);
                        return [
                            monthDisplay || 'חודש',          // Используем GroupBy для даты
                            item.PerformancePercentage || 0   // Процент выполнения
                        ];
                    })
                ],
                options: {
                    chartArea: { width: "80%", height: "60%" },
                    hAxis: {
                        title: "תאיריכים",
                        direction: -1,
                        slantedText: true,
                    },
                    vAxis: { 
                        title: "אחוזים",
                        format: '#\'%\'',
                        minValue: 0,
                        maxValue: 100,
                    },
                    legend: { 
                        position: "top",
                        alignment: "center",
                    },
                    series: {
                        0: { pointSize: 5 }
                    },
                    isStacked: false,
                },
                type: "Line",
                isOnline: true,
                title: "אחוז ביצוע",
            };
            charts.push(performancePercentageChart);
        }
        
        // 3. График "שינויים מתוכננים" (Запланированные изменения)
        if (plannedChangesData && plannedChangesData.length > 0) {
            console.log('Начало обработки данных для графика "שינויים מתוכננים"');
            
            // Группируем данные по месяцам
            const monthlyData = {};
            
            plannedChangesData.forEach(item => {
                const month = item.GroupBy;
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        Times: 0,
                        Weekly: 0,
                        Daily: 0,
                        Stops: 0
                    };
                }
                
                // Добавляем количество для соответствующей категории
                monthlyData[month][item.CombinedCategory] = item.Amount;
            });
            
            console.log('Сгруппированные данные по месяцам для изменений:', monthlyData);
            
            // Преобразуем сгруппированные данные в формат для графика
            const chartData = [
                ["חודש", "זמנים", "שבועי", "יומי", "תחנות"]
            ];
            
            Object.entries(monthlyData).forEach(([month, data]) => {
                const monthDisplay = formatDay(month);
                chartData.push([
                    monthDisplay,
                    data.Times || 0,
                    data.Weekly || 0,
                    data.Daily || 0,
                    data.Stops || 0
                ]);
            });
            
            console.log('Финальные данные для графика изменений:', chartData);
            
            const plannedChangesChart = {
                data: chartData,
                options: {
                    chartArea: { width: "80%", height: "60%" },
                    hAxis: {
                        title: "תאיריכים",
                        direction: -1,
                        slantedText: true,
                    },
                    vAxis: { 
                        title: "כמות שינויים",
                    },
                    legend: { 
                        position: "top",
                        alignment: "center",
                    },
                    series: {
                        0: { pointSize: 5 },
                        1: { pointSize: 5 },
                        2: { pointSize: 5 },
                        3: { pointSize: 5 }
                    },
                    isStacked: false,
                },
                type: "Line",
                isOnline: false,
                title: "שינויים מתוכננים",
            };
            
            charts.push(plannedChangesChart);
            console.log('График изменений добавлен, текущее количество графиков:', charts.length);
        }
        
        // 4. График "סוג נסיעות מתוכנן" (Типы запланированных поездок)
        if (plannedTripsData && plannedTripsData.length > 0) {
            console.log('Начало обработки данных для графика "סוג נסיעות מתוכנן"');
            
            // Данные уже сгруппированы по месяцам в ответе API
            const chartData = [
                ["חודש", "עירוני", "בינעירוני"]
            ];
            
            // Преобразуем данные в формат для графика
            plannedTripsData.forEach(item => {
                const monthDisplay = formatDay(item.GroupBy);
                chartData.push([
                    monthDisplay,
                    item.City || 0,     // городские (עירוני)
                    item.InterCity || 0 // междугородние (בינעירוני)
                ]);
            });
            
            console.log('Финальные данные для графика запланированных поездок:', chartData);
            
            const plannedTripsChart = {
                data: chartData,
                options: {
                    chartArea: { width: "80%", height: "60%" },
                    hAxis: {
                        title: "תאיריכים",
                        direction: -1,
                        slantedText: true,
                    },
                    vAxis: { 
                        title: "כמות נסיעות",
                    },
                    legend: { 
                        position: "top",
                        alignment: "center",
                    },
                    series: {
                        0: { pointSize: 5 },
                        1: { pointSize: 5 }
                    },
                    isStacked: false,
                },
                type: "Line",
                isOnline: false,
                title: "סוג נסיעות מתוכנן",
            };
            
            charts.push(plannedTripsChart);
            console.log('График запланированных поездок добавлен, текущее количество графиков:', charts.length);
        }
        
        // 5. График "איחורים / הקדמות לתקופה" (Опоздания/опережения за период)
        if (tripsPerformanceDetailsData && tripsPerformanceDetailsData.length > 0) {
            console.log('Начало обработки данных для графика "איחורים / הקדמות לתקופה"');
            
            if (isHourlyView) {
                // Создаем почасовой график для данного дня
                const hourlyChartData = [
                    ["שעה", "בזמן", "הקדמה עד 2 דקות", "הקדמה 3 דקות ומעלה", "עד 5 דקות", "6-10 דקות", "11-20 דקות", "מעל 20 דקות", "לא בוצע"]
                ];
                
                // Сортируем данные по времени
                const sortedData = [...tripsPerformanceDetailsData].sort((a, b) => {
                    // Преобразуем форматы времени в Date для сравнения
                    const getTimeValue = (timeStr) => {
                        const parts = timeStr.split(' ');
                        const timePart = parts[parts.length - 1]; // "1:00PM"
                        const isPM = timePart.includes('PM');
                        const hourMin = timePart.split(':');
                        let hour = parseInt(hourMin[0]);
                        if (isPM && hour !== 12) hour += 12;
                        if (!isPM && hour === 12) hour = 0;
                        return hour;
                    };
                    return getTimeValue(a.GroupBy) - getTimeValue(b.GroupBy);
                });
                
                // Добавляем данные в таблицу, используя formatHourDisplay
                sortedData.forEach(hourData => {
                    const timeOnly = formatHourDisplay(hourData.GroupBy);
                    
                    hourlyChartData.push([
                        timeOnly,  // Используем только время, без даты
                        hourData.OnTime,
                        hourData.EarlyUpTo2Minutes,
                        hourData.EarlyMoreThan2Minutes,
                        hourData.LateUpTo5Minutes,
                        hourData.Late6To10Minutes,
                        hourData.Late11To20Minutes, 
                        hourData.LateOver20Minutes,
                        hourData.UnPerformed
                    ]);
                });
                
                const hourlyPerformanceChart = {
                    data: hourlyChartData,
                    options: {
                        chartArea: { width: "80%", height: "60%" },
                        hAxis: {
                            title: "שעות",
                            direction: -1,
                            slantedText: true,
                        },
                        vAxis: { 
                            title: "כמות נסיעות",
                        },
                        legend: { 
                            position: "top",
                            alignment: "center",
                        },
                        isStacked: true,
                        seriesType: 'bars',
                    },
                    type: "Column", // Column chart is better for hourly data
                    isOnline: false,
                    title: "איחורים / הקדמות לפי שעות",
                };
                charts.push(hourlyPerformanceChart);
            }
            
            // Существующий код для суммарного графика
            const delayCategories = {
                "הקדמה 3 דקות ומעלה": 0,                
                "הקדמה עד 2 דקות": 0,                
                "עד 5 דקות": 0,                
                "6-10 דקות": 0,                
                "11-20 דקות": 0,                
                "מעל 20 דקות": 0,                
                "לא בוצע": 0
            };
            
            // Суммируем значения по всем часам
            tripsPerformanceDetailsData.forEach(hourData => {
                delayCategories["הקדמה 3 דקות ומעלה"] += hourData.EarlyMoreThan2Minutes;
                delayCategories["הקדמה עד 2 דקות"] += hourData.EarlyUpTo2Minutes;
                delayCategories["עד 5 דקות"] += hourData.LateUpTo5Minutes;
                delayCategories["6-10 דקות"] += hourData.Late6To10Minutes;
                delayCategories["11-20 דקות"] += hourData.Late11To20Minutes;
                delayCategories["מעל 20 דקות"] += hourData.LateOver20Minutes;
                delayCategories["לא בוצע"] += hourData.UnPerformed;
            });
            
            const delayChartData = [
                ["קטגוריה", "ערך"],
                ...Object.entries(delayCategories).map(([key, value]) => [key, value])
            ];
            
            const delayPerformanceChart = {
                data: delayChartData,
                options: {
                    legend: { position: "left" },
                    chartArea: { width: "100%", height: "100%" },
                },
                type: "Area",
                isOnline: false,
                title: "איחורים / הקדמות לתקופה",
            };
            charts.push(delayPerformanceChart);
        }
        
        // 6-7. Для остальных графиков, которым нет данных из API, можно добавить заглушки
        // или не добавлять их вовсе, тогда будут отображаться тестовые данные
        
        return charts;
    };

    const { isModalOpen } = useChartOrdering();

    // Function to handle order changes
    const handleOrderChange = (newOrder) => {
        setChartsOrder(newOrder);
        // Store in localStorage for persistence
        localStorage.setItem('chartsOrder', JSON.stringify(newOrder));
    };

    // Function to handle visibility changes
    const handleVisibilityChange = (newHiddenCharts) => {
        setHiddenCharts(newHiddenCharts);
        // Store in localStorage for persistence
        localStorage.setItem('hiddenCharts', JSON.stringify(newHiddenCharts));
    };

    // Load preferences from localStorage on component mount
    useEffect(() => {
        const savedOrder = localStorage.getItem('chartsOrder');
        const savedHidden = localStorage.getItem('hiddenCharts');
        
        if (savedOrder) {
            try {
                setChartsOrder(JSON.parse(savedOrder));
            } catch (e) {
                console.error("Error parsing saved chart order:", e);
            }
        }
        
        if (savedHidden) {
            try {
                setHiddenCharts(JSON.parse(savedHidden));
            } catch (e) {
                console.error("Error parsing saved hidden charts:", e);
            }
        }
    }, []);

    // Get the charts to display (either API data or default)
    const chartsToDisplay = (chartsData && chartsData.length > 0) ? chartsData : defaultCharts;

    // Apply ordering and visibility
    const sortedAndFilteredCharts = chartsToDisplay
        // Filter out hidden charts
        .filter(chart => !hiddenCharts.includes(chart.title))
        // Sort by the order specified
        .sort((a, b) => {
            const orderA = chartsOrder[a.title] !== undefined ? chartsOrder[a.title] : Infinity;
            const orderB = chartsOrder[b.title] !== undefined ? chartsOrder[b.title] : Infinity;
            return orderA - orderB;
        });

    if (isLoading) {
        return <div className={styles.loading}>טוען נתונים...</div>;
    }

    if (error) {
        return <div className={styles.error}>שגיאה: {error}</div>;
    }

    return (
        <section className={styles.charts}>
            {sortedAndFilteredCharts.map((chart, ind) => (
                <ChartCard chart={chart} key={ind} />
            ))}
            
            <ChartOrderModal 
                charts={chartsToDisplay}
                onOrderChange={handleOrderChange}
                onVisibilityChange={handleVisibilityChange}
                chartsOrder={chartsOrder}
                hiddenCharts={hiddenCharts}
            />
        </section>
    );
};
