// db.js
import Dexie from 'dexie';

export const argonautdb = new Dexie('argonautdb');
argonautdb.version(1).stores({
  state: '_id, classId, superClassId', // Primary key and indexed props
});