/**
 * Interface for the consent configuration
 */
export interface IfcConsentConfiguration {
    modifiers: [object];
    locator?: string; // locator to find the consent element
    role?: any; // role to find the consent element
    label?: string; // label to find the consent element
    options?: Object; // options to find the consent element
}