/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { LogLevel, PublicClientApplication, } from "@azure/msal-node";
import { BrowserWindow } from "electron";
import { CustomFileProtocolListener } from "./CustomFileProtocol";
import { REDIRECT_URI, COMMON_AUTHORITY_URL } from "./Constants";
/**
 * Prompt type for consent or login
 *
 * @enum {number}
 */
var promptType;
(function (promptType) {
    /**
     * Select account prompt
     */
    promptType["SELECT_ACCOUNT"] = "select_account";
})(promptType || (promptType = {}));
/**
 * State of Authentication Provider
 *
 * @enum {number}
 */
var AuthState;
(function (AuthState) {
    /**
     * Logged in state
     */
    AuthState["LOGGED_IN"] = "logged_in";
    /**
     * Logged out state
     */
    AuthState["LOGGED_OUT"] = "logged_out";
})(AuthState || (AuthState = {}));
/**
 * ElectronAuthenticator class to be instantiated in the main process.
 * Responsible for MSAL authentication flow and token acqusition.
 *
 * @export
 * @class ElectronAuthenticator
 */
export class ElectronAuthenticator {
    ipcMain;
    protocol;
    /**
     * Configuration for MSAL Authentication
     *
     * @private
     * @type {Configuration}
     * @memberof ElectronAuthenticator
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ms_config;
    /**
     * Application instance
     *
     * @type {PublicClientApplication}
     * @memberof ElectronAuthenticator
     */
    clientApplication;
    /**
     * Mainwindow instance
     *
     * @type {BrowserWindow}
     * @memberof ElectronAuthenticator
     */
    mainWindow;
    // Popup which will take the user through the login/consent process
    /**
     * Auth window instance
     *
     * @type {BrowserWindow}
     * @memberof ElectronAuthenticator
     */
    authWindow;
    /**
     * Logged in account
     *
     * @private
     * @type {AccountDetails}
     * @memberof ElectronAuthenticator
     */
    account;
    /**
     * Params to generate the URL for MSAL auth
     *
     * @private
     * @type {AuthorizationUrlRequest}
     * @memberof ElectronAuthenticator
     */
    authCodeUrlParams;
    /**
     * Request for authentication call
     *
     * @private
     * @type {AuthorizationCodeRequest}
     * @memberof ElectronAuthenticator
     */
    authCodeRequest;
    /**
     * Listener that will listen for auth code in response
     *
     * @private
     * @type {CustomFileProtocolListener}
     * @memberof ElectronAuthenticator
     */
    authCodeListener;
    /**
     * Instance of the authenticator
     *
     * @private
     * @static
     * @type {ElectronAuthenticator}
     * @memberof ElectronAuthenticator
     */
    static authInstance;
    /**
     * Creates an instance of ElectronAuthenticator.
     *
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    constructor(config, ipcMain, protocol) {
        this.ipcMain = ipcMain;
        this.protocol = protocol;
        this.setConfig(config);
        this.account = undefined;
        this.mainWindow = config.mainWindow;
        this.setRequestObjects(config.scopes);
        this.setupProvider();
    }
    /**
     * Initialize the authenticator. Call this method in your main process to create an instance of ElectronAuthenticator.
     *
     * @static
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    static initialize(config, ipcMain, protocol) {
        if (!ElectronAuthenticator.instance) {
            ElectronAuthenticator.authInstance = new ElectronAuthenticator(config, ipcMain, protocol);
        }
    }
    /**
     * Getter for the ElectronAuthenticator instance.
     *
     * @readonly
     * @memberof ElectronAuthenticator
     */
    static get instance() {
        return this.authInstance;
    }
    /**
     * Setting up config for MSAL auth
     *
     * @private
     * @param {MsalElectronConfig} config
     * @memberof ElectronAuthenticator
     */
    setConfig(config) {
        this.ms_config = {
            auth: {
                clientId: config.clientId,
                authority: config.authority ? config.authority : COMMON_AUTHORITY_URL,
            },
            cache: config.cachePlugin
                ? { cachePlugin: config.cachePlugin }
                : undefined,
            system: {
                loggerOptions: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
                    loggerCallback: (_loglevel, _message, _containsPii) => { },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Warning,
                },
            },
        };
        this.clientApplication = new PublicClientApplication(this.ms_config);
    }
    /**
     * Set up request parameters
     *
     * @protected
     * @param {*} [scopes]
     * @memberof ElectronAuthenticator
     */
    setRequestObjects(scopes) {
        const requestScopes = scopes ? scopes : [];
        const redirectUri = REDIRECT_URI;
        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri,
        };
        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri,
            code: "",
        };
    }
    /**
     * Set up an auth window with an option to be visible (invisible during silent sign in)
     *
     * @protected
     * @param {boolean} visible
     * @memberof ElectronAuthenticator
     */
    setAuthWindow(visible) {
        this.authWindow = new BrowserWindow({ show: visible });
    }
    /**
     * Set up messaging between authenticator and provider
     *
     * @protected
     * @memberof ElectronAuthenticator
     */
    setupProvider() {
        this.mainWindow.webContents.on("did-finish-load", () => {
            void this.attemptSilentLogin();
        });
        this.ipcMain.handle("login", async () => {
            const account = await this.login();
            if (account) {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_IN);
            }
            else {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
            }
        });
        this.ipcMain.handle("token", async (_e, options) => {
            const token = await this.getAccessToken(options);
            return token;
        });
        this.ipcMain.handle("logout", async () => {
            await this.logout();
            this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
        });
    }
    /**
     * Get access token
     *
     * @protected
     * @param {AuthenticationProviderOptions} [options]
     * @return {*}  {Promise<string>}
     * @memberof ElectronAuthenticator
     */
    async getAccessToken(options) {
        let authResponse = null;
        const scopes = options?.scopes
            ? options.scopes
            : this.authCodeUrlParams?.scopes;
        const account = this.account || (await this.getAccount());
        if (account) {
            const request = {
                account,
                scopes: scopes,
                forceRefresh: false,
            };
            authResponse = await this.getTokenSilent(request, scopes);
        }
        if (authResponse && authResponse !== null) {
            return authResponse.accessToken;
        }
        return undefined;
    }
    /**
     * Get token silently if available
     *
     * @protected
     * @param {*} tokenRequest
     * @param {*} [_scopes]
     * @return {*}  {Promise<AuthenticationResult>}
     * @memberof ElectronAuthenticator
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getTokenSilent(tokenRequest, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _scopes) {
        try {
            return await this.clientApplication?.acquireTokenSilent(tokenRequest);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Login (open popup and allow user to select account/login)
     *
     * @private
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    async login() {
        const authResponse = await this.getTokenInteractive(promptType.SELECT_ACCOUNT);
        return this.setAccountFromResponse(authResponse);
    }
    /**
     * Logout
     *
     * @private
     * @return {*}  {Promise<void>}
     * @memberof ElectronAuthenticator
     */
    async logout() {
        if (this.account) {
            await this.clientApplication?.getTokenCache().removeAccount(this.account);
            this.account = undefined;
        }
    }
    /**
     * Set this.account to current logged in account
     *
     * @private
     * @param {AuthenticationResult} response
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    async setAccountFromResponse(response) {
        if (response) {
            this.account = response?.account || undefined;
        }
        else {
            this.account = await this.getAccount();
        }
        return this.account;
    }
    /**
     * Get token interactively and optionally allow prompt to select account
     *
     * @protected
     * @param {promptType} prompt_type
     * @param {*} [scopes]
     * @return {*}  {Promise<AuthenticationResult>}
     * @memberof ElectronAuthenticator
     */
    async getTokenInteractive(prompt_type, scopes) {
        const requestScopes = scopes ? scopes : this.authCodeUrlParams?.scopes;
        const authCodeUrlParams = {
            ...this.authCodeUrlParams,
            scopes: requestScopes,
            prompt: prompt_type.toString(),
        };
        const authCodeUrl = await this.clientApplication?.getAuthCodeUrl(authCodeUrlParams);
        this.authCodeListener = new CustomFileProtocolListener(this.protocol, "msal");
        this.authCodeListener.start();
        const authCode = await this.listenForAuthCode(authCodeUrl, prompt_type);
        return await this.clientApplication
            ?.acquireTokenByCode({
            ...this.authCodeRequest,
            scopes: requestScopes,
            code: authCode || "",
        })
            .catch((e) => {
            throw e;
        });
    }
    /**
     * Listen for the auth code in API response
     *
     * @private
     * @param {string} navigateUrl
     * @param {promptType} _prompt_type
     * @return {*}  {Promise<string>}
     * @memberof ElectronAuthenticator
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listenForAuthCode(navigateUrl, _prompt_type) {
        this.setAuthWindow(true);
        await this.authWindow?.loadURL(navigateUrl);
        return new Promise((resolve, reject) => {
            this.authWindow?.webContents.on("will-redirect", (_event, responseUrl) => {
                try {
                    const parsedUrl = new URL(responseUrl);
                    const authCode = parsedUrl.searchParams.get("code");
                    resolve(authCode);
                }
                catch (err) {
                    this.authWindow?.destroy();
                    reject(err);
                }
                this.authWindow?.destroy();
            });
        });
    }
    /**
     * Attempt to Silently Sign In
     *
     * @protected
     * @memberof ElectronAuthenticator
     */
    async attemptSilentLogin() {
        this.account = this.account || (await this.getAccount());
        if (this.account) {
            const token = await this.getAccessToken();
            if (token) {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_IN);
            }
            else {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
            }
        }
        else {
            this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
        }
    }
    /**
     * Get logged in Account details
     *
     * @private
     * @return {*}  {Promise<AccountInfo>}
     * @memberof ElectronAuthenticator
     */
    async getAccount() {
        const cache = this.clientApplication?.getTokenCache();
        const currentAccounts = await cache?.getAllAccounts();
        if (currentAccounts && currentAccounts?.length >= 1) {
            return currentAccounts[0];
        }
        return undefined;
    }
}
