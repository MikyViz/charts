import { Outlet } from "react-router-dom";
import { Header } from "./header/header";
import { Aside } from "./aside/aside";
import { Footer } from "./footer/footer";
import styles from "./layout.module.css";
import { MessageModal } from "../message-modal/message-modal";
import { useState } from "react";
import { Modal } from "../modal/modal";
import { SupportModal } from "../support-modal/support-modal";

export const Layout = () => {
    const [showModal, setShowModal] = useState(false);
    const handlerHelpModal = () => setShowModal(!showModal);

    return (
        <div className={styles.container}>
            {showModal && (
                <Modal
                    handlerClose={() => {
                        setShowModal(false);
                    }}
                >
                    <SupportModal />
                </Modal>
            )}
            <header className={styles.header}>
                <Header handlerHelpModal={handlerHelpModal} />
            </header>
            <aside className={styles.aside}>
                <Aside />
            </aside>
            <main className={styles.main}>
                <Outlet />
            </main>
            <footer className={styles.footer}>
                <Footer />
            </footer>
            <MessageModal />)
        </div>
    );
};
