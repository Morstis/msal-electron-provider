/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { AccountInfo, AuthenticationResult, ICachePlugin, PublicClientApplication, SilentFlowRequest } from "@azure/msal-node";
import { AuthenticationProviderOptions } from "@microsoft/microsoft-graph-client";
import { GraphEndpoint } from "@microsoft/mgt-element";
import { BrowserWindow, IpcMain, Protocol } from "electron";
/**
 * base config for MSAL authentication
 *
 * @interface MsalElectronConfig
 */
export interface MsalElectronConfig {
    /**
     * Client ID alphanumeric code
     *
     * @type {string}
     * @memberof MsalElectronConfig
     */
    clientId: string;
    /**
     * Main window instance
     *
     * @type {BrowserWindow}
     * @memberof MsalElectronConfig
     */
    mainWindow: BrowserWindow;
    /**
     * Config authority
     *
     * @type {string}
     * @memberof MsalElectronConfig
     */
    authority?: string;
    /**
     * List of scopes
     *
     * @type {string[]}
     * @memberof MsalElectronConfig
     */
    scopes?: string[];
    /**
     * Cache plugin to enable persistent caching
     *
     * @type {ICachePlugin}
     * @memberof MsalElectronConfig
     */
    cachePlugin?: ICachePlugin;
    /**
     * The base URL for the graph client
     */
    baseURL?: GraphEndpoint;
}
/**
 * Prompt type for consent or login
 *
 * @enum {number}
 */
declare enum promptType {
    /**
     * Select account prompt
     */
    SELECT_ACCOUNT = "select_account"
}
/**
 * AccountDetails defines the available AccountInfo or undefined.
 */
type AccountDetails = AccountInfo | undefined;
/**
 * ElectronAuthenticator class to be instantiated in the main process.
 * Responsible for MSAL authentication flow and token acqusition.
 *
 * @export
 * @class ElectronAuthenticator
 */
export declare class ElectronAuthenticator {
    private readonly ipcMain;
    private readonly protocol;
    /**
     * Configuration for MSAL Authentication
     *
     * @private
     * @type {Configuration}
     * @memberof ElectronAuthenticator
     */
    private ms_config;
    /**
     * Application instance
     *
     * @type {PublicClientApplication}
     * @memberof ElectronAuthenticator
     */
    clientApplication: PublicClientApplication | undefined;
    /**
     * Mainwindow instance
     *
     * @type {BrowserWindow}
     * @memberof ElectronAuthenticator
     */
    mainWindow: BrowserWindow;
    /**
     * Auth window instance
     *
     * @type {BrowserWindow}
     * @memberof ElectronAuthenticator
     */
    authWindow: BrowserWindow | undefined;
    /**
     * Logged in account
     *
     * @private
     * @type {AccountDetails}
     * @memberof ElectronAuthenticator
     */
    private account;
    /**
     * Params to generate the URL for MSAL auth
     *
     * @private
     * @type {AuthorizationUrlRequest}
     * @memberof ElectronAuthenticator
     */
    private authCodeUrlParams;
    /**
     * Request for authentication call
     *
     * @private
     * @type {AuthorizationCodeRequest}
     * @memberof ElectronAuthenticator
     */
    private authCodeRequest;
    /**
     * Listener that will listen for auth code in response
     *
     * @private
     * @type {CustomFileProtocolListener}
     * @memberof ElectronAuthenticator
     */
    private authCodeListener;
    /**
     * Instance of the authenticator
     *
     * @private
     * @static
     * @type {ElectronAuthenticator}
     * @memberof ElectronAuthenticator
     */
    private static authInstance;
    /**
     * Creates an instance of ElectronAuthenticator.
     *
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    private constructor();
    /**
     * Initialize the authenticator. Call this method in your main process to create an instance of ElectronAuthenticator.
     *
     * @static
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    static initialize(config: MsalElectronConfig, ipcMain: IpcMain, protocol: Protocol): void;
    /**
     * Getter for the ElectronAuthenticator instance.
     *
     * @readonly
     * @memberof ElectronAuthenticator
     */
    static get instance(): ElectronAuthenticator;
    /**
     * Setting up config for MSAL auth
     *
     * @private
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    private setConfig;
    /**
     * Set up request parameters
     *
     * @protected
     * @param {*} [scopes]
     * @memberof ElectronAuthenticator
     */
    protected setRequestObjects(scopes?: string[]): void;
    /**
     * Set up an auth window with an option to be visible (invisible during silent sign in)
     *
     * @protected
     * @param {boolean} visible
     * @memberof ElectronAuthenticator
     */
    protected setAuthWindow(visible: boolean): void;
    /**
     * Set up messaging between authenticator and provider
     *
     * @protected
     * @memberof ElectronAuthenticator
     */
    protected setupProvider(): void;
    /**
     * Get access token
     *
     * @protected
     * @param {AuthenticationProviderOptions} [options]
     * @return {*}  {Promise<string>}
     * @memberof ElectronAuthenticator
     */
    protected getAccessToken(options?: AuthenticationProviderOptions): Promise<string | undefined>;
    /**
     * Get token silently if available
     *
     * @protected
     * @param {*} tokenRequest
     * @param {*} [_scopes]
     * @return {*}  {Promise<AuthenticationResult>}
     * @memberof ElectronAuthenticator
     */
    protected getTokenSilent(tokenRequest: SilentFlowRequest, _scopes?: string[]): Promise<AuthenticationResult | null | undefined>;
    /**
     * Login (open popup and allow user to select account/login)
     *
     * @private
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    protected login(): Promise<AccountDetails>;
    /**
     * Logout
     *
     * @private
     * @return {*}  {Promise<void>}
     * @memberof ElectronAuthenticator
     */
    protected logout(): Promise<void>;
    /**
     * Set this.account to current logged in account
     *
     * @private
     * @param {AuthenticationResult} response
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    private setAccountFromResponse;
    /**
     * Get token interactively and optionally allow prompt to select account
     *
     * @protected
     * @param {promptType} prompt_type
     * @param {*} [scopes]
     * @return {*}  {Promise<AuthenticationResult>}
     * @memberof ElectronAuthenticator
     */
    protected getTokenInteractive(prompt_type: promptType, scopes?: string[]): Promise<AuthenticationResult | undefined>;
    /**
     * Listen for the auth code in API response
     *
     * @private
     * @param {string} navigateUrl
     * @param {promptType} _prompt_type
     * @return {*}  {Promise<string>}
     * @memberof ElectronAuthenticator
     */
    private listenForAuthCode;
    /**
     * Attempt to Silently Sign In
     *
     * @protected
     * @memberof ElectronAuthenticator
     */
    protected attemptSilentLogin(): Promise<void>;
    /**
     * Get logged in Account details
     *
     * @private
     * @return {*}  {Promise<AccountInfo>}
     * @memberof ElectronAuthenticator
     */
    private getAccount;
}
export {};
