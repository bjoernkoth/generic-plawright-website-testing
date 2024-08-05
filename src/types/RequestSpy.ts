import {Page} from '@playwright/test';
import * as _ from "lodash";
import {CustomRequest} from "types/IfcCustomRequest";

const resourceRequestTimeout = 20000;

/**
 * RequestSpy class to record and block requests
 */
export class RequestSpy {
    private page: Page;
    private requests: CustomRequest[] = [];

    /**
     * Constructor
     * @param {Page} page - Playwright page object
     * @param {string} regexStr - optional regex string to match the URL against
     */
    constructor(page: Page, regexStr?: string) {
        this.page = page;
        this.page.on("request", (data: any) => {

            // if regexStr is provided, check if the URL matches to capture it
            if (typeof regexStr === "string" && !(new RegExp(regexStr)).test(data.url())) return;

            // Break postData into pieces and enhance data
            const postData = data?.postData?.();
            if (postData) {
                // if POST data is present, it may contain multiple requests e.g., in GA4
                // split them and push them individually to the requests array
                const postRequests = postData.split(/[\r\n]/).filter((payload: Object) => payload);
                postRequests.forEach((payload: Object) => {
                    this.requests.push({
                        url: data.url(),
                        data: {...this._queryParamsToObj(data.url()), ...this._queryParamsToObj(payload)}
                    });
                });
            } else {
                this.requests.push({
                    url: data.url(),
                    data: this._queryParamsToObj(data.url())
                });
            }
        });
    }

    /**
     * Check if the request matches the URL and payload
     * @param {CustomRequest} request - request object
     * @param {string} urlPart - part of the URL to match
     * @param {object} payload - optional payload to match
     * @private
     */
    private _matchesPayload(request: CustomRequest, urlPart: string, payload?: object): boolean {

        // check if the URL matches
        if (request.url.includes(urlPart)) {
            // additional params can be either in the GET query string OR the POST params
            if (typeof payload === "object" && Object.keys(payload).length > 0) {
                request.data = request.data || {};
                if (_.isMatch(request.data, payload)) {
                    return true;
                }
            } else {
                // no payload
                return true;
            }
        }
        return false;
    }

    /**
     * Wait for a request to be made
     * @param {string} urlPart - part of the URL to match
     * @param {object} payload - optional payload to match
     */
    async waitForRequest(urlPart: string, payload?: object): Promise<string> {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                for (let request of this.requests) {
                    if (this._matchesPayload(request, urlPart, payload)) {
                        clearInterval(intervalId);
                        resolve("resource loaded");
                    }
                }
            }, 100);

            setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`Item not found in array within ${resourceRequestTimeout / 1000}s`));
            }, resourceRequestTimeout);

        });
    }

    /**
     * Transform a GET query string or POST data in string format into an object
     * @param {string|object} data
     * @private
     */
    _queryParamsToObj(data: any): object {
        try {
            if (!data) return {};
            if (typeof data === 'object') {
                return data;
            } else if (typeof data === 'string') {
                if (data.startsWith('{')) {
                    return JSON.parse(data);
                } else if (data.startsWith('http')) {
                    return Object.fromEntries(new URL(data).searchParams);
                } else {
                    return Object.fromEntries(new URL('https://www.foo.com?' + data).searchParams);
                }
            }
        } catch (e: any) {
            // console.error(">>> unable to parse query string: " + e.message + ", " + data)
        }
        return {};
    }

    /**
     * Get all matched requests of the page
     */
    getRequests(): CustomRequest[] {
        return this.requests;
    }
}