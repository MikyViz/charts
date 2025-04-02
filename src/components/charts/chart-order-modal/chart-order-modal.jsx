import { useState, useEffect } from 'react';
import styles from './chart-order-modal.module.css';
import { Cross } from '../../../svg/cross';
import { Button } from '../../button/button';
import { useChartOrdering } from "../../../contexts/chart-ordering-context";

export const ChartOrderModal = ({ 
    charts, 
    onOrderChange, 
    onVisibilityChange, 
    chartsOrder, 
    hiddenCharts 
}) => {
    const { isModalOpen, setIsModalOpen } = useChartOrdering();
    const [localOrder, setLocalOrder] = useState({});
    const [localHidden, setLocalHidden] = useState([]);

    // Initialize with current values when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // Create default order if not set
            const defaultOrder = {};
            charts.forEach((chart, index) => {
                const chartId = chart.title;
                defaultOrder[chartId] = chartsOrder[chartId] !== undefined ? chartsOrder[chartId] : index;
            });
            
            setLocalOrder(defaultOrder);
            setLocalHidden([...hiddenCharts]);
        }
    }, [isModalOpen, charts, chartsOrder, hiddenCharts]);

    // Close modal function
    const handleClose = () => setIsModalOpen(false);

    // Handle order change for a specific chart
    const handleOrderChange = (chartId, value) => {
        const orderValue = parseInt(value, 10) || 0;
        setLocalOrder(prev => ({
            ...prev,
            [chartId]: orderValue
        }));
    };

    // Handle visibility toggle for a chart
    const handleVisibilityToggle = (chartId) => {
        setLocalHidden(prev => {
            if (prev.includes(chartId)) {
                return prev.filter(id => id !== chartId);
            } else {
                return [...prev, chartId];
            }
        });
    };

    // Save changes
    const handleSave = () => {
        onOrderChange(localOrder);
        onVisibilityChange(localHidden);
        setIsModalOpen(false); // Close modal after saving
    };

    if (!isModalOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>סדר גרפים</h2>
                    <button onClick={handleClose} className={styles.closeButton}>
                        <Cross />
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    <table className={styles.chartsTable}>
                        <thead>
                            <tr>
                                <th>שם הגרף</th>
                                <th>מספר סדר</th>
                                <th>הצג</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charts.map((chart) => {
                                const chartId = chart.title;
                                const isHidden = localHidden.includes(chartId);
                                
                                return (
                                    <tr key={chartId} className={isHidden ? styles.hiddenChart : ''}>
                                        <td>{chart.title}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                value={localOrder[chartId] || 0}
                                                onChange={(e) => handleOrderChange(chartId, e.target.value)}
                                                className={styles.orderInput}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={!isHidden}
                                                onChange={() => handleVisibilityToggle(chartId)}
                                                className={styles.visibilityCheckbox}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                <div className={styles.modalFooter}>
                    <Button onClick={handleSave} color={"fullBlue"}>
                        שמור שינויים
                    </Button>
                    <Button onClick={handleClose} color={"blue"}>
                        ביטול
                    </Button>
                </div>
            </div>
        </div>
    );
};