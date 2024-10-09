/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
import { AuthCodeListener } from "./AuthCodeListener";
import { Protocol } from "electron";
/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code responses.
 */
export declare class CustomFileProtocolListener extends AuthCodeListener {
    private readonly protocol;
    constructor(protocol: Protocol, hostName: string);
    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
    start(): void;
    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    close(): void;
}
