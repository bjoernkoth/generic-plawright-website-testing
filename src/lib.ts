import * as _ from "lodash";
import {expect, Locator, Page} from "@playwright/test";
import {IfcGenericConfig} from "types/IfcGenericConfig";

/**
 * Click a cookie consent button
 * @param page - the Page instance
 * @param locator - the locator to click
 * @param [path] - the path to store the storage state
 */
export const applyConsent = async (page: Page, locator: Locator, path?: string): Promise<void> => {
    await locator.waitFor({state: "visible"});
    await locator.click();
    await locator.waitFor({state: "hidden"});
    await delay(3000);
    await page.context().storageState({path: path ? path : "storageState.json"});
}

/**
 * Process consent based on the config
 * @param page - the Page instance
 * @param config - the generic configuration object
 * @param [path] - the path to store the storage state
 */
export async function processConsent(page: Page, config: IfcGenericConfig, path?: string) {
    if (config.consent) {
        let locator: any;

        // parse through the different function name - parameter pairs in the "consent" object
        // and apply the consent based on the locator found
        if (config.consent.locator) {
            // @ts-ignore
            locator = await page[config.consent.locator.name](config.consent.locator.value);

            if (locator) {
                // apply modifiers to the locator if set
                if (config.consent.modifiers) {
                    for (const modifier of config.consent.modifiers) {
                        // console.log(">>> Applied modifier: ", modifier.name, modifier.value);
                        // @ts-ignore
                        locator = await locator[modifier.name](modifier.value);
                    }
                }
            }
        }

        if (locator) {
            // console.log(">>> Locator found, applying consent");
            await applyConsent(page, locator, path);
        } else {
            console.log(">>> No locator found, skipping consent");
        }
    }
}

/**
 * Search for the datalayer itself or a specific(!) payload within the dataLayer.
 * NOTE: Does not support fluffy properties e.g., "foo": expect.any(String)
 * Creates an interval which checks for the dataLayer to be present with the given payload which may be set only later.
 * @param page - the Page instance
 * @param dataLayerName - the name of the dataLayer object
 * @param expectedPayload - key-value payload to look for
 */
export const waitForDataLayer = async (page: Page, dataLayerName: string, expectedPayload?: object) => {
    // @ts-ignore
    const dataLayer = await page.evaluate(({dataLayerName}) => window[dataLayerName], {dataLayerName});
    expect(dataLayer).toBeDefined();
    expect(dataLayer).toBeInstanceOf(Array);
    if (expectedPayload) {
        expect(expectedPayload).toBeInstanceOf(Object);
        expect(dataLayer.some((item: object) => _.isMatch(item, expectedPayload))).toBeTruthy();
    }
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));