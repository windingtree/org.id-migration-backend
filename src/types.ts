/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Objet describing an error */
export interface Error {
  /**
   * Error message
   * @example "Something went wrong"
   */
  message: string;
}

/** Health response */
export interface Health {
  /**
   * Current server time
   * @format date-time
   * @example "2022-11-16T22:33:49.333+01:00"
   */
  time: string;
  /**
   * Actual git commit hash
   * @example "7edb2b9e2204f908d1b03f2c2872b39f29b31bc5"
   */
  commit: string;
  /**
   * Redis DB connection status
   * @example "ready"
   */
  redis: string;
}

/**
 * EOA
 * @pattern ^0x[a-fA-F0-9]{40}$
 * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
 */
export type EthAddress = string;

/**
 * ORGiD DID
 * @pattern ^did:orgid:([0-9])*(?::)?(0x[a-fA-F0-9]{64})+$
 * @example "did:orgid:77:0xeae18b4ccf6dfd743dc1738c6547bc829c3384bcc2b48f98f0c9a49c5c67b2be"
 */
export type Did = string;

/** List of ORGiDs DIDs */
export interface DidWithState {
  /** ORGiD DID */
  did: Did;
  /** An ORGiD migration request progress state */
  state: RequestState;
}

/** List of ORGiDs DIDs */
export type Dids = DidWithState[];

/** In-path API /owner/{address} parameters */
export interface ApiOwnerParams {
  /** EOA */
  owner: EthAddress;
}

/** In-path API /did/{did} parameters */
export interface ApiDidParams {
  /** ORGiD DID */
  did: Did;
}

/** In-path API /request/{id} parameters */
export interface ApiRequestParams {
  /** Migration request Id */
  id: RequestId;
}

/** Migration request Id */
export type RequestId = string;

/** An ORGiD migration request */
export interface MigrationRequest {
  /** ORGiD DID */
  did: Did;
  /** Chain Id */
  chain: 5 | 77 | 100 | 137;
  /** Serialized ORGiD VC */
  orgIdVc: string;
}

/** An ORGiD migration request progress state */
export enum RequestState {
  Ready = 'ready',
  Requested = 'requested',
  Progress = 'progress',
  Failed = 'failed',
  Completed = 'completed',
}

/** An ORGiD migration request status */
export interface RequestStatus {
  /** Migration request Id */
  id: RequestId;
  /** Timestamp when the request was created */
  timestamp: number;
  /** ORGiD DID */
  did: Did;
  /** An ORGiD migration request progress state */
  state: RequestState;
}
