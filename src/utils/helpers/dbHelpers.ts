/**
 * @fileoverview dbHelpers.ts - This file contains all the helper functions which interacts with the database
 */

import db from '../db';

export async function getLatestTokens() {
  try {
    const tokens = await db.token.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return tokens ?? [];
  } catch (e: any) {
    console.log(`Error at "getLatestTokens" helper`, e.message);
    return [];
  }
}
