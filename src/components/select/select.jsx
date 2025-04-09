import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "../../svg/arrow";
import { Search } from "../../svg/search";
import styles from "./select.module.css";
import classNames from "classnames";
import { Checkbox } from "../checkbox/checkbox";

export const Select = ({
    name,
    items,
    onClick,
    onOpen,
    activeFilters,
    type,
    thereIsSearch = true,
    style,
    size,
    thereIsAgree = true,
}) => {
    const [selectActive, setSelectActive] = useState(false);
    const [localActiveFilters, setLocalActiveFilters] = useState(activeFilters || new Set());
    const selectRef = useRef(null);

    // Обновляем localActiveFilters при изменении activeFilters из пропсов
    useEffect(() => {
        if (activeFilters) {
            setLocalActiveFilters(activeFilters);
        }
    }, [activeFilters]);

    const handlerClick = () => {
        if (!selectActive && onOpen) {
            onOpen();
        }
        setSelectActive(!selectActive);
    };

    // Обработчик клика по чекбоксу
    const handleCheckboxClick = (value) => {
        if (type === "radio") {
            // Для radio заменяем всё на новое значение
            setLocalActiveFilters(new Set([value]));
        } else {
            // Для checkbox добавляем/удаляем значение
            const newFilters = new Set(localActiveFilters);
            if (newFilters.has(value)) {
                newFilters.delete(value);
            } else {
                newFilters.add(value);
            }
            setLocalActiveFilters(newFilters);
        }
        // Вызываем внешний обработчик
        if (onClick) {
            onClick(value);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectActive &&
                selectRef.current &&
                !selectRef.current.contains(event.target)
            ) {
                setSelectActive(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectActive]);

    return (
        <div
            className={classNames(styles.select, {
                [styles.active]: selectActive,
            })}
            ref={selectRef}
        >
            <ButtonOpen
                style={style}
                size={size}
                name={name}
                onClick={handlerClick}
            />
            <Window
                items={items}
                checkboxClick={handleCheckboxClick}
                activeFilters={localActiveFilters}
                handlerClick={handlerClick}
                name={name}
                type={type}
                thereIsSearch={thereIsSearch}
                thereIsAgree={thereIsAgree}
            />
        </div>
    );
};

const ButtonOpen = ({ onClick, name, style, size }) => {
    return (
        <button
            onClick={onClick}
            className={classNames(styles.button, styles[style], styles[size])}
        >
            <span className={styles.buttonName}>{name}</span>
            <span className={styles.arrow}>
                <Arrow color="#7C7C7C" />
            </span>
        </button>
    );
};

const Window = ({
    name,
    items,
    checkboxClick,
    activeFilters,
    handlerClick,
    type,
    thereIsSearch,
    thereIsAgree,
}) => {
    const [foundItems, setFoundItems] = useState(items);

    useEffect(() => {
        setFoundItems(items);
    }, [items]);

    return (
        <div className={styles.window}>
            {thereIsSearch && (
                <SearchFiled
                    handlerInput={(e) => {
                        const regexp = new RegExp(e.target.value, "i");
                        setFoundItems(items.filter((item) => item.match(regexp)));
                    }}
                />
            )}
            <Results
                foundItems={foundItems}
                checkboxClick={checkboxClick}
                activeFilters={activeFilters}
                name={name}
                type={type}
            />
        </div>
    );
};

const SearchFiled = ({ handlerInput }) => {
    return (
        <div className={styles.customInput}>
            <input
                className={styles.input}
                placeholder="חיפוש"
                type="text"
                onInput={handlerInput}
            />
            <span className={styles.search}>
                <Search />
            </span>
        </div>
    );
};

const Results = ({ foundItems, checkboxClick, activeFilters, name, type }) => {
    // Проверяем, есть ли элементы для отображения
    if (!foundItems || foundItems.length === 0) {
        return <div className={styles.noResults}>Нет доступных фильтров</div>;
    }

    return (
        <div className={styles.checkboxContainer}>
            {foundItems.map((item, ind) => {
                return (
                    <Checkbox
                        name={`${name}-${ind}`}
                        item={item}
                        key={ind}
                        type={type}
                        checkboxClick={checkboxClick}
                        activeFilters={activeFilters}
                    />
                );
            })}
        </div>
    );
};

const Submit = ({ handlerClick }) => {
    return (
        <div className={styles.submitContainer}>
            <button onClick={handlerClick} className={styles.submit}>
                <span className={styles.submitText}>לבחור</span>
            </button>
        </div>
    );
};
