/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * AuthCodeListener is the base class from which
 * special CustomFileProtocol and HttpAuthCode inherit
 * their structure and members.
 */
export declare abstract class AuthCodeListener {
    private readonly hostName;
    /**
     * Constructor
     *
     * @param hostName - A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
     */
    constructor(hostName: string);
    /**
     * hostName getter
     *
     * @readonly
     * @type {string}
     * @memberof AuthCodeListener
     */
    get host(): string;
    /**
     * Start listening for auth code
     *
     * @abstract
     * @memberof AuthCodeListener
     */
    abstract start(): void;
    /**
     * Stop listening for auth code
     *
     * @abstract
     * @memberof AuthCodeListener
     */
    abstract close(): void;
}
