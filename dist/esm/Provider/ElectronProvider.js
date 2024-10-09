/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { IProvider, Providers, ProviderState, createFromProvider, MICROSOFT_GRAPH_DEFAULT_ENDPOINT, } from "@microsoft/mgt-element";
/**
 * ElectronProvider class to be instantiated in the renderer process.
 * Responsible for communicating with ElectronAuthenticator in the main process to acquire tokens
 *
 * @export
 * @class ElectronProvider
 * @extends {IProvider}
 */
export class ElectronProvider extends IProvider {
    ipcRenderer;
    /**
     * Name used for analytics
     *
     * @readonly
     * @memberof IProvider
     */
    get name() {
        return "MgtElectronProvider";
    }
    graph;
    constructor(ipcRenderer, baseUrl = MICROSOFT_GRAPH_DEFAULT_ENDPOINT) {
        super();
        this.ipcRenderer = ipcRenderer;
        this.baseURL = baseUrl;
        this.graph = createFromProvider(this);
        this.setupProvider();
    }
    /**
     * Sets up messaging between main and renderer to receive SignedIn/SignedOut state information
     *
     * @memberof ElectronProvider
     */
    setupProvider() {
        this.ipcRenderer.on("mgtAuthState", (event, authState) => {
            if (authState === "logged_in") {
                Providers.globalProvider.setState(ProviderState.SignedIn);
            }
            else if (authState === "logged_out") {
                Providers.globalProvider.setState(ProviderState.SignedOut);
            }
        });
    }
    /**
     * Gets access token (called by MGT components)
     *
     * @param {AuthenticationProviderOptions} [options]
     * @return {*}  {Promise<string>}
     * @memberof ElectronProvider
     */
    async getAccessToken(options) {
        const token = (await this.ipcRenderer.invoke("token", options));
        return token;
    }
    /**
     * Log in to set account information (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    async login() {
        Providers.globalProvider.setState(ProviderState.Loading);
        await this.ipcRenderer.invoke("login");
    }
    /**
     * Log out (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    async logout() {
        await this.ipcRenderer.invoke("logout");
    }
}
