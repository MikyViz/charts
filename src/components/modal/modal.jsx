import { Cross } from "../../svg/cross";
import styles from "./modal.module.css";

export const Modal = ({ children, handlerClose }) => {
    const handleOutsideClick = (event) => {
        if (event.target.className === styles.modal) {
            handlerClose();
        }
    };

    return (
        <div className={styles.modal} onClick={handleOutsideClick}>
            <div className={styles.container}>
                <div onClick={handlerClose} className={styles.cross}>
                    <Cross />
                </div>
                {children}
            </div>
        </div>
    );
};
