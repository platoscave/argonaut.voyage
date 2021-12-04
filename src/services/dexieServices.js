// db.js
import Dexie from 'dexie';

export const db = new Dexie('argonautdb');
db.version(1).stores({
  state: '_id, classId, superClassId', // Primary key and indexed props
  settings: 'pageId'
});