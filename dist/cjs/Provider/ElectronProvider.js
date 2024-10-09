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
exports.ElectronProvider = void 0;
const mgt_element_1 = require("@microsoft/mgt-element");
/**
 * ElectronProvider class to be instantiated in the renderer process.
 * Responsible for communicating with ElectronAuthenticator in the main process to acquire tokens
 *
 * @export
 * @class ElectronProvider
 * @extends {IProvider}
 */
class ElectronProvider extends mgt_element_1.IProvider {
    /**
     * Name used for analytics
     *
     * @readonly
     * @memberof IProvider
     */
    get name() {
        return "MgtElectronProvider";
    }
    constructor(ipcRenderer, baseUrl = mgt_element_1.MICROSOFT_GRAPH_DEFAULT_ENDPOINT) {
        super();
        this.ipcRenderer = ipcRenderer;
        this.baseURL = baseUrl;
        this.graph = (0, mgt_element_1.createFromProvider)(this);
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
                mgt_element_1.Providers.globalProvider.setState(mgt_element_1.ProviderState.SignedIn);
            }
            else if (authState === "logged_out") {
                mgt_element_1.Providers.globalProvider.setState(mgt_element_1.ProviderState.SignedOut);
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
    getAccessToken(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = (yield this.ipcRenderer.invoke("token", options));
            return token;
        });
    }
    /**
     * Log in to set account information (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            mgt_element_1.Providers.globalProvider.setState(mgt_element_1.ProviderState.Loading);
            yield this.ipcRenderer.invoke("login");
        });
    }
    /**
     * Log out (called by mgt-login)
     *
     * @return {*}  {Promise<void>}
     * @memberof ElectronProvider
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ipcRenderer.invoke("logout");
        });
    }
}
exports.ElectronProvider = ElectronProvider;
