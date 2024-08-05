import {IfcConsentConfiguration} from "types/IfcConsentConfiguration";

/**
 * Generic configuration object for a test suite
 */
export interface IfcGenericConfig {
    name: string, // name of the test suite
    consent?: IfcConsentConfiguration; // consent configuration i.e., what shall be clicked to accept cookies
    requestsPattern?: string; // optional regex string to limit the captured requests
    tests: Array<any>; // array of test cases
}