import { elem } from "../elem";
import styles from "./Logo.module.css";

export const logo = () => elem("h1", { className: styles.logo, textContent: "Game Logo" });
