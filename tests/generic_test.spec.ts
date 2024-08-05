import {test} from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {RequestSpy} from "types/RequestSpy";
import {processConsent, waitForDataLayer} from "src/lib";

test.describe("Generic Tests with JSON config", () => {
    const jsonConfigs = fs.readdirSync('tests/config').filter(file => path.extname(file) === '.json');
    jsonConfigs.forEach(configFile => {
        // const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config", configFile), "utf8"));
        const config = JSON.parse(fs.readFileSync(path.join("tests/config", configFile), "utf8"));
        const testCases = config.tests || [];
        for (const testCase of testCases) {

            const previouslyConsented = fs.existsSync(__dirname + "/storageState/" + configFile);
            if (previouslyConsented) {
                test.use({storageState: __dirname + "/storageState/" + configFile});
            }

            test(`${testCase.name}`, async ({page}) => {

                // set up request recording
                const requestSpy = new RequestSpy(page, config.requestsPattern);
                await page.goto(testCase.url);
                await page.waitForTimeout(5000);

                // apply consent
                if (!previouslyConsented) {
                    await processConsent(page, config, __dirname + "/storageState/" + configFile);
                }

                // test base data layer entry
                if (testCase.dataLayer && testCase.dataLayer.name && testCase.dataLayer.payload) {
                    await waitForDataLayer(page, testCase.dataLayer.name, testCase.dataLayer.payload);
                }

                // test page requests e.g., libraries, tracking pixels, etc.
                await Promise.all((testCase.requests || []).map((request: any) => {
                    return requestSpy.waitForRequest(request.url, request.payload);
                }));
            });
        }
    });
});