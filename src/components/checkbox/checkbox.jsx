import styles from "./checkbox.module.css";
import classNames from "classnames";

export const Checkbox = ({
    name,
    item,
    type,
    checkboxClick,
    activeFilters
}) => {
    // Определяем, выбран ли этот элемент
    const isChecked = activeFilters && activeFilters.has(item);

    // Обработчик клика по элементу
    const handleClick = () => {
        if (checkboxClick) {
            checkboxClick(item);
        }
    };

    return (
        <div 
            className={classNames(styles.checkbox, {
                [styles.checked]: isChecked,
                [styles.radio]: type === "radio"
            })}
            onClick={handleClick}
        >
            <input
                className={styles.input}
                type={type || "checkbox"}
                name={name}
                id={`${name}-${item}`}
                checked={isChecked}
                readOnly // Используем readOnly, чтобы избежать ошибок React
            />
            <label 
                className={styles.label} 
                htmlFor={`${name}-${item}`}
            >
                {item}
            </label>
        </div>
    );
};
