import { Link } from "react-router-dom";
import logo from "../../../img/לוגו.png";
import { Help } from "../../../svg/help";
import styles from "./header.module.css";

export const Header = ({ thereAreActivities = true, handlerHelpModal }) => {
    return (
        <div className={styles.header}>
            <Link className={styles.home} to={"/"}>
                <img src={logo} className={styles.img} alt="Logo" />
            </Link>
            {thereAreActivities && (
                <div className={styles.active}>
                    <button
                        onClick={() => {
                            handlerHelpModal(true);
                        }}
                        className={styles.helpButton}
                    >
                        <span className={styles.btnText}>תמיכה</span>
                        <span className={styles.svg}>
                            <Help />
                        </span>
                    </button>
                    <span className={styles.user}>שלום, יענקי!</span>
                    <div className={styles.statusContainer}>
                        <span className={styles.statusRound}></span>
                        <span className={styles.status}>מחובר</span>
                    </div>
                </div>
            )}
        </div>
    );
};
