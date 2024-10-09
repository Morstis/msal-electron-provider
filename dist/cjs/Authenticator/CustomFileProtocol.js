"use strict";
/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFileProtocolListener = void 0;
const AuthCodeListener_1 = require("./AuthCodeListener");
const path_1 = require("path");
const url_1 = require("url");
/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code responses.
 */
class CustomFileProtocolListener extends AuthCodeListener_1.AuthCodeListener {
    constructor(protocol, hostName) {
        super(hostName);
        this.protocol = protocol;
    }
    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
    start() {
        this.protocol.registerFileProtocol(this.host, (req, callback) => {
            const requestUrl = (0, url_1.parse)(req.url, true);
            callback((0, path_1.normalize)(`${__dirname}/${requestUrl.path}`));
        });
    }
    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    close() {
        this.protocol.unregisterProtocol(this.host);
    }
}
exports.CustomFileProtocolListener = CustomFileProtocolListener;
