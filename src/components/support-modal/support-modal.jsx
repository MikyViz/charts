import { FilledButton } from "../filled-button/filled-button";
import { TextInput } from "../text-input/text-input";
import styles from "./support-modal.module.css"

export const SupportModal = () => {
    return (
        <form className={styles.form}>
            <h2 className={styles.title}>Поддержка</h2>
            <TextInput type="input" placeholder="Заголовк" />
            <TextInput type="textarea" placeholder="Сообщение" />
            <FilledButton text="Отправить" />
        </form>
    );
};
