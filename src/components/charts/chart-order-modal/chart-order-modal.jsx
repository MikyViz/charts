import { useState, useEffect } from "react";
import styles from "./chart-order-modal.module.css";
import { Cross } from "../../../svg/cross";
import { FilledButton } from "../../filled-button/filled-button";
import { useChartOrdering } from "../../../contexts/chart-ordering-context";
import classNames from "classnames";
import { Eye } from "../../../svg/eye";
import { CloseEye } from "../../../svg/close-eye";
import {
    DndContext,
    closestCenter,
    useSensors,
    useSensor,
    MouseSensor,
    TouchSensor,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove, 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon } from "../../../svg/drag-handle-icon";

const ChartItem = ({ chart, localHidden, handleVisibilityToggle }) => {
    const chartId = chart.title;
    const isHidden = localHidden.includes(chartId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: chartId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 0.1s ease",
    };

    return (
        <div
            ref={setNodeRef}
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
                    <span className={styles.closeEye}>
                        <CloseEye />
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

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );

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

    const handleClose = () => setIsModalOpen(false);

    const handleOutsideClick = (event) => {
        if (event.target.className === styles.modalOverlay) {
            handleClose();
        }
    };

    const handleVisibilityToggle = (chartId) => {
        setLocalHidden((prev) =>
            prev.includes(chartId)
                ? prev.filter((id) => id !== chartId)
                : [...prev, chartId]
        );
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLocalCharts((prevCharts) => {
                const oldIndex = prevCharts.findIndex(
                    (chart) => chart.title === active.id
                );
                const newIndex = prevCharts.findIndex(
                    (chart) => chart.title === over.id
                );
                return arrayMove(prevCharts, oldIndex, newIndex);
            });
        }
    };

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
        <div className={styles.modalOverlay} onClick={handleOutsideClick}>
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
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={localCharts.map((chart) => chart.title)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className={styles.modalBody}>
                            {localCharts.map((chart) => (
                                <ChartItem
                                    key={chart.title}
                                    chart={chart}
                                    localHidden={localHidden}
                                    handleVisibilityToggle={handleVisibilityToggle}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className={styles.modalFooter}>
                    <FilledButton onClick={handleSave} text={"שמור שינויים"} />
                </div>
            </div>
        </div>
    );
};