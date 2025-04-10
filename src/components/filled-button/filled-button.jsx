import styles from "./filled-button.module.css"

export const FilledButton = ({ text, onClick }) => {
    return <button className={styles.button} onClick={onClick}>{text}</button>;
};
