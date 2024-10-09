"use strict";
/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronAuthenticator = void 0;
const msal_node_1 = require("@azure/msal-node");
const electron_1 = require("electron");
const CustomFileProtocol_1 = require("./CustomFileProtocol");
const Constants_1 = require("./Constants");
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
class ElectronAuthenticator {
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
                authority: config.authority ? config.authority : Constants_1.COMMON_AUTHORITY_URL,
            },
            cache: config.cachePlugin
                ? { cachePlugin: config.cachePlugin }
                : undefined,
            system: {
                loggerOptions: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
                    loggerCallback: (_loglevel, _message, _containsPii) => { },
                    piiLoggingEnabled: false,
                    logLevel: msal_node_1.LogLevel.Warning,
                },
            },
        };
        this.clientApplication = new msal_node_1.PublicClientApplication(this.ms_config);
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
        const redirectUri = Constants_1.REDIRECT_URI;
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
        this.authWindow = new electron_1.BrowserWindow({ show: visible });
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
        this.ipcMain.handle("login", () => __awaiter(this, void 0, void 0, function* () {
            const account = yield this.login();
            if (account) {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_IN);
            }
            else {
                this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
            }
        }));
        this.ipcMain.handle("token", (_e, options) => __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getAccessToken(options);
            return token;
        }));
        this.ipcMain.handle("logout", () => __awaiter(this, void 0, void 0, function* () {
            yield this.logout();
            this.mainWindow.webContents.send("mgtAuthState", AuthState.LOGGED_OUT);
        }));
    }
    /**
     * Get access token
     *
     * @protected
     * @param {AuthenticationProviderOptions} [options]
     * @return {*}  {Promise<string>}
     * @memberof ElectronAuthenticator
     */
    getAccessToken(options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let authResponse = null;
            const scopes = (options === null || options === void 0 ? void 0 : options.scopes)
                ? options.scopes
                : (_a = this.authCodeUrlParams) === null || _a === void 0 ? void 0 : _a.scopes;
            const account = this.account || (yield this.getAccount());
            if (account) {
                const request = {
                    account,
                    scopes: scopes,
                    forceRefresh: false,
                };
                authResponse = yield this.getTokenSilent(request, scopes);
            }
            if (authResponse && authResponse !== null) {
                return authResponse.accessToken;
            }
            return undefined;
        });
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
    getTokenSilent(tokenRequest, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _scopes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield ((_a = this.clientApplication) === null || _a === void 0 ? void 0 : _a.acquireTokenSilent(tokenRequest));
            }
            catch (error) {
                return null;
            }
        });
    }
    /**
     * Login (open popup and allow user to select account/login)
     *
     * @private
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            const authResponse = yield this.getTokenInteractive(promptType.SELECT_ACCOUNT);
            return this.setAccountFromResponse(authResponse);
        });
    }
    /**
     * Logout
     *
     * @private
     * @return {*}  {Promise<void>}
     * @memberof ElectronAuthenticator
     */
    logout() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.account) {
                yield ((_a = this.clientApplication) === null || _a === void 0 ? void 0 : _a.getTokenCache().removeAccount(this.account));
                this.account = undefined;
            }
        });
    }
    /**
     * Set this.account to current logged in account
     *
     * @private
     * @param {AuthenticationResult} response
     * @return {*}
     * @memberof ElectronAuthenticator
     */
    setAccountFromResponse(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response) {
                this.account = (response === null || response === void 0 ? void 0 : response.account) || undefined;
            }
            else {
                this.account = yield this.getAccount();
            }
            return this.account;
        });
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
    getTokenInteractive(prompt_type, scopes) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const requestScopes = scopes ? scopes : (_a = this.authCodeUrlParams) === null || _a === void 0 ? void 0 : _a.scopes;
            const authCodeUrlParams = Object.assign(Object.assign({}, this.authCodeUrlParams), { scopes: requestScopes, prompt: prompt_type.toString() });
            const authCodeUrl = yield ((_b = this.clientApplication) === null || _b === void 0 ? void 0 : _b.getAuthCodeUrl(authCodeUrlParams));
            this.authCodeListener = new CustomFileProtocol_1.CustomFileProtocolListener(this.protocol, "msal");
            this.authCodeListener.start();
            const authCode = yield this.listenForAuthCode(authCodeUrl, prompt_type);
            return yield ((_c = this.clientApplication) === null || _c === void 0 ? void 0 : _c.acquireTokenByCode(Object.assign(Object.assign({}, this.authCodeRequest), { scopes: requestScopes, code: authCode || "" })).catch((e) => {
                throw e;
            }));
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
    listenForAuthCode(navigateUrl, _prompt_type) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.setAuthWindow(true);
            yield ((_a = this.authWindow) === null || _a === void 0 ? void 0 : _a.loadURL(navigateUrl));
            return new Promise((resolve, reject) => {
                var _a;
                (_a = this.authWindow) === null || _a === void 0 ? void 0 : _a.webContents.on("will-redirect", (_event, responseUrl) => {
                    var _a, _b;
                    try {
                        const parsedUrl = new URL(responseUrl);
                        const authCode = parsedUrl.searchParams.get("code");
                        resolve(authCode);
                    }
                    catch (err) {
                        (_a = this.authWindow) === null || _a === void 0 ? void 0 : _a.destroy();
                        reject(err);
                    }
                    (_b = this.authWindow) === null || _b === void 0 ? void 0 : _b.destroy();
                });
            });
        });
    }
    /**
     * Attempt to Silently Sign In
     *
     * @protected
     * @memberof ElectronAuthenticator
     */
    attemptSilentLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            this.account = this.account || (yield this.getAccount());
            if (this.account) {
                const token = yield this.getAccessToken();
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
        });
    }
    /**
     * Get logged in Account details
     *
     * @private
     * @return {*}  {Promise<AccountInfo>}
     * @memberof ElectronAuthenticator
     */
    getAccount() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const cache = (_a = this.clientApplication) === null || _a === void 0 ? void 0 : _a.getTokenCache();
            const currentAccounts = yield (cache === null || cache === void 0 ? void 0 : cache.getAllAccounts());
            if (currentAccounts && (currentAccounts === null || currentAccounts === void 0 ? void 0 : currentAccounts.length) >= 1) {
                return currentAccounts[0];
            }
            return undefined;
        });
    }
}
exports.ElectronAuthenticator = ElectronAuthenticator;
