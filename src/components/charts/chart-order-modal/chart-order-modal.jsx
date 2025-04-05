import { useState, useEffect } from "react";
import styles from "./chart-order-modal.module.css";
import { Cross } from "../../../svg/cross";
import { Button } from "../../button/button";
import { useChartOrdering } from "../../../contexts/chart-ordering-context";
import classNames from "classnames";
import { Eye } from "../../../svg/eye";
import {
    DndContext,
    closestCenter,
    useDraggable,
    useDroppable,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { DragHandleIcon } from "../../../svg/drag-handle-icon";

const ChartItem = ({ chart, index, localHidden, handleVisibilityToggle }) => {
    const chartId = chart.title;
    const isHidden = localHidden.includes(chartId);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: chartId,
    });

    const { setNodeRef: setDropNodeRef } = useDroppable({
        id: chartId,
    });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
    };

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                setDropNodeRef(node);
            }}
            style={style}
            className={styles.chartElement}
        >
            <span className={styles.chartTitle}>{chart.title}</span>
            <div
                className={classNames(styles.chartButtons, {
                    [styles.hiddenChart]: isHidden,
                })}
            >
                <label>
                    <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => handleVisibilityToggle(chartId)}
                        className={styles.visibilityCheckbox}
                    />
                    <span className={styles.eye}>
                        <Eye />
                    </span>
                </label>
                <span
                    className={styles.dragHandle}
                    {...attributes}
                    {...listeners}
                >
                    <DragHandleIcon />
                </span>
            </div>
        </div>
    );
};

export const ChartOrderModal = ({
    charts,
    onOrderChange,
    onVisibilityChange,
    chartsOrder,
    hiddenCharts,
}) => {
    const { isModalOpen, setIsModalOpen } = useChartOrdering();
    const [localCharts, setLocalCharts] = useState([]);
    const [localHidden, setLocalHidden] = useState([]);

    // Initialize with current values when modal opens
    useEffect(() => {
        if (isModalOpen) {
            const sortedCharts = [...charts].sort((a, b) => {
                const aOrder = chartsOrder[a.title] ?? charts.indexOf(a);
                const bOrder = chartsOrder[b.title] ?? charts.indexOf(b);
                return aOrder - bOrder;
            });
            setLocalCharts(sortedCharts);
            setLocalHidden([...hiddenCharts]);
        }
    }, [isModalOpen, charts, chartsOrder, hiddenCharts]);

    // Close modal function
    const handleClose = () => setIsModalOpen(false);

    // Handle visibility toggle for a chart
    const handleVisibilityToggle = (chartId) => {
        setLocalHidden((prev) => {
            if (prev.includes(chartId)) {
                return prev.filter((id) => id !== chartId);
            } else {
                return [...prev, chartId];
            }
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = localCharts.findIndex(
                (chart) => chart.title === active.id
            );
            const newIndex = localCharts.findIndex(
                (chart) => chart.title === over.id
            );
            const newOrder = arrayMove(localCharts, oldIndex, newIndex);
            setLocalCharts(newOrder);
        }
    };

    // Save changes
    const handleSave = () => {
        const newOrder = {};
        localCharts.forEach((chart, index) => {
            newOrder[chart.title] = index;
        });
        onOrderChange(newOrder);
        onVisibilityChange(localHidden);
        setIsModalOpen(false);
    };

    if (!isModalOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>סדר גרפים</h2>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <Cross />
                    </button>
                </div>

                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className={styles.modalBody}>
                        {localCharts.map((chart, index) => (
                            <ChartItem
                                key={chart.title}
                                chart={chart}
                                index={index}
                                localHidden={localHidden}
                                handleVisibilityToggle={handleVisibilityToggle}
                            />
                        ))}
                    </div>
                </DndContext>

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
