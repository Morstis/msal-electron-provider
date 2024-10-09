/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { IProvider, GraphEndpoint, Graph } from "@microsoft/mgt-element";
import { AuthenticationProviderOptions } from "@microsoft/microsoft-graph-client";
import { IpcRenderer } from "electron";
/**
 * ElectronProvider class to be instantiated in the renderer process.
 * Responsible for communicating with ElectronAuthenticator in the main process to acquire tokens
 *
 * @export
 * @class ElectronProvider
 * @extends {IProvider}
 */
export declare class ElectronProvider extends IProvider {
    private readonly ipcRenderer;
    /**
     * Name used for analytics
     *
     * @readonly
     * @memberof IProvider
     */
    get name(): string;
    graph: Graph;
    constructor(ipcRenderer: IpcRenderer, baseUrl?: GraphEndpoint);
    /**
     * Sets up messaging between main and renderer to receive SignedIn/SignedOut state information
     *
     * @memberof ElectronProvider
     */
    setupProvider(): void;
    /**
     * Gets access token (called by MGT components)
     *
     * @param {AuthenticationProviderOptions} [options]
     * @return {*}  {Promise<string>}
     * @memberof ElectronProvider
     */
    getAccessToken(options?: AuthenticationProviderOptions): Promise<string>;
    /**
     * Log in to set account information (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    login(): Promise<void>;
    /**
     * Log out (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    logout(): Promise<void>;
}
