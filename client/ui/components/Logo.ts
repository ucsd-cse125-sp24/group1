import styles from "./Logo.module.css";
import { elem } from "../elem";

export const logo = () => elem("h1", { className: styles.logo, textContent: "Game Logo" });
