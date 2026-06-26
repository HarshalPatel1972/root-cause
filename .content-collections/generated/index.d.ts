import configuration from '../../content-collections.ts';
import { GetTypeByName } from '@content-collections/core';

export type Work = GetTypeByName<typeof configuration, 'works'>;
export declare const allWorks: Array<Work>;

export {};
