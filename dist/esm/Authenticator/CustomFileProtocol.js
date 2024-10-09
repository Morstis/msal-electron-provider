/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { AuthCodeListener } from "./AuthCodeListener";
import { normalize } from "path";
import { parse } from "url";
/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code responses.
 */
export class CustomFileProtocolListener extends AuthCodeListener {
    protocol;
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
            const requestUrl = parse(req.url, true);
            callback(normalize(`${__dirname}/${requestUrl.path}`));
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
