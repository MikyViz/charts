import classNames from "classnames";
import { Cross } from "../../svg/cross";
import { Warning } from "../../svg/warning";
import styles from "./message-modal.module.css";
import { useEffect, useState } from "react";

export const MessageModal = () => {
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShowMessage(true);
        }, 1000);
    }, []);

    return (
        <div
            className={classNames(styles.container, {
                [styles.active]: showMessage,
            })}
        >
            <div
                onClick={() => {
                    setShowMessage(false);
                }}
                className={styles.close}
            >
                <Cross />
            </div>
            <Warning />
            <h3 className={styles.title}>18:22 20/12/24 - 20:22 21/12/24</h3>
            <p className={styles.text}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
        </div>
    );
};
