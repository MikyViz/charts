import { Link } from "react-router-dom";
import logo from "../../../img/לוגו.png";
import { Help } from "../../../svg/help";
import styles from "./header.module.css";
import { SupportModal } from "../../support-modal/support-modal";
import { Modal } from "../../modal/modal";
import { useState } from "react";

export const Header = ({ thereAreActivities = true }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.header}>
            {showModal && (
                <Modal
                    handlerClose={() => {
                        setShowModal(false);
                    }}
                >
                    <SupportModal />
                </Modal>
            )}
            <Link className={styles.home} to={"/"}>
                <img src={logo} className={styles.img} alt="Logo" />
            </Link>
            {thereAreActivities && (
                <div className={styles.active}>
                    <button
                        onClick={() => {
                            setShowModal(true);
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
