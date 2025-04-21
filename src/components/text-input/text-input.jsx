import styles from "./text-input.module.css";

export const TextInput = ({ type, placeholder }) => {
    return (
        <>
            {type === "input" && (
                <input className={styles.input} placeholder={placeholder} type="text" />
            )}
            {type === "textarea" && (
                <textarea className={styles.textarea} placeholder={placeholder}></textarea>
            )}
        </>
    );
};
