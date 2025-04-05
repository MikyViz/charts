import { Cross } from "../../svg/cross";
import styles from "./modal.module.css"

export const Modal = ({ children, handlerClose }) => {
    return (
        <div className={styles.modal}>
            <div className={styles.container}>
                <div onClick={handlerClose} className={styles.cross}>
                    <Cross />
                </div>
                {children}
            </div>
        </div>
    );
};
