/**
 * Časovač odpočítavania pre cestu k práci dátového analytika
 * ES6 module pattern pre zabránenie globálneho scope pollution
 *
 * @author Claude
 * @version 1.0.0
 */

// IIFE pre vytvorenie privátneho scope
(() => {
  "use strict";

  // Konfiguračné konštanty
  const CONFIG = {
    TARGET_DATE: "August 31, 2025 23:59:59",
    START_DATE: "May 17, 2025 00:00:00",
    UPDATE_INTERVAL: 1000, // ms
    LOCALE: "sk-SK",
    SELECTORS: {
      days: "#days",
      hours: "#hours",
      minutes: "#minutes",
      seconds: "#seconds",
      totalDays: "#total-days",
      startDate: "#start-date",
      endDate: "#end-date",
      progressBar: "#progress-bar",
      progressPercentage: "#progress-percentage",
      message: ".message",
    },
    MESSAGES: {
      expired:
        "Čas vypršal! Dúfam, že si pripravený na svoju novú kariéru dátového analytika!",
    },
  };

  // Dátumové objekty
  const DATES = {
    target: new Date(CONFIG.TARGET_DATE).getTime(),
    start: new Date(CONFIG.START_DATE).getTime(),
    get now() {
      return new Date().getTime();
    },
    get totalDuration() {
      return this.target - this.start;
    },
    get remaining() {
      return this.target - this.now;
    },
    get elapsed() {
      return this.now - this.start;
    },
    get percentComplete() {
      return (this.elapsed / this.totalDuration) * 100;
    },
  };

  /**
   * DOM utility funkcie
   */
  const DOM = {
    /**
     * Získa element podľa selektora
     * @param {string} selector - CSS selektor
     * @return {HTMLElement}
     */
    get(selector) {
      return document.querySelector(selector);
    },

    /**
     * Nastaví text elementu
     * @param {string} selector - CSS selektor
     * @param {string} text - Text na nastavenie
     */
    setText(selector, text) {
      const element = this.get(selector);
      if (element) {
        element.textContent = text;
      }
    },

    /**
     * Nastaví atribút elementu
     * @param {string} selector - CSS selektor
     * @param {string} attribute - Názov atribútu
     * @param {string} value - Hodnota atribútu
     */
    setAttribute(selector, attribute, value) {
      const element = this.get(selector);
      if (element) {
        element.setAttribute(attribute, value);
      }
    },

    /**
     * Nastaví štýl elementu
     * @param {string} selector - CSS selektor
     * @param {string} property - CSS vlastnosť
     * @param {string} value - Hodnota vlastnosti
     */
    setStyle(selector, property, value) {
      const element = this.get(selector);
      if (element) {
        element.style[property] = value;
      }
    },
  };

  /**
   * Utility funkcie pre dátumy a čísla
   */
  const Utils = {
    /**
     * Formátovanie dátumu v slovenčine
     * @param {number} timestamp - Unix timestamp
     * @return {string} - Formátovaný dátum
     */
    formatDate(timestamp) {
      const d = new Date(timestamp);
      const monthNames = [
        "január",
        "február",
        "marec",
        "apríl",
        "máj",
        "jún",
        "júl",
        "august",
        "september",
        "október",
        "november",
        "december",
      ];
      return `${d.getDate()}. ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    },

    /**
     * Padding čísla nulami
     * @param {number} num - Číslo na formátovanie
     * @param {number} size - Požadovaná dĺžka
     * @return {string} - Formátované číslo
     */
    padNumber(num, size = 2) {
      return num.toString().padStart(size, "0");
    },

    /**
     * Formátovanie percentuálnej hodnoty na 2 desatinné miesta
     * @param {number} value - Hodnota v percentách
     * @return {string} - Formátovaná hodnota s %
     */
    formatPercentage(value) {
      return `${value.toFixed(2)}%`;
    },

    /**
     * Výpočet časových jednotiek z milisekúnd
     * @param {number} ms - Čas v milisekundách
     * @return {Object} - Objekt s časovými jednotkami
     */
    calculateTimeUnits(ms) {
      // Vyhneme sa negatívnym hodnotám
      const time = Math.max(0, ms);

      return {
        days: Math.floor(time / (1000 * 60 * 60 * 24)),
        hours: Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((time % (1000 * 60)) / 1000),
      };
    },
  };

  /**
   * Trieda pre odpočítavanie
   */
  class Countdown {
    constructor() {
      this.interval = null;
      this.isExpired = false;
      this.initializeDateLabels();
      this.debugInitialInfo();
    }

    /**
     * Inicializácia dátumových popiskov
     */
    initializeDateLabels() {
      DOM.setText(CONFIG.SELECTORS.startDate, Utils.formatDate(DATES.start));
      DOM.setText(CONFIG.SELECTORS.endDate, Utils.formatDate(DATES.target));
    }

    /**
     * Debug informácie pri spustení
     */
    debugInitialInfo() {
      console.log("Skript sa načítal!");
      console.log(
        "Cieľový dátum:",
        new Date(CONFIG.TARGET_DATE).toLocaleString(CONFIG.LOCALE)
      );
      console.log("Aktuálny dátum:", new Date().toLocaleString(CONFIG.LOCALE));
      console.log(
        "Začiatočný dátum:",
        new Date(CONFIG.START_DATE).toLocaleString(CONFIG.LOCALE)
      );
      console.log(
        "Celkové trvanie (dni):",
        DATES.totalDuration / (1000 * 60 * 60 * 24)
      );
    }

    /**
     * Spustenie odpočítavania
     */
    start() {
      // Okamžitá aktualizácia
      this.update();

      // Nastavenie intervalu
      this.interval = setInterval(() => this.update(), CONFIG.UPDATE_INTERVAL);
    }

    /**
     * Aktualizácia hodnôt odpočítavania
     */
    update() {
      // Kontrola, či časovač už vypršal
      if (DATES.remaining <= 0 && !this.isExpired) {
        this.handleExpiration();
        return;
      }

      // Výpočet a aktualizácia časových hodnôt
      const timeUnits = Utils.calculateTimeUnits(DATES.remaining);
      this.updateTimeDisplay(timeUnits);

      // Aktualizácia progress baru
      this.updateProgressBar();

      // Debug info
      this.logDebugInfo(timeUnits);
    }

    /**
     * Aktualizácia zobrazenia času
     * @param {Object} timeUnits - Objekt s časovými jednotkami
     */
    updateTimeDisplay(timeUnits) {
      DOM.setText(CONFIG.SELECTORS.days, Utils.padNumber(timeUnits.days));
      DOM.setText(CONFIG.SELECTORS.hours, Utils.padNumber(timeUnits.hours));
      DOM.setText(CONFIG.SELECTORS.minutes, Utils.padNumber(timeUnits.minutes));
      DOM.setText(CONFIG.SELECTORS.seconds, Utils.padNumber(timeUnits.seconds));
      DOM.setText(CONFIG.SELECTORS.totalDays, timeUnits.days);
    }

    /**
     * Aktualizácia progress baru
     */
    updateProgressBar() {
      const percentValue = DATES.percentComplete;
      const formattedPercent = Utils.formatPercentage(percentValue);

      DOM.setStyle(CONFIG.SELECTORS.progressBar, "width", formattedPercent);
      DOM.setText(CONFIG.SELECTORS.progressPercentage, formattedPercent);
      DOM.setAttribute(
        CONFIG.SELECTORS.progressBar,
        "aria-valuenow",
        Math.round(percentValue)
      );
    }

    /**
     * Spracovanie expirácie časovača
     */
    handleExpiration() {
      this.isExpired = true;
      clearInterval(this.interval);

      // Nastavenie hodnôt na nulu
      const timeUnits = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      this.updateTimeDisplay(timeUnits);

      // Nastavenie progress baru na 100%
      DOM.setStyle(CONFIG.SELECTORS.progressBar, "width", "100%");
      DOM.setText(CONFIG.SELECTORS.progressPercentage, "100.00%");
      DOM.setAttribute(CONFIG.SELECTORS.progressBar, "aria-valuenow", 100);

      // Aktualizácia správy
      DOM.setText(CONFIG.SELECTORS.message, CONFIG.MESSAGES.expired);
    }

    /**
     * Logovanie debug informácií
     * @param {Object} timeUnits - Objekt s časovými jednotkami
     */
    logDebugInfo(timeUnits) {
      console.log(
        "Odpočítavanie:",
        timeUnits.days,
        "dní,",
        timeUnits.hours,
        "hodín,",
        timeUnits.minutes,
        "minút,",
        timeUnits.seconds,
        "sekúnd"
      );
      console.log(
        "Percentá dokončenia:",
        Utils.formatPercentage(DATES.percentComplete)
      );
    }
  }

  // Vytvorenie a spustenie odpočítavania po načítaní DOM
  document.addEventListener("DOMContentLoaded", () => {
    try {
      const countdown = new Countdown();
      countdown.start();
    } catch (error) {
      console.error("Chyba pri inicializácii odpočítavania:", error);
    }
  });
})();
