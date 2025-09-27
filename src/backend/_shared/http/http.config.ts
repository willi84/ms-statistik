/**
 * ⚙️ config for HTTP
 * @module backend/_shared/HTTP
 * @version 0.0.1
 * @date 2025-09-18
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */
export const STANDARD_CURL_TIMEOUT: number = 0.4;
export const CURL_CONFIG_STATUS = `-m ${STANDARD_CURL_TIMEOUT} --silent`;
